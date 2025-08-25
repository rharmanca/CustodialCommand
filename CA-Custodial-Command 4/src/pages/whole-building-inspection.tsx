import { useState, useEffect } from 'react';
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
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
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Star, Check, X, Upload, Camera, Save, Clock } from 'lucide-react';
=======
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Check, Save, Clock, Building2, AlertTriangle } from 'lucide-react';
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { ratingDescriptions, inspectionCategories } from '../../shared/custodial-criteria';

interface WholeBuildingInspectionPageProps {
  onBack?: () => void;
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
}

export default function WholeBuildingInspectionPage({ onBack }: WholeBuildingInspectionPageProps) {
=======
  showSuccess?: (title: string, description?: string, duration?: number) => string;
  showError?: (title: string, description?: string, duration?: number) => string;
  showInfo?: (title: string, description?: string, duration?: number) => string;
}

// Building requirements matrix
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

export default function WholeBuildingInspectionPage({ 
  onBack, 
  showSuccess, 
  showError, 
  showInfo 
}: WholeBuildingInspectionPageProps) {
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
  const { isMobile } = useIsMobile();
  const { toast } = useToast();

  // Progress tracking
  const [completed, setCompleted] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.keys(requirements).forEach(key => { initial[key] = 0; });
    return initial;
  });

  // Inspection management
  const [availableInspections, setAvailableInspections] = useState<any[]>([]);
  const [showInspectionSelector, setShowInspectionSelector] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [buildingInspectionId, setBuildingInspectionId] = useState<number | null>(null);

  // Form data with 11 rating categories (all start at -1 = "not rated")
  const [formData, setFormData] = useState({
    inspectorName: '',
    school: '',
    date: '',
    locationCategory: '',
    roomNumber: '',
    locationDescription: '',
    notes: '',
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
    monitoring: -1
  });

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAllComplete, setIsAllComplete] = useState(false);

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [currentFormDraftId, setCurrentFormDraftId] = useState<string | null>(null);

  // School options
  const schoolOptions = [
    { value: 'ASA', label: 'ASA' },
    { value: 'LCA', label: 'LCA' },
    { value: 'GWC', label: 'GWC' },
    { value: 'OA', label: 'OA' },
    { value: 'CBR', label: 'CBR' },
    { value: 'WLC', label: 'WLC' }
  ];

