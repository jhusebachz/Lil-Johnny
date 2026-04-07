import { useEffect, useState } from 'react';

import {
  GymExerciseHistory,
  PersistedGymData,
  createEmptyGymProgressHistory,
  readPersistedGymData,
  writePersistedGymData,
} from '../data/gymData';

export function useGymData() {
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

  return { exerciseHistory, exerciseLogs, hydrated, setExerciseHistory, setExerciseLogs };
}
