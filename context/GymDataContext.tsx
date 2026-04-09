import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import {
  GymExerciseHistory,
  PersistedGymData,
  createEmptyGymProgressHistory,
  readPersistedGymData,
  writePersistedGymData,
} from '../data/gymData';

type GymDataContextValue = {
  hydrated: boolean;
  exerciseHistory: GymExerciseHistory;
  exerciseLogs: PersistedGymData['exerciseLogs'];
  setExerciseHistory: React.Dispatch<React.SetStateAction<GymExerciseHistory>>;
  setExerciseLogs: React.Dispatch<React.SetStateAction<PersistedGymData['exerciseLogs']>>;
};

const GymDataContext = createContext<GymDataContextValue | undefined>(undefined);

export function GymDataProvider({ children }: { children: React.ReactNode }) {
  const [exerciseLogs, setExerciseLogs] = useState<PersistedGymData['exerciseLogs']>({});
  const [exerciseHistory, setExerciseHistory] = useState<GymExerciseHistory>(createEmptyGymProgressHistory());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const persisted = await readPersistedGymData();

        if (mounted && persisted) {
          setExerciseLogs(persisted.exerciseLogs ?? {});
          setExerciseHistory(persisted.exerciseHistory ?? createEmptyGymProgressHistory());
        }
      } finally {
        if (mounted) {
          setHydrated(true);
        }
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

    void writePersistedGymData({ exerciseLogs, exerciseHistory });
  }, [exerciseHistory, exerciseLogs, hydrated]);

  const value = useMemo(
    () => ({
      hydrated,
      exerciseHistory,
      exerciseLogs,
      setExerciseHistory,
      setExerciseLogs,
    }),
    [exerciseHistory, exerciseLogs, hydrated]
  );

  return <GymDataContext.Provider value={value}>{children}</GymDataContext.Provider>;
}

export function useGymData() {
  const context = useContext(GymDataContext);

  if (!context) {
    throw new Error('useGymData must be used within a GymDataProvider.');
  }

  return context;
}
