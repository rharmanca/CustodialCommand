import { useState, useEffect } from 'react';

interface OfflineForm {
  id: string;
  data: any;
  endpoint: string;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'syncing' | 'failed';
}

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineForms, setOfflineForms] = useState<Record<string, OfflineForm>>({});
  const [syncInProgress, setSyncInProgress] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      console.log('Connection restored - switching to online mode');
      setIsOnline(true);
    };

    const handleOffline = () => {
      console.log('Connection lost - switching to offline mode');
      setIsOnline(false);
    };

    // Listen for service worker messages about sync status
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data.type === 'FORM_SYNC_SUCCESS') {
        console.log('Form synced successfully:', event.data.formId);
        // Remove the synced form from our local state
        setOfflineForms(prev => {
          const updated = { ...prev };
          delete updated[event.data.formId];
          return updated;
        });
        setSyncInProgress(false);
      }
    };

    // Get initial offline forms count
    const getOfflineForms = async () => {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = (event) => {
          if (event.data.type === 'OFFLINE_FORMS_RESPONSE') {
            setOfflineForms(event.data.forms || {});
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_OFFLINE_FORMS' },
          [messageChannel.port2]
        );
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    navigator.serviceWorker?.addEventListener('message', handleServiceWorkerMessage);

    // Get offline forms on mount and periodically
    getOfflineForms();
    const interval = setInterval(getOfflineForms, 10000); // Check every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      navigator.serviceWorker?.removeEventListener('message', handleServiceWorkerMessage);
      clearInterval(interval);
    };
  }, []);

  const pendingCount = Object.values(offlineForms).filter(
    form => form.status === 'pending'
  ).length;

  return {
    isOnline,
    offlineForms,
    pendingCount,
    syncInProgress,
  };
}
