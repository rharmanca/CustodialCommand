/**
 * SyncRecovery — Banner component shown when an interrupted sync is detected.
 *
 * Visual design:
 *  - Amber warning banner (bg-amber-50 border-amber-300)
 *  - AlertTriangle icon
 *  - Mobile: full width, sticky-bottom-friendly
 *  - Desktop: full width, inline below header
 *
 * States:
 *  1. Initial  — shows recovery info + "Resume Sync" + "Dismiss"
 *  2. Retrying — spinner + "Resuming sync…"
 *  3. Success  — green checkmark + "Sync complete!" (auto-dismiss after 3 s)
 *  4. Error    — red message + "Retry" button
 */

import * as React from 'react';
import { AlertTriangle, CheckCircle, Loader2, X } from 'lucide-react';
import { useSyncRecovery } from '@/hooks/useSyncRecovery';

export interface SyncRecoveryProps {
  /** Optional override callback when the user dismisses the banner */
  onDismiss?: () => void;
  /** Additional CSS class names applied to the root element */
  className?: string;
}

export function SyncRecovery({ onDismiss, className = '' }: SyncRecoveryProps) {
  const {
    needsRecovery,
    completedCount,
    failedCount,
    recoveryMessage,
    isRetrying,
    retryError,
    dismissRecovery,
    retryInterrupted
  } = useSyncRecovery();

  const [showSuccess, setShowSuccess] = React.useState(false);
  const autoDismissRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Auto-dismiss after successful retry ──────────────────────────────────
  React.useEffect(() => {
    // If we were retrying and recovery is now cleared → show success
    if (!needsRecovery && !isRetrying && showSuccess) {
      autoDismissRef.current = setTimeout(() => {
        setShowSuccess(false);
        onDismiss?.();
      }, 3000);
    }
    return () => {
      if (autoDismissRef.current) clearTimeout(autoDismissRef.current);
    };
  }, [needsRecovery, isRetrying, showSuccess, onDismiss]);

  const handleRetry = async () => {
    await retryInterrupted();
    // On success needsRecovery will become false via polling; show success state
    setShowSuccess(true);
  };

  const handleDismiss = () => {
    dismissRecovery();
    onDismiss?.();
  };

  // ── Focus management ─────────────────────────────────────────────────────
  const bannerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (needsRecovery && bannerRef.current) {
      bannerRef.current.focus();
    }
  }, [needsRecovery]);

  // ── Render guard ─────────────────────────────────────────────────────────
  // Hide when no recovery needed AND no success toast pending
  if (!needsRecovery && !isRetrying && !showSuccess && !retryError) {
    return null;
  }

  // ── Success state ─────────────────────────────────────────────────────────
  if (showSuccess && !needsRecovery && !isRetrying) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-3 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800 ${className}`}
      >
        <CheckCircle className="h-5 w-5 flex-shrink-0 text-green-600" aria-hidden="true" />
        <span className="flex-1 font-medium">Sync complete! All items uploaded.</span>
      </div>
    );
  }

  // ── Retrying state ───────────────────────────────────────────────────────
  if (isRetrying) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={`flex items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 ${className}`}
      >
        <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin text-amber-600" aria-hidden="true" />
        <span className="flex-1 font-medium">Resuming sync…</span>
      </div>
    );
  }

  // ── Recovery / error state ────────────────────────────────────────────────
  const totalItems = completedCount + failedCount + 1; // +1 for interrupted item

  return (
    <div
      ref={bannerRef}
      role="alert"
      aria-live="assertive"
      tabIndex={-1}
      className={`rounded-lg border border-amber-300 bg-amber-50 p-4 ${className}`}
    >
      {/* Header row */}
      <div className="flex items-start gap-3">
        <AlertTriangle
          className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600"
          aria-hidden="true"
        />

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-900">Sync Interrupted</p>
          <p className="mt-0.5 text-sm text-amber-700">{recoveryMessage}</p>

          {/* Item counts summary */}
          {(completedCount > 0 || failedCount > 0) && (
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-amber-700">
              {completedCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5 text-green-600" aria-hidden="true" />
                  {completedCount} uploaded
                </span>
              )}
              {failedCount > 0 && (
                <span className="inline-flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
                  {failedCount} failed
                </span>
              )}
              <span className="text-amber-500">
                {totalItems} total item{totalItems !== 1 ? 's' : ''}
              </span>
            </div>
          )}

          {/* Retry error */}
          {retryError && (
            <p className="mt-2 text-xs font-medium text-red-700" role="alert">
              Retry failed: {retryError}
            </p>
          )}
        </div>

        {/* Dismiss button */}
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss sync recovery notification"
          className="ml-auto flex-shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100 hover:text-amber-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="min-h-[44px] rounded-md border border-amber-300 bg-white px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
        >
          Dismiss
        </button>
        <button
          type="button"
          onClick={handleRetry}
          disabled={isRetrying}
          className="min-h-[44px] rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          Resume Sync
        </button>
      </div>
    </div>
  );
}
