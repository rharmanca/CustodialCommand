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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Star, Check, X, Upload, Camera } from 'lucide-react';
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

  // Track available inspections and selection state
  const [availableInspections, setAvailableInspections] = useState<any[]>([]);
  const [showInspectionSelector, setShowInspectionSelector] = useState(false);
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
    floors: -1,
    verticalHorizontalSurfaces: -1,
    ceiling: -1,
    restrooms: -1,
    customerSatisfaction: -1,
    trash: -1,
    projectCleaning: -1,
    activitySupport: -1,
    safetyCompliance: -1,
    equipment: -1,
    monitoring: -1,
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

  // Load available inspections on mount
  useEffect(() => {
    const loadAvailableInspections = async () => {
      try {
        const response = await fetch('/api/inspections?type=whole_building&incomplete=true');
        if (response.ok) {
          const inspections = await response.json();
          setAvailableInspections(inspections);
          if (inspections.length > 0) {
            setShowInspectionSelector(true);
          }
        }
      } catch (error) {
        console.error('Error loading available inspections:', error);
      }
    };

    loadAvailableInspections();
  }, []);

  // Function to select an existing inspection
  const selectInspection = async (inspection: any) => {
    try {
      setBuildingInspectionId(inspection.id);
      setFormData({
        inspectorName: inspection.inspectorName || '',
        school: inspection.school,
        date: inspection.date,
        locationCategory: '',
        roomNumber: '',
        locationDescription: '',
        floors: -1,
        verticalHorizontalSurfaces: -1,
        ceiling: -1,
        restrooms: -1,
        customerSatisfaction: -1,
        trash: -1,
        projectCleaning: -1,
        activitySupport: -1,
        safetyCompliance: -1,
        equipment: -1,
        monitoring: -1,
        notes: ''
      });

      // Load completed rooms for each category
      const roomResponse = await fetch(`/api/inspections/${inspection.id}/rooms`);
      if (roomResponse.ok) {
        const rooms = await roomResponse.json();
        const completedCount: Record<string, number> = {};
        Object.keys(requirements).forEach(key => {
          completedCount[key] = rooms.filter((room: any) => room.roomType === key).length;
        });
        setCompleted(completedCount);
        setIsResuming(true);
        setShowInspectionSelector(false);
      }
    } catch (error) {
      console.error('Error loading inspection:', error);
    }
  };

  // Function to start a new inspection
  const startNewInspection = () => {
    setShowInspectionSelector(false);
    setIsResuming(false);
    setBuildingInspectionId(null);
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
      floors: -1,
      verticalHorizontalSurfaces: -1,
      ceiling: -1,
      restrooms: -1,
      customerSatisfaction: -1,
      trash: -1,
      projectCleaning: -1,
      activitySupport: -1,
      safetyCompliance: -1,
      equipment: -1,
      monitoring: -1,
      notes: ''
    });
  };

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

  const renderMobileDropdownRating = (category: any, currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-3">
        <Select 
          value={currentRating > 0 ? currentRating.toString() : currentRating === -1 ? "-1" : ""} 
          onValueChange={(value) => onRatingChange(parseInt(value))}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select a rating..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-1">Not Rated</SelectItem>
            {ratingDescriptions.map((rating, index) => (
              <SelectItem key={index + 1} value={(index + 1).toString()}>
                <div className="flex items-center gap-3 py-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (index + 1)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{rating.label}</div>
                    <div className="text-sm text-gray-600">{rating.description}</div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentRating > 0 && currentRating !== -1 && (
          <div className="space-y-3">
            <div className="text-center space-y-1">
              <div className="text-base font-semibold text-yellow-600">
                {ratingDescriptions[currentRating - 1]?.label}
              </div>
              <div className="text-sm text-gray-600">
                {ratingDescriptions[currentRating - 1]?.description}
              </div>
            </div>
            {category?.criteria && category.criteria[currentRating] && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Detailed Criteria for {currentRating} Star{currentRating > 1 ? 's' : ''}:
                </div>
                <div className="text-sm text-blue-800">
                  {category.criteria[currentRating]}
                </div>
              </div>
            )}
          </div>
        )}
        {currentRating === -1 && (
          <div className="text-center space-y-1">
            <div className="text-base font-semibold text-gray-600">
              Not Rated
            </div>
            <div className="text-sm text-gray-600">
              No rating selected
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStarRating = (category: any, currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-3">
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-3 py-2 h-auto text-sm"
            onClick={() => onRatingChange(-1)}
          >
            Not Rated
          </Button>
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
                  star <= currentRating && currentRating > 0
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </Button>
          ))}
        </div>
        {currentRating > 0 && currentRating !== -1 && (
          <div className="space-y-3">
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">
                {ratingDescriptions[currentRating - 1]?.label}
              </div>
              <div className="text-sm text-gray-600">
                {ratingDescriptions[currentRating - 1]?.description}
              </div>
            </div>
            {category?.criteria && category.criteria[currentRating] && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-2">
                  Detailed Criteria for {currentRating} Star{currentRating > 1 ? 's' : ''}:
                </div>
                <div className="text-sm text-blue-800">
                  {category.criteria[currentRating]}
                </div>
              </div>
            )}
          </div>
        )}
        {currentRating === -1 && (
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-600">
              Not Rated
            </div>
            <div className="text-sm text-gray-600">
              No rating selected
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
      floors: -1,
      verticalHorizontalSurfaces: -1,
      ceiling: -1,
      restrooms: -1,
      customerSatisfaction: -1,
      trash: -1,
      projectCleaning: -1,
      activitySupport: -1,
      safetyCompliance: -1,
      equipment: -1,
      monitoring: -1,
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inspectorName: formData.inspectorName,
            school: formData.school,
            date: formData.date,
            inspectionType: 'whole_building',
            locationDescription: 'Whole Building Inspection',
            isCompleted: false,
            locationCategory: null,
            roomNumber: null,
            floors: null,
            verticalHorizontalSurfaces: null,
            ceiling: null,
            restrooms: null,
            customerSatisfaction: null,
            trash: null,
            projectCleaning: null,
            activitySupport: null,
            safetyCompliance: null,
            equipment: null,
            monitoring: null,
            notes: ''
          }),
        });

        if (buildingResponse.ok) {
          const buildingInspection = await buildingResponse.json();
          currentBuildingId = buildingInspection.id;
          setBuildingInspectionId(currentBuildingId);
        } else {
          throw new Error('Failed to create building inspection');
        }
      }

      // Submit room inspection
      const submissionData = {
        buildingInspectionId: currentBuildingId,
        roomType: selectedCategory,
        roomIdentifier: formData.roomNumber,
        floors: formData.floors === -1 ? null : formData.floors,
        verticalHorizontalSurfaces: formData.verticalHorizontalSurfaces === -1 ? null : formData.verticalHorizontalSurfaces,
        ceiling: formData.ceiling === -1 ? null : formData.ceiling,
        restrooms: formData.restrooms === -1 ? null : formData.restrooms,
        customerSatisfaction: formData.customerSatisfaction === -1 ? null : formData.customerSatisfaction,
        trash: formData.trash === -1 ? null : formData.trash,
        projectCleaning: formData.projectCleaning === -1 ? null : formData.projectCleaning,
        activitySupport: formData.activitySupport === -1 ? null : formData.activitySupport,
        safetyCompliance: formData.safetyCompliance === -1 ? null : formData.safetyCompliance,
        equipment: formData.equipment === -1 ? null : formData.equipment,
        monitoring: formData.monitoring === -1 ? null : formData.monitoring,
        notes: formData.notes || null,
        images: []
      };

      const response = await fetch('/api/room-inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });

      if (response.ok) {
        const savedInspection = await response.json();
        
        // Update completed count
        setCompleted(prev => ({
          ...prev,
          [selectedCategory]: prev[selectedCategory] + 1
        }));

        // Add to saved inspections
        setSavedInspections(prev => [...prev, savedInspection]);

        // Reset current form
        resetCurrentForm();

        alert(`${categoryLabels[selectedCategory]} inspection submitted successfully!`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to submit inspection');
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Failed to save inspection. Please try again.');
    }
  };

  const handleFinalSubmit = async () => {
    if (!isAllComplete) {
      alert('Please complete all required inspections before finalizing.');
      return;
    }

    try {
      // Update the building inspection as completed
      const response = await fetch(`/api/inspections/${buildingInspectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true }),
      });

      if (response.ok) {
        alert('Whole building inspection completed successfully!');
        if (onBack) onBack();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to finalize inspection');
      }
    } catch (error) {
      console.error('Error finalizing inspection:', error);
      alert('Failed to finalize inspection. Please try again.');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          {onBack && (
            <Button variant="outline" onClick={onBack} className="flex-shrink-0">
              ← Back
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center sm:text-left">
              Inspect an entire building.
            </h1>
          </div>
        </div>
        
        <div className="flex justify-center px-4">
          <Collapsible className="w-full max-w-lg">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full p-3 h-auto font-normal text-center text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg text-sm sm:text-base leading-relaxed"
              >
                📋 How to conduct a whole building inspection ↓
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Step 1: Getting Started</h4>
                  <p>Enter your inspector name, select the school, and choose the inspection date. This information will be saved automatically.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Step 2: Complete Required Inspections</h4>
                  <p>Each category below shows how many inspections are required (e.g., 3 Classrooms, 2 Restrooms). Click "Select" on any incomplete category to start inspecting that area type.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Step 3: Rate Each Area</h4>
                  <p>For each room/area, rate the custodial performance using the 1-5 star system you're familiar with. Add room numbers and notes as needed.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Step 4: Track Progress</h4>
                  <p>Your progress is saved automatically. Green checkmarks show completed categories. Return anytime to continue where you left off.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900 mb-1">Step 5: Finalize</h4>
                  <p>Once all required inspections are complete, the "Finalize Building Inspection" button will become available to submit your comprehensive inspection.</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      {/* Inspection Selector */}
      {showInspectionSelector && (
        <Card>
          <CardHeader>
            <CardTitle>Choose Inspection</CardTitle>
            <CardDescription>Select an existing inspection to continue or start a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableInspections.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Continue Previous Inspection:</h4>
                {availableInspections.map((inspection) => (
                  <div
                    key={inspection.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div>
                      <div className="font-medium">{inspection.school}</div>
                      <div className="text-sm text-gray-600">
                        {new Date(inspection.date).toLocaleDateString()}
                        {inspection.inspectorName && (
                          <span className="block text-sm text-gray-700 font-medium">
                            Inspector: {inspection.inspectorName}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => selectInspection(inspection)}
                      variant="outline"
                      size="sm"
                    >
                      Continue
                    </Button>
                  </div>
                ))}
                <Separator />
              </div>
            )}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Or Start New Inspection:</h4>
              <Button
                onClick={startNewInspection}
                className="w-full"
                variant="default"
              >
                Start New Building Inspection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* School and Date Selection */}
      {!isResuming && !showInspectionSelector && (
        <Card>
          <CardHeader>
            <CardTitle>Building Information</CardTitle>
            <CardDescription>Select the school and date for this inspection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspectorName">Inspector Name</Label>
                <Input
                  id="inspectorName"
                  value={formData.inspectorName}
                  onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                  placeholder="Enter inspector name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select
                  value={formData.school}
                  onValueChange={(value) => handleInputChange('school', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select school" />
                  </SelectTrigger>
                  <SelectContent>
                    {schoolOptions.map((school) => (
                      <SelectItem key={school.value} value={school.value}>
                        {school.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Current Inspection Info (when resuming) */}
      {isResuming && (
        <Card>
          <CardHeader>
            <CardTitle>Current Inspection</CardTitle>
            <CardDescription>Continuing inspection progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium">Inspector:</span>
                <span>{formData.inspectorName || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">School:</span>
                <span>{formData.school}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Date:</span>
                <span>{new Date(formData.date).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={() => {
                  setShowInspectionSelector(true);
                  setIsResuming(false);
                  setBuildingInspectionId(null);
                }}
                variant="outline"
                size="sm"
              >
                Switch to Different Inspection
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Dynamic Checklist */}
      {!showInspectionSelector && (isMobile ? (
        <MobileCard title="Inspection Progress">
          <p className="text-sm text-gray-600 mb-4">
            Complete the required number of inspections for each category
            {formData.school && formData.date && (
              <span className="block text-xs text-gray-500 mt-1">
                (Progress is automatically saved)
              </span>
            )}
          </p>
          <div className="space-y-3">
            {Object.entries(requirements).map(([category, required]) => {
              const completedCount = completed[category];
              const isComplete = completedCount >= required;
              
              return (
                <div
                  key={category}
                  className={`p-3 rounded-lg border ${
                    isComplete ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isComplete ? 'bg-green-500 border-green-500' : 'border-gray-400'
                      }`}>
                        {isComplete && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium text-sm block leading-tight ${isComplete ? 'text-green-800' : 'text-gray-700'}`}>
                          {categoryLabels[category]}
                        </span>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant={isComplete ? 'default' : 'secondary'} className="text-xs">
                            {completedCount}/{required} Done
                          </Badge>
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
      ))}
      {/* Inspection Form */}
      {!showInspectionSelector && selectedCategory && formData.school && formData.date && (
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
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room Number</Label>
                    <Input
                      id="roomNumber"
                      value={formData.roomNumber}
                      onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                      placeholder="Enter room number"
                      required
                    />
                  </div>
                  <div className="space-y-2">
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
          {isMobile ? (
            <MobileCard title="Rate Each Category">
              <div className="space-y-6">
                {inspectionCategories.map((category, index) => (
                  <div key={category.key} className="space-y-3">
                    <Label className="text-base font-medium">{category.label}</Label>
                    {renderMobileDropdownRating(
                      formData[category.key as keyof typeof formData] as number,
                      (rating) => handleInputChange(category.key as keyof typeof formData, rating)
                    )}
                    {index < inspectionCategories.length - 1 && <div className="border-t pt-4" />}
                  </div>
                ))}
              </div>
            </MobileCard>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {inspectionCategories.map((category, index) => {
                const key = category.key as keyof typeof formData;
                return (
                  <Card key={category.key} className="overflow-hidden">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{category.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {renderStarRating(
                        category,
                        formData[key] as number,
                        (rating) => handleInputChange(key, rating)
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Notes */}
          {isMobile ? (
            <MobileCard title="Additional Notes">
              <Textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Enter any additional observations..."
                rows={4}
                className="text-base min-h-[120px]"
              />
            </MobileCard>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Additional Notes</CardTitle>
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

          {/* Image Upload */}
          {isMobile ? (
            <MobileCard title="Photo Documentation">
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Upload className="w-5 h-5" />
                      <span className="text-base">Upload Images</span>
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        console.log('Files selected:', e.target.files);
                      }}
                      className="hidden"
                    />
                  </Label>
                  
                  <Label htmlFor="camera-capture" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-3 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Camera className="w-5 h-5" />
                      <span className="text-base">Take Photo</span>
                    </div>
                    <Input
                      id="camera-capture"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        console.log('Camera photo taken:', e.target.files);
                      }}
                      className="hidden"
                    />
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  Upload existing images or take new photos to document the inspection
                </p>
              </div>
            </MobileCard>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Photo Documentation</CardTitle>
                <CardDescription>Upload images or take photos to document the inspection</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Label htmlFor="image-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload Images</span>
                    </div>
                    <Input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => {
                        console.log('Files selected:', e.target.files);
                      }}
                      className="hidden"
                    />
                  </Label>
                  
                  <Label htmlFor="camera-capture" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </div>
                    <Input
                      id="camera-capture"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => {
                        console.log('Camera photo taken:', e.target.files);
                      }}
                      className="hidden"
                    />
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  Select multiple images from your device or take new photos with your camera
                </p>
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
      {!showInspectionSelector && (
        <div className={`border-t ${isMobile ? 'pt-4' : 'pt-6'}`}>
          <Button
            onClick={handleFinalSubmit}
            size="lg"
            className={`w-full bg-green-600 hover:bg-green-700 ${isMobile ? 'h-14 text-base' : ''}`}
            disabled={!isAllComplete}
          >
            {isMobile ? 'Finalize Building Inspection' : 'Finalize Whole Building Inspection'}
          </Button>
          {!isAllComplete && (
            <p className={`text-center text-gray-500 mt-2 ${isMobile ? 'text-xs px-2' : 'text-sm'}`}>
              {isMobile ? 'Complete all required inspections first' : 'Complete all required inspections to enable this button'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}