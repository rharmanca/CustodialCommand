import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  LocationData,
  LocationMethod,
  LocationPermission,
  WiFiNetwork,
  IndoorLocation
} from '@/types/photo';

interface LocationServicesConfig {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watchMode?: boolean;
  fallbackMethods?: LocationMethod[];
  retryAttempts?: number;
  retryDelay?: number;
}

interface LocationServicesState {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  method: LocationMethod;
  permission: LocationPermission;
  availableMethods: LocationMethod[];
  watchPositionId: number | null;
  lastUpdate: Date | null;
}

const DEFAULT_CONFIG: Required<LocationServicesConfig> = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000,
  watchMode: false,
  fallbackMethods: ['wifi', 'manual'],
  retryAttempts: 3,
  retryDelay: 1000
};

const DEFAULT_BUILDINGS = [
  { id: 'main', name: 'Main Building', floors: 3 },
  { id: 'gym', name: 'Gymnasium', floors: 2 },
  { id: 'cafeteria', name: 'Cafeteria', floors: 1 },
  { id: 'library', name: 'Library', floors: 2 },
  { id: 'science', name: 'Science Wing', floors: 3 },
  { id: 'admin', name: 'Administration', floors: 2 }
];

export const useLocationServices = (config: LocationServicesConfig = {}) => {
  const settings = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<LocationServicesState>({
    location: null,
    isLoading: false,
    error: null,
    method: 'gps',
    permission: 'prompt',
    availableMethods: ['gps'],
    watchPositionId: null,
    lastUpdate: null
  });

  const retryCountRef = useRef(0);
  const watchPositionIdRef = useRef<number | null>(null);

  // Check available location methods
  const checkAvailableMethods = useCallback((): LocationMethod[] => {
    const methods: LocationMethod[] = [];

    // GPS is always available if geolocation is supported
    if (navigator.geolocation) {
      methods.push('gps');
    }

    // WiFi scanning (limited browser support)
    if ('connection' in navigator) {
      methods.push('wifi');
    }

    // QR code scanning (always available with camera)
    methods.push('qr');

    // Manual entry is always available
    methods.push('manual');

    return methods;
  }, []);

  // Check location permission
  const checkLocationPermission = useCallback(async (): Promise<LocationPermission> => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, permission: 'denied' }));
      return 'denied';
    }

    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName
      });

      setState(prev => ({ ...prev, permission: permission.state as LocationPermission }));
      return permission.state as LocationPermission;
    } catch {
      // Permission API not supported, assume prompt
      setState(prev => ({ ...prev, permission: 'prompt' }));
      return 'prompt';
    }
  }, []);

  // Request location permission
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation not supported by this browser',
        permission: 'denied'
      }));
      return false;
    }

    try {
      // Try to get location to request permission
      await new Promise<LocationData>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
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
            resolve(locationData);
          },
          reject,
          { timeout: 5000, enableHighAccuracy: false }
        );
      });

      setState(prev => ({ ...prev, permission: 'granted' }));
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        permission: 'denied',
        error: 'Location permission denied'
      }));
      return false;
    }
  }, []);

  // Get GPS location
  const getGPSLocation = useCallback(async (options?: PositionOptions): Promise<LocationData> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    const positionOptions: PositionOptions = {
      enableHighAccuracy: settings.enableHighAccuracy,
      timeout: settings.timeout,
      maximumAge: settings.maximumAge,
      ...options
    };

    return new Promise((resolve, reject) => {
      const successCallback = (position: GeolocationPosition) => {
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
        resolve(locationData);
      };

      const errorCallback = (error: GeolocationPositionError) => {
        reject(new Error(error.message));
      };

      if (settings.watchMode) {
        watchPositionIdRef.current = navigator.geolocation.watchPosition(
          successCallback,
          errorCallback,
          positionOptions
        );
        setState(prev => ({ ...prev, watchPositionId: watchPositionIdRef.current }));
      } else {
        navigator.geolocation.getCurrentPosition(successCallback, errorCallback, positionOptions);
      }
    });
  }, [settings.enableHighAccuracy, settings.timeout, settings.maximumAge, settings.watchMode]);

  // Scan WiFi networks (limited implementation)
  const scanWiFiNetworks = useCallback(async (): Promise<WiFiNetwork[]> => {
    try {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      if (connection) {
        return [{
          ssid: connection.type || 'Unknown Network',
          rssi: -50,
          bssid: '00:00:00:00:00:00',
          frequency: 2400 // Default 2.4GHz frequency
        }];
      }

      return [];
    } catch (error) {
      console.warn('WiFi scanning not available:', error);
      return [];
    }
  }, []);

  // Get indoor location by WiFi
  const getIndoorLocationByWiFi = useCallback(async (): Promise<LocationData | null> => {
    try {
      const networks = await scanWiFiNetworks();

      if (networks.length === 0) {
        throw new Error('No WiFi networks detected');
      }

      // Mock indoor location based on WiFi network
      // In a real implementation, this would query a database of known WiFi fingerprints
      const mockLocation: LocationData = {
        latitude: 0,
        longitude: 0,
        accuracy: 10,
        timestamp: Date.now(),
        source: 'wifi',
        buildingId: 'main',
        buildingName: 'Main Building',
        floor: 1,
        room: 'Room 101'
      };

      return mockLocation;
    } catch (error) {
      throw new Error('WiFi location failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, [scanWiFiNetworks]);

  // Get QR code location
  const getQRLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      // Mock QR location
      // In a real implementation, this would open a camera scanner
      const mockLocation: LocationData = {
        latitude: 0,
        longitude: 0,
        accuracy: 5,
        timestamp: Date.now(),
        source: 'qr',
        buildingId: 'main',
        buildingName: 'Main Building',
        floor: 2,
        room: 'Room 205',
        section: 'A'
      };

      return mockLocation;
    } catch (error) {
      throw new Error('QR location failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }, []);

  // Create manual location
  const createManualLocation = useCallback((indoorData: {
    buildingId: string;
    buildingName: string;
    floor: number;
    room: string;
    section?: string;
  }): LocationData => {
    return {
      latitude: 0,
      longitude: 0,
      accuracy: 20,
      timestamp: Date.now(),
      source: 'manual',
      ...indoorData
    };
  }, []);

  // Get location using specified method
  const getLocationByMethod = useCallback(async (method: LocationMethod, options?: any): Promise<LocationData | null> => {
    switch (method) {
      case 'gps':
        return await getGPSLocation(options);
      case 'wifi':
        const wifiLocation = await getIndoorLocationByWiFi();
        return wifiLocation || null;
      case 'qr':
        const qrLocation = await getQRLocation();
        return qrLocation || null;
      case 'manual':
        if (!options?.indoorData) {
          throw new Error('Manual location requires indoor data');
        }
        return createManualLocation(options.indoorData);
      default:
        throw new Error(`Unsupported location method: ${method}`);
    }
  }, [getGPSLocation, getIndoorLocationByWiFi, getQRLocation, createManualLocation]);

  // Get current location with fallback
  const getCurrentLocation = useCallback(async (
    preferredMethod?: LocationMethod,
    options?: any
  ): Promise<LocationData | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const methodToUse = preferredMethod || state.method;
      let location: LocationData | null = null;

      // Try preferred method first
      try {
        location = await getLocationByMethod(methodToUse, options);
        setState(prev => ({
          ...prev,
          location,
          method: methodToUse,
          lastUpdate: new Date()
        }));
        retryCountRef.current = 0;
        return location;
      } catch (error) {
        console.warn(`${methodToUse} location failed:`, error);

        // Try fallback methods
        for (const fallbackMethod of settings.fallbackMethods) {
          if (fallbackMethod === methodToUse) continue;

          try {
            location = await getLocationByMethod(fallbackMethod, options);
            setState(prev => ({
              ...prev,
              location,
              method: fallbackMethod,
              lastUpdate: new Date()
            }));
            retryCountRef.current = 0;
            return location;
          } catch (fallbackError) {
            console.warn(`${fallbackMethod} fallback failed:`, fallbackError);
          }
        }

        throw new Error('All location methods failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Location acquisition failed';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }));

      // Retry logic
      if (retryCountRef.current < settings.retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          getCurrentLocation(preferredMethod, options);
        }, settings.retryDelay * retryCountRef.current);
      }

      return null;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [
    state.method,
    getLocationByMethod,
    settings.fallbackMethods,
    settings.retryAttempts,
    settings.retryDelay
  ]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchPositionIdRef.current) {
      navigator.geolocation.clearWatch(watchPositionIdRef.current);
      watchPositionIdRef.current = null;
      setState(prev => ({ ...prev, watchPositionId: null }));
    }
  }, []);

  // Start watching position
  const startWatching = useCallback(() => {
    if (navigator.geolocation && state.permission === 'granted') {
      watchPositionIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
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

          setState(prev => ({
            ...prev,
            location: locationData,
            method: 'gps',
            lastUpdate: new Date(),
            error: null
          }));
        },
        (error) => {
          setState(prev => ({
            ...prev,
            error: error.message,
            isLoading: false
          }));
        },
        {
          enableHighAccuracy: settings.enableHighAccuracy,
          timeout: settings.timeout,
          maximumAge: settings.maximumAge
        }
      );

      setState(prev => ({ ...prev, watchPositionId: watchPositionIdRef.current }));
    }
  }, [state.permission, settings.enableHighAccuracy, settings.timeout, settings.maximumAge]);

  // Clear location
  const clearLocation = useCallback(() => {
    setState(prev => ({
      ...prev,
      location: null,
      error: null,
      lastUpdate: null
    }));
  }, []);

  // Update method
  const setMethod = useCallback((method: LocationMethod) => {
    setState(prev => ({ ...prev, method }));
  }, []);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      const availableMethods = checkAvailableMethods();
      await checkLocationPermission();

      setState(prev => ({
        ...prev,
        availableMethods
      }));
    };

    initialize();
  }, [checkAvailableMethods, checkLocationPermission]);

  // Cleanup
  useEffect(() => {
    return () => {
      stopWatching();
    };
  }, [stopWatching]);

  return {
    // State
    location: state.location,
    isLoading: state.isLoading,
    error: state.error,
    method: state.method,
    permission: state.permission,
    availableMethods: state.availableMethods,
    isWatching: state.watchPositionId !== null,
    lastUpdate: state.lastUpdate,

    // Actions
    getCurrentLocation,
    requestLocationPermission,
    checkLocationPermission,
    setMethod,
    clearLocation,
    startWatching,
    stopWatching,

    // Utilities
    getGPSLocation,
    getIndoorLocationByWiFi,
    getQRLocation,
    createManualLocation,
    scanWiFiNetworks
  };
};

export default useLocationServices;