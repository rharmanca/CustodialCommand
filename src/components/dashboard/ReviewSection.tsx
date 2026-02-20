import * as React from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { PendingBadge } from "./PendingBadge";
import { usePendingInspections } from "@/hooks/usePendingInspections";
import { FileCheck, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ReviewSectionProps {
  className?: string;
  onNavigate?: (page: string) => void;
}

/**
 * ReviewSection - Dashboard section for the Review workflow
 * 
 * Features:
 * - Header with "Review Inspections" title and PendingBadge
 * - Quick action to review all pending inspections
 * - Preview of recent pending inspections with thumbnails
 * - Teal/cool color theme for visual distinction from Capture
 * - Integration with usePendingInspections hook for real-time data
 */
export function ReviewSection({ className, onNavigate }: ReviewSectionProps) {
  const [, navigate] = useLocation();
  const { inspections, isLoading, error, pagination } = usePendingInspections({
    limit: 3,
  });

  const pendingCount = pagination?.totalCount ?? 0;

  const handleReviewAll = () => {
    if (onNavigate) {
      onNavigate("Photo Review");
    } else {
      navigate("/review-inspections");
    }
  };

  const handleReviewInspection = (id: number) => {
    if (onNavigate) {
      onNavigate("Photo Review");
    } else {
      navigate(`/review-inspections/${id}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-xl border border-teal-100 bg-teal-50/50 p-5",
          className
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-8 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={cn(
          "rounded-xl border border-red-200 bg-red-50 p-5",
          className
        )}
      >
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-semibold">Unable to Load Inspections</h3>
        </div>
        <p className="text-red-600 text-sm mb-3">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.reload()}
          className="border-red-200 hover:bg-red-100 h-10 min-h-[40px] min-w-[80px]"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 p-5",
        "shadow-sm",
        className
      )}
    >
      {/* Header with title and badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center flex-shrink-0">
            <FileCheck className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-teal-900">
              Review Inspections
            </h2>
          </div>
        </div>
        <PendingBadge count={pendingCount} />
      </div>

      {/* Description */}
      <p className="text-teal-700 text-sm mb-4">
        Complete detailed assessments from captured photos
      </p>

      {/* Quick action */}
      {pendingCount > 0 ? (
        <div className="mb-4">
          <Button
            onClick={handleReviewAll}
            variant="outline"
            className={cn(
              "w-full sm:w-auto",
              "h-12 min-h-[48px]", // 48px touch target for primary action
              "border-teal-300 hover:bg-teal-100 hover:border-teal-400",
              "text-teal-800 font-medium",
              "group transition-all duration-200"
            )}
          >
            <span>Review All Pending</span>
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </Button>
          <p className="text-teal-600 text-xs mt-2">
            {pendingCount} inspection{pendingCount !== 1 ? "s" : ""} waiting
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-white/60 rounded-lg border border-teal-100">
          <p className="text-teal-600 text-sm">
            No inspections pending review. Great job!
          </p>
        </div>
      )}

      {/* Recent pending inspections preview */}
      {inspections.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-teal-600 uppercase tracking-wide">
            Recent
          </h3>
          <div className="space-y-2">
            {inspections.slice(0, 3).map((inspection) => (
              <button
                key={inspection.id}
                onClick={() => handleReviewInspection(inspection.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg",
                  "min-h-[48px]", // 48px minimum touch target
                  "bg-white/60 hover:bg-white border border-transparent hover:border-teal-200",
                  "transition-all duration-200 text-left",
                  "focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                )}
              >
                {/* Thumbnail */}
                {inspection.thumbnailUrl ? (
                  <img
                    src={inspection.thumbnailUrl}
                    alt=""
                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-12 rounded bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="w-5 h-5 text-teal-500" />
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-teal-900 text-sm truncate">
                    {inspection.locationDescription || "Unknown Location"}
                  </p>
                  <p className="text-teal-600 text-xs">
                    {inspection.school}
                    {inspection.photoCount !== undefined &&
                      inspection.photoCount > 0 && (
                        <span className="ml-2">
                          {inspection.photoCount} photo
                          {inspection.photoCount !== 1 ? "s" : ""}
                        </span>
                      )}
                  </p>
                </div>

                {/* Arrow */}
                <ChevronRight className="w-4 h-4 text-teal-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewSection;
