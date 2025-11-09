export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  altitudeAccuracy?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
  source: 'gps' | 'wifi' | 'cell' | 'manual' | 'qr' | 'bluetooth';
  buildingId?: string;
  buildingName?: string;
  floor?: number;
  room?: string;
  section?: string;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  vendor: string;
  camera?: string;
  memory?: number;
  cores?: number;
}

export interface PhotoMetadata {
  width: number;
  height: number;
  fileSize: number;
  capturedAt: string;
  deviceInfo: DeviceInfo;
  compressionRatio: string;
  format?: string;
  orientation?: number;
}

export interface PhotoCaptureData {
  blob: Blob;
  metadata: PhotoMetadata;
  location?: LocationData;
}

export interface PhotoStorageItem {
  id: string;
  inspectionId?: number;
  blob: Blob;
  metadata: PhotoMetadata;
  location?: LocationData;
  thumbnailUrl?: string;
  syncStatus: 'pending' | 'synced' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

export interface CameraConstraints {
  facingMode?: 'user' | 'environment';
  width?: { min?: number; ideal?: number; max?: number };
  height?: { min?: number; ideal?: number; max?: number };
  aspectRatio?: { ideal?: number };
  frameRate?: { min?: number; ideal?: number; max?: number };
}

export interface PhotoCaptureConfig {
  maxPhotoSize?: number;
  quality?: number;
  maxRetries?: number;
  locationTimeout?: number;
  autoLocation?: boolean;
  compressionFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface PhotoUploadData {
  photoId: string;
  inspectionId?: number;
  blob: Blob;
  metadata: PhotoMetadata;
  location?: LocationData;
  retryCount?: number;
}

export interface SyncQueueItem {
  id: string;
  type: 'photo_upload' | 'inspection_update';
  photoId?: string;
  data: string; // JSON string
  retryCount: number;
  nextRetryAt?: Date;
  errorMessage?: string;
  createdAt: Date;
}

export type LocationPermission = 'granted' | 'denied' | 'prompt';
export type LocationMethod = 'gps' | 'wifi' | 'cell' | 'qr' | 'manual' | 'bluetooth';

export interface WiFiNetwork {
  ssid: string;
  bssid: string;
  rssi: number;
  frequency: number;
}

export interface IndoorLocation {
  buildingId: string;
  buildingName: string;
  floor: number;
  room: string;
  section?: string;
  confidence: number;
}

export interface CameraPermission {
  granted: boolean;
  devices: MediaDeviceInfo[];
  currentDevice?: MediaDeviceInfo;
}

export interface PhotoCaptureState {
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  location: LocationData | null;
  isLocationLoading: boolean;
  captureCount: number;
  facingMode: 'user' | 'environment';
  permissions: {
    camera: CameraPermission;
    location: LocationPermission;
  };
}

export interface PhotoCaptureEvents {
  onPhotoCapture: (data: PhotoCaptureData) => void;
  onLocationUpdate?: (location: LocationData | null) => void;
  onError?: (error: string) => void;
  onStreamStart?: () => void;
  onStreamStop?: () => void;
}

export interface PhotoCaptureRef {
  capturePhoto: () => Promise<void>;
  switchCamera: () => void;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
  getState: () => PhotoCaptureState;
}