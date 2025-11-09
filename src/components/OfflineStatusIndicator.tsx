import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  Smartphone,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useOfflineManager } from '@/hooks/useOfflineManager';

interface OfflineStatusIndicatorProps {
  showDetails?: boolean;
  showActions?: boolean;
  className?: string;
  compact?: boolean;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusIndicatorProps> = ({
  showDetails = false,
  showActions = true,
  className = '',
  compact = false
}) => {
  const {
    isOnline,
    isInitialized,
    isSyncing,
    stats,
    error,
    lastSyncTime,
    storagePercentage,
    formatStorageSize,
    refreshStats,
    syncPendingItems,
    forceSyncAll,
    clearAllData,
    exportData,
    importData
  } = useOfflineManager({
    onNetworkChange: (online) => {
      console.log('Network status changed:', online);
    }
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);

  // Auto-refresh stats every 30 seconds
  useEffect(() => {
    if (!compact) {
      const interval = setInterval(refreshStats, 30000);
      return () => clearInterval(interval);
    }
  }, [refreshStats, compact]);

  // Handle sync button click
  const handleSync = async () => {
    if (stats && stats.pendingSync > 0) {
      await syncPendingItems();
    } else {
      await forceSyncAll();
    }
  };

  // Handle export
  const handleExport = async () => {
    try {
      const data = await exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `custodial-photos-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setShowExportDialog(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Handle import
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target?.result as string;
          await importData(data);
          setShowImportDialog(false);
        } catch (error) {
          console.error('Import failed:', error);
        }
      };
      reader.readAsText(file);
    }
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <Badge variant="default" className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Online
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            Offline
          </Badge>
        )}
        {stats && stats.pendingSync > 0 && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {stats.pendingSync} pending
          </Badge>
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <WifiOff className="w-4 h-4" />
                <span className="font-medium">Offline</span>
              </div>
            )}

            {isSyncing && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Syncing
              </Badge>
            )}

            {!isOnline && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <CloudOff className="w-3 h-3" />
                No Connection
              </Badge>
            )}
          </div>

          {showDetails && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Show Less' : 'Show More'}
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{stats.totalPhotos}</div>
                <div className="text-muted-foreground">Total Photos</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-green-600">{stats.syncedPhotos}</div>
                <div className="text-muted-foreground">Synced</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-yellow-600">{stats.pendingSync}</div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-lg text-red-600">{stats.failedSync}</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  Storage Usage
                </span>
                <span>
                  {formatStorageSize(stats.storageUsed)} / {formatStorageSize(stats.storageUsed + stats.storageAvailable)}
                </span>
              </div>
              <Progress value={storagePercentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {storagePercentage.toFixed(1)}% used
              </div>
            </div>

            {/* Last Sync Time */}
            {lastSyncTime && (
              <div className="text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Last sync: {lastSyncTime.toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Expanded Details */}
        {isExpanded && stats && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Network Status */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Network Status:</span>
                <div className="flex items-center gap-1 mt-1">
                  {isOnline ? (
                    <>
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Connected
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3 text-red-500" />
                      Disconnected
                    </>
                  )}
                </div>
              </div>
              <div>
                <span className="font-medium">Device Type:</span>
                <div className="flex items-center gap-1 mt-1">
                  <Smartphone className="w-3 h-3" />
                  Mobile
                </div>
              </div>
            </div>

            {/* Sync Information */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Sync Information</h4>
              <div className="text-xs space-y-1 text-muted-foreground">
                <div>• Photos are synced automatically when online</div>
                <div>• Failed items will be retried automatically</div>
                <div>• Manual sync available for immediate updates</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats && stats.pendingSync > 0 && (
              <Button
                onClick={handleSync}
                disabled={isSyncing || !isOnline}
                size="sm"
                className="flex items-center gap-1"
              >
                {isSyncing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                Sync {stats.pendingSync} Items
              </Button>
            )}

            <Button
              onClick={refreshStats}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </Button>

            <Button
              onClick={() => setShowExportDialog(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Export
            </Button>

            <Button
              onClick={() => setShowImportDialog(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Upload className="w-3 h-3" />
              Import
            </Button>

            <Button
              onClick={clearAllData}
              variant="destructive"
              size="sm"
              className="flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              Clear All
            </Button>
          </div>
        )}

        {/* Export Dialog */}
        {showExportDialog && (
          <div className="mt-4 p-3 border rounded-lg space-y-2">
            <div className="text-sm">
              <strong>Export Data</strong>
              <p className="text-muted-foreground">Download all your photo metadata as a backup file.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExport} size="sm">
                Download Export
              </Button>
              <Button onClick={() => setShowExportDialog(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Import Dialog */}
        {showImportDialog && (
          <div className="mt-4 p-3 border rounded-lg space-y-2">
            <div className="text-sm">
              <strong>Import Data</strong>
              <p className="text-muted-foreground">Upload a previously exported backup file.</p>
            </div>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={() => setShowImportDialog(false)} variant="outline" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Initialization Status */}
        {!isInitialized && (
          <Alert>
            <Cloud className="h-4 w-4" />
            <AlertDescription>
              Initializing offline storage...
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default OfflineStatusIndicator;