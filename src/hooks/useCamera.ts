import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseCameraReturn {
  /** Ref to pass to Webcam component */
  webcamRef: React.RefObject<HTMLVideoElement>;
  /** Array of captured base64 image strings */
  capturedImages: string[];
  /** Function to take a screenshot */
  capture: () => void;
  /** Function to reset captured images */
  clearImages: () => void;
  /** Camera permission state: true=granted, false=denied, null=checking */
  hasPermission: boolean | null;
  /** Whether camera stream is active and ready */
  isReady: boolean;
  /** Error message if camera fails */
  error: string | null;
  /** Remove a specific image by index */
  removeImage: (index: number) => void;
}

/**
 * Hook for continuous camera capture using react-webcam.
 * Keeps camera active between captures to avoid re-initialization delay.
 */
export const useCamera = (): UseCameraReturn => {
  const webcamRef = useRef<HTMLVideoElement>(null);
  const [capturedImages, setCapturedImages] = useState<string[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check camera permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Try to access camera to check permission
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
        
        setHasPermission(true);
      } catch (err) {
        setHasPermission(false);
        setError('Camera access denied. Please allow camera access in your browser settings.');
      }
    };

    checkPermissions();
  }, []);

  // Set ready state when webcam component reports it's ready
  const handleUserMedia = useCallback(() => {
    setIsReady(true);
    setError(null);
  }, []);

  const handleUserMediaError = useCallback((err: Error) => {
    setIsReady(false);
    setError(err.message || 'Failed to access camera');
    setHasPermission(false);
  }, []);

  // Capture a screenshot
  const capture = useCallback(() => {
    const video = webcamRef.current;
    if (!video || !isReady) {
      setError('Camera not ready');
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1920;
      canvas.height = video.videoHeight || 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        setError('Failed to create canvas context');
        return;
      }

      // Draw the current video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get base64 data URL at high quality
      const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
      
      if (imageSrc) {
        setCapturedImages(prev => [...prev, imageSrc]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture image');
    }
  }, [isReady]);

  // Clear all captured images
  const clearImages = useCallback(() => {
    setCapturedImages([]);
  }, []);

  // Remove a specific image by index
  const removeImage = useCallback((index: number) => {
    setCapturedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Clean up blob URLs on unmount (not needed for base64, but good practice)
  useEffect(() => {
    return () => {
      // Cleanup if needed in future
    };
  }, []);

  return {
    webcamRef: webcamRef as React.RefObject<HTMLVideoElement>,
    capturedImages,
    capture,
    clearImages,
    hasPermission,
    isReady,
    error,
    removeImage
  };
};

export default useCamera;