<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
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

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [currentFormDraftId, setCurrentFormDraftId] = useState<string | null>(null);

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
=======
  // Load incomplete building inspections on mount
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
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

  // Continuous completion checking
  useEffect(() => {
    const checkCompletion = () => {
      return Object.entries(requirements).every(([category, required]) => {
        return completed[category] >= required;
      });
    };
    setIsAllComplete(checkCompletion());
  }, [completed]);

  // Auto-save every 2 seconds when form data changes
  useEffect(() => {
    if (buildingInspectionId && selectedCategory && (formData.inspectorName || formData.school || formData.date)) {
      const timeoutId = setTimeout(() => {
        saveFormDraft();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData, selectedCategory, buildingInspectionId]);

<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
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

=======
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
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

  const saveFormDraft = async () => {
    if (!buildingInspectionId || !selectedCategory) return;

    setIsAutoSaving(true);
    try {
      const draftId = currentFormDraftId || `building_form_${buildingInspectionId}_${selectedCategory}_${Date.now()}`;
      if (!currentFormDraftId) setCurrentFormDraftId(draftId);

      const draftData = {
        id: draftId,
        buildingInspectionId,
        selectedCategory,
        formData: { ...formData },
        lastModified: new Date().toISOString(),
        title: `${formData.school} - Building - ${categoryLabels[selectedCategory]}`
      };

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

  const clearCurrentFormDraft = () => {
    if (currentFormDraftId) {
      try {
        const existingDrafts = JSON.parse(localStorage.getItem('building_form_drafts') || '[]');
        const updatedDrafts = existingDrafts.filter((d: any) => d.id !== currentFormDraftId);
        localStorage.setItem('building_form_drafts', JSON.stringify(updatedDrafts));
        setCurrentFormDraftId(null);
        setLastSaved(null);
      } catch (error) {
        console.error('Error clearing form draft:', error);
      }
    }
  };

  const startNewInspection = () => {
    setShowInspectionSelector(false);
    setIsResuming(false);
    setBuildingInspectionId(null);
    
    // Reset all completion counts to zero
    setCompleted(() => {
      const initial: Record<string, number> = {};
      Object.keys(requirements).forEach(key => { initial[key] = 0; });
      return initial;
    });
    
    // Reset form to empty state
    setFormData({
      inspectorName: '',
      school: '',
      date: '',
      locationCategory: '',
      roomNumber: '',
      locationDescription: '',
      notes: '',
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
      monitoring: -1
    });
  };

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
        notes: '',
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
        monitoring: -1
      });

      // Load existing room completion counts
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
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
=======
      if (showError) {
        showError("Load Failed", "Failed to load inspection data");
      }
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setFormData(prev => ({
      ...prev,
      locationCategory: category,
      roomNumber: '',
      locationDescription: '',
      notes: '',
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
      monitoring: -1
    }));
  };

<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
  const handleDateChange = (date: string) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
  };



  const renderMobileStarRating = (category: any, currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-50 rounded-lg p-4 border">
          <div className="text-sm font-medium text-gray-700 mb-3 text-center">
            Rate this category:
          </div>

          {/* Star Rating Buttons */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="p-2 rounded-md hover:bg-yellow-50 transition-colors touch-manipulation"
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

          {/* Not Rated Button */}
          <div className="flex justify-center">
            <button
              type="button"
              className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors touch-manipulation ${
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

        {/* Current Rating Status */}
        <div className="text-center">
          {currentRating > 0 && currentRating !== -1 ? (
            <div className="space-y-2">
              <div className="text-base font-semibold text-yellow-600">
                {ratingDescriptions[currentRating - 1]?.label}
              </div>
              <div className="text-sm text-gray-600">
                {ratingDescriptions[currentRating - 1]?.description}
              </div>
            </div>
          ) : (
            <div className="text-base font-semibold text-gray-600">
              No rating selected
            </div>
          )}
        </div>

        {/* Detailed Criteria */}
        {currentRating > 0 && currentRating !== -1 && category?.criteria && category.criteria[currentRating] && (
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
    );
  };

  const renderStarRating = (category: any, currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-4">
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant={currentRating === -1 ? "default" : "outline"}
            size="sm"
            className="px-3 py-2 text-xs"
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
                className={`w-6 h-6 ${
                  star <= currentRating && currentRating > 0
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </Button>
          ))}
        </div>

        {/* Current Rating Status */}
        <div className="text-center">
          {currentRating > 0 && currentRating !== -1 ? (
            <div className="space-y-2">
              <div className="text-lg font-semibold text-yellow-600">
                {ratingDescriptions[currentRating - 1]?.label}
              </div>
              <div className="text-sm text-gray-600">
                {ratingDescriptions[currentRating - 1]?.description}
              </div>
            </div>
          ) : (
            <div className="text-lg font-semibold text-gray-600">
              No rating selected
            </div>
          )}
        </div>

        {/* Detailed Criteria */}
        {currentRating > 0 && currentRating !== -1 && category?.criteria && category.criteria[currentRating] && (
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
    );
  };

=======
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
  const resetCurrentForm = () => {
    setFormData(prev => ({
      ...prev,
      roomNumber: '',
      locationDescription: '',
      notes: '',
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
      monitoring: -1
    }));
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx

    // Clear form draft state
    setCurrentFormDraftId(null);
    setLastSaved(null);
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
=======
    clearCurrentFormDraft();
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !formData.inspectorName.trim()) return;

<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
    if (!selectedCategory) return;

    // Validate inspector name is provided
    if (!formData.inspectorName.trim()) {
      console.error('Inspector name is required');
      return;
    }

=======
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
    try {
      // Create building inspection if it doesn't exist
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
            notes: '',
            images: []
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
        // Update completion count
        setCompleted(prev => ({
          ...prev,
          [selectedCategory]: prev[selectedCategory] + 1
        }));

        // Clear form and show success
        clearCurrentFormDraft();
        resetCurrentForm();
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx

        // Show success toast notification
        toast({
          title: "Inspection Submitted",
          description: `${categoryLabels[selectedCategory]} inspection has been saved successfully!`,
          duration: 4000,
        });
=======
        
        if (showSuccess) {
          showSuccess("Inspection Submitted", `${categoryLabels[selectedCategory]} inspection has been saved successfully!`, 3000);
        } else {
          toast({
            title: "Inspection Submitted",
            description: `${categoryLabels[selectedCategory]} inspection has been saved successfully!`,
            duration: 3000,
          });
        }
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx

        // Scroll to progress section
        setTimeout(() => {
          const progressSection = document.querySelector('[data-inspection-progress]');
          if (progressSection) {
            progressSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to submit inspection');
      }
    } catch (error) {
      console.error('Error submitting inspection:', error);
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx

      // Show error toast notification
      toast({
        title: "Submission Failed",
        description: "Failed to save inspection. Please check your connection and try again.",
        variant: "destructive",
        duration: 7000,
      });
=======
      if (showError) {
        showError("Submission Failed", "Failed to save inspection. Please try again.");
      } else {
        toast({
          title: "Submission Failed",
          description: "Failed to save inspection. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
    }
  };

  const handleFinalSubmit = async () => {
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
    if (!isAllComplete) {
      console.error('Please complete all required inspections before finalizing.');
      return;
    }
=======
    if (!isAllComplete || !buildingInspectionId) return;
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx

    try {
      const response = await fetch(`/api/inspections/${buildingInspectionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: true }),
      });

      if (response.ok) {
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
        // Show success toast notification
        toast({
          title: "🎉 You Did Your Duty, Thank You! 🎉",
          description: "Outstanding work! Your complete building inspection has been submitted successfully. Ready to start a new inspection when you return home.",
          duration: 5000,
        });

        console.log('Whole building inspection completed successfully!');

        // Delay navigation to let user see the success message
=======
        if (showSuccess) {
          showSuccess("Building Inspection Complete!", "Your whole building inspection has been finalized and saved successfully.", 4000);
        } else {
          toast({
            title: "Building Inspection Complete!",
            description: "Your whole building inspection has been finalized and saved successfully.",
            duration: 4000,
          });
        }

>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
        setTimeout(() => {
          if (onBack) onBack();
        }, 3000);
      } else {
        throw new Error('Failed to finalize inspection');
      }
    } catch (error) {
      console.error('Error finalizing inspection:', error);
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx

      // Show error toast notification
      toast({
        title: "Finalization Failed",
        description: "Failed to finalize building inspection. Please try again.",
        variant: "destructive",
        duration: 7000,
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="mb-6">
        {onBack && (
          <div className="flex justify-start mb-4">
            <Button variant="outline" onClick={onBack} className="flex-shrink-0">
              ← Back
=======
      if (showError) {
        showError("Finalization Failed", "Failed to finalize building inspection. Please try again.");
      } else {
        toast({
          title: "Finalization Failed",
          description: "Failed to finalize building inspection. Please try again.",
          variant: "destructive",
          duration: 4000,
        });
      }
    }
  };

  const renderMobileStarRating = (categoryData: any, currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3 border">
          <div className="text-sm font-medium text-gray-700 mb-2 text-center">
            Rate this category:
          </div>
          
          {/* Star Buttons */}
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
          
          {/* Not Rated Button */}
          <div className="flex justify-center">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-md border text-xs font-medium ${
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
        
        {/* Dynamic Rating Description */}
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
            
            {/* Detailed Criteria */}
            {categoryData?.criteria && categoryData.criteria[currentRating] && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-900 mb-1">
                  Detailed Criteria for {currentRating} Star{currentRating > 1 ? 's' : ''}:
                </div>
                <div className="text-sm text-blue-800">
                  {categoryData.criteria[currentRating]}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderStarRating = (categoryData: any, currentRating: number, onRatingChange: (rating: number) => void) => {
    return (
      <div className="space-y-3">
        <div className="flex justify-center gap-1">
          <Button
            type="button"
            variant={currentRating === -1 ? "default" : "outline"}
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
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
            </Button>
          ))}
        </div>

        {/* Rating Description */}
        {currentRating > 0 && currentRating !== -1 && (
          <div className="text-center space-y-1">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {ratingDescriptions[currentRating - 1]?.label}
            </Badge>
            <div className="text-xs text-gray-600">
              {ratingDescriptions[currentRating - 1]?.description}
            </div>
          </div>
        )}

<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
        <div className="flex justify-center px-4">
          <Collapsible className="w-full max-w-lg">
            <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                className="w-full p-3 h-auto font-normal text-center text-primary hover:text-primary/80 hover:bg-accent/10 border border-accent/30 rounded-lg text-sm sm:text-base leading-relaxed"
              >
                📋 How to conduct a whole building inspection ↓
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 p-4 bg-accent/10 rounded-lg border border-accent/30">
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
=======
        {/* Detailed Criteria */}
        {currentRating > 0 && currentRating !== -1 && categoryData?.criteria && categoryData.criteria[currentRating] && (
          <Card className="mt-2 bg-accent/10 border-accent/30">
            <CardContent className="p-3">
              <div className="text-xs text-accent-foreground">
                <strong className="text-sm">Rating {currentRating} Criteria:</strong>
                <p className="mt-1 leading-relaxed">{categoryData.criteria[currentRating]}</p>
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="flex-shrink-0">
            ← Back
          </Button>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Whole Building Inspection
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete comprehensive building assessments by inspecting required room categories
          </p>
        </div>
      </div>

      {/* Inspection Selection */}
      {showInspectionSelector && (
        <Card>
          <CardHeader>
            <CardTitle>Building Inspection Options</CardTitle>
            <CardDescription>You can continue a previous inspection or start a new one</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
            {/* Start New Inspection - More Prominent */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-lg">Start New Inspection:</h4>
              <Button
                onClick={startNewInspection}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 border-2 border-green-600 hover:border-green-700 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-lg"
                variant="default"
                size="lg"
              >
                🏢 Start New Building Inspection
              </Button>
              <p className="text-sm text-gray-600 text-center">
                Begin a fresh comprehensive building inspection
              </p>
            </div>

            {availableInspections.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Or Continue Previous Inspection:</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {availableInspections.map((inspection) => (
                      <div
                        key={inspection.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 bg-amber-50 border-amber-200"
                      >
                        <div>
                          <div className="font-medium text-amber-900">{inspection.school}</div>
                          <div className="text-sm text-amber-700">
                            {new Date(inspection.date).toLocaleDateString()}
                            {inspection.inspectorName && (
                              <span className="block text-sm text-amber-800 font-medium">
                                Inspector: {inspection.inspectorName}
                              </span>
                            )}
                          </div>
                        </div>
                        {!inspection.isCompleted ? (
                          <Button
                            onClick={() => selectInspection(inspection)}
                            variant="outline"
                            size="sm"
                            className="border-amber-400 text-amber-700 hover:bg-amber-100"
                          >
                            Continue
                          </Button>
                        ) : (
                          <Badge variant="default" className="bg-green-500">
                            Completed ✓
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    These inspections were started but not completed
                  </p>
                </div>
              </>
=======
            {/* Always show Start New button first */}
            <Button
              onClick={startNewInspection}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8"
            >
              🏢 Start New Building Inspection
            </Button>
            
            {/* Show incomplete inspections if any exist */}
            {availableInspections.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Or Continue Previous Inspection:</h4>
                {availableInspections.map((inspection) => (
                  <div key={inspection.id} className="flex items-center justify-between p-3 border rounded-lg bg-amber-50">
                    <div>
                      <div className="font-medium">{inspection.school}</div>
                      <div className="text-sm">{new Date(inspection.date).toLocaleDateString()}</div>
                      <div className="text-sm">Inspector: {inspection.inspectorName}</div>
                    </div>
                    <Button onClick={() => selectInspection(inspection)}>Continue</Button>
                  </div>
                ))}
              </div>
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
            )}
          </CardContent>
        </Card>
      )}

      {/* Building Information Form */}
      {!isResuming && !showInspectionSelector && (
        <Card>
          <CardHeader>
            <CardTitle>Building Information</CardTitle>
            <CardDescription>Enter the basic details for this building inspection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Inspector Name *</Label>
                <Input
                  value={formData.inspectorName}
                  onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                  placeholder="Enter inspector name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>School *</Label>
                <Select
                  value={formData.school}
                  onValueChange={(value) => handleInputChange('school', value)}
                >
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
              
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input
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

      {/* Validation Warning */}
      {!showInspectionSelector && 
       selectedCategory && 
       !(formData.school && formData.date && formData.inspectorName.trim()) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-medium text-amber-800">Complete Required Information</h4>
                <p className="text-sm text-amber-700">Please fill in all required fields above:</p>
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

      {/* Dynamic Progress Checklist */}
      {!showInspectionSelector && (
        <Card data-inspection-progress>
          <CardHeader>
            <CardTitle>Inspection Progress</CardTitle>
            <CardDescription>
              Complete the required number of inspections for each category
              {formData.school && formData.date && " (Progress is automatically saved)"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(requirements).map(([category, required]) => {
              const completedCount = completed[category];
              const isComplete = completedCount >= required;

              return (
                <div
                  key={category}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    isComplete 
                      ? 'bg-green-50 border-green-200' 
                      : selectedCategory === category 
                        ? 'bg-blue-50 border-blue-300 border-2' 
                        : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Checkbox Visual */}
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center transition-colors ${
                      isComplete ? 'bg-green-500 border-green-500' : 'border-gray-400'
                    }`}>
                      {isComplete && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`font-medium ${isComplete ? 'text-green-800' : 'text-gray-700'}`}>
                      {categoryLabels[category]}
                    </span>
                  </div>
                  
                  {/* Progress Badge and Select Button */}
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
      )}

<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
      {/* Inspection Form */}
=======
      {/* Individual Room Inspection Form */}
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
      {!showInspectionSelector && selectedCategory && formData.school && formData.date && formData.inspectorName.trim() && (
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspecting: {categoryLabels[selectedCategory]}</CardTitle>
              <CardDescription>
                Complete the inspection for this room category
              </CardDescription>
              {/* Auto-save indicators */}
              {lastSaved && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Auto-saved at {lastSaved.toLocaleTimeString()}</span>
                </div>
              )}
              {isAutoSaving && (
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Save className="w-4 h-4 animate-pulse" />
                  <span>Saving...</span>
                </div>
              )}
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
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

          {/* Rating Categories - Collapsible sections */}
          {isMobile ? (
            <MobileCard title="Rate Each Category">
              <div className="space-y-4">
                {inspectionCategories.map((category, index) => (
                  <CollapsibleSection
                    key={category.key}
                    title={category.label}
                    defaultCollapsed={true}
                    className="border border-gray-200"
                    titleClassName="text-left font-medium"
                    contentClassName="space-y-3"
                  >
                    {renderMobileStarRating(
                      category,
                      formData[category.key as keyof typeof formData] as number,
                      (rating: number) => handleInputChange(category.key as keyof typeof formData, rating)
                    )}
                  </CollapsibleSection>
                ))}
              </div>
            </MobileCard>
          ) : (
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              {inspectionCategories.map((category, index) => {
                const key = category.key as keyof typeof formData;
                return (
                  <CollapsibleSection
                    key={category.key}
                    title={category.label}
                    defaultCollapsed={true}
                    className="border border-gray-200"
                    titleClassName="text-left font-medium"
                    contentClassName="space-y-3"
                  >
                    {renderStarRating(
                      category,
                      formData[key] as number,
                      (rating) => handleInputChange(key, rating)
                    )}
                  </CollapsibleSection>
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
=======
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 11 Rating Categories */}
              {inspectionCategories.map((categoryData) => (
                <div key={categoryData.key} className="space-y-2">
                  <Label className="text-base font-medium">{categoryData.label}</Label>
                  {isMobile ? 
                    renderMobileStarRating(categoryData, formData[categoryData.key as keyof typeof formData] as number, (rating) => handleInputChange(categoryData.key, rating)) :
                    renderStarRating(categoryData, formData[categoryData.key as keyof typeof formData] as number, (rating) => handleInputChange(categoryData.key, rating))
                  }
                </div>
              ))}
              
              {/* Room Number */}
              <div className="space-y-2">
                <Label>Room Number/Identifier</Label>
                <Input
                  value={formData.roomNumber}
                  onChange={(e) => handleInputChange('roomNumber', e.target.value)}
                  placeholder="e.g., 101, A-Wing, Main Entrance"
                />
              </div>
              
              {/* Location Description */}
              <div className="space-y-2">
                <Label>Location Description</Label>
                <Input
                  value={formData.locationDescription}
                  onChange={(e) => handleInputChange('locationDescription', e.target.value)}
                  placeholder="e.g., Second Floor, Near Library, East Wing"
                />
              </div>
              
              {/* Notes */}
              <div className="space-y-2">
                <Label>Additional Notes</Label>
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Optional: Add any additional observations..."
                  rows={3}
                />
<<<<<<< HEAD:CA-Custodial-Command 4/src/pages/whole-building-inspection.tsx
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
                        if (e.target.files && e.target.files.length > 0) {
                          toast({
                            title: "📸 Photos Uploaded Successfully!",
                            description: `Added ${e.target.files.length} photo${e.target.files.length > 1 ? 's' : ''} to room inspection documentation.`,
                            duration: 3000
                          });
                          console.log('Files selected:', e.target.files.length, 'files');
                          e.target.value = ''; // Reset input to allow selecting same files again
                        }
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
                        if (e.target.files && e.target.files.length > 0) {
                          toast({
                            title: "📷 Photo Captured Successfully!",
                            description: "Camera photo has been added to your inspection documentation.",
                            duration: 3000
                          });
                          console.log('Camera photo taken:', e.target.files[0].name);
                          e.target.value = ''; // Reset input to allow selecting same files again
                        }
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
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          toast({
                            title: "📸 Photos Uploaded Successfully!",
                            description: `Added ${e.target.files.length} photo${e.target.files.length > 1 ? 's' : ''} to room inspection documentation.`,
                            duration: 3000
                          });
                          console.log('Files selected:', e.target.files.length, 'files');
                          e.target.value = ''; // Reset input to allow selecting same files again
                        }
                      }}
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
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          toast({
                            title: "📷 Photo Captured Successfully!",
                            description: "Camera photo has been added to your inspection documentation.",
                            duration: 3000
                          });
                          console.log('Camera photo taken:', e.target.files[0].name);
                          e.target.value = ''; // Reset input to allow selecting same files again
                        }
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
=======
              </div>
              
              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Submit {categoryLabels[selectedCategory]} Inspection
                </Button>
                <Button type="button" variant="outline" onClick={resetCurrentForm}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}

      {/* Final Building Completion */}
      {!showInspectionSelector && isAllComplete && buildingInspectionId && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="text-lg font-semibold text-green-800">
                ✅ All Required Inspections Complete!
              </div>
              <p className="text-sm text-green-700">
                You have completed all required inspections for this building. 
                Click below to finalize and submit your comprehensive building inspection.
              </p>
              <Button
                onClick={handleFinalSubmit}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8"
                size="lg"
              >
                Finalize Building Inspection
              </Button>
            </div>
          </CardContent>
        </Card>
>>>>>>> cadfd26dfb434a576df963764ff632b780371326:client/src/pages/whole-building-inspection.tsx
      )}
    </div>
  );
}