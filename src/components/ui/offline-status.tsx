import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent } from './card';

interface OfflineForm {
  id: string;
  data: any;
  endpoint: string;
  timestamp: string;
  retryCount: number;
  status: 'pending' | 'failed';
}

interface OfflineStatusProps {
  className?: string;
}

export function OfflineStatus({ className }: OfflineStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineForms, setOfflineForms] = useState<OfflineForm[]>([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for service worker messages
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'FORM_SYNC_SUCCESS') {
          // Remove synced form from local state
          setOfflineForms(prev => prev.filter(form => form.id !== event.data.formId));
        }
      });
    }

    // Load offline forms on mount
    loadOfflineForms();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineForms = async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        if (event.data.type === 'OFFLINE_FORMS_RESPONSE') {
          const forms = Object.values(event.data.forms) as OfflineForm[];
          setOfflineForms(forms);
        }
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_OFFLINE_FORMS' },
        [messageChannel.port2]
      );
    }
  };

  const getStatusIcon = () => {
    if (isOnline) {
      return offlineForms.length > 0 ? (
        <Clock className="w-4 h-4 text-yellow-500" />
      ) : (
        <CheckCircle className="w-4 h-4 text-green-500" />
      );
    }
    return <WifiOff className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline';
    }
    if (offlineForms.length > 0) {
      return `${offlineForms.length} form${offlineForms.length > 1 ? 's' : ''} pending sync`;
    }
    return 'Online';
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (offlineForms.length > 0) return 'secondary';
    return 'default';
  };

  if (isOnline && offlineForms.length === 0) {
    return null; // Don't show status when everything is synced
  }

  return (
    <div className={className}>
      <Card className="border-l-4 border-l-blue-500">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getStatusIcon()}
              <span className="text-sm font-medium">{getStatusText()}</span>
              {offlineForms.length > 0 && (
                <Badge variant={getStatusColor()} className="text-xs">
                  {offlineForms.length}
                </Badge>
              )}
            </div>
            
            {offlineForms.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs"
              >
                {showDetails ? 'Hide' : 'Details'}
              </Button>
            )}
          </div>

          {showDetails && offlineForms.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs text-muted-foreground">
                Forms saved offline will be submitted when connection is restored:
              </div>
              {offlineForms.map((form) => (
                <div key={form.id} className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-3 h-3 text-yellow-500" />
                    <span>
                      {form.data.school} - {new Date(form.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {form.retryCount > 0 ? `Retry ${form.retryCount}` : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          {!isOnline && (
            <div className="mt-2 text-xs text-muted-foreground">
              Your forms are being saved locally and will sync when you're back online.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
