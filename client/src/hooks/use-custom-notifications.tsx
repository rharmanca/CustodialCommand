import { useState, useCallback } from 'react';

interface Notification {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

export function useCustomNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods for different types
  const showSuccess = useCallback((title: string, description?: string, duration?: number) => {
    return addNotification({ title, description, type: 'success', duration });
  }, [addNotification]);

  const showError = useCallback((title: string, description?: string, duration?: number) => {
    return addNotification({ title, description, type: 'error', duration });
  }, [addNotification]);

  const showInfo = useCallback((title: string, description?: string, duration?: number) => {
    return addNotification({ title, description, type: 'info', duration });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showInfo,
  };
}