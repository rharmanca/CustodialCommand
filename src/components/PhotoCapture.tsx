import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Camera, CameraOff, RotateCw, MapPin, Wifi, WifiOff } from 'lucide-react';
import { useGesture } from '@use-gesture/react';
import type { LocationData, PhotoMetadata } from '@/types/photo';

interface PhotoCaptureProps {
  onPhotoCapture: (photoData: {
    blob: Blob;
    metadata: PhotoMetadata;
    location?: LocationData;
  }) => void;
  onLocationUpdate?: (location: LocationData | null) => void;
  maxPhotoSize?: number; // in bytes
  quality?: number; // 0.0 to 1.0
  className?: string;
  disabled?: boolean;
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotoCapture,
  onLocationUpdate,
  maxPhotoSize = 5 * 1024 * 1024, // 5MB default
  quality = 0.8,
  className = '',
  disabled = false
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);

  // Initialize camera stream
  const initializeCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920, max: 1920 },
          height: { ideal: 1080, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize camera';
      setError(errorMessage);
      setIsStreaming(false);
    } finally {
      setIsLoading(false);
    }
  }, [facingMode]);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, []);

  // Switch camera (front/back)
  const switchCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      setIsLocationLoading(true);

      const timeoutId = setTimeout(() => {
        setIsLocationLoading(false);
        resolve(null);
      }, 10000); // 10 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          setIsLocationLoading(false);

          const locationData: LocationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude || undefined,
            altitudeAccuracy: position.coords.altitudeAccuracy || undefined,
            heading: position.coords.heading || undefined,
            speed: position.coords.speed || undefined,
            timestamp: position.timestamp,
            source: 'gps'
          };

          setLocation(locationData);
          onLocationUpdate?.(locationData);
          resolve(locationData);
        },
        (error) => {
          clearTimeout(timeoutId);
          setIsLocationLoading(false);
          console.warn('Location access denied or unavailable:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000 // Accept 1 minute old locations
        }
      );
    });
  }, [onLocationUpdate]);

  // Capture photo from video stream
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !isStreaming) {
      setError('Camera not ready');
      return;
    }

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        setError('Failed to get canvas context');
        return;
      }

      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Get current location when photo is captured
      const currentLocation = await getCurrentLocation();

      // Convert canvas to blob
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setError('Failed to capture photo');
          return;
        }

        // Check file size
        if (blob.size > maxPhotoSize) {
          setError(`Photo too large. Maximum size is ${(maxPhotoSize / 1024 / 1024).toFixed(1)}MB`);
          return;
        }

        // Create metadata
        const metadata: PhotoMetadata = {
          width: canvas.width,
          height: canvas.height,
          fileSize: blob.size,
          capturedAt: new Date().toISOString(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            vendor: navigator.vendor,
            camera: facingMode
          },
          compressionRatio: quality.toFixed(2)
        };

        setCaptureCount(prev => prev + 1);
        onPhotoCapture({
          blob,
          metadata,
          location: currentLocation || undefined
        });
      }, 'image/jpeg', quality);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to capture photo';
      setError(errorMessage);
    }
  }, [isStreaming, getCurrentLocation, maxPhotoSize, quality, onPhotoCapture, facingMode]);

  // Handle gesture controls for mobile
  const bind = useGesture({
    onPinch: ({ delta: [d] }) => {
      // Could implement zoom functionality here
      if (videoRef.current) {
        const scale = Math.max(0.5, Math.min(2, 1 + d * 0.01));
        videoRef.current.style.transform = `scale(${scale})`;
      }
    },
    onClick: () => {
      if (!disabled && isStreaming) {
        capturePhoto();
      }
    }
  });

  // Initialize camera on mount
  useEffect(() => {
    if (!disabled) {
      initializeCamera();
    }

    return () => {
      stopCamera();
    };
  }, [initializeCamera, stopCamera, disabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Re-initialize camera when facing mode changes
  useEffect(() => {
    if (isStreaming) {
      initializeCamera();
    }
  }, [facingMode, initializeCamera]);

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Video Preview */}
          <div className="relative aspect-video bg-black" {...bind()}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}

            {/* Status Indicators */}
            <div className="absolute top-2 right-2 flex flex-col gap-2">
              {location && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  GPS
                </Badge>
              )}
              {isLocationLoading && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Location
                </Badge>
              )}
              <Badge variant={isStreaming ? "default" : "destructive"} className="flex items-center gap-1">
                {isStreaming ? <Camera className="w-3 h-3" /> : <CameraOff className="w-3 h-3" />}
                {isStreaming ? 'Live' : 'Offline'}
              </Badge>
            </div>

            {/* Capture Counter */}
            {captureCount > 0 && (
              <div className="absolute top-2 left-2">
                <Badge variant="secondary">
                  {captureCount} photo{captureCount !== 1 ? 's' : ''}
                </Badge>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="m-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="p-4 bg-background border-t">
            <div className="flex items-center justify-between gap-2">
              {/* Camera Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={isStreaming ? stopCamera : initializeCamera}
                disabled={isLoading || disabled}
                className="flex items-center gap-2"
              >
                {isStreaming ? <CameraOff className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                {isStreaming ? 'Stop' : 'Start'}
              </Button>

              {/* Switch Camera */}
              {isStreaming && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={switchCamera}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <RotateCw className="w-4 h-4" />
                  Switch
                </Button>
              )}

              {/* Capture Button */}
              <Button
                onClick={capturePhoto}
                disabled={!isStreaming || isLoading || disabled}
                className="flex-1"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
                Capture Photo
              </Button>
            </div>

            {/* Location Status */}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                {location ? (
                  <>
                    <MapPin className="w-3 h-3" />
                    Location available
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    No location data
                  </>
                )}
              </div>
              {captureCount > 0 && (
                <span>{captureCount} captured</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden canvas for photo capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default PhotoCapture;