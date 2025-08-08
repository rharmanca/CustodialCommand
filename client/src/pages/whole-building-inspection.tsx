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
import { Star, Check, X, Upload, Camera, Save, Clock } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { ratingDescriptions, inspectionCategories } from '@shared/custodial-criteria';

interface WholeBuildingInspectionPageProps {
  onBack?: () => void;
  showSuccess: (title: string, description?: string, duration?: number) => string;
  showError: (title: string, description?: string, duration?: number) => string;
  showInfo: (title: string, description?: string, duration?: number) => string;
}

export default function WholeBuildingInspectionPage({ onBack, showSuccess, showError, showInfo }: WholeBuildingInspectionPageProps) {
  const { isMobile } = useIsMobile();
  const { toast } = useToast();

  // Prevent unwanted scrolling during interactions
  useEffect(() => {
    const preventScroll = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && typeof target.closest === 'function' && target.closest('[data-radix-select-content]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Add scroll prevention for select dropdowns
    document.addEventListener('scroll', preventScroll, { passive: false });

    return () => {
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);

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
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  
  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [currentFormDraftId, setCurrentFormDraftId] = useState<string | null>(null);
  
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

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
    loadFormDraft();
  }, []);

  // Auto-save current form state
  useEffect(() => {
    if (buildingInspectionId && selectedCategory && (formData.inspectorName || formData.school || formData.date)) {
      const timeoutId = setTimeout(() => {
        saveFormDraft();
      }, 2000); // Auto-save after 2 seconds of inactivity

      return () => clearTimeout(timeoutId);
    }
  }, [formData, selectedCategory, buildingInspectionId]);

  const generateFormDraftId = () => {
    return `building_form_${buildingInspectionId}_${selectedCategory}_${Date.now()}`;
  };

  const saveFormDraft = async () => {
    if (!buildingInspectionId || !selectedCategory) return;

    setIsAutoSaving(true);
    try {
      const draftId = currentFormDraftId || generateFormDraftId();
      if (!currentFormDraftId) {
        setCurrentFormDraftId(draftId);
      }

      const draftData = {
        id: draftId,
        buildingInspectionId,
        selectedCategory,
        formData: { ...formData },
        lastModified: new Date().toISOString(),
        title: `${formData.school} - Building - ${categoryLabels[selectedCategory] || selectedCategory}`
      };

      // Save to localStorage
      const existingDrafts = JSON.parse(localStorage.getItem('building_form_drafts') || '[]');
      const draftIndex = existingDrafts.findIndex((d: any) => d.id === draftId);
      
      if (draftIndex >= 0) {
        existingDrafts[draftIndex] = draftData;
      } else {
        existingDrafts.push(draftData);
      }

      localStorage.setItem('building_form_drafts', JSON.stringify(existingDrafts));
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving form draft:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const loadFormDraft = () => {
    try {
      const savedDrafts = localStorage.getItem('building_form_drafts');
      if (savedDrafts) {
        const drafts = JSON.parse(savedDrafts);
        // Clean up old drafts (older than 7 days)
        const validDrafts = drafts.filter((draft: any) => {
          const draftDate = new Date(draft.lastModified);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return draftDate > weekAgo;
        });

        if (validDrafts.length !== drafts.length) {
          localStorage.setItem('building_form_drafts', JSON.stringify(validDrafts));
        }
      }
    } catch (error) {
      console.error('Error loading form drafts:', error);
    }
  };

  const clearCurrentFormDraft = () => {
    if (currentFormDraftId) {
      const existingDrafts = JSON.parse(localStorage.getItem('building_form_drafts') || '[]');
      const updatedDrafts = existingDrafts.filter((d: any) => d.id !== currentFormDraftId);
      localStorage.setItem('building_form_drafts', JSON.stringify(updatedDrafts));
      setCurrentFormDraftId(null);
      setLastSaved(null);
    }
  };

  // Function to select an existing inspection
  const selectInspection = async (inspection: any) => {
    try {
      setBuildingInspectionId(inspection.id);
      const newFormData = {
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
      };
      setFormData(newFormData);

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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      setSelectedImages(prev => [...prev, ...newImages].slice(0, 5)); // Limit to 5 images
      console.log('Files selected:', newImages.length, 'files');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
  };



  const renderMobileStarRating = (category: any, currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="text-sm font-medium text-gray-700 mb-2 text-center">
            Rate this category:
          </div>
          
          {/* Compact Star Rating Buttons */}
          <div className="flex justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-1.5 rounded-md hover:bg-yellow-50 transition-colors touch-manipulation"
                onClick={() => onRatingChange(star)}
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= currentRating && currentRating > 0
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground hover:text-yellow-300'
                  }`}
                />
              </button>
            ))}
          </div>
          
          {/* Compact Not Rated Button */}
          <div className="flex justify-center">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md border text-xs font-medium transition-colors touch-manipulation ${
                currentRating === -1
                  ? 'bg-muted border-border text-foreground'
                  : 'bg-card border-border text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => onRatingChange(-1)}
            >
              Not Rated
            </button>
          </div>
        </div>
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
        <div className="flex justify-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="px-2 py-1 h-auto text-xs"
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
              className="p-1 h-auto"
              onClick={() => onRatingChange(star)}
            >
              <Star
                className={`w-6 h-6 ${
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
    
    // Clear form draft state
    setCurrentFormDraftId(null);
    setLastSaved(null);
  };

  const convertImagesToBase64 = async (images: File[]): Promise<string[]> => {
    const imagePromises = images.map(file => {
      return new Promise<string>((resolve, reject) => {
        try {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    try {
      return await Promise.all(imagePromises);
    } catch (error) {
      console.error('Error converting images to base64:', error);
      return [];
    }
  };

  const handleCategorySelect = (category: string) => {
    // Store current scroll position
    const currentScrollY = window.scrollY;
    
    setSelectedCategory(category);
    setShowInspectionSelector(false);

    // Prevent automatic scroll to top with multiple methods
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    });
    
    // Also set a timeout as backup
    setTimeout(() => {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    }, 10);
    
    setTimeout(() => {
      window.scrollTo({ top: currentScrollY, behavior: 'instant' });
    }, 50);
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory) return;

    // Validate inspector name is provided
    if (!formData.inspectorName.trim()) {
      if (showError) {
        showError("Validation Error", "Inspector name is required");
      } else {
        toast({
          title: "Validation Error",
          description: "Inspector name is required",
          variant: "destructive",
        });
      }
      return;
    }

    // Validate room number is provided
    if (!formData.roomNumber.trim()) {
      if (showError) {
        showError("Validation Error", "Room number is required");
      } else {
        toast({
          title: "Validation Error", 
          description: "Room number is required",
          variant: "destructive",
        });
      }
      return;
    }

    setIsSubmitting(true);
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
        images: await convertImagesToBase64(selectedImages)
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

        // Clear current form draft and reset form
        clearCurrentFormDraft();
        resetCurrentForm();
        setSelectedImages([]);

        // Show enhanced success notification
        if (showSuccess) {
          showSuccess(
            "Inspection Submitted Successfully!",
            `${categoryLabels[selectedCategory]} inspection has been saved. Progress updated automatically.`,
            8000
          );
        } else {
          toast({
            title: "Success!",
            description: `${categoryLabels[selectedCategory]} inspection submitted successfully! Progress updated automatically.`,
            duration: 4000
          });
        }

        console.log(`${categoryLabels[selectedCategory]} inspection submitted successfully!`);

        // Scroll to the inspection progress section after confirmation is dismissed
        setTimeout(() => {
          const progressSection = document.querySelector('[data-inspection-progress]');
          if (progressSection) {
            progressSection.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            });
          }
        }, 100);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'Failed to submit inspection');
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
      
      // Show enhanced error notification with fallback
      if (showError) {
        showError(
          "Submission Failed",
          "Failed to save inspection. Please check your connection and try again.",
          10000
        );
      } else {
        toast({
          title: "Submission Failed",
          description: "Failed to save inspection. Please check your connection and try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!isAllComplete) {
      toast({
        title: "Incomplete Inspections",
        description: "Please complete all required inspections before finalizing.",
        variant: "destructive"
      });
      return;
    }

    setIsFinalizing(true);
    try {
      // Update the building inspection as completed
      const response = await fetch(`/api/inspections/${buildingInspectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true }),
      });

      if (response.ok) {
        // Show enhanced final success notification
        if (showInfo) {
          showInfo(
            "Building Inspection Complete!",
            "Your whole building inspection has been finalized and saved successfully. All data has been recorded.",
            10000
          );
        } else {
          toast({
            title: "Building Inspection Complete!",
            description: "Your whole building inspection has been finalized and saved successfully.",
            duration: 5000
          });
        }

        console.log('Whole building inspection completed successfully!');
        
        // Delay navigation slightly to let user see the success message
        setTimeout(() => {
          if (onBack) onBack();
        }, 1000);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to finalize inspection');
      }
    } catch (error) {
      console.error('Error finalizing inspection:', error);
      
      // Show error notification with fallback
      if (showError) {
        showError(
          "Finalization Failed",
          "Failed to finalize building inspection. Please try again.",
          8000
        );
      } else {
        toast({
          title: "Finalization Failed",
          description: "Failed to finalize building inspection. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl space-y-8">
      <div className="mb-8">
        {onBack && (
          <div className="flex justify-start mb-6">
            <Button variant="outline" onClick={onBack} className="flex-shrink-0">
              ← Back
            </Button>
          </div>
        )}

        <div className="flex justify-center px-4">
          <Collapsible className="w-full max-w-2xl">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full p-4 h-auto font-normal text-center text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 rounded-lg text-sm sm:text-base leading-relaxed"
              >
                📋 How to conduct a whole building inspection ↓
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 p-6 bg-slate-50 rounded-lg border border-slate-200">
              <div className="space-y-3 text-sm text-muted-foreground">
                <div>
                  <h4 className="font-semibold text-primary mb-1">Step 1: Getting Started</h4>
                  <p>Enter your inspector name, select the school, and choose the inspection date. This information will be saved automatically.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Step 2: Complete Required Inspections</h4>
                  <p>Each category below shows how many inspections are required (e.g., 3 Classrooms, 2 Restrooms). Click "Select" on any incomplete category to start inspecting that area type.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Step 3: Rate Each Area</h4>
                  <p>For each room/area, rate the custodial performance using the 1-5 star system you're familiar with. Add room numbers and notes as needed.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Step 4: Track Progress</h4>
                  <p>Your progress is saved automatically. Green checkmarks show completed categories. Return anytime to continue where you left off.</p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">Step 5: Finalize</h4>
                  <p>Once all required inspections are complete, the "Finalize Building Inspection" button will become available to submit your comprehensive inspection.</p>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
      {/* Inspection Selector */}
      {showInspectionSelector && (
        <Card className="mx-2 sm:mx-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl sm:text-2xl">Building Inspection Options</CardTitle>
            <CardDescription className="text-base">You can continue a previous inspection or start a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 px-4 sm:px-6">
            {/* Start New Inspection - More Prominent */}
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 text-lg sm:text-xl">Start New Inspection:</h4>
              <Button
                onClick={startNewInspection}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-6 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-base sm:text-lg min-h-[60px] flex items-center justify-center gap-3"
                variant="default"
                size="lg"
              >
                <span className="text-xl">🏢</span>
                <span>Start New Building Inspection</span>
              </Button>
              <p className="text-sm text-slate-600 text-center px-2">
                Begin a fresh comprehensive building inspection
              </p>
            </div>
            
            {availableInspections.length > 0 && (
              <>
                <Separator className="my-6" />
                <div className="space-y-4">
                  <h4 className="font-semibold text-slate-900 text-lg sm:text-xl">Or Continue Previous Inspection:</h4>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {availableInspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 bg-orange-50 border-orange-200 gap-4"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-orange-900 truncate">{inspection.school}</div>
                          <div className="text-sm text-orange-700 mt-1">
                            {new Date(inspection.date).toLocaleDateString()}
                            {inspection.inspectorName && (
                              <span className="block text-sm text-orange-800 font-medium mt-1 truncate">
                                Inspector: {inspection.inspectorName}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={() => selectInspection(inspection)}
                          variant="outline"
                          size="sm"
                          className="border-orange-400 text-orange-700 hover:bg-orange-100 shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0 px-4 py-2"
                        >
                          Continue
                        </Button>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-slate-500 text-center px-2">
                    These inspections were started but not completed
                  </p>
                </div>
              </>
            )}
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
                <Label htmlFor="inspectorName">Inspector Name *</Label>
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
        <MobileCard title="Inspection Progress" data-inspection-progress>
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
                    isComplete 
                      ? 'bg-green-50 border-green-200' 
                      : selectedCategory === category 
                        ? 'bg-blue-50 border-blue-300 border-2' 
                        : 'bg-gray-50 border-gray-200'
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
                          {!isComplete && formData.school && formData.date && formData.inspectorName.trim() && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCategorySelect(category)}
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
        <Card data-inspection-progress>
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
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    isComplete 
                      ? 'bg-green-50 border-green-200' 
                      : selectedCategory === category 
                        ? 'bg-blue-50 border-blue-300 border-2' 
                        : 'bg-gray-50 border-gray-200'
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
                    {!isComplete && formData.school && formData.date && formData.inspectorName.trim() && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCategorySelect(category)}
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
      {/* Help message when form is not showing */}
      {!showInspectionSelector && selectedCategory && !(formData.school && formData.date && formData.inspectorName.trim()) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h4 className="font-medium text-amber-800 mb-1">Complete Required Information</h4>
                <p className="text-sm text-amber-700">
                  Please fill in all required fields above before you can start rating this category:
                </p>
                <ul className="text-sm text-amber-700 mt-2 space-y-1">
                  {!formData.inspectorName.trim() && <li>• Inspector Name is required</li>}
                  {!formData.school && <li>• School selection is required</li>}
                  {!formData.date && <li>• Inspection date is required</li>}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Inspection Form */}
      {!showInspectionSelector && selectedCategory && formData.school && formData.date && formData.inspectorName.trim() && (
        <form onSubmit={handleCategorySubmit} className={`space-y-4 ${isMobile ? '' : 'space-y-6'}`}>
          {isMobile ? (
            <MobileCard title={`Inspecting: ${categoryLabels[selectedCategory]}`}>
              {lastSaved && (
                <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Auto-saved at {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              {isAutoSaving && (
                <div className="flex items-center gap-2 mb-4 text-sm text-blue-600">
                  <Save className="w-4 h-4 animate-pulse" />
                  <span>Saving...</span>
                </div>
              )}
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
                <CardDescription>
                  Complete the inspection for this category
                  {lastSaved && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>Auto-saved at {lastSaved.toLocaleTimeString()}</span>
                    </div>
                  )}
                  {isAutoSaving && (
                    <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                      <Save className="w-4 h-4 animate-pulse" />
                      <span>Saving...</span>
                    </div>
                  )}
                </CardDescription>
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
              <div className="space-y-4">
                {inspectionCategories.map((category, index) => {
                  const currentRating = formData[category.key as keyof typeof formData] as number;
                  const isRated = currentRating !== -1;
                  
                  return (
                    <Collapsible key={category.key} defaultOpen={isRated}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors">
                          <div className="flex items-center gap-3">
                            <Label className="text-base font-medium cursor-pointer">
                              {category.label}
                            </Label>
                            {isRated && (
                              <Badge variant="default" className="text-xs">
                                {currentRating} star{currentRating > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">
                            {isRated ? '✓' : 'Tap to rate'}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <div className="pl-3">
                          {renderMobileStarRating(
                            category,
                            currentRating,
                            (rating: number) => handleInputChange(category.key as keyof typeof formData, rating)
                          )}
                        </div>
                      </CollapsibleContent>
                      {index < inspectionCategories.length - 1 && <div className="border-t mt-4" />}
                    </Collapsible>
                  );
                })}
              </div>
            </MobileCard>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Rate Each Category</CardTitle>
                <CardDescription>
                  Click on any category below to expand and rate it. Completed ratings are shown with checkmarks.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {inspectionCategories.map((category, index) => {
                    const key = category.key as keyof typeof formData;
                    const currentRating = formData[key] as number;
                    const isRated = currentRating !== -1;
                    
                    return (
                      <Collapsible key={category.key} defaultOpen={isRated}>
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border cursor-pointer hover:bg-gray-100 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-medium">
                                {category.label}
                              </span>
                              {isRated && (
                                <Badge variant="default">
                                  {currentRating} star{currentRating > 1 ? 's' : ''}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {isRated ? (
                                <span className="text-green-600 font-medium">✓ Rated</span>
                              ) : (
                                <span>Click to rate</span>
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="p-4 bg-white rounded-lg border border-gray-200">
                            {renderStarRating(
                              category,
                              currentRating,
                              (rating) => handleInputChange(key, rating)
                            )}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
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
                      onChange={handleImageUpload}
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
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  Upload existing images or take new photos to document the inspection (up to 5 images)
                </p>
                
                {/* Image Previews */}
                {selectedImages.length > 0 && (
                  <div className="space-y-3">
                    <Label>Selected Images ({selectedImages.length}/5)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                            {image.name.length > 10 ? image.name.substring(0, 10) + '...' : image.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  <Label htmlFor="image-upload-desktop" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Upload className="w-4 h-4" />
                      <span>Upload Images</span>
                    </div>
                    <Input
                      id="image-upload-desktop"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Label>

                  <Label htmlFor="camera-capture-desktop" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                      <Camera className="w-4 h-4" />
                      <span>Take Photo</span>
                    </div>
                    <Input
                      id="camera-capture-desktop"
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Label>
                </div>
                <p className="text-sm text-gray-500">
                  Select multiple images from your device or take new photos with your camera (up to 5 images)
                </p>
                
                {/* Image Previews */}
                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Images ({selectedImages.length}/5)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={URL.createObjectURL(image)}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                            {image.name.length > 12 ? image.name.substring(0, 12) + '...' : image.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Button 
            type="submit" 
            size="lg" 
            disabled={isSubmitting}
            className={`w-full bg-red-600 hover:bg-red-700 border-red-600 text-white shadow-lg hover:shadow-xl transform transition-all duration-200 ${isMobile ? 'h-14 text-lg' : ''} ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              `Submit ${categoryLabels[selectedCategory]} Inspection`
            )}
          </Button>
        </form>
      )}
      {/* Final Submit Button */}
      {!showInspectionSelector && (
        <div className={`border-t ${isMobile ? 'pt-4' : 'pt-6'}`}>
          <Button
            onClick={handleFinalSubmit}
            size="lg"
            className={`w-full bg-amber-700 hover:bg-amber-800 border-amber-700 text-white shadow-lg hover:shadow-xl transform transition-all duration-200 ${isMobile ? 'h-14 text-base' : ''} ${isFinalizing ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={!isAllComplete || isFinalizing}
          >
            {isFinalizing ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Finalizing...
              </>
            ) : (
              isMobile ? 'Finalize Building Inspection' : 'Finalize Whole Building Inspection'
            )}
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