
import { useState, useCallback } from 'react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
}

export const useCustomNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const defaultDuration = notification.type === 'error' ? 7000 : 5000;
    const newNotification = { 
      ...notification, 
      id,
      duration: notification.duration || defaultDuration
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'success', message, title, duration });
  }, [addNotification]);

  const showError = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'error', message, title, duration });
  }, [addNotification]);

  const showInfo = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'info', message, title, duration });
  }, [addNotification]);

  const showWarning = useCallback((message: string, title?: string, duration?: number) => {
    return addNotification({ type: 'warning', message, title, duration });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
    showWarning
  };
};
