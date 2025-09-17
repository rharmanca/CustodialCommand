import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Wifi, WifiOff, Upload, Download } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'offline' | 'sync';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: NotificationAction[];
  timestamp: Date;
}

interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

interface EnhancedNotificationsProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  maxNotifications?: number;
}

export function EnhancedNotifications({ 
  notifications, 
  onRemove, 
  maxNotifications = 5 
}: EnhancedNotificationsProps) {
  const [visibleNotifications, setVisibleNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Sort notifications by timestamp (newest first) and limit display
    const sorted = [...notifications]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, maxNotifications);
    
    setVisibleNotifications(sorted);

    // Auto-remove non-persistent notifications
    sorted.forEach(notification => {
      if (!notification.persistent && notification.duration !== 0) {
        const duration = notification.duration || 5000;
        setTimeout(() => {
          onRemove(notification.id);
        }, duration);
      }
    });
  }, [notifications, onRemove, maxNotifications]);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'offline':
        return <WifiOff className="w-5 h-5 text-orange-600" />;
      case 'sync':
        return <Upload className="w-5 h-5 text-blue-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBackgroundColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      case 'offline':
        return 'bg-orange-50 border-orange-200';
      case 'sync':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getTextColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-yellow-900';
      case 'info':
        return 'text-blue-900';
      case 'offline':
        return 'text-orange-900';
      case 'sync':
        return 'text-blue-900';
      default:
        return 'text-gray-900';
    }
  };

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {visibleNotifications.map((notification) => (
        <div
          key={notification.id}
          className={`relative p-4 rounded-lg border shadow-lg transition-all duration-300 transform animate-in slide-in-from-right-full ${getBackgroundColor(notification.type)}`}
        >
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {getIcon(notification.type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-semibold ${getTextColor(notification.type)}`}>
                  {notification.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-muted-foreground">
                    {notification.timestamp.toLocaleTimeString()}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(notification.id)}
                    className="h-6 w-6 p-0 hover:bg-black/10"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <p className={`text-sm mt-1 ${getTextColor(notification.type)} opacity-90`}>
                {notification.message}
              </p>
              
              {notification.actions && notification.actions.length > 0 && (
                <div className="flex space-x-2 mt-3">
                  {notification.actions.map((action, index) => (
                    <Button
                      key={index}
                      variant={action.variant || 'outline'}
                      size="sm"
                      onClick={action.action}
                      className="text-xs h-7"
                    >
                      {action.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Hook for managing notifications
export function useEnhancedNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return newNotification.id;
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const showSuccess = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  };

  const showError = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'error',
      title,
      message,
      persistent: true, // Errors should be persistent by default
      ...options,
    });
  };

  const showWarning = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'warning',
      title,
      message,
      ...options,
    });
  };

  const showInfo = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  };

  const showOffline = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'offline',
      title,
      message,
      persistent: true,
      ...options,
    });
  };

  const showSync = (title: string, message: string, options?: Partial<Notification>) => {
    return addNotification({
      type: 'sync',
      title,
      message,
      ...options,
    });
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showOffline,
    showSync,
  };
}
