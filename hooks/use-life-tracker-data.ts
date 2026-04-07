import { useEffect, useState } from 'react';

import {
  LifeTrackerData,
  defaultLifeTrackerData,
  mergeLifeTrackerData,
  readPersistedLifeTrackerData,
  writePersistedLifeTrackerData,
} from '../data/lifeTrackerData';

export function useLifeTrackerData() {
  const [lifeData, setLifeData] = useState<LifeTrackerData>(defaultLifeTrackerData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const persisted = await readPersistedLifeTrackerData().catch(() => null);

      if (mounted) {
        setLifeData(mergeLifeTrackerData(persisted));
        setHydrated(true);
      }
    };

    void hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    void writePersistedLifeTrackerData(lifeData);
  }, [hydrated, lifeData]);

  return { hydrated, lifeData, setLifeData };
}
