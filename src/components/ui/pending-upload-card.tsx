import * as React from 'react';
import { Camera, FileText, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Badge } from './badge';
import { Button } from './button';
import type { UploadItem } from '@/hooks/usePendingUploads';

export interface PendingUploadCardProps {
  item: UploadItem;
  onRetry: (id: string) => Promise<void>;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Status badge ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: UploadItem['status'] }) {
  switch (status) {
    case 'pending':
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 border-amber-200 text-xs shrink-0"
          aria-label="Pending upload"
        >
          <Clock className="w-3 h-3 mr-1" aria-hidden="true" />
          Pending
        </Badge>
      );
    case 'syncing':
      return (
        <Badge
          variant="secondary"
          className="bg-amber-100 text-amber-800 border-amber-200 text-xs shrink-0 animate-pulse"
          aria-label="Syncing now"
        >
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" aria-hidden="true" />
          Syncing
        </Badge>
      );
    case 'failed':
      return (
        <Badge
          variant="destructive"
          className="text-xs shrink-0"
          aria-label="Sync failed"
        >
          <AlertCircle className="w-3 h-3 mr-1" aria-hidden="true" />
          Failed
        </Badge>
      );
    case 'synced':
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 border-green-200 text-xs shrink-0"
          aria-label="Synced successfully"
        >
          <CheckCircle className="w-3 h-3 mr-1" aria-hidden="true" />
          Synced
        </Badge>
      );
    default:
      return null;
  }
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * PendingUploadCard
 *
 * Displays a single pending/failed/syncing/synced upload item.
 * Shows type icon, location, relative timestamp, status badge, file size
 * (for photos), and a retry button for failed items.
 *
 * Accessibility:
 * - role="listitem" — used inside a <ul role="list">
 * - aria-label on the card describes its contents
 * - 44px minimum touch targets on all interactive controls
 */
export function PendingUploadCard({ item, onRetry }: PendingUploadCardProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    try {
      await onRetry(item.id);
    } finally {
      setIsRetrying(false);
    }
  };

  const borderClass =
    item.status === 'failed'
      ? 'border border-red-200 bg-red-50/30'
      : item.status === 'synced'
      ? 'border border-green-200 bg-green-50/30'
      : 'border border-slate-200 bg-white';

  const cardLabel = `${item.type === 'photo' ? 'Photo' : 'Form'} from ${item.location}, ${formatRelativeTime(item.timestamp)}, status: ${item.status}`;

  return (
    <li
      role="listitem"
      aria-label={cardLabel}
      className={`rounded-lg p-3 ${borderClass} flex items-start gap-3 transition-colors`}
    >
      {/* Type icon */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          item.status === 'syncing'
            ? 'bg-amber-100 animate-pulse'
            : item.status === 'failed'
            ? 'bg-red-100'
            : item.status === 'synced'
            ? 'bg-green-100'
            : 'bg-slate-100'
        }`}
        aria-hidden="true"
      >
        {item.type === 'photo' ? (
          <Camera className="w-4 h-4 text-slate-600" />
        ) : (
          <FileText className="w-4 h-4 text-slate-600" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-900 truncate">
            {item.location}
          </span>
          <StatusBadge status={item.status} />
        </div>

        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-muted-foreground">
            {formatRelativeTime(item.timestamp)}
          </span>
          {item.type === 'photo' && item.size != null && item.size > 0 && (
            <>
              <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
              <span className="text-xs text-muted-foreground">
                {formatFileSize(item.size)}
              </span>
            </>
          )}
          {item.retryCount > 0 && (
            <>
              <span className="text-xs text-muted-foreground" aria-hidden="true">·</span>
              <span className="text-xs text-muted-foreground">
                {item.retryCount} retr{item.retryCount === 1 ? 'y' : 'ies'}
              </span>
            </>
          )}
        </div>

        {/* Error message for failed items */}
        {item.status === 'failed' && item.error && (
          <p className="text-xs text-red-600 mt-1 break-words">{item.error}</p>
        )}
      </div>

      {/* Retry button — only for failed items, 44px touch target */}
      {item.status === 'failed' && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex-shrink-0 min-h-[44px] min-w-[44px] border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
          aria-label={`Retry upload for ${item.location}`}
        >
          <RefreshCw
            className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
          <span className="sr-only">Retry</span>
        </Button>
      )}
    </li>
  );
}
