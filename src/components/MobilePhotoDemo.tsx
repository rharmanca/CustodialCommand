import React, { useState } from 'react';
import { PhotoCapture } from '@/components/PhotoCapture';
import { LocationTagger } from '@/components/LocationTagger';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { photoStorage } from '@/utils/photoStorage';
import type { PhotoCaptureData, LocationData } from '@/types/photo';
import {
  Camera,
  MapPin,
  Smartphone,
  Battery,
  Wifi,
  Monitor,
  Navigation,
  Image,
  Info,
  CheckCircle,
  AlertTriangle,
  Zap,
  Shield
} from 'lucide-react';

interface CapturedItem {
  id: string;
  photoData: PhotoCaptureData;
  location?: LocationData;
  preview: string;
  timestamp: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export const MobilePhotoDemo: React.FC = () => {
  const [capturedItems, setCapturedItems] = useState<CapturedItem[]>([]);
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // Initialize device and network info
  React.useEffect(() => {
    const initializeInfo = () => {
      // Device information
      setDeviceInfo({
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        vendor: navigator.vendor,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: (navigator as any).hardwareConcurrency,
        maxTouchPoints: navigator.maxTouchPoints,
        pointerEnabled: (navigator as any).pointerEnabled
      });

      // Network information
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      if (connection) {
        setNetworkInfo({
          type: connection.type,
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        });
      }

      // Listen for online/offline changes
      const handleOnline = () => setNetworkInfo((prev: any) => prev ? { ...prev, onLine: true } : null);
      const handleOffline = () => setNetworkInfo((prev: any) => prev ? { ...prev, onLine: false } : null);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    };

    const cleanup = initializeInfo();
    return cleanup;
  }, []);

  // Initialize photo storage
  React.useEffect(() => {
    photoStorage.initDB();
  }, []);

  const handlePhotoCapture = async (photoData: PhotoCaptureData) => {
    try {
      // Create preview URL
      const preview = URL.createObjectURL(photoData.blob);

      // Save to storage
      const photoId = await photoStorage.savePhoto(photoData, undefined);

      // Create captured item
      const newItem: CapturedItem = {
        id: photoId,
        photoData,
        location: currentLocation || undefined,
        preview,
        timestamp: new Date(),
        syncStatus: 'pending'
      };

      setCapturedItems(prev => [...prev, newItem]);

      return () => URL.revokeObjectURL(preview);
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  };

  const handleLocationUpdate = (location: LocationData | null) => {
    setCurrentLocation(location);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatCoordinates = (lat: number, lng: number): string => {
    return `${Math.abs(lat).toFixed(6)}°${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(6)}°${lng >= 0 ? 'E' : 'W'}`;
  };

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Mobile Photo Capture Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive mobile photo capture with location tagging and offline capabilities
        </p>
        <div className="flex justify-center gap-2">
          <Badge variant={isMobile ? "default" : "secondary"} className="flex items-center gap-1">
            <Smartphone className="w-3 h-3" />
            {isMobile ? 'Mobile Device' : 'Desktop'}
          </Badge>
          {navigator.onLine ? (
            <Badge variant="outline" className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              Offline
            </Badge>
          )}
        </div>
      </div>

      {/* Device Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Device Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Device</h4>
              <div className="text-sm space-y-1">
                <div>Platform: {deviceInfo?.platform || 'Unknown'}</div>
                <div>Language: {deviceInfo?.language || 'Unknown'}</div>
                <div>Touch Points: {deviceInfo?.maxTouchPoints || 0}</div>
                <div>CPU Cores: {deviceInfo?.hardwareConcurrency || 'Unknown'}</div>
                {deviceInfo?.deviceMemory && (
                  <div>Memory: {deviceInfo.deviceMemory}GB</div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Network</h4>
              <div className="text-sm space-y-1">
                <div>Status: {networkInfo ? (networkInfo.onLine ? 'Online' : 'Offline') : 'Unknown'}</div>
                {networkInfo?.type && <div>Type: {networkInfo.type}</div>}
                {networkInfo?.effectiveType && <div>Speed: {networkInfo.effectiveType}</div>}
                {networkInfo?.downlink && <div>Downlink: {networkInfo.downlink}Mbps</div>}
                {networkInfo?.rtt && <div>RTT: {networkInfo.rtt}ms</div>}
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Capabilities</h4>
              <div className="text-sm space-y-1">
                <div className="flex items-center gap-1">
                  {navigator.geolocation ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                  Geolocation
                </div>
                <div className="flex items-center gap-1">
                  {navigator.mediaDevices ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                  Camera Access
                </div>
                <div className="flex items-center gap-1">
                  {'serviceWorker' in navigator ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                  Service Workers
                </div>
                <div className="flex items-center gap-1">
                  {'indexedDB' in window ? (
                    <CheckCircle className="w-3 h-3 text-green-500" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                  )}
                  IndexedDB
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LocationTagger
              onLocationUpdate={handleLocationUpdate}
              initialLocation={currentLocation}
              showAdvanced={true}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Camera Capture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoCapture
              onPhotoCapture={handlePhotoCapture}
              onLocationUpdate={handleLocationUpdate}
              maxPhotoSize={5 * 1024 * 1024}
              quality={0.8}
            />
          </CardContent>
        </Card>
      </div>

      {/* Captured Items */}
      {capturedItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Captured Items ({capturedItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {capturedItems.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={item.preview}
                        alt={`Captured ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          <Camera className="w-3 h-3 mr-1" />
                          Photo
                        </Badge>
                        <Badge variant="secondary">
                          {formatFileSize(item.photoData.metadata.fileSize)}
                        </Badge>
                        <Badge variant={item.syncStatus === 'synced' ? 'default' : 'outline'}>
                          {item.syncStatus}
                        </Badge>
                      </div>

                      <div className="text-sm space-y-1">
                        <div>
                          <span className="font-medium">Captured:</span>{' '}
                          {item.timestamp.toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Dimensions:</span>{' '}
                          {item.photoData.metadata.width} × {item.photoData.metadata.height}
                        </div>
                        <div>
                          <span className="font-medium">Device:</span>{' '}
                          {item.photoData.metadata.deviceInfo.platform}
                        </div>

                        {/* Location Information */}
                        {item.location && (
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <div className="flex items-center gap-1 mb-1">
                              <MapPin className="w-3 h-3" />
                              <span className="font-medium">Location:</span>
                              <Badge variant="outline" className="text-xs">
                                {item.location.source.toUpperCase()}
                              </Badge>
                            </div>

                            {item.location.source === 'gps' ? (
                              <div>
                                {formatCoordinates(item.location.latitude, item.location.longitude)}
                                {item.location.accuracy && (
                                  <span className="text-muted-foreground ml-2">
                                    ±{item.location.accuracy.toFixed(0)}m
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div>
                                {item.location.buildingName && (
                                  <div>{item.location.buildingName}</div>
                                )}
                                {item.location.floor && <div>Floor {item.location.floor}</div>}
                                {item.location.room && <div>Room: {item.location.room}</div>}
                                {item.location.section && <div>Section: {item.location.section}</div>}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Phase 1 Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-500" />
                <h4 className="font-medium">Camera Integration</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• WebRTC camera access</li>
                <li>• Front/back camera switching</li>
                <li>• Touch gesture controls</li>
                <li>• Real-time preview</li>
                <li>• Quality and size optimization</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-500" />
                <h4 className="font-medium">Location Tagging</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• GPS with high accuracy</li>
                <li>• WiFi indoor positioning</li>
                <li>• QR code location scanning</li>
                <li>• Manual location entry</li>
                <li>• Indoor floor/room mapping</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <h4 className="font-medium">Offline Capabilities</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• IndexedDB storage</li>
                <li>• Background sync queue</li>
                <li>• Offline-first architecture</li>
                <li>• Automatic retry logic</li>
                <li>• Progressive enhancement</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-500" />
                <h4 className="font-medium">Mobile Optimized</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Touch-friendly interface</li>
                <li>• Responsive design</li>
                <li>• One-handed operation</li>
                <li>• PWA ready</li>
                <li>• Device orientation support</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <h4 className="font-medium">Security & Privacy</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Permission management</li>
                <li>• Local-first storage</li>
                <li>• Secure photo handling</li>
                <li>• Metadata protection</li>
                <li>• GDPR compliant</li>
              </ul>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Battery className="w-4 h-4 text-orange-500" />
                <h4 className="font-medium">Performance</h4>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Optimized compression</li>
                <li>• Efficient storage</li>
                <li>• Smart caching</li>
                <li>• Background processing</li>
                <li>• Resource management</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobilePhotoDemo;