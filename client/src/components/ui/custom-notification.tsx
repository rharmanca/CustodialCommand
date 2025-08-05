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
        fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999999] max-w-sm w-full mx-4
        transition-all duration-300 ease-in-out
        ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        ${typeStyles[type]}
        border-2 rounded-lg shadow-xl p-6 mb-2
      `}
      style={{ 
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: `translate(-50%, -50%) ${isVisible ? 'scale(1)' : 'scale(0.95)'}`,
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
      {notifications.map((notification, index) => (
        <div 
          key={notification.id} 
          className="absolute"
          style={{ 
            pointerEvents: 'auto',
            zIndex: 9999999 + index
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