import * as React from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface NetworkIndicatorProps {
  /**
   * compact: icon + colored dot only (Quick Capture header)
   * full:    icon + text + status badge (Dashboard)
   * minimal: just colored dot (nav bars)
   */
  variant?: 'compact' | 'full' | 'minimal';
  /** Show "Syncing..." when there are pending items */
  showSyncStatus?: boolean;
  className?: string;
}

/**
 * NetworkIndicator - Mobile-optimized online/offline status component
 *
 * States:
 * - Online:           Green dot + Wifi icon
 * - Offline:          Red dot + WifiOff icon + "Offline" text
 * - Just reconnected: Green pulse + "Back Online" text (3s transition window)
 *
 * Variants:
 * - full:    For Dashboard — icon + colored badge + text
 * - compact: For Quick Capture header — icon + dot only
 * - minimal: For nav bars — dot only
 *
 * Accessibility:
 * - role="status" + aria-live="polite" for dynamic announcement
 * - aria-label describes current state
 * - Minimum 44px touch target on all interactive variants
 */
export function NetworkIndicator({
  variant = 'full',
  showSyncStatus = false,
  className,
}: NetworkIndicatorProps) {
  const { isOnline, wasOffline } = useNetworkStatus();

  // Determine display state
  const isReconnecting = wasOffline && isOnline;

  // Status label for aria-label and text display
  const statusLabel = isReconnecting
    ? 'Back Online'
    : isOnline
    ? 'Online'
    : 'Offline';

  // Color classes per state
  const dotColor = isReconnecting
    ? 'bg-green-500'
    : isOnline
    ? 'bg-green-500'
    : 'bg-red-500';

  const textColor = isReconnecting
    ? 'text-green-700'
    : isOnline
    ? 'text-green-700'
    : 'text-red-700';

  const iconColor = isReconnecting
    ? 'text-green-600'
    : isOnline
    ? 'text-green-600'
    : 'text-red-600';

  // minimal: just a colored dot
  if (variant === 'minimal') {
    return (
      <span
        role="status"
        aria-label={`Network status: ${statusLabel}`}
        className={cn('inline-flex items-center', className)}
      >
        <span
          className={cn(
            'w-2.5 h-2.5 rounded-full',
            dotColor,
            isReconnecting && 'animate-pulse'
          )}
        />
      </span>
    );
  }

  // compact: icon + colored dot (suitable for tight headers)
  if (variant === 'compact') {
    return (
      <span
        role="status"
        aria-label={`Network status: ${statusLabel}`}
        aria-live="polite"
        className={cn(
          'inline-flex items-center gap-1.5 min-h-[44px] px-2',
          className
        )}
      >
        {isOnline ? (
          <Wifi className={cn('w-4 h-4', iconColor)} aria-hidden="true" />
        ) : (
          <WifiOff className={cn('w-4 h-4', iconColor)} aria-hidden="true" />
        )}
        <span
          className={cn(
            'w-2 h-2 rounded-full transition-colors duration-300',
            dotColor,
            isReconnecting && 'animate-pulse'
          )}
        />
      </span>
    );
  }

  // full: icon + dot + text label (default for Dashboard)
  return (
    <div
      role="status"
      aria-label={`Network status: ${statusLabel}`}
      aria-live="polite"
      className={cn(
        'inline-flex items-center gap-2 min-h-[44px] px-3 py-2 rounded-lg',
        'transition-all duration-300 ease-in-out',
        isOnline
          ? 'bg-green-50 border border-green-200'
          : 'bg-red-50 border border-red-200',
        className
      )}
    >
      {/* Wifi / WifiOff icon */}
      {isOnline ? (
        <Wifi className={cn('w-4 h-4 flex-shrink-0', iconColor)} aria-hidden="true" />
      ) : (
        <WifiOff className={cn('w-4 h-4 flex-shrink-0', iconColor)} aria-hidden="true" />
      )}

      {/* Status dot */}
      <span
        className={cn(
          'w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-300',
          dotColor,
          isReconnecting && 'animate-pulse'
        )}
      />

      {/* Status text */}
      <span className={cn('text-sm font-medium transition-all duration-300', textColor)}>
        {statusLabel}
      </span>

      {/* Sync spinner: shown when back online and showSyncStatus enabled */}
      {showSyncStatus && isReconnecting && (
        <RefreshCw
          className="w-3.5 h-3.5 text-green-600 animate-spin flex-shrink-0"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
