
import React from 'react';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface CustomNotificationProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onRemove: (id: string) => void;
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
  onRemove
}) => {
  const Icon = icons[type];

  return (
    <Alert className={cn('mb-2 relative', typeStyles[type])}>
      <Icon className="h-4 w-4" />
      <AlertDescription className="pr-8">
        {message}
      </AlertDescription>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-black/10"
        onClick={() => onRemove(id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </Alert>
  );
};

export const NotificationContainer: React.FC<{
  notifications: Array<{ id: string; type: 'success' | 'error' | 'warning' | 'info'; message: string; }>;
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80 max-w-sm">
      {notifications.map(notification => (
        <CustomNotification
          key={notification.id}
          {...notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};
