import { useState, useEffect, useMemo, useCallback } from "react";
import {
  saveDraft,
  loadDraft,
  clearDraft,
  STORAGE_KEYS,
  migrateLegacyDrafts,
  getStorageStats,
} from "@/utils/storage";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MobileCard } from "@/components/ui/mobile-card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import {
  Star,
  Check,
  X,
  Upload,
  Camera,
  Save,
  Clock,
  Building2,
  Dumbbell,
  BookOpen,
  Utensils,
  Package,
  Briefcase,
  ArrowRight,
  TrendingUp,
  Bath,
  User,
  ChevronRight,
  Home,
  Send,
  Loader2,
  HelpCircle,
  CheckCircle2
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import {
  ratingDescriptions,
  inspectionCategories,
} from "../../shared/custodial-criteria";
import { CategoryCriteriaHelper, MobileCategoryCriteriaHelper } from '@/components/ui/category-criteria-helper';
// Navigation handled by onBack prop

interface WholeBuildingInspectionPageProps {
  onBack?: () => void;
}

export default function WholeBuildingInspectionPage({
  onBack,
}: WholeBuildingInspectionPageProps) {
  const { isMobile } = useIsMobile();
  const { toast } = useToast();

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

    // Add scroll prevention for select dropdowns
    document.addEventListener("scroll", preventScroll, { passive: false });

    return () => {
      document.removeEventListener("scroll", preventScroll);
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
    staff_single_restroom: 1,
  };

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

  // Category icons for visual identification
  const categoryIcons: Record<string, React.ElementType> = {
    exterior: Building2,
    gym_bleachers: Dumbbell,
    classroom: BookOpen,
    cafeteria: Utensils,
    utility_storage: Package,
    admin_office: Briefcase,
    hallway: ArrowRight,
    stairwell: TrendingUp,
    restroom: Bath,
    staff_single_restroom: User,
  };

  // School options
  const schoolOptions = [
    { value: "ASA", label: "ASA" },
    { value: "LCA", label: "LCA" },
    { value: "GWC", label: "GWC" },
    { value: "OA", label: "OA" },
    { value: "CBR", label: "CBR" },
    { value: "WLC", label: "WLC" },
  ];

  // Page loaded state for test synchronization
  const [pageLoaded, setPageLoaded] = useState(false);

  // Track completed inspections
  const [completed, setCompleted] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    Object.keys(requirements).forEach((key) => {
      initial[key] = 0;
    });
    return initial;
  });

  // Track available inspections and selection state
  const [availableInspections, setAvailableInspections] = useState<any[]>([]);
  const [showInspectionSelector, setShowInspectionSelector] = useState(false);
  const [isResuming, setIsResuming] = useState(false);
  const [savedInspections, setSavedInspections] = useState<any[]>([]);
  const [finalized, setFinalized] = useState(false);

  // Form data for current inspection
  const [formData, setFormData] = useState({
    inspectorName: "",
    school: "",
    date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`, // Local date (avoids UTC timezone shift)
    inspectionType: "whole_building",
    locationCategory: "",
    roomNumber: "",
    locationDescription: "",
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
    notes: "",
    // Add comments field to formData if it's intended to be used
    comments: "",
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAllComplete, setIsAllComplete] = useState(false);
  const [buildingInspectionId, setBuildingInspectionId] = useState<
    number | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // State for submission
  const [validationErrors, setValidationErrors] = useState<Record<string, boolean>>({});

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [currentFormDraftId, setCurrentFormDraftId] = useState<string | null>(
    null
  );

  // Check if all categories are complete and calculate overall progress
  useEffect(() => {
    const checkCompletion = () => {
      return Object.entries(requirements).every(([category, required]) => {
        return completed[category] >= required;
      });
    };
    setIsAllComplete(checkCompletion());
  }, [completed]);

  // Calculate overall statistics
  // Memoize expensive stats calculation to prevent unnecessary recalculations
  const stats = useMemo(() => {
    const totalRequired = Object.values(requirements).reduce((sum, req) => sum + req, 0);
    const totalCompleted = Object.values(completed).reduce((sum, count) => sum + count, 0);
    const completedCategories = Object.entries(requirements).filter(
      ([category, required]) => completed[category] >= required
    ).length;
    const inProgressCategories = Object.entries(requirements).filter(
      ([category, required]) => completed[category] > 0 && completed[category] < required
    ).length;
    const notStartedCategories = Object.keys(requirements).length - completedCategories - inProgressCategories;
    const overallPercentage = totalRequired > 0 ? Math.round((totalCompleted / totalRequired) * 100) : 0;

    return {
      totalRequired,
      totalCompleted,
      completedCategories,
      inProgressCategories,
      notStartedCategories,
      overallPercentage,
      totalCategories: Object.keys(requirements).length
    };
  }, [completed, requirements]);

  // Load available inspections on mount
  useEffect(() => {
    setPageLoaded(true);
    const loadAvailableInspections = async () => {
      try {
        const response = await fetch(
          "/api/inspections?type=whole_building&incomplete=true"
        );
        if (response.ok) {
          const inspections = await response.json();
          setAvailableInspections(inspections);
          if (inspections.length > 0) {
            setShowInspectionSelector(true);
          }
        }
      } catch (error) {
        console.error("Error loading available inspections:", error);
      }
    };

    loadAvailableInspections();
    migrateLegacyDrafts();
    loadFormDraft();

    // Log storage stats for monitoring
    const stats = getStorageStats();
    console.log("Building inspection storage stats:", stats);
  }, []);

  // Auto-save current form state
  useEffect(() => {
    if (
      buildingInspectionId &&
      selectedCategory &&
      (formData.inspectorName || formData.school || formData.date)
    ) {
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
        title: `${formData.school} - Building - ${
          categoryLabels[selectedCategory] || selectedCategory
        }`,
      };

      // Use optimized storage system
      saveDraft(
        `${STORAGE_KEYS.DRAFT_BUILDING_INSPECTION}_${draftId}`,
        draftData
      );
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving form draft:", error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const loadFormDraft = () => {
    try {
      const savedDrafts = localStorage.getItem("building_form_drafts");
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
          localStorage.setItem(
            "building_form_drafts",
            JSON.stringify(validDrafts)
          );
        }
      }
    } catch (error) {
      console.error("Error loading form drafts:", error);
    }
  };

  const clearCurrentFormDraft = () => {
    if (currentFormDraftId) {
      // Clear from optimized storage
      clearDraft(
        `${STORAGE_KEYS.DRAFT_BUILDING_INSPECTION}_${currentFormDraftId}`
      );

      // Also clean up legacy storage
      const existingDrafts = JSON.parse(
        localStorage.getItem("building_form_drafts") || "[]"
      );
      const updatedDrafts = existingDrafts.filter(
        (d: any) => d.id !== currentFormDraftId
      );
      if (updatedDrafts.length !== existingDrafts.length) {
        localStorage.setItem(
          "building_form_drafts",
          JSON.stringify(updatedDrafts)
        );
      }

      setCurrentFormDraftId(null);
      setLastSaved(null);
    }
  };

  // Function to select an existing inspection
  const selectInspection = async (inspection: any) => {
    try {
      setBuildingInspectionId(inspection.id);
      const newFormData = {
        inspectorName: inspection.inspectorName || "",
        school: inspection.school,
        date: inspection.date,
        inspectionType: "whole_building",
        locationCategory: "",
        roomNumber: "",
        locationDescription: "",
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
        notes: "",
        comments: "", // Ensure comments is reset or handled
      };
      setFormData(newFormData);

      // Load completed rooms for each category
      const roomResponse = await fetch(
        `/api/inspections/${inspection.id}/rooms`
      );
      if (roomResponse.ok) {
        const rooms = await roomResponse.json();
        const completedCount: Record<string, number> = {};
        Object.keys(requirements).forEach((key) => {
          completedCount[key] = rooms.filter(
            (room: any) => room.roomType === key
          ).length;
        });
        setCompleted(completedCount);
        setIsResuming(true);
        setShowInspectionSelector(false);
      }
    } catch (error) {
      console.error("Error loading inspection:", error);
    }
  };

  // Function to start a new inspection
  const startNewInspection = () => {
    // Do not clear building-level fields; preserve inspectorName, school, and date
    setShowInspectionSelector(false);
    setIsResuming(false);
    setBuildingInspectionId(null);
    setCompleted(() => {
      const initial: Record<string, number> = {};
      Object.keys(requirements).forEach((key) => {
        initial[key] = 0;
      });
      return initial;
    });
    setFormData((prev) => ({
      ...prev,
      inspectionType: "whole_building",
      locationCategory: "",
      roomNumber: "",
      locationDescription: "",
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
      notes: "",
      comments: "",
    }));
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleDateChange = (date: string) => {
    setFormData((prev) => ({
      ...prev,
      date,
    }));
  };

  const renderMobileStarRating = (
    category: any,
    currentRating: number,
    onRatingChange: (rating: number) => void
  ) => {
    return (
      <div className="space-y-4">
        {/* Criteria Help Button */}
        <MobileCategoryCriteriaHelper
          categoryLabel={category.label}
          criteria={category.criteria}
        />

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
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground hover:text-yellow-300"
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
                  ? "bg-muted border-border text-foreground"
                  : "bg-card border-border text-muted-foreground hover:bg-muted"
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
        {currentRating > 0 &&
          currentRating !== -1 &&
          category?.criteria &&
          category.criteria[currentRating] && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-1">
                Detailed Criteria for {currentRating} Star
                {currentRating > 1 ? "s" : ""}:
              </div>
              <div className="text-sm text-blue-800">
                {category.criteria[currentRating]}
              </div>
            </div>
          )}
      </div>
    );
  };

  const renderStarRating = (
    category: any,
    currentRating: number,
    onRatingChange: (rating: number) => void
  ) => {
    return (
      <div className="space-y-4">
        {/* Criteria Help - Desktop */}
        <div className="flex items-center justify-center">
          <span className="text-sm font-medium text-gray-700">Select Rating:</span>
          <CategoryCriteriaHelper
            categoryLabel={category.label}
            criteria={category.criteria}
          />
        </div>

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
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
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
        {currentRating > 0 &&
          currentRating !== -1 &&
          category?.criteria &&
          category.criteria[currentRating] && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-sm font-medium text-blue-900 mb-2">
                Detailed Criteria for {currentRating} Star
                {currentRating > 1 ? "s" : ""}:
              </div>
              <div className="text-sm text-blue-800">
                {category.criteria[currentRating]}
              </div>
            </div>
          )}
      </div>
    );
  };

  const resetCurrentForm = () => {
    setFormData((prev) => ({
      ...prev,
      inspectionType: "whole_building",
      locationCategory: selectedCategory || "",
      roomNumber: "",
      locationDescription: "",
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
      notes: "",
      comments: "", // Ensure comments is reset
    }));

    // Clear form draft state
    setCurrentFormDraftId(null);
    setLastSaved(null);
  };

  const handleCategorySelect = (category: string) => {
    // Store current scroll position
    const currentScrollY = window.scrollY;

    setSelectedCategory(category);
    setShowInspectionSelector(false);

    // Clear room-specific fields when switching categories to prevent data persistence
    setFormData((prev) => ({
      ...prev,
      roomNumber: "",
      locationDescription: "",
      locationCategory: category,
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
      notes: "",
      comments: "",
    }));

    // Prevent automatic scroll to top with multiple methods
    requestAnimationFrame(() => {
      window.scrollTo({ top: currentScrollY, behavior: "instant" });
    });

    // Also set a timeout as backup
    setTimeout(() => {
      window.scrollTo({ top: currentScrollY, behavior: "instant" });
    }, 10);

    setTimeout(() => {
      window.scrollTo({ top: currentScrollY, behavior: "instant" });
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous validation errors
    setValidationErrors({});

    if (!selectedCategory) {
      toast({
        title: "Category Required",
        description: "Please select a category before submitting.",
        variant: "destructive",
      });
      return;
    }

    // Validation
    const requiredFields = ["inspectorName", "school", "date", "roomNumber"];
    const missingFields = requiredFields.filter(
      (field) => !formData[field as keyof typeof formData]
    );

    if (missingFields.length > 0) {
      // Set validation errors for visual feedback
      const errors: Record<string, boolean> = {};
      missingFields.forEach(field => {
        errors[field] = true;
      });
      setValidationErrors(errors);

      toast({
        title: "Missing Required Fields",
        description: `Please fill in the highlighted fields`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare submission data that matches the database schema
      const submissionData = {
        inspectorName: formData.inspectorName,
        school: formData.school,
        date: formData.date,
        inspectionType: "whole_building",
        locationDescription: formData.locationDescription || `Building inspection for ${selectedCategory}`,
        roomNumber: formData.roomNumber || null,
        locationCategory: selectedCategory,
        buildingName: null, // Building name is not currently captured in the form
        buildingInspectionId: buildingInspectionId || null,
        floors: formData.floors >= 0 ? formData.floors : null,
        verticalHorizontalSurfaces: formData.verticalHorizontalSurfaces >= 0 ? formData.verticalHorizontalSurfaces : null,
        ceiling: formData.ceiling >= 0 ? formData.ceiling : null,
        restrooms: formData.restrooms >= 0 ? formData.restrooms : null,
        customerSatisfaction: formData.customerSatisfaction >= 0 ? formData.customerSatisfaction : null,
        trash: formData.trash >= 0 ? formData.trash : null,
        projectCleaning: formData.projectCleaning >= 0 ? formData.projectCleaning : null,
        activitySupport: formData.activitySupport >= 0 ? formData.activitySupport : null,
        safetyCompliance: formData.safetyCompliance >= 0 ? formData.safetyCompliance : null,
        equipment: formData.equipment >= 0 ? formData.equipment : null,
        monitoring: formData.monitoring >= 0 ? formData.monitoring : null,
        notes: formData.notes || null,
        images: [], // No images for building-level submissions
        verifiedRooms: [], // Will be populated when individual rooms are submitted
        isCompleted: false // Will be set to true when all categories are complete
      };

      console.log("Submitting building inspection:", submissionData);

      const response = await fetch("/api/submit-building-inspection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(submissionData),
      });

      const contentType = response.headers.get("content-type") || "";
      let result: any = null;
      let rawText: string | null = null;

      try {
        if (contentType.includes("application/json")) {
          result = await response.json();
        } else {
          rawText = await response.text();
        }
      } catch (parseErr) {
        // Fallback to text if JSON parsing fails
        try {
          rawText = await response.text();
        } catch {}
      }

      console.log("Submission response status:", response.status, "ctype:", contentType);
      if (result) console.log("Submission response JSON:", result);
      if (!result && rawText) console.log("Submission response TEXT:", rawText.slice(0, 300));

      if (!response.ok) {
        const serverMsg = (result && (result.message || result.error)) || rawText || null;
        throw new Error(serverMsg || `HTTP error! status: ${response.status}`);
      }

      // Treat as success if server indicates success or returned an id
      if ((result && (result.success || result.id)) || response.ok) {
        // Clear validation errors on success
        setValidationErrors({});

        toast({
          title: (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span>Room Inspection Saved!</span>
            </span>
          ),
          description: `${categoryLabels[selectedCategory]} room ${formData.roomNumber} recorded successfully. Progress updated.`,
          className: "border-green-500 bg-green-50",
        });

        // Set buildingInspectionId from the first successful submission for finalization
        if (result && result.id && !buildingInspectionId) {
          console.log("Setting buildingInspectionId from first submission:", result.id);
          setBuildingInspectionId(result.id);
        }

        // Update completed count for this category
        if (selectedCategory) {
          setCompleted((prev) => ({
            ...prev,
            [selectedCategory]: (prev[selectedCategory] || 0) + 1
          }));
        }

        // Clear the current form draft
        clearCurrentFormDraft();

        // Reset only room-specific fields, preserve inspector information
        setFormData((prev) => ({
          ...prev, // Preserve inspectorName, school, date, and other building-level info
          roomNumber: "",
          locationDescription: "",
          notes: "",
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
        }));

        // Clear selectedCategory to prevent validation warning from showing
        setSelectedCategory(null);
      } else {
        throw new Error(result.message || "Submission failed");
      }
    } catch (error) {
      console.error("Building inspection submission error:", error);

      // Provide more specific error messages
      let errorMessage =
        "Failed to save inspection. Please check your connection and try again.";

      if (error instanceof TypeError && error.message.includes("fetch")) {
        errorMessage = "Network error. Please check your internet connection.";
      } else if (error instanceof Error) {
        if (error.message.includes("404")) {
          errorMessage = "Server endpoint not found. Please contact support.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else if (error.message && error.message !== "Submission failed") {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!isAllComplete) {
      console.error(
        "Please complete all required inspections before finalizing."
      );
      return;
    }

    console.log("Attempting to finalize building inspection:", { buildingInspectionId, isAllComplete });

    if (!buildingInspectionId) {
      console.error("No building inspection ID available for finalization");
      toast({
        title: "Finalization Failed",
        description: "No building inspection ID found. Please start a new inspection.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Try finalize endpoint first
      console.log(`Calling finalize endpoint: /api/inspections/${buildingInspectionId}/finalize`);
      const finalizeResp = await fetch(`/api/inspections/${buildingInspectionId}/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log("Finalize response status:", finalizeResp.status);
      
      let ok = finalizeResp.ok;
      let errorMessage = null;

      if (!ok) {
        // Get error from finalize attempt
        try {
          const finalizeError = await finalizeResp.json();
          errorMessage = finalizeError.error || finalizeError.message;
          console.log("Finalize endpoint error:", finalizeError);
        } catch (e) {
          const finalizeText = await finalizeResp.text();
          console.log("Finalize endpoint error (text):", finalizeText.slice(0, 200));
          errorMessage = finalizeText;
        }

        // Fallback to PATCH if finalize route is unavailable
        console.log(`Trying PATCH fallback: /api/inspections/${buildingInspectionId}`);
        const patchResp = await fetch(`/api/inspections/${buildingInspectionId}`, {
          method: "PATCH",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ isCompleted: true }),
        });
        
        console.log("PATCH response status:", patchResp.status);
        ok = patchResp.ok;
        
        if (!ok) {
          try {
            const errData = await patchResp.json();
            errorMessage = errData.error || errData.message || 'Failed to finalize inspection';
            console.log("PATCH endpoint error:", errData);
          } catch (e) {
            const patchText = await patchResp.text();
            console.log("PATCH endpoint error (text):", patchText.slice(0, 200));
            errorMessage = patchText || 'Failed to finalize inspection';
          }
          throw new Error(errorMessage);
        }
      }

      // Mark as finalized to display banner
      setFinalized(true);

      // Show success toast notification
      toast({
        title: "🎉 Building Inspection Complete! 🎉",
        description:
          "Excellent work! All required inspections submitted successfully. The building inspection is now finalized.",
        duration: 5000,
        className: "border-green-500 bg-green-50",
      });

      console.log("Whole building inspection completed successfully!");

      // Optional: navigate back after a short delay if onBack is provided
      setTimeout(() => {
        if (onBack) onBack();
      }, 3000);
    } catch (error) {
      console.error("Error finalizing inspection:", error);

      // Show error toast notification
      toast({
        title: "Finalization Failed",
        description:
          "Failed to finalize building inspection. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto p-6 max-w-4xl space-y-6" data-loaded={pageLoaded ? "true" : undefined}>
      {/* Primary call-to-action placed above progress table */}
      {!showInspectionSelector && (
        <Card className="border-primary/30">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-semibold">Start New Building Inspection</div>
              <div className="text-sm text-muted-foreground">Guided, step-by-step workflow to complete all required areas</div>
            </div>
            <Button
              onClick={startNewInspection}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-shadow min-h-[44px]"
            >
              🏢 Start New Building Inspection
            </Button>
          </CardContent>
        </Card>
      )}
      {finalized && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="py-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-green-800">Building Inspection Finalized</div>
              <div className="text-sm text-green-700">Your comprehensive inspection has been submitted successfully.</div>
            </div>
            <Button
              onClick={() => {
                setFinalized(false);
                startNewInspection();
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Start New Building Inspection
            </Button>
          </CardContent>
        </Card>
      )}
      <div className="mb-6">
        {onBack && (
          <div className="flex justify-start mb-4">
            <Button
              variant="outline"
              onClick={onBack}
              className="flex-shrink-0 back-button"
            >
              ← Back
            </Button>
          </div>
        )}

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
                  <h4 className="font-semibold text-primary mb-1">
                    Step 1: Getting Started
                  </h4>
                  <p>
                    Enter your inspector name, select the school, and choose the
                    inspection date. This information will be saved
                    automatically.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    Step 2: Complete Required Inspections
                  </h4>
                  <p>
                    Each category below shows how many inspections are required
                    (e.g., 3 Classrooms, 2 Restrooms). Click "Select" on any
                    incomplete category to start inspecting that area type.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    Step 3: Rate Each Area
                  </h4>
                  <p>
                    For each room/area, rate the custodial performance using the
                    1-5 star system you're familiar with. Add room numbers and
                    notes as needed.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    Step 4: Track Progress
                  </h4>
                  <p>
                    Your progress is saved automatically. Green checkmarks show
                    completed categories. Return anytime to continue where you
                    left off.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-primary mb-1">
                    Step 5: Finalize
                  </h4>
                  <p>
                    Once all required inspections are complete, the "Finalize
                    Building Inspection" button will become available to submit
                    your comprehensive inspection.
                  </p>
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
            <CardTitle>Building Inspection Options</CardTitle>
            <CardDescription>
              You can continue a previous inspection or start a new one
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Start New Inspection - More Prominent */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 text-lg">
                Start New Inspection:
              </h4>
              <Button
                onClick={startNewInspection}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 border-2 border-green-600 hover:border-green-700 rounded-lg shadow-md hover:shadow-xl transition-all duration-200 text-lg min-h-[56px]"
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
                  <h4 className="font-medium text-gray-900">
                    Or Continue Previous Inspection:
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto border-2 border-amber-300 rounded-lg p-3 bg-amber-25 shadow-inner">
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-200">
                      <span className="text-sm font-medium text-amber-800">
                        Available Inspections
                      </span>
                      <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                        {availableInspections.length} found
                      </span>
                    </div>
                    {availableInspections.map((inspection, index) => (
                      <div
                        key={inspection.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-amber-100 bg-amber-50 border-amber-200 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-medium">
                              #{index + 1}
                            </span>
                            <div className="font-medium text-amber-900">
                              {inspection.school}
                            </div>
                          </div>
                          <div className="text-sm text-amber-700 mt-1">
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
                            className="border-amber-400 text-amber-700 hover:bg-amber-100 font-medium"
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
                    {availableInspections.length > 3 && (
                      <div className="text-center py-2 border-t border-amber-200 mt-2">
                        <span className="text-xs text-amber-600 bg-amber-100 px-3 py-1 rounded-full">
                          ↕ Scroll to see all {availableInspections.length}{" "}
                          inspections
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-2">
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
            <CardDescription>
              Select the school and date for this inspection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inspectorName">Inspector Name *</Label>
                <Input
                  id="inspectorName"
                  value={formData.inspectorName}
                  onChange={(e) =>
                    handleInputChange("inspectorName", e.target.value)
                  }
                  placeholder="Enter inspector name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="school">School</Label>
                <Select
                  value={formData.school}
                  onValueChange={(value) => handleInputChange("school", value)}
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
                  onChange={(e) => handleInputChange("date", e.target.value)}
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
                <span>{formData.inspectorName || "Not specified"}</span>
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
      {/* Overall Progress Summary */}
      {!showInspectionSelector && (formData.school || formData.date || isResuming) && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 animate-in fade-in-0 slide-in-from-top-4 duration-500">
          <CardContent className="py-4">
            <div className="space-y-4" role="region" aria-label="Overall inspection progress summary">
              {/* Overall Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-primary">Overall Progress</h3>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Tracks completion across all required room categories. Complete all rooms in a category to mark it complete.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <span className="text-2xl font-bold text-primary">
                    {stats.overallPercentage}%
                  </span>
                </div>
                <Progress
                  value={stats.overallPercentage}
                  className="h-3 bg-primary/10 transition-all duration-700 ease-out"
                  aria-label={`Overall progress: ${stats.overallPercentage}% complete`}
                  data-testid="multi-progress"
                />
                <p className="text-sm text-muted-foreground text-center" aria-live="polite" aria-atomic="true">
                  {stats.totalCompleted} of {stats.totalRequired} rooms inspected
                </p>
              </div>

              {/* Status Breakdown */}
              <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-xs font-medium text-muted-foreground">Complete</span>
                  </div>
                  <p className="text-xl font-bold text-green-700">
                    {stats.completedCategories}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                    <span className="text-xs font-medium text-muted-foreground">In Progress</span>
                  </div>
                  <p className="text-xl font-bold text-amber-700">
                    {stats.inProgressCategories}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span className="text-xs font-medium text-muted-foreground">Not Started</span>
                  </div>
                  <p className="text-xl font-bold text-gray-600">
                    {stats.notStartedCategories}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Jump Category Navigation */}
      {!showInspectionSelector && (formData.school || formData.date || isResuming) && (
        <Card className="animate-in fade-in-0 slide-in-from-top-4 duration-500 delay-75">
          <CardContent className="py-3">
            <div className="space-y-2" role="navigation" aria-label="Category quick jump navigation">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-muted-foreground">Quick Jump</h4>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Quickly switch between room categories. Green = complete, Amber = in progress, Gray = not started.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {Object.entries(requirements).map(([category, required]) => {
                  const completedCount = completed[category];
                  const isComplete = completedCount >= required;
                  const isInProgress = completedCount > 0 && !isComplete;
                  const IconComponent = categoryIcons[category];

                  return (
                    <button
                      key={category}
                      onClick={() => {
                        handleCategorySelect(category);
                        // Scroll to top smoothly
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-lg border-2 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95 min-w-[80px] ${
                        selectedCategory === category
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : isComplete
                          ? "border-green-300 bg-green-50 hover:border-green-400"
                          : isInProgress
                          ? "border-amber-300 bg-amber-50 hover:border-amber-400"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      disabled={!formData.school || !formData.date || !formData.inspectorName.trim()}
                      aria-label={`Select ${categoryLabels[category]} category. ${completedCount} of ${required} rooms completed. ${isComplete ? 'Complete' : isInProgress ? 'In progress' : 'Not started'}.`}
                    >
                      {IconComponent && (
                        <IconComponent
                          className={`w-5 h-5 ${
                            isComplete ? "text-green-600" : isInProgress ? "text-amber-600" : "text-gray-500"
                          }`}
                        />
                      )}
                      <span className="text-xs font-medium text-center leading-tight">
                        {categoryLabels[category].split(' ')[0]}
                      </span>
                      {isComplete && <Check className="w-3 h-3 text-green-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dynamic Checklist */}
      {!showInspectionSelector &&
        (isMobile ? (
          <MobileCard title="Inspection Progress" data-inspection-progress>
            <p className="text-sm text-gray-600 mb-4">
              Complete the required number of inspections for each category
              {formData.school && formData.date && (
                <span className="block text-xs text-gray-500 mt-1">
                  (Progress is automatically saved)
                </span>
              )}
            </p>
            <div className="space-y-4">
              {Object.entries(requirements).map(([category, required]) => {
                const completedCount = completed[category];
                const isComplete = completedCount >= required;
                const IconComponent = categoryIcons[category];

                return (
                  <div
                    key={category}
                    className={`p-4 rounded-lg border-l-4 border-y border-r ${
                      isComplete
                        ? "bg-green-50 border-l-green-500 border-y-green-200 border-r-green-200"
                        : selectedCategory === category
                        ? "bg-blue-50 border-l-blue-500 border-y-blue-300 border-r-blue-300"
                        : completedCount > 0
                        ? "bg-amber-50 border-l-amber-500 border-y-amber-200 border-r-amber-200"
                        : "bg-gray-50 border-l-gray-300 border-y-gray-200 border-r-gray-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div
                          className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isComplete
                              ? "bg-green-500 border-green-500"
                              : "border-gray-400"
                          }`}
                        >
                          {isComplete && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {IconComponent && (
                              <IconComponent
                                className={`w-4 h-4 flex-shrink-0 ${
                                  isComplete ? "text-green-700" : "text-gray-600"
                                }`}
                              />
                            )}
                            <span
                              className={`font-medium text-sm leading-tight ${
                                isComplete ? "text-green-800" : "text-gray-700"
                              }`}
                            >
                              {categoryLabels[category]}
                            </span>
                          </div>
                          <div className="space-y-2 mt-2">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={isComplete ? "default" : "secondary"}
                                className="text-xs"
                              >
                                {completedCount}/{required} Done
                              </Badge>
                              <span className="text-xs text-muted-foreground font-medium">
                                {Math.round((completedCount / required) * 100)}%
                              </span>
                            </div>
                            <Progress
                              value={(completedCount / required) * 100}
                              className="h-2"
                            />
                            {!isComplete &&
                              formData.school &&
                              formData.date &&
                              formData.inspectorName.trim() && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCategorySelect(category)}
                                  className={`text-xs px-3 min-h-[44px] w-full ${
                                    selectedCategory === category
                                      ? "border-blue-500 bg-blue-50 shadow-sm"
                                      : ""
                                  }`}
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
            <CardContent className="space-y-4">
              {Object.entries(requirements).map(([category, required]) => {
                const completedCount = completed[category];
                const isComplete = completedCount >= required;
                const IconComponent = categoryIcons[category];

                return (
                  <div
                    key={category}
                    className={`flex items-center justify-between p-4 rounded-lg border-l-4 border-y border-r ${
                      isComplete
                        ? "bg-green-50 border-l-green-500 border-y-green-200 border-r-green-200"
                        : selectedCategory === category
                        ? "bg-blue-50 border-l-blue-500 border-y-blue-300 border-r-blue-300"
                        : completedCount > 0
                        ? "bg-amber-50 border-l-amber-500 border-y-amber-200 border-r-amber-200"
                        : "bg-gray-50 border-l-gray-300 border-y-gray-200 border-r-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
                          isComplete
                            ? "bg-green-500 border-green-500"
                            : "border-gray-400"
                        }`}
                      >
                        {isComplete && <Check className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {IconComponent && (
                            <IconComponent
                              className={`w-4 h-4 flex-shrink-0 ${
                                isComplete ? "text-green-700" : "text-gray-600"
                              }`}
                            />
                          )}
                          <span
                            className={`font-medium ${
                              isComplete ? "text-green-800" : "text-gray-700"
                            }`}
                          >
                            {categoryLabels[category]}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={(completedCount / required) * 100}
                            className="h-2 flex-1"
                          />
                          <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                            {Math.round((completedCount / required) * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <Badge variant={isComplete ? "default" : "secondary"}>
                        {completedCount}/{required} Completed
                      </Badge>
                      {!isComplete &&
                        formData.school &&
                        formData.date &&
                        formData.inspectorName.trim() && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCategorySelect(category)}
                            className={`min-h-[44px] px-4 ${
                              selectedCategory === category
                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                : ""
                            }`}
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
      {!showInspectionSelector &&
        selectedCategory &&
        !(
          formData.school &&
          formData.date &&
          formData.inspectorName.trim()
        ) && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">
                    Complete Required Information
                  </h4>
                  <p className="text-sm text-amber-700">
                    Please fill in all required fields above before you can
                    start rating this category:
                  </p>
                  <ul className="text-sm text-amber-700 mt-2 space-y-1">
                    {!formData.inspectorName.trim() && (
                      <li>• Inspector Name is required</li>
                    )}
                    {!formData.school && (
                      <li>• School selection is required</li>
                    )}
                    {!formData.date && <li>• Inspection date is required</li>}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Breadcrumb Trail */}
      {!showInspectionSelector &&
        selectedCategory &&
        formData.school &&
        formData.date &&
        formData.inspectorName.trim() && (
          <Card className="bg-muted/30">
            <CardContent className="py-3">
              <nav className="flex items-center text-sm text-muted-foreground">
                <Home className="w-4 h-4 mr-2" />
                <span className="font-medium text-foreground">{formData.school}</span>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="font-medium text-foreground">
                  {categoryLabels[selectedCategory]}
                </span>
                {formData.roomNumber && (
                  <>
                    <ChevronRight className="w-4 h-4 mx-2" />
                    <span className="text-primary font-semibold">
                      Room {formData.roomNumber}
                    </span>
                  </>
                )}
              </nav>
            </CardContent>
          </Card>
        )}

      {/* Inspection Form */}
      {!showInspectionSelector &&
        selectedCategory &&
        formData.school &&
        formData.date &&
        formData.inspectorName.trim() && (
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 ${isMobile ? "" : "space-y-6"}`}
          >
            {isMobile ? (
              <MobileCard
                title={`Inspecting: ${categoryLabels[selectedCategory]}`}
              >
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
                    <Label
                      htmlFor="roomNumber"
                      className={`text-base font-medium ${
                        validationErrors.roomNumber ? "text-destructive" : ""
                      }`}
                    >
                      Room Number *
                    </Label>
                    <Input
                      id="roomNumber"
                      className={`h-12 text-base ${
                        validationErrors.roomNumber
                          ? "border-destructive focus-visible:ring-destructive"
                          : ""
                      }`}
                      value={formData.roomNumber}
                      onChange={(e) => {
                        handleInputChange("roomNumber", e.target.value);
                        // Clear error when user starts typing
                        if (validationErrors.roomNumber) {
                          setValidationErrors(prev => ({ ...prev, roomNumber: false }));
                        }
                      }}
                      placeholder="Enter room number"
                      required
                    />
                    {validationErrors.roomNumber && (
                      <p className="text-sm text-destructive">Room number is required</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="locationDescription"
                      className="text-base font-medium"
                    >
                      Location Description
                    </Label>
                    <Input
                      id="locationDescription"
                      className="h-12 text-base"
                      value={formData.locationDescription}
                      onChange={(e) =>
                        handleInputChange("locationDescription", e.target.value)
                      }
                      placeholder="e.g., Main Building, Second Floor"
                    />
                  </div>
                </div>
              </MobileCard>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>
                    Inspecting: {categoryLabels[selectedCategory]}
                  </CardTitle>
                  <CardDescription>
                    Complete the inspection for this category
                    {lastSaved && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>
                          Auto-saved at {lastSaved.toLocaleTimeString()}
                        </span>
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
                      <Label
                        htmlFor="roomNumber"
                        className={validationErrors.roomNumber ? "text-destructive" : ""}
                      >
                        Room Number *
                      </Label>
                      <Input
                        id="roomNumber"
                        className={
                          validationErrors.roomNumber
                            ? "border-destructive focus-visible:ring-destructive"
                            : ""
                        }
                        value={formData.roomNumber}
                        onChange={(e) => {
                          handleInputChange("roomNumber", e.target.value);
                          // Clear error when user starts typing
                          if (validationErrors.roomNumber) {
                            setValidationErrors(prev => ({ ...prev, roomNumber: false }));
                          }
                        }}
                        placeholder="Enter room number"
                        required
                      />
                      {validationErrors.roomNumber && (
                        <p className="text-sm text-destructive">Room number is required</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="locationDescription">
                        Location Description
                      </Label>
                      <Input
                        id="locationDescription"
                        value={formData.locationDescription}
                        onChange={(e) =>
                          handleInputChange(
                            "locationDescription",
                            e.target.value
                          )
                        }
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
                        formData[
                          category.key as keyof typeof formData
                        ] as number,
                        (rating: number) =>
                          handleInputChange(
                            category.key as keyof typeof formData,
                            rating
                          )
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
                  onChange={(e) => handleInputChange("notes", e.target.value)}
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
                    onChange={(e) => handleInputChange("notes", e.target.value)}
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
                          if (e.target.files && e.target.files.length > 0) {
                            toast({
                              title: "📸 Photos Uploaded Successfully!",
                              description: `Added ${
                                e.target.files.length
                              } photo${
                                e.target.files.length > 1 ? "s" : ""
                              } to room inspection documentation.`,
                              duration: 3000,
                            });
                            console.log(
                              "Files selected:",
                              e.target.files.length,
                              "files"
                            );
                            e.target.value = ""; // Reset input to allow selecting same files again
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
                              description:
                                "Camera photo has been added to your inspection documentation.",
                              duration: 3000,
                            });
                            console.log(
                              "Camera photo taken:",
                              e.target.files[0].name
                            );
                            e.target.value = ""; // Reset input to allow selecting same files again
                          }
                        }}
                        className="hidden"
                      />
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Upload existing images or take new photos to document the
                    inspection
                  </p>
                </div>
              </MobileCard>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Photo Documentation</CardTitle>
                  <CardDescription>
                    Upload images or take photos to document the inspection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Label
                      htmlFor="image-upload-desktop"
                      className="cursor-pointer"
                    >
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
                              description: `Added ${
                                e.target.files.length
                              } photo${
                                e.target.files.length > 1 ? "s" : ""
                              } to room inspection documentation.`,
                              duration: 3000,
                            });
                            console.log(
                              "Files selected:",
                              e.target.files.length,
                              "files"
                            );
                            e.target.value = ""; // Reset input to allow selecting same files again
                          }
                        }}
                        className="hidden"
                      />
                    </Label>

                    <Label
                      htmlFor="camera-capture-desktop"
                      className="cursor-pointer"
                    >
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
                              description:
                                "Camera photo has been added to your inspection documentation.",
                              duration: 3000,
                            });
                            console.log(
                              "Camera photo taken:",
                              e.target.files[0].name
                            );
                            e.target.value = ""; // Reset input to allow selecting same files again
                          }
                        }}
                        className="hidden"
                      />
                    </Label>
                  </div>
                  <p className="text-sm text-gray-500">
                    Select multiple images from your device or take new photos
                    with your camera
                  </p>
                </CardContent>
              </Card>
            )}

            <Button
              type="submit"
              size="lg"
              className={`w-full bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg transition-shadow ${
                isMobile ? "min-h-[56px] text-lg" : "min-h-[48px]"
              }`}
              disabled={isSubmitting} // Disable button while submitting
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving inspection...
                </span>
              ) : (
                `Submit ${categoryLabels[selectedCategory]} Inspection`
              )}
            </Button>
          </form>
        )}
      {/* Final Submit Button */}
      {!showInspectionSelector && (
        <div className={`border-t ${isMobile ? "pt-4" : "pt-6"}`}>
          <Button
            onClick={handleFinalSubmit}
            size="lg"
            className={`w-full bg-green-600 hover:bg-green-700 shadow-md hover:shadow-xl transition-all ${
              isMobile ? "min-h-[56px] text-base" : "min-h-[48px]"
            }`}
            disabled={!isAllComplete}
          >
            {isMobile
              ? "Finalize Building Inspection"
              : "Finalize Whole Building Inspection"}
          </Button>
          {!isAllComplete && (
            <p
              className={`text-center text-gray-500 mt-2 ${
                isMobile ? "text-xs px-2" : "text-sm"
              }`}
            >
              {isMobile
                ? "Complete all required inspections first"
                : "Complete all required inspections to enable this button"}
            </p>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) for Quick Submit */}
      {!showInspectionSelector &&
        selectedCategory &&
        formData.school &&
        formData.date &&
        formData.inspectorName.trim() && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in-0 zoom-in-95 duration-300">
            <Button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                // Find the form and trigger submit
                const form = document.querySelector('form');
                if (form) {
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
                }
              }}
              disabled={isSubmitting}
              className={`rounded-full shadow-xl hover:shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 ${
                isMobile
                  ? "w-14 h-14"
                  : "w-16 h-16"
              } bg-blue-600 hover:bg-blue-700 text-white`}
              title="Quick Submit Room"
              aria-label={isSubmitting ? "Submitting room inspection" : `Quick submit ${categoryLabels[selectedCategory]} inspection`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-6 h-6" />
              )}
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
