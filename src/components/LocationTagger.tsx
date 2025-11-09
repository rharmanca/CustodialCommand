import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Wifi,
  WifiOff,
  Loader2,
  RefreshCw,
  Building,
  Map,
  Navigation,
  AlertTriangle,
  CheckCircle,
  XCircle,
  QrCode,
  Home
} from 'lucide-react';
import type { LocationData, LocationMethod, LocationPermission } from '@/types/photo';

interface LocationTaggerProps {
  onLocationUpdate: (location: LocationData | null) => void;
  initialLocation?: LocationData | null;
  disabled?: boolean;
  className?: string;
  showAdvanced?: boolean;
}

interface IndoorLocation {
  buildingId: string;
  buildingName: string;
  floor: number;
  room: string;
  section?: string;
  method: 'manual' | 'qr' | 'wifi' | 'bluetooth';
}

interface WiFiNetwork {
  ssid: string;
  rssi: number;
  bssid: string;
}

const DEFAULT_BUILDINGS = [
  { id: 'main', name: 'Main Building', floors: 3 },
  { id: 'gym', name: 'Gymnasium', floors: 2 },
  { id: 'cafeteria', name: 'Cafeteria', floors: 1 },
  { id: 'library', name: 'Library', floors: 2 },
  { id: 'science', name: 'Science Wing', floors: 3 },
  { id: 'admin', name: 'Administration', floors: 2 }
];

