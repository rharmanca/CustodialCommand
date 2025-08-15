
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

export const NotificationContainer: React.FC<{
  notifications: Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; title?: string; }>;
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999999] pointer-events-none flex items-center justify-center"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999999,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {/* Semi-transparent backdrop */}
      <div 
        className="absolute inset-0 bg-black/20"
        style={{ pointerEvents: 'none' }}
      />
      
      {/* Notification stack */}
      <div className="relative flex flex-col items-center space-y-2 px-4">
        {notifications.map(notification => (
          <CustomNotification
            key={notification.id}
            {...notification}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
};
