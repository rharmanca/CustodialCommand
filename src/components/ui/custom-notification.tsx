import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CustomNotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  onRemove: (id: string) => void;
  duration?: number;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info
};

const typeStyles = {
  success: 'border-green-200 bg-green-50 text-green-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800'
};

export const CustomNotification: React.FC<CustomNotificationProps> = ({
  id,
  type,
  message,
  title,
  onRemove,
  duration = type === 'error' ? 7000 : 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}
      style={{ pointerEvents: 'auto' }}
    >
      <Alert className={cn('mb-2 relative min-w-[320px] max-w-[480px] shadow-lg', typeStyles[type])}>
        <Icon className="h-5 w-5" />
        <AlertDescription className="pr-8">
          {title && <div className="font-semibold mb-1">{title}</div>}
          {message}
        </AlertDescription>
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/10"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </Alert>
    </div>
  );
};

import type { CustomNotification as CustomNotificationType } from '@/hooks/use-custom-notifications';

interface NotificationContainerProps {
  notifications: CustomNotificationType[];
  onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  if (!notifications.length) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            p-4 rounded-lg shadow-lg max-w-sm cursor-pointer transform transition-all
            ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : ''}
            ${notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : ''}
            ${notification.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' : ''}
            ${notification.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-800' : ''}
          `}
          onClick={() => onRemove(notification.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h4 className="font-medium">{notification.title}</h4>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove(notification.id);
              }}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}