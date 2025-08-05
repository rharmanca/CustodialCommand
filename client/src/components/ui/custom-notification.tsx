import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface NotificationProps {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
  onRemove: (id: string) => void;
}

export function CustomNotification({ id, title, description, type, duration = 5000, onRemove }: NotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onRemove(id), 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  const typeStyles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const typeIcons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️'
  };

  return (
    <div
      className={`
        fixed right-4 top-4 z-[9999999] max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${typeStyles[type]}
        border-2 rounded-lg shadow-lg p-4 mb-2
      `}
      style={{ 
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999999
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <span className="text-lg flex-shrink-0">
            {typeIcons[type]}
          </span>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold mb-1">
              {title}
            </h4>
            {description && (
              <p className="text-sm opacity-90">
                {description}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

interface NotificationContainerProps {
  notifications: Array<{
    id: string;
    title: string;
    description?: string;
    type: 'success' | 'error' | 'info';
    duration?: number;
  }>;
  onRemove: (id: string) => void;
}

export function NotificationContainer({ notifications, onRemove }: NotificationContainerProps) {
  return (
    <div 
      className="fixed right-4 top-4 z-[9999999] space-y-2"
      style={{ 
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: 9999999,
        pointerEvents: 'none'
      }}
    >
      {notifications.map((notification, index) => (
        <div 
          key={notification.id} 
          style={{ 
            marginTop: `${index * 80}px`,
            pointerEvents: 'auto'
          }}
        >
          <CustomNotification
            {...notification}
            onRemove={onRemove}
          />
        </div>
      ))}
    </div>
  );
}