export const LocationTagger: React.FC<LocationTaggerProps> = ({
  onLocationUpdate,
  initialLocation = null,
  disabled = false,
  className = '',
  showAdvanced = false
}) => {
  const [location, setLocation] = useState<LocationData | null>(initialLocation);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<LocationMethod>('gps');
  const [indoorLocation, setIndoorLocation] = useState<IndoorLocation | null>(null);
  const [availableNetworks, setAvailableNetworks] = useState<WiFiNetwork[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');

  const watchIdRef = useRef<number | null>(null);
  const locationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check location permissions
  const checkLocationPermissions = useCallback(async (): Promise<LocationPermission> => {
    if (!navigator.geolocation) {
      return 'denied';
    }

    try {
      const permission = await navigator.permissions.query({
        name: 'geolocation' as PermissionName
      });
      setPermissionStatus(permission.state as 'granted' | 'denied' | 'prompt');
      return permission.state as LocationPermission;
    } catch {
      return 'prompt';
    }
  }, []);

  // Request location permissions
  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    const status = await checkLocationPermissions();
    if (status === 'denied') {
      setError('Location access denied. Please enable location permissions in your browser settings.');
      return false;
    }

    return true;
  }, [checkLocationPermissions]);

  // Get GPS location with high accuracy
  const getGPSLocation = useCallback(async (timeout = 10000): Promise<LocationData | null> => {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        reject(new Error('Location request timed out'));
      }, timeout);

      const options: PositionOptions = {
        enableHighAccuracy: true,
        timeout: timeout,
        maximumAge: 60000 // Accept 1 minute old locations
      };

      // Use watch for better accuracy
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          clearTimeout(timeoutId);
          if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }

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
        (error) => {
          clearTimeout(timeoutId);
          if (watchIdRef.current) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
          }
          reject(new Error(error.message));
        },
        options
      );
    });
  }, []);

  // Scan WiFi networks (if available through Network Information API)
  const scanWiFiNetworks = useCallback(async (): Promise<WiFiNetwork[]> => {
    try {
      // Note: The Network Information API has limited support
      // This is a placeholder implementation
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

      if (connection) {
        // Basic network information available
        return [{
          ssid: connection.type || 'Unknown Network',
          rssi: -50, // Placeholder
          bssid: '00:00:00:00:00:00' // Placeholder
        }];
      }

      return [];
    } catch (error) {
      console.warn('WiFi scanning not available:', error);
      return [];
    }
  }, []);

  // Get indoor location using WiFi fingerprinting
  const getIndoorLocationByWiFi = useCallback(async (): Promise<IndoorLocation | null> => {
    try {
      const networks = await scanWiFiNetworks();
      setAvailableNetworks(networks);

      // Simple WiFi fingerprinting logic
      // In a real implementation, this would query a database of known WiFi fingerprints
      const strongestNetwork = networks.reduce((strongest, current) =>
        current.rssi > strongest.rssi ? current : strongest, networks[0]
      );

      if (strongestNetwork) {
        // Mock indoor location based on WiFi network
        const mockIndoorLocation: IndoorLocation = {
          buildingId: 'main',
          buildingName: 'Main Building',
          floor: 1,
          room: 'Room 101',
          method: 'wifi'
        };

        return mockIndoorLocation;
      }

      return null;
    } catch (error) {
      console.error('Failed to get indoor location by WiFi:', error);
      return null;
    }
  }, [scanWiFiNetworks]);

  // Get QR code location
  const getQRLocation = useCallback(async (): Promise<IndoorLocation | null> => {
    try {
      // In a real implementation, this would open a camera scanner
      // For now, return a mock QR location
      const qrLocation: IndoorLocation = {
        buildingId: 'main',
        buildingName: 'Main Building',
        floor: 2,
        room: 'Room 205',
        section: 'A',
        method: 'qr'
      };

      return qrLocation;
    } catch (error) {
      console.error('Failed to scan QR code:', error);
      return null;
    }
  }, []);

  // Create location data from indoor location
  const createLocationFromIndoor = useCallback((indoor: IndoorLocation): LocationData => {
    return {
      latitude: 0, // Placeholder coordinates
      longitude: 0,
      accuracy: 10, // Indoor accuracy estimate
      timestamp: Date.now(),
      source: indoor.method,
      buildingId: indoor.buildingId,
      buildingName: indoor.buildingName,
      floor: indoor.floor,
      room: indoor.room
    };
  }, []);

  // Get location based on selected method
  const getLocationByMethod = useCallback(async (selectedMethod: LocationMethod): Promise<LocationData | null> => {
    switch (selectedMethod) {
      case 'gps':
        return await getGPSLocation();

      case 'wifi':
        const indoorWifi = await getIndoorLocationByWiFi();
        return indoorWifi ? createLocationFromIndoor(indoorWifi) : null;

      case 'qr':
        const indoorQR = await getQRLocation();
        return indoorQR ? createLocationFromIndoor(indoorQR) : null;

      case 'manual':
        return indoorLocation ? createLocationFromIndoor(indoorLocation) : null;

      default:
        return null;
    }
  }, [getGPSLocation, getIndoorLocationByWiFi, getQRLocation, createLocationFromIndoor, indoorLocation]);

  // Get current location
  const getCurrentLocation = useCallback(async () => {
    if (disabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission && method === 'gps') {
        // Fall back to indoor methods
        const indoorLocation = await getIndoorLocationByWiFi();
        if (indoorLocation) {
          const locationData = createLocationFromIndoor(indoorLocation);
          setLocation(locationData);
          setIndoorLocation(indoorLocation);
          onLocationUpdate(locationData);
          setMethod('wifi');
        } else {
          setError('Unable to determine location. Please try manual entry.');
        }
        return;
      }

      const locationData = await getLocationByMethod(method);

      if (locationData) {
        setLocation(locationData);
        onLocationUpdate(locationData);

        if (locationData.source !== 'gps') {
          setIndoorLocation({
            buildingId: locationData.buildingId || '',
            buildingName: locationData.buildingName || '',
            floor: locationData.floor || 0,
            room: locationData.room || '',
            method: locationData.source as 'wifi' | 'qr' | 'bluetooth'
          });
        }
      } else {
        setError('Failed to get location. Please try again or use manual entry.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [disabled, method, requestLocationPermission, getLocationByMethod, getIndoorLocationByWiFi, createLocationFromIndoor, onLocationUpdate]);

  // Update indoor location manually
  const updateIndoorLocation = useCallback((updates: Partial<IndoorLocation>) => {
    const updated = { ...indoorLocation, ...updates } as IndoorLocation;
    setIndoorLocation(updated);

    const locationData = createLocationFromIndoor(updated);
    setLocation(locationData);
    onLocationUpdate(locationData);
  }, [indoorLocation, createLocationFromIndoor, onLocationUpdate]);

  // Clear location
  const clearLocation = useCallback(() => {
    setLocation(null);
    setIndoorLocation(null);
    setError(null);
    onLocationUpdate(null);
  }, [onLocationUpdate]);

  // Initialize permissions and get initial location
  useEffect(() => {
    checkLocationPermissions();

    if (initialLocation) {
      setLocation(initialLocation);
      if (initialLocation.source !== 'gps') {
        setIndoorLocation({
          buildingId: initialLocation.buildingId || '',
          buildingName: initialLocation.buildingName || '',
          floor: initialLocation.floor || 0,
          room: initialLocation.room || '',
          method: initialLocation.source as 'wifi' | 'qr' | 'bluetooth'
        });
      }
    }
  }, [checkLocationPermissions, initialLocation]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (locationTimeoutRef.current) {
        clearTimeout(locationTimeoutRef.current);
      }
    };
  }, []);

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${Math.abs(lat).toFixed(6)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(6)}°${lng >= 0 ? 'E' : 'W'}`;
  };

  const getMethodIcon = (method: LocationMethod) => {
    switch (method) {
      case 'gps': return <Navigation className="w-4 h-4" />;
      case 'wifi': return <Wifi className="w-4 h-4" />;
      case 'qr': return <QrCode className="w-4 h-4" />;
      case 'manual': return <MapPin className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getMethodColor = (method: LocationMethod) => {
    switch (method) {
      case 'gps': return 'default';
      case 'wifi': return 'secondary';
      case 'qr': return 'outline';
      case 'manual': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Location Tagging
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Location Status */}
        {location && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={getMethodColor(location.source)} className="flex items-center gap-1">
                {getMethodIcon(location.source)}
                {location.source.toUpperCase()}
              </Badge>
              {location.accuracy && (
                <Badge variant="outline">
                  ±{location.accuracy.toFixed(0)}m
                </Badge>
              )}
            </div>

            {location.source === 'gps' ? (
              <div className="text-sm">
                <div className="font-mono">
                  {formatCoordinates(location.latitude, location.longitude)}
                </div>
                {location.altitude && (
                  <div className="text-muted-foreground">
                    Altitude: {location.altitude.toFixed(0)}m
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm">
                <div className="font-medium">{location.buildingName}</div>
                {location.floor && <div>Floor {location.floor}</div>}
                {location.room && <div>Room: {location.room}</div>}
                {location.section && <div>Section: {location.section}</div>}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Location Method Selection */}
        <Tabs value={method} onValueChange={(value) => setMethod(value as LocationMethod)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="gps" className="flex items-center gap-1">
              <Navigation className="w-3 h-3" />
              GPS
            </TabsTrigger>
            <TabsTrigger value="wifi" className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              WiFi
            </TabsTrigger>
            <TabsTrigger value="qr" className="flex items-center gap-1">
              <QrCode className="w-3 h-3" />
              QR
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gps" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Use GPS for outdoor locations with high accuracy.
            </div>
            {permissionStatus === 'denied' && (
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  Location access denied. Please enable location permissions in your browser settings.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="wifi" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Use WiFi network scanning for indoor locations.
            </div>
            {availableNetworks.length > 0 && (
              <div className="space-y-2">
                <Label>Detected Networks:</Label>
                {availableNetworks.map((network, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>{network.ssid}</span>
                    <Badge variant="outline">{network.rssi} dBm</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="qr" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Scan QR codes for precise indoor locations.
            </div>
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                Point your camera at a location QR code to automatically detect your position.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Manually enter your location for indoor areas.
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="building">Building</Label>
                <Select
                  value={indoorLocation?.buildingId || ''}
                  onValueChange={(value) => {
                    const building = DEFAULT_BUILDINGS.find(b => b.id === value);
                    if (building) {
                      updateIndoorLocation({
                        buildingId: building.id,
                        buildingName: building.name
                      });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select building" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_BUILDINGS.map((building) => (
                      <SelectItem key={building.id} value={building.id}>
                        <Building className="w-4 h-4 mr-2" />
                        {building.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    type="number"
                    min="0"
                    max="10"
                    value={indoorLocation?.floor || ''}
                    onChange={(e) => updateIndoorLocation({ floor: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Input
                    id="room"
                    value={indoorLocation?.room || ''}
                    onChange={(e) => updateIndoorLocation({ room: e.target.value })}
                    placeholder="Room number"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="section">Section (Optional)</Label>
                <Input
                  id="section"
                  value={indoorLocation?.section || ''}
                  onChange={(e) => updateIndoorLocation({ section: e.target.value })}
                  placeholder="A, B, C, etc."
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={getCurrentLocation}
            disabled={isLoading || disabled}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {location ? 'Update Location' : 'Get Location'}
          </Button>

          {location && (
            <Button
              variant="outline"
              onClick={clearLocation}
              disabled={disabled}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Clear
            </Button>
          )}
        </div>

        {/* Advanced Information */}
        {showAdvanced && location && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Advanced Information</h4>
            <div className="text-xs space-y-1 font-mono">
              <div>Timestamp: {new Date(location.timestamp).toISOString()}</div>
              <div>Source: {location.source}</div>
              {location.heading && <div>Heading: {location.heading.toFixed(0)}°</div>}
              {location.speed && <div>Speed: {location.speed.toFixed(1)} m/s</div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LocationTagger;