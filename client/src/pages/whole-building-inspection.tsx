import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { MobileCard } from "@/components/ui/mobile-card";
import { Star, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { ratingDescriptions, inspectionCategories } from '@shared/custodial-criteria';

interface WholeBuildingInspectionPageProps {
  onBack?: () => void;
}

export default function WholeBuildingInspectionPage({ onBack }: WholeBuildingInspectionPageProps) {
  const { isMobile } = useIsMobile();
  
  // Define requirements for each category
  const requirements = {
    exterior: 2,
    gym_bleachers: 1,
    classroom: 3,
    cafeteria: 1,
    utility_storage: 1,
    admin_office: 2,
    hallway: 3,
    stairwell: 2,
    restroom: 2,
    staff_single_restroom: 1
  };

  // Category labels for display
  const categoryLabels: Record<string, string> = {
    exterior: 'Exterior',
    gym_bleachers: 'Gym and Bleachers',
    classroom: 'Classroom',
    cafeteria: 'Cafeteria',
    utility_storage: 'Utility Or Storage',
    admin_office: 'Admin or Office Area',
    hallway: 'Hallway',
    stairwell: 'Stairwell',
    restroom: 'Restroom',
    staff_single_restroom: 'Staff or Single Restroom'
  };

  // School options
  const schoolOptions = [
    { value: 'ASA', label: 'ASA' },
    { value: 'LCA', label: 'LCA' },
    { value: 'GWC', label: 'GWC' },
    { value: 'OA', label: 'OA' },
    { value: 'CBR', label: 'CBR' },
    { value: 'WLC', label: 'WLC' }
  ];

  // Track completed inspections
  const [completed, setCompleted] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.keys(requirements).forEach(key => {
      initial[key] = 0;
    });
    return initial;
  });

  // Track if we're resuming a previous inspection
  const [isResuming, setIsResuming] = useState(false);
  const [savedInspections, setSavedInspections] = useState<any[]>([]);

  // Form data for current inspection
  const [formData, setFormData] = useState({
    inspectorName: '',
    school: '',
    date: '',
    locationCategory: '',
    roomNumber: '',
    locationDescription: '',
    floors: 0,
    verticalHorizontalSurfaces: 0,
    ceiling: 0,
    restrooms: 0,
    customerSatisfaction: 0,
    trash: 0,
    projectCleaning: 0,
    activitySupport: 0,
    safetyCompliance: 0,
    equipment: 0,
    monitoring: 0,
    notes: ''
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAllComplete, setIsAllComplete] = useState(false);
  const [buildingInspectionId, setBuildingInspectionId] = useState<number | null>(null);





  // Check if all categories are complete
  useEffect(() => {
    const checkCompletion = () => {
      return Object.entries(requirements).every(([category, required]) => {
        return completed[category] >= required;
      });
    };
    setIsAllComplete(checkCompletion());
  }, [completed]);

  // Load saved progress on component mount
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        const response = await fetch('/api/inspections?type=whole_building&incomplete=true');
        if (response.ok) {
          const inspections = await response.json();
          if (inspections.length > 0) {
            // Load the most recent incomplete building inspection
            const buildingInspection = inspections[0];
            setBuildingInspectionId(buildingInspection.id);
            setFormData({
              inspectorName: buildingInspection.inspectorName || '',
              school: buildingInspection.school,
              date: buildingInspection.date,
              locationCategory: '',
              roomNumber: '',
              locationDescription: '',
              floors: 0,
              verticalHorizontalSurfaces: 0,
              ceiling: 0,
              restrooms: 0,
              customerSatisfaction: 0,
              trash: 0,
              projectCleaning: 0,
              activitySupport: 0,
              safetyCompliance: 0,
              equipment: 0,
              monitoring: 0,
              notes: ''
            });
            
            // Load completed rooms for each category
            const roomResponse = await fetch(`/api/inspections/${buildingInspection.id}/rooms`);
            if (roomResponse.ok) {
              const rooms = await roomResponse.json();
              const completedCount: Record<string, number> = {};
              Object.keys(requirements).forEach(key => {
                completedCount[key] = rooms.filter((room: any) => room.roomType === key).length;
              });
              setCompleted(completedCount);
              setIsResuming(true);
            }
          }
        }
      } catch (error) {
        console.error('Error loading saved progress:', error);
      }
    };

    loadSavedProgress();
  }, []);

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
  };

  const renderStarRating = (currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-3">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Button
              key={star}
              type="button"
              variant="ghost"
              size="sm"
              className="p-2 h-auto"
              onClick={() => onRatingChange(star)}
            >
              <Star
                className={`w-8 h-8 ${
                  star <= currentRating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </Button>
          ))}
        </div>
        {currentRating > 0 && (
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">
              {ratingDescriptions[currentRating - 1]?.label}
            </div>
            <div className="text-sm text-gray-600">
              {ratingDescriptions[currentRating - 1]?.description}
            </div>
          </div>
        )}
      </div>
    );
  };

  const resetCurrentForm = () => {
    setFormData(prev => ({
      ...prev,
      locationCategory: selectedCategory || '',
      roomNumber: '',
      locationDescription: '',
      floors: 0,
      verticalHorizontalSurfaces: 0,
      ceiling: 0,
      restrooms: 0,
      customerSatisfaction: 0,
      trash: 0,
      projectCleaning: 0,
      activitySupport: 0,
      safetyCompliance: 0,
      equipment: 0,
      monitoring: 0,
      notes: ''
    }));
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) return;

    try {
      // Create or get building inspection first
      let currentBuildingId = buildingInspectionId;
      
      if (!currentBuildingId) {
        const buildingResponse = await fetch('/api/inspections', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            school: formData.school,
            date: formData.date,
            inspectionType: 'whole_building',
            inspectorName: formData.inspectorName,
            isComplete: false
          })
        });
        
        if (!buildingResponse.ok) {
          throw new Error('Failed to create building inspection');
        }
        
        const buildingData = await buildingResponse.json();
        currentBuildingId = buildingData.id;
        setBuildingInspectionId(currentBuildingId);
      }

      // Create room inspection
      const roomResponse = await fetch('/api/room-inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inspectionId: currentBuildingId,
          roomType: selectedCategory,
          roomNumber: formData.roomNumber,
          locationDescription: formData.locationDescription,
          floors: formData.floors,
          verticalHorizontalSurfaces: formData.verticalHorizontalSurfaces,
          ceiling: formData.ceiling,
          restrooms: formData.restrooms,
          customerSatisfaction: formData.customerSatisfaction,
          trash: formData.trash,
          projectCleaning: formData.projectCleaning,
          activitySupport: formData.activitySupport,
          safetyCompliance: formData.safetyCompliance,
          equipment: formData.equipment,
          monitoring: formData.monitoring,
          notes: formData.notes
        })
      });

      if (!roomResponse.ok) {
        throw new Error('Failed to save room inspection');
      }

      // Update completed count
      setCompleted(prev => ({
        ...prev,
        [selectedCategory]: prev[selectedCategory] + 1
      }));

      // Reset form and clear selection
      resetCurrentForm();
      setSelectedCategory(null);

      // Show success message
      alert('Room inspection saved successfully!');

    } catch (error) {
      console.error('Error saving inspection:', error);
      alert('Failed to save inspection. Please try again.');
    }
  };

  const handleFinalSubmit = async () => {
    if (!buildingInspectionId) return;

    try {
      const response = await fetch(`/api/inspections/${buildingInspectionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isComplete: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to finalize inspection');
      }

      alert('Whole building inspection completed successfully!');
      
      // Reset everything
      setCompleted(() => {
        const initial: Record<string, number> = {};
        Object.keys(requirements).forEach(key => {
          initial[key] = 0;
        });
        return initial;
      });
      
      setFormData({
        inspectorName: '',
        school: '',
        date: '',
        locationCategory: '',
        roomNumber: '',
        locationDescription: '',
        floors: 0,
        verticalHorizontalSurfaces: 0,
        ceiling: 0,
        restrooms: 0,
        customerSatisfaction: 0,
        trash: 0,
        projectCleaning: 0,
        activitySupport: 0,
        safetyCompliance: 0,
        equipment: 0,
        monitoring: 0,
        notes: ''
      });
      
      setSelectedCategory(null);
      setBuildingInspectionId(null);
      setIsResuming(false);

    } catch (error) {
      console.error('Error finalizing inspection:', error);
      alert('Failed to finalize inspection. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-shrink-0">
            ← Back
          </Button>
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Whole Building Inspection</h1>
          <p className="text-gray-600 mt-2">Complete inspections across all required categories</p>
        </div>
      </div>

      {/* Initial Setup */}
      {!formData.inspectorName || !formData.school || !formData.date ? (
        <Card>
          <CardHeader>
            <CardTitle>Setup Inspection</CardTitle>
            <CardDescription>Choose school and date to begin the whole building inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="inspectorName">Inspector Name *</Label>
              <Input
                id="inspectorName"
                value={formData.inspectorName}
                onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <Label htmlFor="school">School</Label>
              <Select value={formData.school} onValueChange={(value) => handleInputChange('school', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schoolOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Inspection Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Current Inspection Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">{formData.school}</div>
                  <div className="text-gray-600">{new Date(formData.date).toLocaleDateString()}</div>
                  <div className="text-sm text-gray-500">Inspector: {formData.inspectorName}</div>
                  {isResuming && (
                    <Badge variant="outline" className="mt-2">
                      Resuming Previous Inspection
                    </Badge>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, inspectorName: '', school: '', date: '' }));
                    setSelectedCategory(null);
                  }}
                >
                  Change Details
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          {isMobile ? (
            <MobileCard title="Inspection Progress">
              <div className="space-y-3">
                {Object.entries(requirements).map(([category, required]) => {
                  const completedCount = completed[category];
                  const isComplete = completedCount >= required;
                  
                  return (
                    <div key={category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isComplete ? 'bg-green-500 border-green-500' : 'border-gray-400'
                          }`}>
                            {isComplete && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <span className={`text-sm font-medium ${isComplete ? 'text-green-800' : 'text-gray-700'}`}>
                            {categoryLabels[category]}
                          </span>
                        </div>
                        <Badge variant={isComplete ? 'default' : 'secondary'} className="text-xs">
                          {completedCount}/{required}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pl-7">
                        <div className="text-xs text-gray-500">
                          {isComplete ? 'Complete' : `${required - completedCount} remaining`}
                        </div>
                        <div className="flex gap-2">
                          {!isComplete && formData.school && formData.date && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedCategory(category)}
                              className={`text-xs px-3 py-1 h-7 ${selectedCategory === category ? 'border-blue-500 bg-blue-50' : ''}`}
                            >
                              Select
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </MobileCard>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Progress</CardTitle>
                <CardDescription>
                  Complete the required number of inspections for each category
                  {formData.school && formData.date && (
                    <span className="text-sm text-gray-500 ml-2">
                      (Progress is automatically saved)
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(requirements).map(([category, required]) => {
                  const completedCount = completed[category];
                  const isComplete = completedCount >= required;
                  
                  return (
                    <div
                      key={category}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isComplete ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center ${
                          isComplete ? 'bg-green-500 border-green-500' : 'border-gray-400'
                        }`}>
                          {isComplete && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`font-medium ${isComplete ? 'text-green-800' : 'text-gray-700'}`}>
                          {categoryLabels[category]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={isComplete ? 'default' : 'secondary'}>
                          {completedCount}/{required} Completed
                        </Badge>
                        {!isComplete && formData.school && formData.date && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedCategory(category)}
                            className={selectedCategory === category ? 'border-blue-500' : ''}
                          >
                            Select
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Inspection Form */}
          {selectedCategory && formData.school && formData.date && (
            <form onSubmit={handleCategorySubmit} className={`space-y-4 ${isMobile ? '' : 'space-y-6'}`}>
              {isMobile ? (
                <MobileCard title={`Inspecting: ${categoryLabels[selectedCategory]}`}>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="roomNumber" className="text-base font-medium">Room Number</Label>
                      <Input
                        id="roomNumber"
                        className="h-12 text-base"
                        value={formData.roomNumber}
                        onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                        placeholder="Enter room number"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="locationDescription" className="text-base font-medium">Location Description</Label>
                      <Input
                        id="locationDescription"
                        className="h-12 text-base"
                        value={formData.locationDescription}
                        onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                        placeholder="e.g., Main Building, Second Floor"
                      />
                    </div>
                  </div>
                </MobileCard>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Inspecting: {categoryLabels[selectedCategory]}</CardTitle>
                    <CardDescription>Complete the inspection for this category</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="roomNumber">Room Number</Label>
                        <Input
                          id="roomNumber"
                          value={formData.roomNumber}
                          onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                          placeholder="Enter room number"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="locationDescription">Location Description</Label>
                        <Input
                          id="locationDescription"
                          value={formData.locationDescription}
                          onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                          placeholder="e.g., Main Building, Second Floor"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rating Categories */}
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {inspectionCategories.map((category, index) => {
                  const key = category.key as keyof typeof formData;
                  return (
                    <Card key={category.key} className="overflow-hidden">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-lg">{category.label}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {renderStarRating(
                          formData[key] as number,
                          (rating) => handleInputChange(key, rating)
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Notes Section */}
              {isMobile ? (
                <MobileCard title="Additional Notes">
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter any additional observations..."
                    rows={4}
                    className="text-base"
                  />
                </MobileCard>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Notes</CardTitle>
                    <CardDescription>Record any additional observations or concerns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Enter any additional observations..."
                      rows={4}
                    />
                  </CardContent>
                </Card>
              )}

              <Button 
                type="submit" 
                size="lg" 
                className={`w-full bg-blue-600 hover:bg-blue-700 ${isMobile ? 'h-14 text-lg' : ''}`}
              >
                Submit {categoryLabels[selectedCategory]} Inspection
              </Button>
            </form>
          )}

          {/* Final Submit Button */}
          <div className={`border-t ${isMobile ? 'pt-4' : 'pt-6'}`}>
            <Button
              onClick={handleFinalSubmit}
              size="lg"
              className={`w-full bg-green-600 hover:bg-green-700 ${isMobile ? 'h-14 text-lg' : ''}`}
              disabled={!isAllComplete}
            >
              Finalize Whole Building Inspection
            </Button>
            {!isAllComplete && (
              <p className={`text-center text-gray-500 mt-2 ${isMobile ? 'text-sm' : 'text-sm'}`}>
                Complete all required inspections to enable this button
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}