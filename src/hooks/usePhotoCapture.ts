import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PhotoCaptureData,
  PhotoMetadata,
  LocationData,
  CameraPermission,
  LocationPermission,
  PhotoCaptureState,
  PhotoCaptureConfig
} from '@/types/photo';

const DEFAULT_CONFIG: PhotoCaptureConfig = {
  maxPhotoSize: 5 * 1024 * 1024, // 5MB
  quality: 0.8,
  maxRetries: 3,
  locationTimeout: 10000,
  autoLocation: true,
  compressionFormat: 'image/jpeg'
};

interface UsePhotoCaptureOptions extends Partial<PhotoCaptureConfig> {
  onPhotoCapture?: (data: PhotoCaptureData) => void;
  onLocationUpdate?: (location: LocationData | null) => void;
  onError?: (error: string) => void;
}

export const usePhotoCapture = (options: UsePhotoCaptureOptions = {}) => {
  const config = { ...DEFAULT_CONFIG, ...options };
  const [state, setState] = useState<PhotoCaptureState>({
    isStreaming: false,
    isLoading: false,
    error: null,
    location: null,
    isLocationLoading: false,
    captureCount: 0,
    facingMode: 'environment',
    permissions: {
      camera: { granted: false, devices: [] },
      location: 'prompt'
    }
  });

  const streamRef = useRef<MediaStream | null>(null);
  const captureCountRef = useRef(0);

  // Check camera permissions and get available devices
  const checkCameraPermissions = useCallback(async (): Promise<CameraPermission> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      // Try to access camera to check permission
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        testStream.getTracks().forEach(track => track.stop());

        return {
          granted: true,
          devices: videoDevices,
          currentDevice: videoDevices.find(d => d.label.includes('back')) || videoDevices[0]
        };
      } catch (error) {
        return {
          granted: false,
          devices: videoDevices
        };
      }
    } catch (error) {
      return {
        granted: false,
        devices: []
      };
    }
  }, []);

  // Check location permissions
  const checkLocationPermissions = useCallback(async (): Promise<LocationPermission> => {
    if (!navigator.geolocation) {
      return 'denied';
    }

    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName
      });
      return permission.state as LocationPermission;
    } catch {
      return 'prompt';
    }
  }, []);

  // Initialize permissions on mount
  useEffect(() => {
    const initializePermissions = async () => {
      const [cameraPerm, locationPerm] = await Promise.all([
        checkCameraPermissions(),
        checkLocationPermissions()
      ]);

      setState(prev => ({
        ...prev,
        permissions: {
          camera: cameraPerm,
          location: locationPerm
        }
      }));
    };

    initializePermissions();
  }, [checkCameraPermissions, checkLocationPermissions]);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!navigator.geolocation || state.permissions.location === 'denied') {
      return null;
    }

    setState(prev => ({ ...prev, isLocationLoading: true }));

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        setState(prev => ({ ...prev, isLocationLoading: false }));
        resolve(null);
      }, config.locationTimeout);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          setState(prev => ({ ...prev, isLocationLoading: false }));

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

          setState(prev => ({ ...prev, location: locationData }));
          options.onLocationUpdate?.(locationData);
          resolve(locationData);
        },
        (error) => {
          clearTimeout(timeoutId);
          setState(prev => ({ ...prev, isLocationLoading: false }));
          console.warn('Location access denied or unavailable:', error.message);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: config.locationTimeout,
          maximumAge: 60000
        }
      );
    });
  }, [state.permissions.location, config.locationTimeout, options.onLocationUpdate]);

  // Request location permissions
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      options.onError?.('Geolocation not supported');
      return false;
    }

    try {
      const location = await getCurrentLocation();
      return location !== null;
    } catch (error) {
      options.onError?.('Failed to get location permission');
      return false;
    }
  }, [getCurrentLocation, options.onError]);

  // Process captured photo
  const processPhoto = useCallback(async (
    blob: Blob,
    width: number,
    height: number,
    facingMode: 'user' | 'environment'
  ): Promise<PhotoCaptureData | null> => {
    try {
      // Check file size
      if (blob.size > config.maxPhotoSize!) {
        throw new Error(`Photo too large. Maximum size is ${(config.maxPhotoSize! / 1024 / 1024).toFixed(1)}MB`);
      }

      // Get current location if autoLocation is enabled
      let location: LocationData | null = null;
      if (config.autoLocation && state.permissions.location !== 'denied') {
        location = await getCurrentLocation();
      }

      // Create metadata
      const metadata: PhotoMetadata = {
        width,
        height,
        fileSize: blob.size,
        capturedAt: new Date().toISOString(),
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          vendor: navigator.vendor,
          camera: facingMode,
          // Device memory and cores if available
          memory: (navigator as any).deviceMemory,
          cores: (navigator as any).hardwareConcurrency
        },
        compressionRatio: config.quality!.toFixed(2),
        format: config.compressionFormat
      };

      const photoData: PhotoCaptureData = {
        blob,
        metadata,
        location: location || undefined
      };

      captureCountRef.current += 1;
      setState(prev => ({ ...prev, captureCount: captureCountRef.current }));

      options.onPhotoCapture?.(photoData);
      return photoData;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process photo';
      options.onError?.(errorMessage);
      return null;
    }
  }, [
    config.autoLocation,
    config.compressionFormat,
    config.maxPhotoSize,
    config.quality,
    getCurrentLocation,
    options.onError,
    options.onPhotoCapture,
    state.permissions.location
  ]);

  // Get current state
  const getState = useCallback((): PhotoCaptureState => {
    return {
      ...state,
      captureCount: captureCountRef.current
    };
  }, [state]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Reset state
  const reset = useCallback(() => {
    captureCountRef.current = 0;
    setState(prev => ({
      ...prev,
      error: null,
      location: null,
      isLocationLoading: false,
      captureCount: 0
    }));
  }, []);

  // Set facing mode
  const setFacingMode = useCallback((mode: 'user' | 'environment') => {
    setState(prev => ({ ...prev, facingMode: mode }));
  }, []);

  return {
    // State
    state: getState(),
    isStreaming: state.isStreaming,
    isLoading: state.isLoading,
    error: state.error,
    location: state.location,
    isLocationLoading: state.isLocationLoading,
    captureCount: captureCountRef.current,
    facingMode: state.facingMode,
    permissions: state.permissions,

    // Actions
    processPhoto,
    getCurrentLocation,
    requestLocationPermission,
    setFacingMode,
    clearError,
    reset,

    // Utilities
    checkCameraPermissions,
    checkLocationPermissions
  };
};

export default usePhotoCapture;