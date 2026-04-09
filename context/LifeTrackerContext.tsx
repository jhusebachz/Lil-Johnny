import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  LifeTrackerData,
  defaultLifeTrackerData,
  mergeLifeTrackerData,
  readPersistedLifeTrackerData,
  writePersistedLifeTrackerData,
} from '../data/lifeTrackerData';

type LifeTrackerContextValue = {
  hydrated: boolean;
  lifeData: LifeTrackerData;
  setLifeData: React.Dispatch<React.SetStateAction<LifeTrackerData>>;
};

const LifeTrackerContext = createContext<LifeTrackerContextValue | undefined>(undefined);

export function LifeTrackerProvider({ children }: { children: React.ReactNode }) {
  const [lifeData, setLifeData] = useState<LifeTrackerData>(defaultLifeTrackerData);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      const persisted = await readPersistedLifeTrackerData().catch(() => null);

      if (!mounted) {
        return;
      }

      setLifeData(mergeLifeTrackerData(persisted));
      setHydrated(true);
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

  const value = useMemo(
    () => ({
      hydrated,
      lifeData,
      setLifeData,
    }),
    [hydrated, lifeData]
  );

  return <LifeTrackerContext.Provider value={value}>{children}</LifeTrackerContext.Provider>;
}

export function useLifeTrackerData() {
  const context = useContext(LifeTrackerContext);

  if (!context) {
    throw new Error('useLifeTrackerData must be used within a LifeTrackerProvider.');
  }

  return context;
}
