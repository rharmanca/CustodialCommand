import React, { useState, useEffect, useCallback } from 'react';
import { HardDrive, AlertTriangle, Trash2, X } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Badge } from './badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from './dialog';
import {
  getStorageUsage,
  pruneOldItems,
  type StorageQuotaInfo
} from '@/utils/storageQuota';

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Polls storage quota every 30 seconds and returns the current status.
 * Re-renders consuming components whenever the quota changes.
 */
export function useStorageQuota(pollIntervalMs = 30_000): {
  quota: StorageQuotaInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [quota, setQuota] = useState<StorageQuotaInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const info = await getStorageUsage();
      setQuota(info);
    } catch {
      // Graceful degradation — keep previous value.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pollIntervalMs]);

  return { quota, loading, refresh };
}

// ── Storage management modal ────────────────────────────────────────────────

interface ManageStorageModalProps {
  open: boolean;
  onClose: () => void;
  quota: StorageQuotaInfo | null;
  onPruned: () => void;
}

function ManageStorageModal({ open, onClose, quota, onPruned }: ManageStorageModalProps) {
  const [pruning, setPruning] = useState(false);
  const [lastResult, setLastResult] = useState<{ prunedCount: number; freedMb: string } | null>(null);

  const handlePrune = async () => {
    setPruning(true);
    try {
      const result = await pruneOldItems();
      setLastResult({
        prunedCount: result.prunedCount,
        freedMb: (result.freedBytes / (1024 * 1024)).toFixed(1)
      });
      onPruned();
    } finally {
      setPruning(false);
    }
  };

  const usedMb = quota ? (quota.used / (1024 * 1024)).toFixed(1) : '—';
  const totalMb = quota ? (quota.total / (1024 * 1024)).toFixed(0) : '—';
  const percentage = quota ? Math.round(quota.percentage * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HardDrive className="w-5 h-5" />
            Manage Storage
          </DialogTitle>
          <DialogDescription>
            Review and free up offline storage used by the app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Current usage */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Storage used</span>
              <span className="font-medium">{usedMb} MB of {totalMb} MB ({percentage}%)</span>
            </div>
            <Progress
              value={percentage}
              className={`h-2 ${
                percentage >= 95
                  ? '[&>div]:bg-red-500'
                  : percentage >= 80
                  ? '[&>div]:bg-amber-500'
                  : '[&>div]:bg-green-500'
              }`}
            />
          </div>

          {/* Prune action */}
          <div className="rounded-lg border p-3 space-y-2">
            <p className="text-sm font-medium">Auto-remove old synced items</p>
            <p className="text-xs text-muted-foreground">
              Removes synced photos older than 7 days while keeping at least the 50 most recent items.
            </p>
            {lastResult && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Removed {lastResult.prunedCount} item{lastResult.prunedCount !== 1 ? 's' : ''}, freed {lastResult.freedMb} MB.
              </p>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full min-h-[44px]"
              onClick={handlePrune}
              disabled={pruning}
            >
              {pruning ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                  Removing…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Remove old synced items
                </span>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Pending (not yet synced) items are never deleted automatically.
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" className="min-h-[44px]" onClick={onClose}>
            <X className="w-4 h-4 mr-1" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export interface StorageWarningProps {
  /** Additional Tailwind classes */
  className?: string;
  /**
   * If true, the component is always rendered (even when storage is healthy).
   * Defaults to false — hidden unless warning/critical threshold is exceeded.
   */
  alwaysShow?: boolean;
}

/**
 * Compact card that warns users when offline storage is nearing capacity.
 *
 * - Green  (<80%): hidden by default (or shown compactly if `alwaysShow`)
 * - Amber  (80-95%): amber warning bar + auto-remove notice
 * - Red    (>95%): red critical alert + "Some photos may not save"
 *
 * Includes a "Manage Storage" button that opens a modal allowing manual
 * deletion of old synced items.
 */
export function StorageWarning({ className = '', alwaysShow = false }: StorageWarningProps) {
  const { quota, loading, refresh } = useStorageQuota();
  const [modalOpen, setModalOpen] = useState(false);

  if (loading || !quota) return null;

  const percentage = Math.round(quota.percentage * 100);
  const isCritical = quota.critical;
  const isWarning = quota.warning && !isCritical;
  const isHealthy = !quota.warning;

  // Hide when healthy unless caller explicitly wants the component visible.
  if (isHealthy && !alwaysShow) return null;

  // ── Derived styling ──────────────────────────────────────────────────────

  const borderColor = isCritical
    ? 'border-l-red-500'
    : isWarning
    ? 'border-l-amber-500'
    : 'border-l-green-500';

  const iconColor = isCritical
    ? 'text-red-500'
    : isWarning
    ? 'text-amber-500'
    : 'text-green-500';

  const progressColor = isCritical
    ? '[&>div]:bg-red-500'
    : isWarning
    ? '[&>div]:bg-amber-500'
    : '[&>div]:bg-green-500';

  const usedMb = (quota.used / (1024 * 1024)).toFixed(1);
  const totalMb = (quota.total / (1024 * 1024)).toFixed(0);

  const warningMessage = isCritical
    ? `Storage critical (${percentage}%). Some photos may not save.`
    : `Storage at ${percentage}%. Old synced items will be auto-removed.`;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className={className}>
        <Card className={`border-l-4 ${borderColor}`}>
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              {/* Left: icon + message */}
              <div className="flex items-start gap-2 min-w-0">
                {isCritical || isWarning ? (
                  <AlertTriangle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                ) : (
                  <HardDrive className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    {isHealthy ? 'Storage OK' : 'Storage Warning'}
                  </p>
                  {(isWarning || isCritical) && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {warningMessage}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: badge + manage button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge
                  variant={isCritical ? 'destructive' : isWarning ? 'secondary' : 'default'}
                  className="text-xs whitespace-nowrap"
                >
                  {usedMb} / {totalMb} MB
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs min-h-[44px] px-2"
                  onClick={() => setModalOpen(true)}
                >
                  Manage
                </Button>
              </div>
            </div>

            {/* Progress bar */}
            <Progress
              value={percentage}
              className={`h-1.5 mt-2 ${progressColor}`}
            />
          </CardContent>
        </Card>
      </div>

      <ManageStorageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        quota={quota}
        onPruned={refresh}
      />
    </>
  );
}
