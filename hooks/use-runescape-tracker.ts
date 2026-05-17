import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  LiveRunescapeTracker,
  fetchRunescapeTrackerSnapshot,
  getFallbackRunescapeTracker,
} from '../data/osrsTracker';

export function useRunescapeTracker(refreshToken = 0) {
  const [tracker, setTracker] = useState<LiveRunescapeTracker>(getFallbackRunescapeTracker());
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [trackerError, setTrackerError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadTracker = useCallback(async () => {
    if (!mountedRef.current) {
      return;
    }

    setTrackerLoading(true);
    setTrackerError(null);

    try {
      const liveTracker = await fetchRunescapeTrackerSnapshot();

      if (mountedRef.current) {
        setTracker(liveTracker);
      }
    } catch (error) {
      if (mountedRef.current) {
        setTracker(getFallbackRunescapeTracker());
        setTrackerError(error instanceof Error ? error.message : 'Unable to load live OSRS stats.');
      }
    } finally {
      if (mountedRef.current) {
        setTrackerLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    void loadTracker();
  }, [loadTracker, refreshToken]);

  useFocusEffect(
    useCallback(() => {
      void loadTracker();
    }, [loadTracker, refreshToken])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (status === 'active') {
        void loadTracker();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadTracker]);

  return {
    tracker,
    trackerLoading,
    trackerError,
  };
}
