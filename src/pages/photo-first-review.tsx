import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, CheckCircle2, Monitor, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePendingInspections } from '@/hooks/usePendingInspections';
import { PendingInspectionList } from '@/components/review/PendingInspectionList';
import { PhotoReviewPane } from '@/components/review/PhotoReviewPane';
import { InspectionCompletionForm } from '@/components/review/InspectionCompletionForm';
import type { PendingInspection, CompleteInspectionData } from '@/hooks/usePendingInspections';
import type { ReviewPhoto } from '@/components/review/PhotoReviewPane';

// Convert inspection images to review photos
function inspectionToPhotos(inspection: PendingInspection): ReviewPhoto[] {
  if (!inspection.images || inspection.images.length === 0) {
    return [];
  }

  return inspection.images.map((imageUrl, index) => ({
    id: `${inspection.id}-${index}`,
    thumbnailUrl: imageUrl.includes('?') ? `${imageUrl}&thumb=1` : `${imageUrl}?thumb=1`,
    fullUrl: imageUrl,
    alt: `Photo ${index + 1} of ${inspection.locationDescription || 'inspection'}`,
    capturedAt: inspection.captureTimestamp || inspection.createdAt,
  }));
}

// Desktop-only guard
function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  return isDesktop;
}

// Custom hook for URL search params
function useUrlSearchParams(): [URLSearchParams, (params: Record<string, string | null>) => void] {
  const [location, navigate] = useLocation();

  const searchParams = useMemo(() => {
    const url = new URL(window.location.href);
    return url.searchParams;
  }, [location]);

  const setSearchParams = useCallback((params: Record<string, string | null>) => {
    const url = new URL(window.location.href);

    Object.entries(params).forEach(([key, value]) => {
      if (value === null) {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });

    navigate(url.pathname + url.search);
  }, [navigate]);

  return [searchParams, setSearchParams];
}

export default function PhotoFirstReviewPage() {
  const [location, navigate] = useLocation();
  const [searchParams, setSearchParams] = useUrlSearchParams();
  const { toast } = useToast();
  const isDesktop = useIsDesktop();

  // Get inspection ID from URL
  const inspectionId = searchParams.get('id');

  // State
  const [selectedInspection, setSelectedInspection] = useState<PendingInspection | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  // Fetch pending inspections
  const {
    inspections,
    isLoading,
    error,
    refetch,
    completeInspection,
    discardInspection,
    isCompleting,
    isDiscarding,
    completeError,
    discardError,
  } = usePendingInspections();

  // Find selected inspection from list or URL
  useEffect(() => {
    if (inspectionId && inspections.length > 0) {
      const found = inspections.find(insp => insp.id === parseInt(inspectionId, 10));
      if (found) {
        setSelectedInspection(found);
      } else {
        // Inspection not found - it may have been completed/discarded
        toast({
          title: 'Inspection Not Found',
          description: 'This inspection may have already been completed or discarded.',
          variant: 'destructive',
        });
        setSearchParams({ id: null });
      }
    } else if (!inspectionId) {
      setSelectedInspection(null);
    }
  }, [inspectionId, inspections, setSearchParams, toast]);

  // Handle selecting an inspection
  const handleSelectInspection = (inspection: PendingInspection) => {
    setSearchParams({ id: inspection.id.toString() });
  };

  // Handle completing an inspection
  const handleComplete = async (data: CompleteInspectionData) => {
    if (!selectedInspection) return;

    const success = await completeInspection(selectedInspection.id, data);

    if (success) {
      setShowCompleted(true);
      setTimeout(() => {
        setShowCompleted(false);
        setSearchParams({ id: null });
      }, 2000);
    }
  };

  // Handle discarding an inspection
  const handleDiscard = async (id: number) => {
    const success = await discardInspection(id);

    if (success && selectedInspection?.id === id) {
      setSearchParams({ id: null });
    }
  };

  // Handle going back to list
  const handleBack = () => {
    setSearchParams({ id: null });
  };

  // Convert selected inspection photos
  const photos = useMemo(() => {
    return selectedInspection ? inspectionToPhotos(selectedInspection) : [];
  }, [selectedInspection]);

  // Mobile warning
  if (!isDesktop) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Desktop Only
            </CardTitle>
            <CardDescription>
              Photo-first review is optimized for desktop viewing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                The photo-first review interface requires a larger screen for optimal viewing.
                Please access this feature from a desktop or laptop computer (1024px+ width).
              </AlertDescription>
            </Alert>
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Current width: {typeof window !== 'undefined' ? window.innerWidth : 0}px
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state after completion
  if (showCompleted) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-800 mb-2">Inspection Completed!</h2>
            <p className="text-green-700">
              The inspection has been successfully completed and saved.
            </p>
            <Button
              onClick={() => setShowCompleted(false)}
              className="mt-6"
              variant="outline"
            >
              Return to List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Review mode - split pane layout
  if (selectedInspection) {
    return (
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Pending List
          </Button>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Review Inspection</h1>
            <Badge variant="secondary">{selectedInspection.school}</Badge>
            <Badge variant="outline">{selectedInspection.locationDescription}</Badge>
          </div>
        </div>

        {/* Split Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left Pane - Photos (Sticky) */}
          <div className="lg:h-fit">
            <PhotoReviewPane
              photos={photos}
              className="h-full"
            />
          </div>

          {/* Right Pane - Form (Scrollable) */}
          <div className="min-w-0">
            {isLoading ? (
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </CardContent>
              </Card>
            ) : (
              <InspectionCompletionForm
                inspection={selectedInspection}
                onComplete={handleComplete}
                isSubmitting={isCompleting}
                error={completeError}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // List mode - show pending inspections
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Photo-First Review</h1>
        <p className="text-muted-foreground">
          Complete full inspections using photos captured in the field.
          Select an inspection to review and rate all categories.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Pending Inspections List */}
      <PendingInspectionList
        inspections={inspections}
        isLoading={isLoading}
        error={error}
        onReview={handleSelectInspection}
        onDiscard={handleDiscard}
      />

      {/* Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Eye className="h-4 w-4" />
            How Photo-First Review Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Field staff capture quick photos during their walks</li>
            <li>Photos are automatically uploaded with location data</li>
            <li>Office staff review photos and complete full ratings</li>
            <li>Inspections are marked complete with both capture and completion timestamps</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
