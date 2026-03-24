import { useCallback, useEffect, useRef, useState } from 'react';

export function useTimedRefresh(defaultDuration = 600) {
  const [refreshing, setRefreshing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerRefresh = useCallback((duration = defaultDuration) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setRefreshing(true);
    timerRef.current = setTimeout(() => {
      setRefreshing(false);
      timerRef.current = null;
    }, duration);
  }, [defaultDuration]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { refreshing, setRefreshing, triggerRefresh };
}
