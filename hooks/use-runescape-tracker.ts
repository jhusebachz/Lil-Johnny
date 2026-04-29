import { useEffect, useState } from 'react';

import {
  LiveRunescapeTracker,
  fetchRunescapeTrackerSnapshot,
  getFallbackRunescapeTracker,
} from '../data/osrsTracker';

export function useRunescapeTracker(refreshToken = 0) {
  const [tracker, setTracker] = useState<LiveRunescapeTracker>(getFallbackRunescapeTracker());
  const [trackerLoading, setTrackerLoading] = useState(true);
  const [trackerError, setTrackerError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadTracker = async () => {
      setTrackerLoading(true);
      setTrackerError(null);

      try {
        const liveTracker = await fetchRunescapeTrackerSnapshot();

        if (mounted) {
          setTracker(liveTracker);
        }
      } catch (error) {
        if (mounted) {
          setTracker(getFallbackRunescapeTracker());
          setTrackerError(error instanceof Error ? error.message : 'Unable to load live OSRS stats.');
        }
      } finally {
        if (mounted) {
          setTrackerLoading(false);
        }
      }
    };

    void loadTracker();

    return () => {
      mounted = false;
    };
  }, [refreshToken]);

  return {
    tracker,
    trackerLoading,
    trackerError,
  };
}
