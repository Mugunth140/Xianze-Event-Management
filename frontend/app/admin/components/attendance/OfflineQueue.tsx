'use client';

import { useCallback, useEffect, useState } from 'react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface QueueItem {
  id: string;
  data: unknown;
  timestamp: number;
  retryCount: number;
  error?: string;
}

interface OfflineQueueProps {
  queueKey?: string; // localStorage key for the queue
  onRetry?: (item: QueueItem) => Promise<boolean>;
  onClear?: () => void;
  maxRetries?: number;
}

export default function OfflineQueue({
  queueKey = 'offlineQueue',
  onRetry,
  onClear,
  maxRetries = 3,
}: OfflineQueueProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);

  // Load queue from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(queueKey);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch {
      console.error('Failed to load offline queue');
    }
  }, [queueKey]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveQueue = useCallback(
    (items: QueueItem[]) => {
      setQueue(items);
      localStorage.setItem(queueKey, JSON.stringify(items));
    },
    [queueKey]
  );

  const retryAll = async () => {
    if (!onRetry || retrying || queue.length === 0) return;

    setRetrying(true);
    const remaining: QueueItem[] = [];

    for (const item of queue) {
      if (item.retryCount >= maxRetries) {
        remaining.push({ ...item, error: 'Max retries exceeded' });
        continue;
      }

      try {
        const success = await onRetry(item);
        if (!success) {
          remaining.push({ ...item, retryCount: item.retryCount + 1 });
        }
      } catch (err) {
        remaining.push({
          ...item,
          retryCount: item.retryCount + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    saveQueue(remaining);
    setRetrying(false);
  };

  const clearQueue = () => {
    saveQueue([]);
    onClear?.();
  };

  const pendingCount = queue.filter((i) => i.retryCount < maxRetries).length;
  const failedCount = queue.filter((i) => i.retryCount >= maxRetries).length;

  if (queue.length === 0) {
    return null; // Don't render anything if queue is empty
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-[var(--admin-text-primary)]">Offline Queue</h3>
          <Badge variant={isOnline ? 'success' : 'error'} dot>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
          {failedCount > 0 && <Badge variant="error">{failedCount} failed</Badge>}
        </div>
      </div>

      <p className="text-sm text-[var(--admin-text-muted)] mb-4">
        {isOnline
          ? 'You are online. Queued items can be synced now.'
          : 'You are offline. Items will be synced when connection is restored.'}
      </p>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          onClick={retryAll}
          disabled={!isOnline || retrying || pendingCount === 0}
          loading={retrying}
        >
          Sync {pendingCount} Items
        </Button>
        <Button variant="ghost" onClick={clearQueue} disabled={retrying}>
          Clear Queue
        </Button>
      </div>
    </Card>
  );
}

// Helper function to add item to queue (for use in other components)
export function addToOfflineQueue(queueKey: string, data: unknown): void {
  try {
    const stored = localStorage.getItem(queueKey);
    const queue: QueueItem[] = stored ? JSON.parse(stored) : [];

    queue.push({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });

    localStorage.setItem(queueKey, JSON.stringify(queue));
  } catch (err) {
    console.error('Failed to add to offline queue:', err);
  }
}
