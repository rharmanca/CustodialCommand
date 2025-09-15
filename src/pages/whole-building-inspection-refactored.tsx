import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Save, Clock, ArrowLeft, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBuildingInspectionForm } from '@/hooks/use-building-inspection-form';
import { useRoomSelection } from '@/hooks/use-room-selection';
import InspectionCategoryCard from '@/components/inspection-category-card';
import ProgressTracker from '@/components/progress-tracker';

interface WholeBuildingInspectionPageProps {
  onBack?: () => void;
}

export default function WholeBuildingInspectionPageRefactored({
  onBack,
}: WholeBuildingInspectionPageProps) {
  const { toast } = useToast();
  
  // Use our custom hooks
  const {
    formData,
    completed,
    requirements,
    schoolOptions,
    categoryLabels,
    currentDraftId,
    lastSaved,
    isAutoSaving,
    updateFormData,
    updateCompleted,
    isFormValid,
    isInspectionComplete,
    completionPercentage,
    clearCurrentDraft
  } = useBuildingInspectionForm();

  const {
    selectedCategory,
    selectedRoom,
    availableRooms,
    selectCategory,
    selectRoom,
    clearSelection
  } = useRoomSelection();

  // Prevent unwanted scrolling during interactions
  useEffect(() => {
    const preventScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("[data-radix-select-content]")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener("scroll", preventScroll, { passive: false });
    return () => {
      document.removeEventListener("scroll", preventScroll);
    };
  }, []);

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    const required = requirements[category as keyof typeof requirements];
    selectCategory(category, required);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!isFormValid) {
      toast({
        title: "Form Incomplete",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!isInspectionComplete) {
      toast({
        title: "Inspection Incomplete",
        description: `Please complete all required inspections. Progress: ${completionPercentage}%`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Submit the inspection
      const response = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          inspectionType: 'whole_building',
          isCompleted: true,
          verifiedRooms: Object.keys(completed),
        }),
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: "Building inspection submitted successfully.",
        });
        
        // Clear the draft after successful submission
        clearCurrentDraft();
        
        // Navigate back or reset form
        if (onBack) {
          onBack();
        }
      } else {
        throw new Error('Failed to submit inspection');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit inspection. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-shrink-0">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            Whole Building Inspection
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete a comprehensive inspection of all areas in the building.
          </p>
        </div>
        
        {/* Save Status */}
        {(lastSaved || isAutoSaving) && (
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {isAutoSaving ? (
              <>
                <Save className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Clock className="w-4 h-4" />
                <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inspectorName">Inspector Name *</Label>
                  <Input
                    id="inspectorName"
                    value={formData.inspectorName}
                    onChange={(e) => updateFormData({ inspectorName: e.target.value })}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="school">School *</Label>
                  <Select
                    value={formData.school}
                    onValueChange={(value) => updateFormData({ school: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">Inspection Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => updateFormData({ date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="buildingName">Building Name *</Label>
                  <Input
                    id="buildingName"
                    value={formData.buildingName}
                    onChange={(e) => updateFormData({ buildingName: e.target.value })}
                    placeholder="Enter building name"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="locationDescription">Location Description</Label>
                <Textarea
                  id="locationDescription"
                  value={formData.locationDescription}
                  onChange={(e) => updateFormData({ locationDescription: e.target.value })}
                  placeholder="Describe the building location"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Inspection Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Inspection Categories</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete all required inspections for each category. Progress is saved automatically.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(requirements).map(([category, required]) => {
                  const completedCount = completed[category] || 0;
                  const isComplete = completedCount >= required;
                  
                  return (
                    <InspectionCategoryCard
                      key={category}
                      category={category}
                      label={categoryLabels[category]}
                      required={required}
                      completed={completedCount}
                      isCompleted={isComplete}
                      onSelect={handleCategorySelect}
                      disabled={!isFormValid}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.notes}
                onChange={(e) => updateFormData({ notes: e.target.value })}
                placeholder="Add any additional notes about the building inspection..."
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid || !isInspectionComplete}
              size="lg"
              className="min-w-48"
            >
              {isInspectionComplete ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Submit Inspection
                </>
              ) : (
                <>
                  Complete All Inspections ({completionPercentage}%)
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Sidebar - Progress Tracker */}
        <div className="space-y-6">
          <ProgressTracker
            completed={completed}
            requirements={requirements}
            categoryLabels={categoryLabels}
          />
          
          {/* Help Section */}
          <Card>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>How to Use</span>
                  <span>+</span>
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 p-4 bg-accent/10 rounded-lg border border-accent/30">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div>
                    <h4 className="font-semibold text-primary mb-1">
                      Step 1: Fill Basic Information
                    </h4>
                    <p>
                      Enter your inspector name, select the school, and choose the inspection date.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-1">
                      Step 2: Complete Required Inspections
                    </h4>
                    <p>
                      Each category shows how many inspections are required. Click "Start Inspection" to begin.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-primary mb-1">
                      Step 3: Track Progress
                    </h4>
                    <p>
                      Your progress is saved automatically. Green checkmarks show completed categories.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>
    </div>
  );
}
