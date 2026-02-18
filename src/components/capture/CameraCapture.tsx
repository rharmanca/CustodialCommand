import * as React from "react";
import { useCallback, useState } from "react";
import Webcam from "react-webcam";
import { Camera, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CameraCaptureProps {
  /** Callback when a photo is captured */
  onCapture: (imageSrc: string) => void;
  /** Optional initial photos */
  initialPhotos?: string[];
  /** Additional CSS classes */
  className?: string;
  /** Whether camera is disabled */
  disabled?: boolean;
}

/**
 * Continuous camera component using react-webcam.
 * Keeps camera active between shots to avoid re-initialization delay.
 * Large touch targets for field use with gloves.
 */
export const CameraCapture = React.forwardRef<HTMLDivElement, CameraCaptureProps>(
  ({ onCapture, initialPhotos = [], className, disabled = false }, ref) => {
    const webcamRef = React.useRef<Webcam>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const videoConstraints = {
      width: 1920,
      height: 1080,
      facingMode: "environment"
    };

    const handleUserMedia = useCallback(() => {
      setIsReady(true);
      setError(null);
      setHasPermission(true);
    }, []);

    const handleUserMediaError = useCallback((err: string | Error) => {
      setIsReady(false);
      setHasPermission(false);
      setError(typeof err === 'string' ? err : err.message || 'Camera access denied');
    }, []);

    const capture = useCallback(() => {
      if (!webcamRef.current || !isReady) {
        setError('Camera not ready');
        return;
      }

      try {
        const imageSrc = webcamRef.current.getScreenshot({
          width: 1920,
          height: 1080
        });

        if (imageSrc) {
          onCapture(imageSrc);
        } else {
          setError('Failed to capture image');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Capture failed');
      }
    }, [isReady, onCapture]);

    // Loading state while camera initializes
    if (hasPermission === null) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative w-full aspect-[4/3] bg-muted rounded-lg flex items-center justify-center",
            className
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Initializing camera...</p>
          </div>
        </div>
      );
    }

    // Permission denied state
    if (hasPermission === false || error) {
      return (
        <div
          ref={ref}
          className={cn(
            "relative w-full aspect-[4/3] bg-destructive/10 rounded-lg flex items-center justify-center border-2 border-destructive/30",
            className
          )}
        >
          <div className="flex flex-col items-center gap-3 p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-sm text-destructive font-medium">
              {error || 'Camera access denied'}
            </p>
            <p className="text-xs text-muted-foreground">
              Please allow camera access in your browser settings to use quick capture.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full flex flex-col gap-4",
          className
        )}
      >
        {/* Camera preview */}
        <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden">
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.9}
            videoConstraints={videoConstraints}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            className="w-full h-full object-cover"
            style={{ transform: 'scaleX(1)' }}
          />

          {/* Camera not ready overlay */}
          {!isReady && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Photo count badge */}
          {initialPhotos.length > 0 && (
            <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-medium px-2 py-1 rounded-full">
              {initialPhotos.length} photo{initialPhotos.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Capture button - large touch target (64px circle) */}
        <div className="self-center p-2">
          <button
            type="button"
            onClick={capture}
            disabled={!isReady || disabled}
            className={cn(
              "w-16 h-16 min-h-[64px] min-w-[64px] rounded-full",
              "flex items-center justify-center",
              "bg-primary text-primary-foreground",
              "shadow-lg hover:shadow-xl",
              "transition-all duration-200",
              "hover:scale-105 active:scale-95 active:brightness-95",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100",
              "border-4 border-white dark:border-gray-800",
              "touch-manipulation"
            )}
            aria-label="Capture photo"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>
      </div>
    );
  }
);

CameraCapture.displayName = "CameraCapture";

export default CameraCapture;
