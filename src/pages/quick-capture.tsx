// Quick Capture Page - Mobile-optimized rapid photo documentation
// Enables field inspectors to capture multiple photos with minimal UI friction

import { useState, useCallback, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { NetworkIndicator } from '@/components/ui/network-indicator';
import { usePendingCount, PENDING_COUNT_UPDATED_EVENT } from '@/hooks/usePendingCount';
import { getCsrfToken, refreshCsrfTokenIfNeeded } from '@/utils/csrf';
import { CameraCapture } from '@/components/capture/CameraCapture';
import { PhotoPreviewStrip } from '@/components/capture/PhotoPreviewStrip';
import { QuickNoteInput } from '@/components/capture/QuickNoteInput';
import { TagSelector } from '@/components/tags';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Camera,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  MapPin,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickCapturePageProps {
  onBack?: () => void;
}

// School options matching existing patterns
const SCHOOL_OPTIONS = [
  { value: 'ASA', label: 'ASA' },
  { value: 'LCA', label: 'LCA' },
  { value: 'GWC', label: 'GWC' },
  { value: 'OA', label: 'OA' },
  { value: 'CBR', label: 'CBR' },
  { value: 'WLC', label: 'WLC' }
];

// Common location presets for quick selection
const LOCATION_PRESETS = [
  'Hallway',
  'Restroom',
  'Classroom',
  'Cafeteria',
  'Gym',
  'Office',
  'Stairwell',
  'Exterior',
  'Storage',
  'Utility'
];

export default function QuickCapturePage({ onBack }: QuickCapturePageProps) {
  const { isMobile } = useIsMobile();
  const { toast } = useToast();
  const { isOnline } = useNetworkStatus();
  
  // Form state
  const [school, setSchool] = useState<string>('');
  const [captureLocation, setCaptureLocation] = useState<string>('');
  const [inspectorName, setInspectorName] = useState<string>('');
  const [quickNotes, setQuickNotes] = useState<string>('');
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load inspector name from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('inspectorName');
    if (savedName) {
      setInspectorName(savedName);
    }
  }, []);

  // Save inspector name when it changes
  useEffect(() => {
    if (inspectorName) {
      localStorage.setItem('inspectorName', inspectorName);
    }
  }, [inspectorName]);

  // Handle photo capture
  const handleCapture = useCallback((imageSrc: string) => {
    setCapturedImages(prev => [...prev, imageSrc]);
    // Haptic feedback on mobile
    if (isMobile && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
  }, [isMobile]);

  // Handle photo removal
  const handleRemovePhoto = useCallback((index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clear all captured images
  const handleClearPhotos = useCallback(() => {
    setCapturedImages([]);
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setSchool('');
    setCaptureLocation('');
    setQuickNotes('');
    setCapturedImages([]);
    setSelectedTags([]);
    setError(null);
    setShowSuccess(false);
  }, []);

  // Validate form before submission
  const validateForm = (): boolean => {
    if (!school) {
      setError('Please select a school');
      return false;
    }
    if (!captureLocation) {
      setError('Please enter a location');
      return false;
    }
    if (!inspectorName) {
      setError('Please enter your name');
      return false;
    }
    if (capturedImages.length === 0) {
      setError('Please capture at least one photo');
      return false;
    }
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    setError(null);
    
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: error || "Please fill in all required fields",
        duration: 4000
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Refresh CSRF token
      await refreshCsrfTokenIfNeeded();
      const csrfToken = getCsrfToken();

      // Prepare request body
      const requestBody = {
        school,
        captureLocation,
        inspectorName,
        quickNotes: quickNotes || undefined,
        images: capturedImages,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      };

      // Make API request
      const response = await fetch('/api/inspections/quick-capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {})
        },
        credentials: 'include',
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        setShowSuccess(true);
        toast({
          title: "✅ Quick Capture Saved!",
          description: `${capturedImages.length} photo${capturedImages.length !== 1 ? 's' : ''} saved for ${school}. Review on desktop later.`,
          duration: 5000
        });

        // Emit event to refresh pending count badge on dashboard
        window.dispatchEvent(new Event(PENDING_COUNT_UPDATED_EVENT));

        // Clear form after success
        setTimeout(() => {
          resetForm();
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to save quick capture');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save';
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: errorMessage,
        duration: 5000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background p-4 flex flex-col items-center justify-center">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Capture Saved!</h2>
            <p className="text-muted-foreground max-w-xs mx-auto">
              {capturedImages.length} photo{capturedImages.length !== 1 ? 's' : ''} saved for {school}
            </p>
            <p className="text-sm text-muted-foreground">
              Review and complete details on desktop later.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Button 
              onClick={resetForm}
              className="min-h-[56px] text-lg"
              size="lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Capture Another
            </Button>
            <Button 
              variant="outline"
              onClick={onBack}
              className="min-h-[48px]"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center justify-between max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="min-h-[44px] min-w-[44px] -ml-2"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-lg font-bold">Quick Capture</h1>
              <p className="text-xs text-muted-foreground">
                {capturedImages.length > 0 && `${capturedImages.length} photo${capturedImages.length !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Network status indicator */}
            <NetworkIndicator variant="compact" />

            {/* Clear photos button (only if photos exist) */}
            {capturedImages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearPhotos}
                className="text-destructive min-h-[44px]"
              >
                Clear All
              </Button>
            )}
          </div>
        </div>

        {/* Offline banner — shown when no connection */}
        {!isOnline && (
          <div
            role="alert"
            aria-live="assertive"
            className="bg-amber-50 border-t border-amber-200 px-4 py-2"
          >
            <p className="text-sm text-amber-800 font-medium text-center">
              You&apos;re offline. Photos will sync when connection is restored.
            </p>
          </div>
        )}
      </header>

      {/* Main content - Camera-first layout */}
      <main className="p-4 pb-32 max-w-2xl mx-auto space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Camera capture - PRIMARY: First in visual hierarchy */}
        <section
          className={cn(
            "space-y-3",
            isMobile && [
              "sticky z-30",
              "bottom-[calc(env(safe-area-inset-bottom)+6rem)]",
              "-mx-1 rounded-xl border border-border/60 bg-background/95 p-3 shadow-lg backdrop-blur"
            ]
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <Label className="text-base font-medium">
                Photos <span className="text-destructive">*</span>
              </Label>
            </div>
            {capturedImages.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {capturedImages.length} captured
              </span>
            )}
          </div>
          <CameraCapture
            onCapture={handleCapture}
            initialPhotos={capturedImages}
            disabled={isSubmitting}
            className={isMobile ? "gap-3" : undefined}
          />
        </section>

        {/* Photo preview strip */}
        {capturedImages.length > 0 && (
          <section>
            <PhotoPreviewStrip
              photos={capturedImages}
              onRemove={handleRemovePhoto}
            />
          </section>
        )}

        {/* Metadata section - SECONDARY: Collapsed by default on mobile */}
        <section className={cn(
          "space-y-4",
          "p-4 rounded-lg border bg-muted/30"
        )}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">Location Details</span>
          </div>

          {/* School selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              School <span className="text-destructive">*</span>
            </Label>
            <Select value={school} onValueChange={setSchool}>
              <SelectTrigger className="min-h-[56px] text-base bg-background">
                <SelectValue placeholder="Select school..." />
              </SelectTrigger>
              <SelectContent>
                {SCHOOL_OPTIONS.map((option) => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="min-h-[48px]"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location input */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Location <span className="text-destructive">*</span>
            </Label>
            <input
              type="text"
              value={captureLocation}
              onChange={(e) => setCaptureLocation(e.target.value)}
              placeholder="e.g., Room 101, Hallway A, etc."
              className={cn(
                "w-full px-4 py-3 rounded-lg border-2 border-input",
                "text-base min-h-[56px] bg-background",
                "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all duration-200"
              )}
            />
            {/* Quick location buttons */}
            <div className="flex flex-wrap gap-2">
              {LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCaptureLocation(preset)}
                  className={cn(
                    "px-3 py-2 text-sm rounded-full border-2",
                    "min-h-[44px] min-w-[60px]",
                    captureLocation === preset
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-muted-foreground/20 text-foreground hover:border-primary/50",
                    "transition-all duration-200 touch-manipulation"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Inspector name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Your Name <span className="text-destructive">*</span>
            </Label>
            <input
              type="text"
              value={inspectorName}
              onChange={(e) => setInspectorName(e.target.value)}
              placeholder="Enter your name"
              className={cn(
                "w-full px-4 py-3 rounded-lg border-2 border-input",
                "text-base min-h-[56px] bg-background",
                "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
                "transition-all duration-200"
              )}
            />
          </div>
        </section>

        {/* Quick notes - Collapsed by default */}
        <section>
          <QuickNoteInput
            value={quickNotes}
            onChange={setQuickNotes}
            maxLength={200}
            disabled={isSubmitting}
            defaultCollapsed={true}
          />
        </section>

        {/* Issue Tags - Categorization for filtering */}
        <section className={cn(
          "space-y-3",
          "p-4 rounded-lg border bg-muted/30"
        )}>
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="w-4 h-4" />
            <span className="text-sm font-medium">Issue Tags</span>
          </div>
          <TagSelector
            selected={selectedTags}
            onChange={setSelectedTags}
            maxSelection={3}
            disabled={isSubmitting}
          />
        </section>
      </main>

      {/* Save button - fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || capturedImages.length === 0}
            className={cn(
              "w-full min-h-[64px] text-lg font-semibold",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-6 h-6 mr-2" />
                Save Quick Capture
              </>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Photos will be saved with &quot;pending_review&quot; status
          </p>
        </div>
      </div>
    </div>
  );
}
