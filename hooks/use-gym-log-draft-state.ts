import { useEffect, useMemo, useState } from 'react';

import {
  ExerciseDraftSet,
  ExerciseLog,
  ExerciseProgressPoint,
  GymDay,
  GymExerciseHistory,
  WorkoutExercise,
  createDraftExerciseSet,
  createEmptyExerciseLog,
} from '../data/gymData';
import { formatFullDate, formatMonthDay, getRelativeDateKey, getTodayDateKey } from '../data/lifeTrackerData';

export type LogDateOption = {
  dateKey: string;
  shortLabel: string;
  fullLabel: string;
};

function createDraftLogFromProgressPoint(point: ExerciseProgressPoint): ExerciseLog {
  return {
    setEntries:
      point.setEntries.length > 0
        ? point.setEntries.map((setEntry) =>
            createDraftExerciseSet({
              reps: String(setEntry.reps),
              weight: String(setEntry.weight),
            })
          )
        : [createDraftExerciseSet()],
    note: point.note ?? '',
  };
}

function getRecentLogDateOptions(referenceDate = new Date(), count = 7): LogDateOption[] {
  return Array.from({ length: count }, (_, index) => {
    const offset = -index;
    const dateKey = offset === 0 ? getTodayDateKey(referenceDate) : getRelativeDateKey(offset, referenceDate);
    const date = new Date(`${dateKey}T12:00:00`);

    return {
      dateKey,
      shortLabel: index === 0 ? 'Today' : index === 1 ? 'Yesterday' : formatMonthDay(date),
      fullLabel: formatFullDate(date),
    };
  });
}

type UseGymLogDraftStateArgs = {
  exerciseHistory: GymExerciseHistory;
  exerciseLogs: Record<string, ExerciseLog>;
  selectedDay: GymDay;
  workoutExercises: WorkoutExercise[];
};

export function useGymLogDraftState({
  exerciseHistory,
  exerciseLogs,
  selectedDay,
  workoutExercises,
}: UseGymLogDraftStateArgs) {
  const [selectedLogDateKey, setSelectedLogDateKey] = useState(() => getTodayDateKey());
  const [activeExerciseKey, setActiveExerciseKey] = useState<string | null>(null);
  const [draftLog, setDraftLog] = useState<ExerciseLog>(createEmptyExerciseLog());

  const logDateOptions = useMemo(() => getRecentLogDateOptions(), []);
  const selectedLogDate =
    logDateOptions.find((option) => option.dateKey === selectedLogDateKey) ?? {
      dateKey: selectedLogDateKey,
      shortLabel: formatMonthDay(new Date(`${selectedLogDateKey}T12:00:00`)),
      fullLabel: formatFullDate(new Date(`${selectedLogDateKey}T12:00:00`)),
    };
  const activeExercise = useMemo(
    () => workoutExercises.find((exercise) => `${selectedDay}-${exercise.name}` === activeExerciseKey) ?? null,
    [activeExerciseKey, selectedDay, workoutExercises]
  );

  useEffect(() => {
    if (!activeExercise || !activeExerciseKey) {
      return;
    }

    const existingPoint = exerciseHistory[selectedDay][activeExercise.name]?.find(
      (point) => point.dateKey === selectedLogDateKey
    );
    const existingLog = exerciseLogs[activeExerciseKey];

    if (existingPoint) {
      setDraftLog(createDraftLogFromProgressPoint(existingPoint));
      return;
    }

    setDraftLog(existingLog && existingLog.setEntries.length > 0 ? existingLog : createEmptyExerciseLog());
  }, [activeExercise, activeExerciseKey, exerciseHistory, exerciseLogs, selectedDay, selectedLogDateKey]);

  const updateDraftSet = (setId: string, field: keyof Pick<ExerciseDraftSet, 'reps' | 'weight'>, value: string) => {
    setDraftLog((current) => ({
      ...current,
      setEntries: current.setEntries.map((setEntry) =>
        setEntry.id === setId
          ? {
              ...setEntry,
              [field]: value,
            }
          : setEntry
      ),
    }));
  };

  return {
    activeExercise,
    activeExerciseKey,
    draftLog,
    logDateOptions,
    selectedLogDate,
    selectedLogDateKey,
    addDraftSet: () =>
      setDraftLog((current) => ({
        ...current,
        setEntries: [...current.setEntries, createDraftExerciseSet()],
      })),
    closeExerciseLogger: () => setActiveExerciseKey(null),
    openExerciseLogger: (exerciseName: string) => setActiveExerciseKey(`${selectedDay}-${exerciseName}`),
    removeDraftSet: (setId: string) =>
      setDraftLog((current) => {
        if (current.setEntries.length <= 1) {
          return {
            ...current,
            setEntries: [createDraftExerciseSet()],
          };
        }

        return {
          ...current,
          setEntries: current.setEntries.filter((setEntry) => setEntry.id !== setId),
        };
      }),
    selectLogDate: setSelectedLogDateKey,
    setDraftLog,
    updateDraftSet,
  };
}
