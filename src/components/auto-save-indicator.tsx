import { useEffect, useState } from 'react';
import { Save, Check, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveIndicatorProps {
  status: SaveStatus;
  lastSaved?: Date | null;
  errorMessage?: string;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  errorMessage,
  className = ''
}: AutoSaveIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>('');

  // Update "time ago" display every 10 seconds
  useEffect(() => {
    if (!lastSaved) {
      setTimeAgo('');
      return;
    }

    const updateTimeAgo = () => {
      const now = new Date();
      const diffMs = now.getTime() - lastSaved.getTime();
      const diffSeconds = Math.floor(diffMs / 1000);
      const diffMinutes = Math.floor(diffSeconds / 60);

      if (diffSeconds < 10) {
        setTimeAgo('just now');
      } else if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}s ago`);
      } else if (diffMinutes < 60) {
        setTimeAgo(`${diffMinutes}m ago`);
      } else {
        setTimeAgo(lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [lastSaved]);

  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Save,
          text: 'Saving...',
          bgColor: 'bg-blue-100 border-blue-300',
          textColor: 'text-blue-800',
          iconColor: 'text-blue-600',
          animate: true
        };
      case 'saved':
        return {
          icon: Check,
          text: timeAgo ? `Saved ${timeAgo}` : 'Saved',
          bgColor: 'bg-green-100 border-green-300',
          textColor: 'text-green-800',
          iconColor: 'text-green-600',
          animate: false
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: errorMessage || 'Save failed',
          bgColor: 'bg-red-100 border-red-300',
          textColor: 'text-red-800',
          iconColor: 'text-red-600',
          animate: false
        };
      default: // idle or no recent save
        return {
          icon: Clock,
          text: 'Not saved',
          bgColor: 'bg-gray-100 border-gray-300',
          textColor: 'text-gray-700',
          iconColor: 'text-gray-500',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg border-2 shadow-lg transition-all duration-200 ${config.bgColor} ${className}`}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={`h-4 w-4 ${config.iconColor} ${config.animate ? 'animate-pulse' : ''}`}
      />
      <span className={`text-sm font-medium ${config.textColor}`}>
        {config.text}
      </span>
    </div>
  );
}

// Hook to manage auto-save status
export function useAutoSave(autoSaveDelay: number = 2000) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  const triggerSave = (saveFunction: () => Promise<void> | void) => {
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set status to saving after delay
    const timeout = setTimeout(async () => {
      setStatus('saving');
      setErrorMessage('');

      try {
        await saveFunction();
        setStatus('saved');
        setLastSaved(new Date());
      } catch (error) {
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Save failed');
      }
    }, autoSaveDelay);

    setSaveTimeout(timeout);
  };

  const resetStatus = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    setStatus('idle');
    setLastSaved(null);
    setErrorMessage('');
  };

  const markSaved = () => {
    setStatus('saved');
    setLastSaved(new Date());
  };

  return {
    status,
    lastSaved,
    errorMessage,
    triggerSave,
    resetStatus,
    markSaved
  };
}
