import { useState, useEffect, useCallback, useRef } from 'react';

export interface Activity {
  id: string;
  type: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface RealtimeState {
  connected: boolean;
  lastUpdate: Date | null;
  activities: Activity[];
  error: string | null;
}

export interface UseRealtimeOptions {
  pollInterval?: number;
  maxActivities?: number;
  onNewActivity?: (activity: Activity) => void;
  onConnectionChange?: (connected: boolean) => void;
}

const POLL_INTERVAL = 5000; // 5 seconds
const MAX_ACTIVITIES = 50;
const RECONNECT_DELAY = 3000;
const MAX_RETRIES = 5;

export function useRealtime(options: UseRealtimeOptions = {}) {
  const {
    pollInterval = POLL_INTERVAL,
    maxActivities = MAX_ACTIVITIES,
    onNewActivity,
    onConnectionChange,
  } = options;

  const [state, setState] = useState<RealtimeState>({
    connected: false,
    lastUpdate: null,
    activities: [],
    error: null,
  });

  const retryCount = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchActivities = useCallback(async () => {
    // Cancel any pending request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    try {
      const response = await fetch('/api/v1/activities', {
        signal: abortController.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const activities: Activity[] = Array.isArray(data) ? data : data.activities || [];

      setState((prev) => {
        const wasConnected = prev.connected;
        const newActivities = activities.slice(0, maxActivities);

        // Check for new activities
        if (onNewActivity && prev.activities.length > 0) {
          const prevIds = new Set(prev.activities.map((a) => a.id));
          newActivities.forEach((activity) => {
            if (!prevIds.has(activity.id)) {
              onNewActivity(activity);
            }
          });
        }

        // Notify connection change
        if (!wasConnected && onConnectionChange) {
          onConnectionChange(true);
        }

        return {
          connected: true,
          lastUpdate: new Date(),
          activities: newActivities,
          error: null,
        };
      });

      // Reset retry count on success
      retryCount.current = 0;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return; // Ignore aborted requests
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      setState((prev) => {
        const wasConnected = prev.connected;

        // Notify connection change
        if (wasConnected && onConnectionChange) {
          onConnectionChange(false);
        }

        return {
          ...prev,
          connected: false,
          error: errorMessage,
        };
      });

      // Increment retry count
      retryCount.current += 1;
    }
  }, [maxActivities, onNewActivity, onConnectionChange]);

  const scheduleNextPoll = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Use exponential backoff on failure, up to max retries
    const delay =
      retryCount.current > 0
        ? Math.min(RECONNECT_DELAY * Math.pow(2, retryCount.current - 1), 30000)
        : pollInterval;

    // Stop polling after max retries
    if (retryCount.current >= MAX_RETRIES) {
      setState((prev) => ({
        ...prev,
        error: 'Max retries reached. Click to reconnect.',
      }));
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      await fetchActivities();
      scheduleNextPoll();
    }, delay);
  }, [fetchActivities, pollInterval]);

  const reconnect = useCallback(() => {
    retryCount.current = 0;
    setState((prev) => ({ ...prev, error: null }));
    fetchActivities().then(scheduleNextPoll);
  }, [fetchActivities, scheduleNextPoll]);

  // Start polling on mount
  useEffect(() => {
    fetchActivities().then(scheduleNextPoll);

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fetchActivities, scheduleNextPoll]);

  return {
    ...state,
    reconnect,
    isPolling: retryCount.current < MAX_RETRIES,
  };
}

export default useRealtime;
