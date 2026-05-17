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

type GymHydrationContextValue = {
  hydrated: boolean;
};

type GymExerciseHistoryContextValue = GymHydrationContextValue & {
  exerciseHistory: GymExerciseHistory;
  setExerciseHistory: React.Dispatch<React.SetStateAction<GymExerciseHistory>>;
};

type GymExerciseLogsContextValue = GymHydrationContextValue & {
  exerciseLogs: PersistedGymData['exerciseLogs'];
  setExerciseLogs: React.Dispatch<React.SetStateAction<PersistedGymData['exerciseLogs']>>;
};

const GymDataContext = createContext<GymDataContextValue | undefined>(undefined);
const GymHydrationContext = createContext<GymHydrationContextValue | undefined>(undefined);
const GymExerciseHistoryContext = createContext<GymExerciseHistoryContextValue | undefined>(undefined);
const GymExerciseLogsContext = createContext<GymExerciseLogsContextValue | undefined>(undefined);

function useRequiredContext<T>(context: React.Context<T | undefined>, errorMessage: string) {
  const value = useContext(context);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}

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

  const hydrationValue = useMemo(
    () => ({
      hydrated,
    }),
    [hydrated]
  );

  const gymDataValue = useMemo(
    () => ({
      hydrated,
      exerciseHistory,
      exerciseLogs,
      setExerciseHistory,
      setExerciseLogs,
    }),
    [exerciseHistory, exerciseLogs, hydrated]
  );

  const exerciseHistoryValue = useMemo(
    () => ({
      hydrated,
      exerciseHistory,
      setExerciseHistory,
    }),
    [exerciseHistory, hydrated]
  );

  const exerciseLogsValue = useMemo(
    () => ({
      hydrated,
      exerciseLogs,
      setExerciseLogs,
    }),
    [exerciseLogs, hydrated]
  );

  return (
    <GymDataContext.Provider value={gymDataValue}>
      <GymHydrationContext.Provider value={hydrationValue}>
        <GymExerciseHistoryContext.Provider value={exerciseHistoryValue}>
          <GymExerciseLogsContext.Provider value={exerciseLogsValue}>{children}</GymExerciseLogsContext.Provider>
        </GymExerciseHistoryContext.Provider>
      </GymHydrationContext.Provider>
    </GymDataContext.Provider>
  );
}

export function useGymData() {
  return useRequiredContext(GymDataContext, 'useGymData must be used within a GymDataProvider.');
}

export function useGymHydration() {
  return useRequiredContext(GymHydrationContext, 'useGymHydration must be used within a GymDataProvider.');
}

export function useGymExerciseHistoryData() {
  return useRequiredContext(
    GymExerciseHistoryContext,
    'useGymExerciseHistoryData must be used within a GymDataProvider.'
  );
}

export function useGymExerciseLogsData() {
  return useRequiredContext(
    GymExerciseLogsContext,
    'useGymExerciseLogsData must be used within a GymDataProvider.'
  );
}
