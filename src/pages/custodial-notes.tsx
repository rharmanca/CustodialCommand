import { useState, useEffect } from "react";
import { getCsrfToken, refreshCsrfTokenIfNeeded } from "@/utils/csrf";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { LoadingOverlay } from "@/components/shared/LoadingOverlay";
import {
  custodialNotesSchema,
  type CustodialNotesForm,
  custodialNotesDefaultValues,
} from "@/schemas";
import {
  compressImage,
  needsCompression,
  formatFileSize,
} from "@/utils/imageCompression";
import {
  Check,
  ChevronsUpDown,
  ChevronDown,
  HelpCircle,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import LocalStorageErrorBoundary from "@/components/errors/LocalStorageErrorBoundary";
import SafeLocalStorage from "@/utils/SafeLocalStorage";
import { useStorageQuotaMonitor } from "@/hooks/useStorageQuotaMonitor";

// School list for dropdown
const SCHOOLS = ["ASA", "CBR", "GWC", "LCA", "OA", "WLC"];

interface CustodialNotesPageProps {
  onBack?: () => void;
}

// Add custom animation styles
const progressAnimation = `
  @keyframes progress {
    from {
      width: 0%;
    }
    to {
      width: 100%;
    }
  }
`;

export default function CustodialNotesPage({
  onBack,
}: CustodialNotesPageProps) {
  const { toast } = useToast();

  // Monitor storage quota and show warnings
  useStorageQuotaMonitor({
    onWarning: (message, percentage, level) => {
      toast({
        variant: level === "critical" ? "destructive" : "default",
        title:
          level === "critical"
            ? "⚠️ Storage Almost Full"
            : "⚡ Storage Warning",
        description: message,
        duration: 7000,
      });
    },
    checkInterval: 30000, // Check every 30 seconds
    checkOnMount: true, // Check immediately on component mount
  });

  // React Hook Form with Zod validation
  const {
    register,
    handleSubmit: hookFormSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    getValues,
    watch,
    clearErrors,
  } = useForm<CustodialNotesForm>({
    resolver: zodResolver(custodialNotesSchema),
    defaultValues: custodialNotesDefaultValues,
  });

  // Watch all form fields for auto-save functionality
  // Using watch() instead of getValues() ensures the effect re-runs when form changes
  const watchedFields = watch();

  // Page loaded state for test synchronization
  const [pageLoaded, setPageLoaded] = useState(false);

  // Mark page as loaded when mounted
  useEffect(() => {
    setPageLoaded(true);
  }, []);

  // Image state (handled separately from form data)
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);

  // Confirmation dialog state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [formDataToConfirm, setFormDataToConfirm] =
    useState<CustodialNotesForm | null>(null);
  const [isActuallySubmitting, setIsActuallySubmitting] = useState(false);

  // School dropdown state
  const [openSchoolDropdown, setOpenSchoolDropdown] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState("");

  // Form progress tracking
  const [currentSection, setCurrentSection] = useState<number | null>(null);
  const [showScrollHint, setShowScrollHint] = useState(true);

  // Landscape detection for phones
  const [isLandscapePhone, setIsLandscapePhone] = useState(false);
  const [showLandscapeWarning, setShowLandscapeWarning] = useState(true);

  // Recent locations for quick selection
  const [recentLocations, setRecentLocations] = useState<string[]>([]);

  // Auto-save state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Success animation
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Report another issue workflow
  const [showReportAnotherDialog, setShowReportAnotherDialog] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] =
    useState<CustodialNotesForm | null>(null);

  // Track scroll position to determine current section
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll(".form-section");
      const scrollPosition = window.scrollY + window.innerHeight / 2;

      sections.forEach((section, index) => {
        const rect = section.getBoundingClientRect();
        const sectionTop = rect.top + window.scrollY;
        const sectionBottom = sectionTop + rect.height;

        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          setCurrentSection(index + 1);
        }
      });

      // Hide scroll hint after user scrolls
      if (window.scrollY > 100) {
        setShowScrollHint(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Detect landscape mode on phones
  useEffect(() => {
    const checkOrientation = () => {
      const isPhone = window.innerWidth <= 768;
      const isLandscape = window.innerHeight < 500;
      setIsLandscapePhone(isPhone && isLandscape);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // Auto-save form data to localStorage
  // CRITICAL: Using watchedFields (from watch()) instead of getValues() to ensure
  // the effect re-runs whenever form fields change. getValues() is a stable function
  // reference and won't trigger re-renders when form data changes.
  useEffect(() => {
    const hasData = Object.values(watchedFields).some(
      (val) => val && val !== "",
    );

    if (hasData && !isActuallySubmitting) {
      const saveTimer = setTimeout(() => {
        setIsSaving(true);
        const dataToSave = {
          ...watchedFields,
          selectedSchool,
          savedAt: new Date().toISOString(),
        };
        SafeLocalStorage.setItem(
          "custodialNotesDraft",
          JSON.stringify(dataToSave),
        );
        setLastSaved(new Date());
        setIsSaving(false);
      }, 2000); // Save 2 seconds after user stops typing

      return () => clearTimeout(saveTimer);
    }
  }, [watchedFields, selectedSchool, isActuallySubmitting]);

  // Load saved data on mount - Combined effect to prevent race conditions
  useEffect(() => {
    try {
      // First, check for a saved draft (takes priority over preferences)
      const saved = SafeLocalStorage.getItem("custodialNotesDraft");
      let hasDraft = false;

      if (saved) {
        const data = JSON.parse(saved);
        const savedDate = new Date(data.savedAt);
        const hoursSince =
          (Date.now() - savedDate.getTime()) / (1000 * 60 * 60);

        // Only restore if saved within last 24 hours
        if (hoursSince < 24) {
          hasDraft = true;

          // Restore all draft fields
          Object.keys(data).forEach((key) => {
            if (key !== "savedAt" && key !== "selectedSchool") {
              setValue(key as any, data[key]);
            }
          });
          if (data.selectedSchool) {
            setSelectedSchool(data.selectedSchool);
            setValue("school", data.selectedSchool);
          }
          setLastSaved(savedDate);
          toast({
            title: "Draft Restored",
            description: `Your work from ${savedDate.toLocaleString()} was restored.`,
            duration: 5000,
          });
        } else {
          // Clear old draft
          SafeLocalStorage.removeItem("custodialNotesDraft");
        }
      }

      // Only restore preferences if there's NO draft
      // This prevents overwriting draft-restored values
      if (!hasDraft) {
        // Restore inspector name
        const savedInspectorName = SafeLocalStorage.getItem(
          "custodialInspectorName",
        );
        if (savedInspectorName) {
          setValue("inspectorName", savedInspectorName);
        }

        // Restore last school
        const savedSchool = SafeLocalStorage.getItem("custodialLastSchool");
        if (savedSchool) {
          setSelectedSchool(savedSchool);
          setValue("school", savedSchool);
        }
      }

      // Always load recent locations (doesn't interfere with form fields)
      const savedLocations = SafeLocalStorage.getItem(
        "custodialRecentLocations",
      );
      if (savedLocations) {
        const locations = JSON.parse(savedLocations);
        setRecentLocations(Array.isArray(locations) ? locations : []);
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, [setValue, setSelectedSchool, toast]);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newImages = Array.from(files);
      const currentCount = images.length;
      const availableSlots = 5 - currentCount;
      const imagesToAdd = newImages.slice(0, availableSlots);

      if (imagesToAdd.length < newImages.length) {
        toast({
          title: "Maximum Images Reached",
          description: `Only ${imagesToAdd.length} images were added. Maximum of 5 images allowed.`,
        });
      }

      // Compress images that need it
      const compressedImages: File[] = [];
      let totalOriginalSize = 0;
      let totalCompressedSize = 0;

      for (const image of imagesToAdd) {
        totalOriginalSize += image.size;

        if (needsCompression(image, 500)) {
          try {
            const result = await compressImage(image, { maxSizeKB: 500 });
            compressedImages.push(result.compressedFile);
            totalCompressedSize += result.compressedSize;

            console.log(
              `Compressed ${image.name}: ${formatFileSize(image.size)} → ${formatFileSize(result.compressedSize)}`,
            );
          } catch (error) {
            console.error("Failed to compress image:", error);
            compressedImages.push(image);
            totalCompressedSize += image.size;
          }
        } else {
          compressedImages.push(image);
          totalCompressedSize += image.size;
        }
      }

      setImages((prev) => [...prev, ...compressedImages]);

      // Create preview URLs
      const urls = compressedImages.map((file) => URL.createObjectURL(file));
      setImagePreviewUrls((prev) => [...prev, ...urls]);

      if (compressedImages.length > 0) {
        const compressionSaved = totalOriginalSize - totalCompressedSize;
        const compressionRatio =
          compressionSaved > 0
            ? ((compressionSaved / totalOriginalSize) * 100).toFixed(1)
            : "0";

        toast({
          title: "📸 Photos Uploaded Successfully!",
          description: `Successfully added ${compressedImages.length} photo${compressedImages.length > 1 ? "s" : ""} to your custodial note documentation.${compressionSaved > 0 ? ` Saved ${formatFileSize(compressionSaved)} (${compressionRatio}% compression).` : ""}`,
          duration: 3000,
        });
      }
    }

    // Reset input value to allow same file to be selected again
    event.target.value = "";
  };

  const capturePhoto = () => {
    if (images.length >= 5) {
      toast({
        variant: "destructive",
        title: "Maximum Images Reached",
        description:
          "Maximum of 5 images allowed. Please remove some images first.",
      });
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";
    input.onchange = (e) => {
      const event = e as any;
      if (event.target.files && event.target.files.length > 0) {
        // Show immediate feedback for camera capture
        toast({
          title: "📷 Photo Captured Successfully!",
          description:
            "Camera photo is being processed and added to your documentation.",
          duration: 2000,
        });
      }
      handleImageUpload(event);
    };
    input.click();
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviewUrls = imagePreviewUrls.filter((_, i) => i !== index);

    // Revoke the URL to free memory
    URL.revokeObjectURL(imagePreviewUrls[index]);

    setImages(newImages);
    setImagePreviewUrls(newPreviewUrls);
  };

  // Helper function to update recent locations (keep last 5 unique values)
  const updateRecentLocations = (newLocation: string) => {
    if (!newLocation.trim()) return;

    setRecentLocations((prev) => {
      // Remove the location if it already exists
      const filtered = prev.filter((loc) => loc !== newLocation);
      // Add to the beginning and keep only the last 5
      const updated = [newLocation, ...filtered].slice(0, 5);

      // Save to localStorage
      try {
        SafeLocalStorage.setItem(
          "custodialRecentLocations",
          JSON.stringify(updated),
        );
      } catch (error) {
        console.error("Error saving recent locations:", error);
      }

      return updated;
    });
  };

  // Handler for "Report Another Issue" workflow
  const handleReportAnotherIssue = () => {
    if (!lastSubmittedData) return;

    // Pre-fill form with previous data (except notes and images)
    setValue("inspectorName", lastSubmittedData.inspectorName);
    setValue("school", lastSubmittedData.school);
    setValue("date", lastSubmittedData.date);
    setValue("location", lastSubmittedData.location);
    setValue(
      "locationDescription",
      lastSubmittedData.locationDescription || "",
    );

    // Also set the selected school for the dropdown
    setSelectedSchool(lastSubmittedData.school);

    // Clear notes and images for new report
    setValue("notes", "");
    setValue("images", []);

    // Close dialog and scroll to top
    setShowReportAnotherDialog(false);
    setLastSubmittedData(null);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Show toast to confirm pre-fill
    toast({
      title: "Form Pre-filled",
      description:
        "Inspector, school, date, and location have been filled in. Just add new notes and photos!",
      duration: 4000,
    });
  };

  // Handler for "Return to Home"
  const handleReturnHome = () => {
    setShowReportAnotherDialog(false);
    setLastSubmittedData(null);
    if (onBack) {
      onBack();
    }
  };

  // Form submission handler with Zod validation - shows confirmation dialog
  const onSubmit = async (data: CustodialNotesForm) => {
    // Validation is automatically handled by Zod schema via zodResolver
    // Store form data and show confirmation dialog
    setFormDataToConfirm(data);
    setShowConfirmDialog(true);
  };

  // Actual submission after confirmation
  const handleConfirmedSubmit = async () => {
    if (!formDataToConfirm) return;

    setIsActuallySubmitting(true);
    setShowConfirmDialog(false);

    try {
      const formDataToSend = new FormData();

      // Add text fields from validated data
      Object.entries(formDataToConfirm).forEach(([key, value]) => {
        if (key !== "images") {
          // Skip images array from form data
          formDataToSend.append(key, value?.toString() || "");
        }
      });

      // Add image files - use 'images' field name that backend expects
      images.forEach((image) => {
        formDataToSend.append("images", image);
      });

      // Ensure proper content-type handling for FormData
      // Some environments may not handle FormData correctly with fetch
      // Refresh CSRF token if needed before making the request
      await refreshCsrfTokenIfNeeded();
      const csrfToken = getCsrfToken();

      const fetchOptions: RequestInit = {
        method: "POST",
        body: formDataToSend,
        credentials: 'include', // Required to send CSRF cookie
        // Don't set Content-Type header when using FormData - browser will set it automatically with boundary
        headers: csrfToken ? { 'x-csrf-token': csrfToken } : {}
      };

      // Add user agent for debugging (only in development)
      if (process.env.NODE_ENV === 'development') {
        fetchOptions.headers = {
          ...fetchOptions.headers,
          'X-Debug-Info': JSON.stringify({
            userAgent: navigator.userAgent,
            formDataEntries: Array.from(formDataToSend.entries()).map(([key, value]) => [
              key,
              typeof value === 'string' ? value.substring(0, 50) + (value.length > 50 ? '...' : '') : `File(${value instanceof File ? value.name : 'unknown'})`
            ])
          })
        };
      }

      // Add timeout to prevent hanging indefinitely (30 second timeout)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      fetchOptions.signal = controller.signal;

      const response = await fetch("/api/custodial-notes", fetchOptions);
      clearTimeout(timeoutId);

      if (response.ok) {
        // Show success animation
        setShowSuccessAnimation(true);

        // Clear the draft from localStorage
        SafeLocalStorage.removeItem("custodialNotesDraft");

        // Save user preferences for next time
        try {
          SafeLocalStorage.setItem(
            "custodialInspectorName",
            formDataToConfirm.inspectorName,
          );
          SafeLocalStorage.setItem("custodialLastSchool", selectedSchool);
          updateRecentLocations(formDataToConfirm.location);
        } catch (error) {
          console.error("Error saving user preferences:", error);
        }

        // Save submitted data for "Report Another Issue" workflow
        setLastSubmittedData(formDataToConfirm);

        toast({
          title: "✅ Custodial Note Submitted Successfully!",
          description:
            "Your custodial concern has been recorded and will be reviewed.",
          variant: "default",
          duration: 5000,
        });

        // Reset form - keep inspector name and school, clear location and notes
        // Store current values that should persist
        const persistedInspector = formDataToConfirm.inspectorName;
        const persistedSchool = selectedSchool;

        // Reset form to defaults
        reset();

        // Immediately restore persisted values
        setValue("inspectorName", persistedInspector);
        setValue("school", persistedSchool);
        setSelectedSchool(persistedSchool);

        // Clear images
        setImages([]);
        imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url));
        setImagePreviewUrls([]);

        // Clear other state
        setFormDataToConfirm(null);
        setLastSaved(null);
        setIsActuallySubmitting(false);

        // Show "Report Another Issue" dialog after animation
        setTimeout(() => {
          setShowSuccessAnimation(false);
          setShowReportAnotherDialog(true);
        }, 3000);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({
            success: false,
            message: "Unknown error occurred",
            details: "Unable to parse server response"
          }));

        // Enhanced error handling with specific user guidance
        let errorMessage = errorData.message || "Unable to submit custodial note. Please try again.";
        let errorDetails = "";

        if (errorData.success === false && errorData.details) {
          if (Array.isArray(errorData.details)) {
            // Validation errors - show specific field issues
            const fieldErrors = errorData.details.map((err: any) =>
              `${err.field}: ${err.message}`
            ).join(', ');
            errorDetails = `Please check: ${fieldErrors}`;
          } else if (typeof errorData.details === 'object') {
            // Missing fields - show what's required
            const missingFields = Object.entries(errorData.details)
              .filter(([_, value]) => value === '✗ required')
              .map(([field]) => field.replace(/([A-Z])/g, ' $1').trim())
              .join(', ');
            errorDetails = `Required: ${missingFields}`;
          } else {
            errorDetails = errorData.details;
          }
        }

        // Special handling for FormData issues
        if (errorData.technical === 'FormData parsing failed' ||
            errorData.message?.includes('form data is malformed')) {
          errorMessage = "Form submission error";
          errorDetails = "Please refresh the page and try submitting again. If the problem persists, contact support.";
        }

        toast({
          variant: "destructive",
          title: "❌ Submission Failed",
          description: `${errorMessage}${errorDetails ? `\n\n${errorDetails}` : ''}`,
          duration: 8000,
        });
        setIsActuallySubmitting(false);

        // Log detailed error for debugging (in development)
        if (process.env.NODE_ENV === 'development') {
          console.error('Form submission error details:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            formDataFields: Object.keys(formDataToConfirm || {})
          });
        }
      }
    } catch (error) {
      console.error("Error submitting custodial note:", error);

      // Enhanced network error handling
      let errorMessage = "Network Error";
      let errorDetails = "Unable to connect to the server. Please check your connection and try again.";

      // Handle timeout/abort errors
      if (error instanceof Error && error.name === 'AbortError') {
        errorMessage = "Request Timeout";
        errorDetails = "The request took too long to complete. This might be due to:\n• Slow internet connection\n• Large file uploads\n• Server being busy\n\nPlease try again.";
      } else if (error instanceof TypeError) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = "Connection Failed";
          errorDetails = "Unable to reach the server. Please check:\n• Internet connection\n• Server is running\n• No firewall blocking the request";
        } else if (error.message.includes('NetworkError')) {
          errorMessage = "Network Error";
          errorDetails = "A network error occurred. Please try again.";
        }
      }

      toast({
        variant: "destructive",
        title: `❌ ${errorMessage}`,
        description: errorDetails,
        duration: 8000,
      });
      setIsActuallySubmitting(false);
    }
  };

  return (
    <LocalStorageErrorBoundary>
      {/* Inject animation styles */}
      <style>{progressAnimation}</style>

      <div className="max-w-3xl mx-auto p-6 space-y-8" data-loaded={pageLoaded ? "true" : undefined}>
        {onBack && (
          <Button
            onClick={onBack}
            variant="outline"
            className="mb-4 back-button min-h-[48px] px-6"
          >
            ← Back to Custodial
          </Button>
        )}

        {/* Landscape Phone Warning */}
        {isLandscapePhone && showLandscapeWarning && (
          <div className="bg-orange-50 border-2 border-orange-400 rounded-lg p-4 shadow-lg">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-2xl flex-shrink-0">📱</span>
                <div className="flex-1">
                  <h3 className="font-bold text-orange-900 text-lg mb-1">
                    Landscape Mode Detected
                  </h3>
                  <p className="text-orange-800 text-sm">
                    For the best experience filling out this form, please{" "}
                    <strong>rotate your device to portrait mode</strong>{" "}
                    (vertical orientation).
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLandscapeWarning(false)}
                className="text-orange-900 hover:bg-orange-100 flex-shrink-0"
              >
                ✕
              </Button>
            </div>
          </div>
        )}

        {/* Auto-Save Indicator */}
        {lastSaved && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            {isSaving ? (
              <>
                <Save className="h-4 w-4 animate-pulse" />
                <span>Saving draft...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4 text-green-600" />
                <span>Draft saved at {lastSaved.toLocaleTimeString()}</span>
              </>
            )}
          </div>
        )}

        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">
            Submit Custodial Note
          </h1>
          <p className="text-gray-600">
            Report maintenance issues, concerns, or general observations
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b-2 border-blue-200 py-3 -mx-6 px-6 shadow-sm">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-blue-800">
                Form Progress:
              </span>
              {currentSection && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-blue-100 text-blue-800 border-2 border-blue-300">
                  Section {currentSection} of 3
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <div
                className={`w-16 h-2 rounded-full transition-colors ${currentSection === 1 ? "bg-blue-600" : currentSection && currentSection > 1 ? "bg-blue-400" : "bg-gray-200"}`}
              />
              <div
                className={`w-16 h-2 rounded-full transition-colors ${currentSection === 2 ? "bg-blue-600" : currentSection && currentSection > 2 ? "bg-blue-400" : "bg-gray-200"}`}
              />
              <div
                className={`w-16 h-2 rounded-full transition-colors ${currentSection === 3 ? "bg-blue-600" : "bg-gray-200"}`}
              />
            </div>
          </div>
        </div>

        {/* Scroll Hint */}
        {showScrollHint && (
          <div className="animate-bounce text-center text-gray-500 text-sm">
            <ChevronDown className="inline-block" />
            <p>Scroll down to continue</p>
          </div>
        )}

        {/* Inspector Name Requirement Notice */}
        <div className="bg-amber-50 border-2 border-amber-400 rounded-lg p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⭐</span>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 text-lg mb-1">
                New Requirement: Inspector Name
              </h3>
              <p className="text-amber-800 text-sm">
                Please enter your name in the <strong>Inspector Name</strong>{" "}
                field. This is now required for all custodial notes to ensure
                proper accountability and follow-up.
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={hookFormSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Enter the basic details for this custodial note
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label
                  htmlFor="inspectorName"
                  className="flex items-center gap-2 flex-wrap"
                >
                  <span>Inspector Name</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                    Required
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-sm">
                      <p className="font-semibold mb-1">
                        Why is this required?
                      </p>
                      <p className="text-gray-600">
                        Your name ensures accountability and allows for proper
                        follow-up on reported issues. This helps maintain
                        quality standards across all facilities.
                      </p>
                    </PopoverContent>
                  </Popover>
                </Label>
                <Input
                  id="inspectorName"
                  {...register("inspectorName")}
                  placeholder="Enter your name"
                  className="border-2 min-h-[48px]"
                />
                {errors.inspectorName && (
                  <p className="text-sm text-red-500">
                    {errors.inspectorName.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="school"
                  className="flex items-center gap-2 flex-wrap"
                >
                  <span>School</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                    Required
                  </span>
                </Label>
                <Popover
                  open={openSchoolDropdown}
                  onOpenChange={setOpenSchoolDropdown}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openSchoolDropdown}
                      className="w-full justify-between border-2 min-h-[48px] text-left font-normal"
                    >
                      {selectedSchool || "Select school..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search schools..." />
                      <CommandEmpty>No school found.</CommandEmpty>
                      <CommandGroup>
                        {SCHOOLS.map((school) => (
                          <CommandItem
                            key={school}
                            value={school}
                            onSelect={(currentValue) => {
                              const newValue = currentValue.toUpperCase();
                              setSelectedSchool(newValue);
                              setValue("school", newValue);
                              setOpenSchoolDropdown(false);
                            }}
                            className="min-h-[48px] cursor-pointer"
                          >
                            <Check
                              className={`mr-2 h-4 w-4 ${
                                selectedSchool === school
                                  ? "opacity-100"
                                  : "opacity-0"
                              }`}
                            />
                            {school}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.school && (
                  <p className="text-sm text-red-500">
                    {errors.school.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="date"
                  className="flex items-center gap-2 flex-wrap"
                >
                  <span>Date</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                    Required
                  </span>
                </Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    {...register("date")}
                    className="border-2 min-h-[48px] pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                </div>
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="location"
                  className="flex items-center gap-2 flex-wrap"
                >
                  <span>Location</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
                    Required
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <HelpCircle className="h-4 w-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 text-sm">
                      <p className="font-semibold mb-1">Location Examples</p>
                      <ul className="text-gray-600 space-y-1 list-disc list-inside">
                        <li>Room numbers: "Room 105", "Classroom 202"</li>
                        <li>
                          Common areas: "Gymnasium", "Cafeteria", "Library"
                        </li>
                        <li>Outdoor: "Playground", "Parking Lot", "Field"</li>
                        <li>Facilities: "Restroom 1st Floor", "Main Office"</li>
                      </ul>
                    </PopoverContent>
                  </Popover>
                </Label>

                {/* Recent Locations Quick Selection */}
                {recentLocations.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1.5">
                      Recent locations:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {recentLocations.map((loc, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            setValue("location", loc);
                            // Optionally trigger validation
                            if (errors.location) {
                              clearErrors("location");
                            }
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <Input
                  id="location"
                  {...register("location")}
                  placeholder="e.g., Room 105, Gymnasium, Cafeteria"
                  className="border-2 min-h-[48px]"
                />
                {errors.location && (
                  <p className="text-sm text-red-500">
                    {errors.location.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationDescription">
                  Location Description
                </Label>
                <Input
                  id="locationDescription"
                  {...register("locationDescription")}
                  placeholder="e.g., Main Building, East Wing, 2nd Floor"
                  className="min-h-[48px]"
                />
                {errors.locationDescription && (
                  <p className="text-sm text-red-500">
                    {errors.locationDescription.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Issue Description & Notes
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm">
                    <p className="font-semibold mb-2">What to Include</p>
                    <ul className="text-gray-600 space-y-1 list-disc list-inside">
                      <li>
                        <strong>What:</strong> Describe the issue clearly
                      </li>
                      <li>
                        <strong>Where:</strong> Specific location details
                      </li>
                      <li>
                        <strong>When:</strong> When you noticed it
                      </li>
                      <li>
                        <strong>Severity:</strong> Is it urgent or can it wait?
                      </li>
                      <li>
                        <strong>Impact:</strong> How does it affect operations?
                      </li>
                      <li>
                        <strong>Action:</strong> What needs to be done?
                      </li>
                    </ul>
                  </PopoverContent>
                </Popover>
              </CardTitle>
              <CardDescription>
                Provide detailed information about the custodial issue or
                observation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("notes")}
                data-testid="custodial-notes-description"
                placeholder="Describe the issue, maintenance need, or observation...&#10;&#10;Examples:&#10;• Broken equipment or fixtures&#10;• Cleaning supply needs&#10;• Safety concerns&#10;• Maintenance requests&#10;• General observations&#10;• Follow-up needed"
                rows={10}
                className="min-h-[250px]"
              />
              {errors.notes && (
                <p className="text-sm text-red-500 mt-2">
                  {errors.notes.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Image Upload Section */}
          <Card className="form-section">
            <CardHeader>
              <CardTitle>Photos & Documentation</CardTitle>
              <CardDescription>
                Upload images or capture photos to document the issue
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="imageUpload" className="block mb-2">
                    Upload Images (Optional)
                  </Label>
                  <Input
                    id="imageUpload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() =>
                      document.getElementById("imageUpload")?.click()
                    }
                    variant="outline"
                    className="w-full h-12 border-2 border-dashed hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-base">
                      <span className="text-2xl">📁</span>
                      <span className="font-medium">
                        Tap to Select Photos{" "}
                        {images.length > 0 && `(${images.length} selected)`}
                      </span>
                    </span>
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum 5 images • Images auto-compressed
                  </p>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={capturePhoto}
                    variant="outline"
                    className="w-full sm:w-auto h-12 border-2"
                  >
                    <span className="flex items-center gap-2 text-base">
                      <span className="text-xl">📷</span>
                      <span>Capture Photo</span>
                    </span>
                  </Button>
                </div>
              </div>

              {/* Image Previews */}
              {imagePreviewUrls.length > 0 && (
                <div className="mt-4">
                  <Label className="block mb-2">
                    Uploaded Images ({images.length})
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imagePreviewUrls.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          onClick={() => removeImage(index)}
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button with Enhanced Loading States */}
          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || isActuallySubmitting}
              className="w-full md:w-auto disabled:bg-gray-400 disabled:cursor-not-allowed min-h-[56px] text-lg font-semibold transition-all duration-300 relative overflow-hidden"
            >
              {isSubmitting || isActuallySubmitting ? (
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-5 h-5 border-3 border-white/30 rounded-full"></div>
                  </div>
                  <span className="animate-pulse">
                    Submitting your report...
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Submit Custodial Note</span>
                </div>
              )}
            </Button>
          </div>
        </form>

        {/* Confirmation Dialog */}
        <AlertDialog
          open={showConfirmDialog}
          onOpenChange={setShowConfirmDialog}
        >
          <AlertDialogContent className="max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-blue-800 text-xl">
                ✅ Confirm Submission
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Please review your custodial note before submitting:
              </AlertDialogDescription>
            </AlertDialogHeader>

            {formDataToConfirm && (
              <div className="space-y-3 py-4">
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div>
                    <span className="font-semibold text-sm text-gray-700">
                      Inspector:
                    </span>
                    <p className="text-gray-900">
                      {formDataToConfirm.inspectorName}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-gray-700">
                      School:
                    </span>
                    <p className="text-gray-900">{formDataToConfirm.school}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-semibold text-sm text-gray-700">
                        Date:
                      </span>
                      <p className="text-gray-900">{formDataToConfirm.date}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-sm text-gray-700">
                        Location:
                      </span>
                      <p className="text-gray-900">
                        {formDataToConfirm.location}
                      </p>
                    </div>
                  </div>
                  {formDataToConfirm.locationDescription && (
                    <div>
                      <span className="font-semibold text-sm text-gray-700">
                        Location Details:
                      </span>
                      <p className="text-gray-900 text-sm">
                        {formDataToConfirm.locationDescription}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-sm text-gray-700">
                      Notes:
                    </span>
                    <p className="text-gray-900 text-sm max-h-24 overflow-y-auto">
                      {formDataToConfirm.notes &&
                      formDataToConfirm.notes.length > 200
                        ? `${formDataToConfirm.notes.substring(0, 200)}...`
                        : formDataToConfirm.notes || "No notes provided"}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-gray-700">
                      Photos:
                    </span>
                    <p className="text-gray-900">
                      {images.length} image{images.length !== 1 ? "s" : ""}{" "}
                      attached
                    </p>
                  </div>
                </div>
              </div>
            )}

            <AlertDialogFooter>
              <AlertDialogCancel>Review/Edit</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmedSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirm & Submit
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Loading overlay during form submission */}
        {isActuallySubmitting && (
          <LoadingOverlay message="Submitting report..." />
        )}

        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in duration-500">
              <div className="text-center space-y-6">
                {/* Animated Success Checkmark */}
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <svg
                        className="w-12 h-12 text-white animate-in zoom-in duration-700"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Sparkles around checkmark */}
                  <Sparkles className="absolute -top-2 -right-2 h-8 w-8 text-yellow-400 animate-pulse" />
                  <Sparkles
                    className="absolute -bottom-2 -left-2 h-6 w-6 text-yellow-400 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <Sparkles
                    className="absolute -top-2 -left-2 h-5 w-5 text-blue-400 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  />
                </div>

                {/* Success Message */}
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-green-700">
                    🎉 Success!
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Your custodial note has been submitted successfully!
                  </p>
                  <p className="text-sm text-gray-500">
                    Redirecting you back to the home page...
                  </p>
                </div>

                {/* Progress indicator */}
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-[progress_3s_ease-in-out]"
                    style={{
                      animation: "progress 3s ease-in-out forwards",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Another Issue Dialog */}
        {showReportAnotherDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in zoom-in duration-500">
              <div className="text-center space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Report Another Issue?
                  </h2>
                  <p className="text-gray-600">
                    Found another issue at the same location?
                  </p>
                  <p className="text-sm text-gray-500">
                    We can pre-fill your inspector name, school, date, and
                    location to save you time!
                  </p>
                </div>

                {/* Buttons */}
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleReportAnotherIssue}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg min-h-[48px]"
                  >
                    📝 Report Another Issue Here
                  </button>
                  <button
                    onClick={handleReturnHome}
                    className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors min-h-[48px]"
                  >
                    🏠 Return to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </LocalStorageErrorBoundary>
  );
}
