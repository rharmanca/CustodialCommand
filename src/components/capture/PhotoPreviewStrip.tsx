import * as React from "react";
import { X, Image } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PhotoPreviewStripProps {
  /** Array of photo URLs (base64 or blob URLs) */
  photos: string[];
  /** Callback when a photo is removed */
  onRemove: (index: number) => void;
  /** Additional CSS classes */
  className?: string;
  /** Maximum height of the strip */
  maxHeight?: string;
}

/**
 * Horizontal scrolling thumbnail strip of captured photos.
 * Each photo shows a remove button with 44px touch target.
 * Shows photo count indicator and empty state.
 */
export const PhotoPreviewStrip = React.forwardRef<HTMLDivElement, PhotoPreviewStripProps>(
  ({ photos, onRemove, className, maxHeight = "80px" }, ref) => {
    // Empty state - no photos captured
    if (photos.length === 0) {
      return (
        <div
          ref={ref}
          className={cn(
            "w-full flex items-center justify-center",
            "bg-muted/50 rounded-lg border-2 border-dashed border-muted-foreground/30",
            "py-4 px-4",
            className
          )}
          style={{ minHeight: maxHeight }}
        >
          <div className="flex items-center gap-2 text-muted-foreground">
            <Image className="w-5 h-5" />
            <span className="text-sm">No photos captured yet</span>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "w-full flex flex-col gap-2",
          className
        )}
      >
        {/* Photo count indicator */}
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-muted-foreground">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} captured
          </span>
          {photos.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Swipe to see all
            </span>
          )}
        </div>

        {/* Horizontal scrolling container */}
        <div
          className={cn(
            "w-full overflow-x-auto overflow-y-hidden",
            "scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent",
            "flex gap-2 p-1",
            "rounded-lg bg-muted/30"
          )}
          style={{ maxHeight }}
        >
          {photos.map((photo, index) => (
            <div
              key={`${photo.slice(-20)}-${index}`}
              className={cn(
                "relative flex-shrink-0",
                "rounded-lg overflow-hidden",
                "border-2 border-muted-foreground/20",
                "group"
              )}
              style={{
                height: maxHeight,
                aspectRatio: '4/3'
              }}
            >
              {/* Thumbnail image */}
              <img
                src={photo}
                alt={`Captured photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Remove button overlay - 44px touch target */}
              <button
                type="button"
                onClick={() => onRemove(index)}
                className={cn(
                  "absolute top-1 right-1",
                  "h-11 w-11 min-h-[44px] min-w-[44px]",
                  "flex items-center justify-center",
                  "bg-black/60 hover:bg-black/80",
                  "text-white rounded-full",
                  "transition-all duration-200",
                  "opacity-100 md:opacity-0 md:group-hover:opacity-100",
                  "focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary",
                  "touch-manipulation"
                )}
                aria-label={`Remove photo ${index + 1}`}
                title="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Photo number badge */}
              <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);

PhotoPreviewStrip.displayName = "PhotoPreviewStrip";

export default PhotoPreviewStrip;
