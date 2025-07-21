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

  // Rating descriptions
  const ratingDescriptions = [
    { stars: 1, label: "Poor", description: "Significant improvements needed" },
    { stars: 2, label: "Below Average", description: "Several issues to address" },
    { stars: 3, label: "Average", description: "Meets basic standards" },
    { stars: 4, label: "Good", description: "Above standard with minor issues" },
    { stars: 5, label: "Excellent", description: "Exceptional condition" }
  ];

  // Inspection categories with criteria
  const inspectionCategories = [
    { key: 'floors', label: '1. Floors', criteria: {} },
    { key: 'verticalHorizontalSurfaces', label: '2. Vertical and Horizontal Surfaces', criteria: {} },
    { key: 'ceiling', label: '3. Ceiling', criteria: {} },
    { key: 'restrooms', label: '4. Restrooms', criteria: {} },
    { key: 'customerSatisfaction', label: '5. Customer Satisfaction', criteria: {} },
    { key: 'trash', label: '6. Trash', criteria: {} },
    { key: 'projectCleaning', label: '7. Project Cleaning', criteria: {} },
    { key: 'activitySupport', label: '8. Activity Support', criteria: {} },
    { key: 'safetyCompliance', label: '9. Safety Compliance', criteria: {} },
    { key: 'equipment', label: '10. Equipment', criteria: {} },
    { key: 'monitoring', label: '11. Monitoring', criteria: {} }
  ];

  // Check if all categories are complete
  useEffect(() => {
    const checkCompletion = () => {
      return Object.entries(requirements).every(([category, required]) => {
        return completed[category] >= required;
      });
    };
    setIsAllComplete(checkCompletion());
  }, [completed]);

  // Check for existing incomplete building inspections on mount
  useEffect(() => {
    const checkForExistingInspection = async () => {
      if (formData.school && formData.date) {
        try {
          // First check if there's an existing incomplete inspection
          const inspectionsResponse = await fetch('/api/inspections');
          if (inspectionsResponse.ok) {
            const allInspections = await inspectionsResponse.json();
            const existingInspection = allInspections.find((insp: any) => 
              insp.school === formData.school && 
              insp.date === formData.date && 
              insp.inspectionType === 'whole_building' && 
              !insp.isCompleted
            );

            if (existingInspection) {
              // Resume existing inspection
              setBuildingInspectionId(existingInspection.id);
              setIsResuming(true);
              
              // Load completed inspections for this building
              const completedInspections = allInspections.filter((insp: any) => 
                insp.buildingInspectionId === existingInspection.id
              );
              
              setSavedInspections(completedInspections);
              
              // Update completed counts
              const newCompleted: Record<string, number> = { ...completed };
              completedInspections.forEach((insp: any) => {
                if (insp.locationCategory && newCompleted[insp.locationCategory] !== undefined) {
                  newCompleted[insp.locationCategory]++;
                }
              });
              setCompleted(newCompleted);
            } else {
              // Create new building inspection
              const response = await fetch('/api/inspections', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  school: formData.school,
                  date: formData.date,
                  inspectionType: 'whole_building',
                  locationDescription: 'Whole Building Inspection',
                  isCompleted: false,
                  // Set null for fields that don't apply to building inspections
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
                  monitoring: null
                }),
              });

              if (response.ok) {
                const inspection = await response.json();
                setBuildingInspectionId(inspection.id);
                setIsResuming(false);
              }
            }
          }
        } catch (error) {
          console.error('Error checking/creating building inspection:', error);
        }
      }
    };

    checkForExistingInspection();
  }, [formData.school, formData.date]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedCategory) {
      alert('Please select a category to inspect.');
      return;
    }

    if (!formData.school || !formData.date) {
      alert('Please select school and date first.');
      return;
    }

    // Validate all ratings are filled
    const ratingFields = inspectionCategories.map(cat => cat.key);
    const hasEmptyRatings = ratingFields.some(field => formData[field as keyof typeof formData] === 0);
    
    if (hasEmptyRatings) {
      alert('Please rate all categories before submitting.');
      return;
    }

    if (!formData.roomNumber) {
      alert('Please enter a room number.');
      return;
    }

    try {
      const submissionData = {
        ...formData,
        locationCategory: selectedCategory,
        inspectionType: 'single_room',
        buildingInspectionId: buildingInspectionId,
        images: []  // Ensure images is an empty array
      };

      const response = await fetch('/api/inspections', {
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

        // Reset form but keep school and date
        setFormData(prev => ({
          ...prev,
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

        alert(`${categoryLabels[selectedCategory]} inspection submitted and saved!`);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error('Failed to submit inspection');
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      alert('Failed to submit inspection. Please try again.');
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
        throw new Error('Failed to finalize inspection');
      }
    } catch (error) {
      console.error('Error finalizing inspection:', error);
      alert('Failed to finalize inspection. Please try again.');
    }
  };

  const renderStarRating = (category: string, currentRating: number) => {
    return (
      <div className={`flex items-center gap-2 ${isMobile ? 'flex-col items-start' : ''}`}>
        <div className={`flex gap-1 ${isMobile ? 'justify-center w-full py-2' : ''}`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`cursor-pointer transition-colors ${
                isMobile ? 'w-10 h-10' : 'w-6 h-6'
              } ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-200'
              }`}
              onClick={() => handleInputChange(category, star)}
            />
          ))}
        </div>
        {currentRating > 0 && (
          <span className={`font-medium text-gray-700 ${isMobile ? 'text-base text-center w-full' : 'text-sm'}`}>
            {ratingDescriptions[currentRating - 1]?.label}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full mx-auto space-y-4 ${isMobile ? 'p-3' : 'max-w-4xl p-6 space-y-6'}`}>
      {onBack && (
        <Button 
          onClick={onBack} 
          variant="outline" 
          className={`${isMobile ? 'w-full mb-3 text-lg py-3' : 'mb-4'}`}
        >
          ← Back to Custodial
        </Button>
      )}

      <div className={`${isMobile ? 'text-left' : 'text-center'}`}>
        <h1 className={`font-bold text-blue-800 mb-2 ${isMobile ? 'text-2xl' : 'text-3xl'}`}>
          Ready to Inspect the Whole Building?
        </h1>
        <p className={`text-gray-600 ${isMobile ? 'text-sm leading-relaxed' : ''}`}>
          This form is for your comprehensive building inspection. Simply go through the list below and submit the required number of inspections for each category. The inspection criteria are the same ones you're already familiar with from standard inspections.
        </p>
        {isResuming && (
          <div className={`bg-blue-50 border border-blue-200 rounded-lg ${isMobile ? 'mt-3 p-3' : 'mt-4 p-4'}`}>
            <p className={`text-blue-800 font-medium ${isMobile ? 'text-sm' : ''}`}>
              ✓ Resuming your previous inspection session. Your progress has been saved!
            </p>
          </div>
        )}
      </div>

      {/* School and Date Selection */}
      {isMobile ? (
        <MobileCard title="Building Information">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="school" className="text-base font-medium">School</Label>
              <Select
                value={formData.school}
                onValueChange={(value) => handleInputChange('school', value)}
              >
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  {schoolOptions.map((school) => (
                    <SelectItem key={school.value} value={school.value} className="text-base py-3">
                      {school.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-base font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                className="h-12 text-base"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                required
              />
            </div>
          </div>
        </MobileCard>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Building Information</CardTitle>
            <CardDescription>Select the school and date for this whole building inspection</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>
      )}

      {/* Dynamic Checklist */}
      {isMobile ? (
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
          </div>
        </CardContent>
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
            <MobileCard title="Inspection Categories">
              <p className="text-sm text-gray-600 mb-4">Rate each category (1-5 stars)</p>
              <div className="space-y-6">
                {inspectionCategories.map((category, index) => (
                  <div key={category.key}>
                    <div className="space-y-3">
                      <Label className="text-base font-medium block">{category.label}</Label>
                      {renderStarRating(category.key, formData[category.key as keyof typeof formData] as number)}
                    </div>
                    {index < inspectionCategories.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </MobileCard>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Inspection Categories</CardTitle>
                <CardDescription>Rate each category (1-5 stars)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {inspectionCategories.map((category, index) => (
                  <div key={category.key}>
                    <div className="space-y-3">
                      <Label className="text-base font-medium">{category.label}</Label>
                      {renderStarRating(category.key, formData[category.key as keyof typeof formData] as number)}
                    </div>
                    {index < inspectionCategories.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>
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
    </div>
  );
}