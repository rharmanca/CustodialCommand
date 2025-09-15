import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { saveDraft, loadDraft, clearDraft, STORAGE_KEYS } from '@/utils/storage';

export interface BuildingInspectionFormData {
  inspectorName: string;
  school: string;
  date: string;
  buildingName: string;
  locationDescription: string;
  notes: string;
}

export interface InspectionRequirements extends Record<string, number> {
  exterior: number;
  gym_bleachers: number;
  classroom: number;
  cafeteria: number;
  utility_storage: number;
  admin_office: number;
  hallway: number;
  stairwell: number;
  restroom: number;
  staff_single_restroom: number;
}

export interface CompletedInspections {
  [key: string]: number;
}

export const useBuildingInspectionForm = () => {
  const { toast } = useToast();
  
  // Form data state
  const [formData, setFormData] = useState<BuildingInspectionFormData>({
    inspectorName: '',
    school: '',
    date: new Date().toISOString().split('T')[0],
    buildingName: '',
    locationDescription: '',
    notes: ''
  });

  // Inspection requirements
  const requirements: InspectionRequirements = {
    exterior: 2,
    gym_bleachers: 1,
    classroom: 3,
    cafeteria: 1,
    utility_storage: 1,
    admin_office: 2,
    hallway: 3,
    stairwell: 2,
    restroom: 2,
    staff_single_restroom: 1,
  };

  // Track completed inspections
  const [completed, setCompleted] = useState<CompletedInspections>(() => {
    const initial: CompletedInspections = {};
    Object.keys(requirements).forEach((key) => {
      initial[key] = 0;
    });
    return initial;
  });

  // Track available inspections and selection state
  const [availableInspections, setAvailableInspections] = useState<Record<string, string[]>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  // Draft management
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // School options
  const schoolOptions = [
    { value: "ASA", label: "ASA" },
    { value: "LCA", label: "LCA" },
    { value: "GWC", label: "GWC" },
    { value: "OA", label: "OA" },
    { value: "CBR", label: "CBR" },
    { value: "WLC", label: "WLC" },
  ];

  // Category labels for display
  const categoryLabels: Record<string, string> = {
    exterior: "Exterior",
    gym_bleachers: "Gym and Bleachers",
    classroom: "Classroom",
    cafeteria: "Cafeteria",
    utility_storage: "Utility Or Storage",
    admin_office: "Admin or Office Area",
    hallway: "Hallway",
    stairwell: "Stairwell",
    restroom: "Restroom",
    staff_single_restroom: "Staff or Single Restroom",
  };

  // Load draft on component mount
  useEffect(() => {
    const loadExistingDraft = () => {
      try {
        const draft = loadDraft(STORAGE_KEYS.DRAFT_BUILDING_INSPECTION);
        if (draft) {
          setFormData(draft.formData || formData);
          setCompleted(draft.completed || completed);
          setAvailableInspections(draft.availableInspections || {});
          setCurrentDraftId(draft.id);
          setLastSaved(new Date(draft.lastSaved));
          
          toast({
            title: "Draft Restored",
            description: "Your previous inspection has been restored.",
          });
        }
      } catch (error) {
        console.error('Error loading draft:', error);
      }
    };

    loadExistingDraft();
  }, []);

  // Auto-save functionality
  const autoSave = useCallback(async () => {
    if (!formData.inspectorName || !formData.school) return;

    setIsAutoSaving(true);
    try {
      const draftData = {
        formData,
        completed,
        availableInspections,
        lastSaved: new Date().toISOString(),
      };

      saveDraft(
        STORAGE_KEYS.DRAFT_BUILDING_INSPECTION,
        draftData
      );
      
      setCurrentDraftId(STORAGE_KEYS.DRAFT_BUILDING_INSPECTION);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  }, [formData, completed, availableInspections]);

  // Auto-save when form data changes
  useEffect(() => {
    const timeoutId = setTimeout(autoSave, 2000);
    return () => clearTimeout(timeoutId);
  }, [autoSave]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<BuildingInspectionFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Update completed inspections
  const updateCompleted = useCallback((category: string, count: number) => {
    setCompleted(prev => ({ ...prev, [category]: count }));
  }, []);

  // Update available inspections
  const updateAvailableInspections = useCallback((category: string, rooms: string[]) => {
    setAvailableInspections(prev => ({ ...prev, [category]: rooms }));
  }, []);

  // Clear draft
  const clearCurrentDraft = useCallback(() => {
    clearDraft(STORAGE_KEYS.DRAFT_BUILDING_INSPECTION);
    setCurrentDraftId(null);
    setLastSaved(null);
  }, []);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return formData.inspectorName.trim() !== '' && 
           formData.school.trim() !== '' && 
           formData.buildingName.trim() !== '';
  }, [formData]);

  // Check if all required inspections are completed
  const isInspectionComplete = useCallback(() => {
    return Object.keys(requirements).every(category => 
      completed[category] >= requirements[category as keyof InspectionRequirements]
    );
  }, [completed, requirements]);

  // Get completion percentage
  const getCompletionPercentage = useCallback(() => {
    const totalRequired = Object.values(requirements).reduce((sum, count) => sum + count, 0);
    const totalCompleted = Object.values(completed).reduce((sum, count) => sum + count, 0);
    return Math.round((totalCompleted / totalRequired) * 100);
  }, [completed, requirements]);

  return {
    // State
    formData,
    completed,
    availableInspections,
    selectedCategory,
    selectedRoom,
    currentDraftId,
    lastSaved,
    isAutoSaving,
    
    // Constants
    requirements,
    schoolOptions,
    categoryLabels,
    
    // Actions
    updateFormData,
    updateCompleted,
    updateAvailableInspections,
    setSelectedCategory,
    setSelectedRoom,
    clearCurrentDraft,
    
    // Computed values
    isFormValid: isFormValid(),
    isInspectionComplete: isInspectionComplete(),
    completionPercentage: getCompletionPercentage(),
  };
};
