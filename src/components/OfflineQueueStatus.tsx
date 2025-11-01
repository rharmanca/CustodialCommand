import { useState } from 'react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export function OfflineQueueStatus() {
  const { offlineForms, pendingCount, isOnline } = useOfflineStatus();
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if no pending forms
  if (pendingCount === 0) {
    return null;
  }

  const pendingForms = Object.values(offlineForms).filter(
    form => form.status === 'pending'
  );

  return (
    <div className="fixed bottom-20 right-4 z-40 max-w-md">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <div className="text-left">
              <div className="font-medium text-gray-900">
                {pendingCount} Pending {pendingCount === 1 ? 'Form' : 'Forms'}
              </div>
              <div className="text-sm text-gray-500">
                {isOnline ? 'Syncing...' : 'Will sync when online'}
              </div>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {/* Expanded Queue List */}
        {isExpanded && (
          <div className="border-t border-gray-200 max-h-96 overflow-y-auto">
            {pendingForms.map((form) => (
              <div
                key={form.id}
                className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {getFormTitle(form)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatTimestamp(form.timestamp)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {form.retryCount > 0 && (
                      <span className="text-xs text-amber-600 font-medium">
                        Retry {form.retryCount}/3
                      </span>
                    )}
                    <div className={`w-2 h-2 rounded-full ${
                      isOnline ? 'bg-blue-500 animate-pulse' : 'bg-amber-500'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer with sync info */}
        {isExpanded && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-600">
              {isOnline
                ? '✓ Connected - Forms will sync automatically'
                : '⚠️ Offline - Forms saved locally'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function getFormTitle(form: any): string {
  // Extract a meaningful title from the form data
  if (form.data?.area) return `Inspection: ${form.data.area}`;
  if (form.data?.note) return `Note: ${form.data.note.substring(0, 30)}...`;
  if (form.endpoint?.includes('inspection')) return 'Custodial Inspection';
  if (form.endpoint?.includes('note')) return 'Custodial Note';
  return 'Form Submission';
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}
