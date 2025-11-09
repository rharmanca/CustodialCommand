import { useState, useEffect, useCallback, useRef } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  registration: ServiceWorkerRegistration | null;
  messageQueue: any[];
}

interface OfflinePhoto {
  id: string;
  photoData: string;
  metadata: any;
  location?: any;
  inspectionId?: number;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'synced' | 'failed';
}

interface ServiceWorkerMessage {
  type: 'PHOTO_SYNC_SUCCESS' | 'PHOTO_SYNC_FAILED' | 'FORM_SYNC_SUCCESS' | 'PHOTO_SYNC_COMPLETED' | 'PHOTO_DELETED';
  photoId?: string;
  formId?: string;
  result?: any;
  error?: string;
  retryCount?: number;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isInstalled: false,
    isOnline: navigator.onLine,
    hasUpdate: false,
    registration: null,
    messageQueue: []
  });

  const messageChannelRef = useRef<MessageChannel | null>(null);
  const mountedRef = useRef(true);

  // Check service worker support
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;

    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        isSupported: supported
      }));
    }
  }, []);

  // Register service worker
  const registerServiceWorker = useCallback(async () => {
    if (!state.isSupported) {
      console.warn('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('Service Worker registered:', registration);

      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          registration,
          isInstalled: true
        }));
      }

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              if (mountedRef.current) {
                setState(prev => ({ ...prev, hasUpdate: true }));
              }
            }
          });
        }
      });

      // Set up message channel for communication
      if (!messageChannelRef.current) {
        const channel = new MessageChannel();
        messageChannelRef.current = channel;

        // Listen for messages from service worker
        channel.port1.onmessage = handleServiceWorkerMessage;

        // Send port to service worker
        navigator.serviceWorker.controller?.postMessage({
          type: 'INIT_PORT'
        }, [channel.port2]);
      }

      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }, [state.isSupported]);

  // Handle messages from service worker
  const handleServiceWorkerMessage = useCallback((event: MessageEvent) => {
    const message = event.data as ServiceWorkerMessage;

    console.log('Service Worker message:', message);

    switch (message.type) {
      case 'PHOTO_SYNC_SUCCESS':
        console.log(`Photo synced successfully: ${message.photoId}`);
        break;

      case 'PHOTO_SYNC_FAILED':
        console.error(`Photo sync failed: ${message.photoId}`, message.error);
        break;

      case 'FORM_SYNC_SUCCESS':
        console.log(`Form synced successfully: ${message.formId}`);
        break;

      case 'PHOTO_SYNC_COMPLETED':
        console.log('Photo sync completed');
        break;

      case 'PHOTO_DELETED':
        console.log(`Photo deleted: ${message.photoId}`);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }

    // Add to message queue for UI updates
    if (mountedRef.current) {
      setState(prev => ({
        ...prev,
        messageQueue: [...prev.messageQueue, message].slice(-10) // Keep last 10 messages
      }));
    }
  }, []);

  // Get offline photos from service worker
  const getOfflinePhotos = useCallback(async (): Promise<OfflinePhoto[]> => {
    return new Promise((resolve) => {
      if (!state.registration) {
        resolve([]);
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data.photos || []);
      };

      state.registration.active?.postMessage({
        type: 'GET_OFFLINE_PHOTOS'
      }, [channel.port2]);
    });
  }, [state.registration]);

  // Force photo sync
  const forcePhotoSync = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      if (!state.registration) {
        resolve();
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        resolve();
      };

      state.registration.active?.postMessage({
        type: 'FORCE_PHOTO_SYNC'
      }, [channel.port2]);
    });
  }, [state.registration]);

  // Delete offline photo
  const deleteOfflinePhoto = useCallback(async (photoId: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!state.registration) {
        resolve();
        return;
      }

      const channel = new MessageChannel();
      channel.port1.onmessage = () => {
        resolve();
      };

      state.registration.active?.postMessage({
        type: 'DELETE_OFFLINE_PHOTO',
        photoId
      }, [channel.port2]);
    });
  }, [state.registration]);

  // Apply service worker update
  const applyUpdate = useCallback(async () => {
    if (state.registration && state.registration.waiting) {
      state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

      // Reload the page to apply the update
      window.location.reload();
    }
  }, [state.registration]);

  // Check online status
  useEffect(() => {
    const handleOnline = () => {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, isOnline: true }));
      }
    };

    const handleOffline = () => {
      if (mountedRef.current) {
        setState(prev => ({ ...prev, isOnline: false }));
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Register on mount
  useEffect(() => {
    if (state.isSupported && !state.isInstalled) {
      registerServiceWorker();
    }
  }, [state.isSupported, state.isInstalled, registerServiceWorker]);

  // Listen for controller changes
  useEffect(() => {
    const handleControllerChange = () => {
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (messageChannelRef.current) {
        messageChannelRef.current.port1.close();
        messageChannelRef.current = null;
      }
    };
  }, []);

  return {
    // State
    isSupported: state.isSupported,
    isInstalled: state.isInstalled,
    isOnline: state.isOnline,
    hasUpdate: state.hasUpdate,
    messageQueue: state.messageQueue,

    // Actions
    registerServiceWorker,
    getOfflinePhotos,
    forcePhotoSync,
    deleteOfflinePhoto,
    applyUpdate,

    // Computed values
    canSync: state.isOnline && state.isInstalled,
    hasOfflinePhotos: state.messageQueue.some(msg => msg.type.includes('PHOTO')),
    lastSyncMessage: state.messageQueue.length > 0 ? state.messageQueue[state.messageQueue.length - 1] : null
  };
};

export default useServiceWorker;