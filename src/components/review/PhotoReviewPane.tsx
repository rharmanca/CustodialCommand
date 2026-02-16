import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { ZoomIn, X, ChevronLeft, ChevronRight, Camera } from 'lucide-react';

export interface ReviewPhoto {
  id?: string | number;
  thumbnailUrl: string;
  fullUrl: string;
  alt: string;
  capturedAt?: string | Date;
}

interface ProgressiveImageProps {
  thumbnailSrc: string;
  fullSrc: string;
  alt: string;
  onClick?: () => void;
  className?: string;
  containerClassName?: string;
}

function ProgressiveImage({
  thumbnailSrc,
  fullSrc,
  alt,
  onClick,
  className = '',
  containerClassName = '',
}: ProgressiveImageProps) {
  const [currentSrc, setCurrentSrc] = useState(thumbnailSrc);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // Reset state when src changes
    setCurrentSrc(thumbnailSrc);
    setIsLoaded(false);

    // Preload full image
    const img = new Image();
    img.src = fullSrc;
    img.onload = () => {
      setCurrentSrc(fullSrc);
      setIsLoaded(true);
    };

    fullImageRef.current = img;

    return () => {
      // Cleanup
      img.onload = null;
    };
  }, [thumbnailSrc, fullSrc]);

  const handleClick = useCallback(() => {
    if (onClick) {
      onClick();
    } else {
      setIsFullscreen(true);
    }
  }, [onClick]);

  return (
    <>
      <div
        className={`relative overflow-hidden rounded-md bg-muted cursor-pointer group ${containerClassName}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <img
          src={currentSrc}
          alt={alt}
          className={`w-full h-full object-cover transition-all duration-500 ${
            isLoaded ? 'blur-0' : 'blur-md'
          } ${className}`}
          loading="lazy"
        />

        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <Skeleton className="w-full h-full" />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="w-8 h-8 text-white" />
        </div>
      </div>

      {/* Fullscreen dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden bg-black/95 border-none">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <div className="relative flex items-center justify-center min-h-[50vh]">
            <img
              src={fullSrc}
              alt={alt}
              className="max-w-full max-h-[90vh] object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20"
              onClick={() => setIsFullscreen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface PhotoReviewPaneProps {
  photos: ReviewPhoto[];
  selectedIndex?: number;
  onSelectPhoto?: (index: number) => void;
  className?: string;
}

export function PhotoReviewPane({
  photos,
  selectedIndex,
  onSelectPhoto,
  className = '',
}: PhotoReviewPaneProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const goToPrevious = useCallback(() => {
    setLightboxIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  }, [photos.length]);

  const goToNext = useCallback(() => {
    setLightboxIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  }, [photos.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeLightbox();
          break;
        case 'ArrowLeft':
          goToPrevious();
          break;
        case 'ArrowRight':
          goToNext();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, closeLightbox, goToPrevious, goToNext]);

  if (photos.length === 0) {
    return (
      <Card className={`${className}`}>
        <CardHeader>
          <CardTitle className="text-lg">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Camera className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-sm">No photos available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentPhoto = photos[lightboxIndex];

  return (
    <>
      <Card className={`sticky top-4 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Photos ({photos.length})</span>
            {photos.length > 1 && (
              <span className="text-sm font-normal text-muted-foreground">
                Click to enlarge
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={containerRef}
            className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-1 scrollbar-thin"
          >
            {photos.map((photo, index) => (
              <div
                key={photo.id || index}
                className={`relative rounded-lg overflow-hidden transition-all ${
                  selectedIndex === index
                    ? 'ring-2 ring-primary ring-offset-2'
                    : ''
                }`}
                onClick={() => onSelectPhoto?.(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectPhoto?.(index);
                  }
                }}
              >
                <ProgressiveImage
                  thumbnailSrc={photo.thumbnailUrl}
                  fullSrc={photo.fullUrl}
                  alt={photo.alt}
                  onClick={() => openLightbox(index)}
                  containerClassName="aspect-video"
                />

                {/* Photo metadata overlay */}
                {photo.capturedAt && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-white">
                      {new Date(photo.capturedAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                )}

                {/* Selection indicator */}
                {selectedIndex === index && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                    Selected
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-[98vw] max-h-[98vh] p-0 overflow-hidden bg-black/95 border-none">
          <DialogTitle className="sr-only">
            {currentPhoto?.alt || 'Photo viewer'}
          </DialogTitle>
          <div className="relative flex items-center justify-center min-h-[60vh]">
            {currentPhoto && (
              <img
                src={currentPhoto.fullUrl}
                alt={currentPhoto.alt}
                className="max-w-full max-h-[90vh] object-contain"
              />
            )}

            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation buttons */}
            {photos.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="h-8 w-8" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                  onClick={goToNext}
                >
                  <ChevronRight className="h-8 w-8" />
                </Button>
              </>
            )}

            {/* Photo counter */}
            {photos.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                {lightboxIndex + 1} / {photos.length}
              </div>
            )}

            {/* Photo metadata */}
            {currentPhoto?.capturedAt && (
              <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded text-sm">
                {new Date(currentPhoto.capturedAt).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default PhotoReviewPane;
