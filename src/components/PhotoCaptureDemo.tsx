import React, { useState } from 'react';
import { PhotoCapture } from '@/components/PhotoCapture';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { photoStorage } from '@/utils/photoStorage';
import type { PhotoCaptureData, LocationData } from '@/types/photo';
import { Camera, Image, MapPin, Info, Trash2 } from 'lucide-react';

export const PhotoCaptureDemo: React.FC = () => {
  const [capturedPhotos, setCapturedPhotos] = useState<Array<{
    id: string;
    data: PhotoCaptureData;
    preview: string;
  }>>([]);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    available: number;
    photos: number;
  } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<typeof capturedPhotos[0] | null>(null);

  // Initialize photo storage
  React.useEffect(() => {
    photoStorage.initDB().then(() => {
      updateStorageInfo();
    });
  }, []);

  const updateStorageInfo = async () => {
    try {
      const info = await photoStorage.getStorageUsage();
      setStorageInfo(info);
    } catch (error) {
      console.error('Failed to get storage info:', error);
    }
  };

  const handlePhotoCapture = async (photoData: PhotoCaptureData) => {
    try {
      // Create preview URL
      const preview = URL.createObjectURL(photoData.blob);

      // Save to storage
      const photoId = await photoStorage.savePhoto(photoData);

      // Update state
      const newPhoto = {
        id: photoId,
        data: photoData,
        preview
      };

      setCapturedPhotos(prev => [...prev, newPhoto]);
      updateStorageInfo();

      // Clean up preview URL when component unmounts
      return () => URL.revokeObjectURL(preview);
    } catch (error) {
      console.error('Failed to save photo:', error);
    }
  };

  const handleLocationUpdate = (location: LocationData | null) => {
    console.log('Location updated:', location);
  };

  const handleDeletePhoto = async (photoId: string, preview: string) => {
    try {
      await photoStorage.deletePhoto(photoId);
      setCapturedPhotos(prev => prev.filter(p => p.id !== photoId));
      setSelectedPhoto(null);
      URL.revokeObjectURL(preview);
      updateStorageInfo();
    } catch (error) {
      console.error('Failed to delete photo:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatLocation = (location: LocationData): string => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Photo Capture Demo</h1>
        <p className="text-muted-foreground">
          Test the mobile photo capture functionality with location tagging
        </p>
      </div>

      {/* Storage Info */}
      {storageInfo && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                <span className="font-medium">Storage Usage</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="secondary">
                  {storageInfo.photos} photos
                </Badge>
                <Badge variant="outline">
                  {formatFileSize(storageInfo.used)} / {formatFileSize(storageInfo.used + storageInfo.available)}
                </Badge>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(storageInfo.used / (storageInfo.used + storageInfo.available)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Section */}
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
              maxPhotoSize={5 * 1024 * 1024} // 5MB
              quality={0.8}
            />
          </CardContent>
        </Card>

        {/* Captured Photos Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5" />
              Captured Photos ({capturedPhotos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {capturedPhotos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No photos captured yet</p>
                <p className="text-sm">Take a photo using the camera to see it here</p>
              </div>
            ) : (
              <Tabs defaultValue="grid" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="grid">Grid View</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                <TabsContent value="grid" className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                    {capturedPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 ${
                          selectedPhoto?.id === photo.id ? 'border-primary' : 'border-transparent'
                        }`}
                        onClick={() => setSelectedPhoto(photo)}
                      >
                        <img
                          src={photo.preview}
                          alt="Captured"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-1 right-1">
                          <Badge variant="secondary" className="text-xs">
                            {formatFileSize(photo.data.metadata.fileSize)}
                          </Badge>
                        </div>
                        {photo.data.location && (
                          <div className="absolute top-1 left-1">
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="w-3 h-3" />
                            </Badge>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  {selectedPhoto && (
                    <div className="space-y-4">
                      <div className="aspect-video rounded-lg overflow-hidden">
                        <img
                          src={selectedPhoto.preview}
                          alt="Selected"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="space-y-2">
                        <h4 className="font-medium">Photo Information</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Size:</span>
                            <div className="font-medium">
                              {formatFileSize(selectedPhoto.data.metadata.fileSize)}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Dimensions:</span>
                            <div className="font-medium">
                              {selectedPhoto.data.metadata.width} × {selectedPhoto.data.metadata.height}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Captured:</span>
                            <div className="font-medium">
                              {new Date(selectedPhoto.data.metadata.capturedAt).toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Compression:</span>
                            <div className="font-medium">
                              {selectedPhoto.data.metadata.compressionRatio}
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedPhoto.data.location && (
                        <div className="space-y-2">
                          <h4 className="font-medium">Location Information</h4>
                          <div className="grid grid-cols-1 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Coordinates:</span>
                              <div className="font-medium">
                                {formatLocation(selectedPhoto.data.location)}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Accuracy:</span>
                              <div className="font-medium">
                                ±{selectedPhoto.data.location.accuracy.toFixed(0)}m
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Source:</span>
                              <div className="font-medium">
                                {selectedPhoto.data.location.source}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <h4 className="font-medium">Device Information</h4>
                        <div className="text-sm space-y-1">
                          <div>
                            <span className="text-muted-foreground">Platform:</span>
                            <div className="font-medium">
                              {selectedPhoto.data.metadata.deviceInfo.platform}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Camera:</span>
                            <div className="font-medium">
                              {selectedPhoto.data.metadata.deviceInfo.camera}
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeletePhoto(selectedPhoto.id, selectedPhoto.preview)}
                        className="w-full"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Photo
                      </Button>
                    </div>
                  )}

                  {!selectedPhoto && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Info className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a photo to view details</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Feature Information */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Features Tested:</strong> Camera access, photo capture, location tagging,
          offline storage, thumbnail generation, file size management, device metadata collection.
          <br />
          <strong>Mobile Optimizations:</strong> Touch gestures, responsive design,
          progressive enhancement, offline functionality.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PhotoCaptureDemo;