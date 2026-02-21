import * as React from 'react';
import { RefreshCw, ChevronDown, ChevronUp, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from './button';
import { Badge } from './badge';
import { Card, CardContent, CardHeader } from './card';
import { PendingUploadCard } from './pending-upload-card';
import { usePendingUploads } from '@/hooks/usePendingUploads';
import { offlineManager } from '@/utils/offlineManager';

export interface PendingUploadsProps {
  /** Maximum items to display before showing "+X more". Default: 10 */
  maxItems?: number;
  /** Show the header with title and controls. Default: true */
  showHeader?: boolean;
  /** Allow collapsing the list on mobile. Default: true */
  collapsible?: boolean;
  className?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatStorageSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function useLastSyncedText() {
  const [lastSynced, setLastSynced] = React.useState<Date | null>(null);
  const [label, setLabel] = React.useState('Never synced');

  React.useEffect(() => {
    const update = () => {
      if (!lastSynced) return;
      const seconds = Math.floor((Date.now() - lastSynced.getTime()) / 1000);
      if (seconds < 60) {
        setLabel('Just synced');
      } else if (seconds < 3600) {
        setLabel(`Synced ${Math.floor(seconds / 60)} min ago`);
      } else {
        setLabel(`Synced ${Math.floor(seconds / 3600)} hr ago`);
      }
    };

    const handler = () => {
      setLastSynced(new Date());
      update();
    };

    offlineManager.on('syncCompleted', handler);
    return () => offlineManager.off('syncCompleted', handler);
  }, [lastSynced]);

  return label;
}

// ── Component ──────────────────────────────────────────────────────────────

/**
 * PendingUploads
 *
 * Displays a scrollable list of pending/failed/syncing photo and form uploads,
 * with controls for manual sync, retry-all, and collapse.
 *
 * Props:
 * - maxItems: cap on displayed items ("+X more" shown if exceeded)
 * - showHeader: whether to render the title/controls header
 * - collapsible: whether to allow collapsing the list
 *
 * States:
 * - Loading: spinner while initial fetch runs
 * - Empty: checkmark + "You're all caught up"
 * - Has items: scrollable list with header stats
 * - Collapsed: count badge only
 */
export function PendingUploads({
  maxItems = 10,
  showHeader = true,
  collapsible = true,
  className = '',
}: PendingUploadsProps) {
  const {
    items,
    totalCount,
    pendingCount,
    failedCount,
    syncingCount,
    isLoading,
    refresh,
    retryItem,
    retryAll,
  } = usePendingUploads();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const lastSyncedLabel = useLastSyncedText();

  // Auto-expand when items appear, auto-collapse when empty
  React.useEffect(() => {
    if (!collapsible) return;
    if (totalCount > 0) {
      setIsCollapsed(false);
    }
  }, [totalCount, collapsible]);

  const handleSyncNow = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await offlineManager.forceSyncAll();
      await refresh();
    } catch (err) {
      console.error('[PendingUploads] forceSyncAll failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Compute total storage used by photo items
  const totalStorageUsed = React.useMemo(() => {
    return items.reduce((sum, item) => {
      return item.type === 'photo' && item.size ? sum + item.size : sum;
    }, 0);
  }, [items]);

  const displayedItems = items.slice(0, maxItems);
  const hiddenCount = Math.max(0, totalCount - maxItems);

  // ── Empty state ──────────────────────────────────────────────────────────

  const isEmpty = !isLoading && totalCount === 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <Card
      className={`shadow-sm max-w-[400px] w-full ${className}`}
      aria-label="Pending uploads queue"
    >
      {/* Header */}
      {showHeader && (
        <CardHeader className="p-4 pb-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-slate-900">
                Pending Uploads
              </h3>
              {totalCount > 0 && (
                <Badge
                  variant="secondary"
                  className={`text-xs ${failedCount > 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                  aria-label={`${totalCount} upload${totalCount !== 1 ? 's' : ''} pending`}
                >
                  {totalCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Sync Now button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSyncNow}
                disabled={isSyncing || syncingCount > 0}
                className="min-h-[36px] text-xs"
                aria-label="Sync all pending uploads now"
              >
                <RefreshCw
                  className={`w-3 h-3 mr-1 ${isSyncing || syncingCount > 0 ? 'animate-spin' : ''}`}
                  aria-hidden="true"
                />
                Sync Now
              </Button>

              {/* Collapse toggle */}
              {collapsible && totalCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCollapsed(prev => !prev)}
                  className="min-h-[36px] min-w-[36px] p-1"
                  aria-label={isCollapsed ? 'Expand pending uploads' : 'Collapse pending uploads'}
                  aria-expanded={!isCollapsed}
                >
                  {isCollapsed ? (
                    <ChevronDown className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="w-4 h-4" aria-hidden="true" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      {/* Body */}
      <CardContent className="p-4 pt-3">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-6" aria-live="polite" aria-label="Loading pending uploads">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-6 text-center" aria-live="polite">
            <CheckCircle className="w-8 h-8 text-green-500 mb-2" aria-hidden="true" />
            <p className="text-sm font-medium text-slate-700">You're all caught up</p>
            <p className="text-xs text-muted-foreground mt-0.5">All uploads complete</p>
          </div>
        )}

        {/* List of items */}
        {!isLoading && totalCount > 0 && !isCollapsed && (
          <>
            <ul
              role="list"
              aria-label={`${totalCount} pending upload${totalCount !== 1 ? 's' : ''}`}
              className="space-y-2 max-h-[400px] overflow-y-auto overscroll-contain pr-0.5"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
            >
              {displayedItems.map(item => (
                <PendingUploadCard
                  key={item.id}
                  item={item}
                  onRetry={retryItem}
                />
              ))}
            </ul>

            {/* "+X more" overflow indicator */}
            {hiddenCount > 0 && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                +{hiddenCount} more item{hiddenCount !== 1 ? 's' : ''} not shown
              </p>
            )}
          </>
        )}

        {/* Collapsed state — just show count */}
        {!isLoading && totalCount > 0 && isCollapsed && (
          <div
            className="flex items-center gap-2 py-1"
            aria-live="polite"
            aria-label={`${pendingCount} pending, ${failedCount} failed uploads — list collapsed`}
          >
            <span className="text-sm text-muted-foreground">
              {pendingCount > 0 && `${pendingCount} pending`}
              {pendingCount > 0 && failedCount > 0 && ', '}
              {failedCount > 0 && `${failedCount} failed`}
            </span>
          </div>
        )}

        {/* Footer */}
        {!isLoading && (
          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            {/* Retry All Failed */}
            {failedCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={retryAll}
                className="min-h-[36px] text-xs text-red-700 hover:bg-red-50 hover:text-red-800"
                aria-label={`Retry all ${failedCount} failed uploads`}
              >
                <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
                Retry All Failed ({failedCount})
              </Button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {/* Storage used */}
              {totalStorageUsed > 0 && (
                <span className="text-xs text-muted-foreground">
                  {formatStorageSize(totalStorageUsed)} pending
                </span>
              )}
              {/* Last synced */}
              <span className="text-xs text-muted-foreground">{lastSyncedLabel}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
