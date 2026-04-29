import { useEffect, useMemo, useState } from 'react';
import { Text, View, useWindowDimensions } from 'react-native';

import BodyMetricsSection from '../../components/gym/BodyMetricsSection';
import ExerciseLogModal from '../../components/gym/ExerciseLogModal';
import ExerciseProgressSection from '../../components/gym/ExerciseProgressSection';
import GymPaceSection from '../../components/gym/GymPaceSection';
import LoopRunSection from '../../components/gym/LoopRunSection';
import MobilityRoutineSection from '../../components/gym/MobilityRoutineSection';
import WorkoutSection from '../../components/gym/WorkoutSection';
import SectionCard from '../../components/SectionCard';
import AppScreenShell from '../../components/ui/AppScreenShell';
import SegmentedToggleRow from '../../components/ui/SegmentedToggleRow';
import { usePreferenceSettings, useThemeSettings } from '../../context/AppSettingsContext';
import { useGymData } from '../../context/GymDataContext';
import { useLifeTrackerData } from '../../context/LifeTrackerContext';
import {
  ExerciseDraftSet,
  ExerciseLog,
  ExerciseProgressPoint,
  ExerciseSet,
  GymDay,
  GymView,
  createDraftExerciseSet,
  createEmptyExerciseLog,
  gymWorkoutTemplates,
} from '../../data/gymData';
import {
  GOAL_WEIGHT_LB,
  LoopRunEntry,
  STARTING_WEIGHT_LB,
  WeightEntry,
  formatDateKey,
  formatFullDate,
  formatMonthDay,
  getRelativeDateKey,
  getTodayDateKey,
} from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';
import { useGymProgressMetrics } from '../../hooks/use-gym-progress-metrics';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

const gymDays: GymDay[] = ['Push', 'Pull', 'Legs'];
const gymViews: GymView[] = ['Workout', 'Progress'];

function parseNumber(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatWeight(weight: number) {
  return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

function parseSeconds(value: string) {
  const cleaned = value.trim();

  if (!cleaned) {
    return null;
  }

  if (cleaned.includes(':')) {
    const [minutes, seconds] = cleaned.split(':').map((part) => Number(part));

    if (Number.isFinite(minutes) && Number.isFinite(seconds)) {
      return minutes * 60 + seconds;
    }
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function getTodayEntryMeta() {
  const now = new Date();

  return {
    dateKey: getTodayDateKey(now),
    label: formatMonthDay(now),
    fullLabel: formatFullDate(now),
  };
}

type LogDateOption = {
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

export default function Gym() {
  const { theme } = useThemeSettings();
  const { preferences, triggerHaptic } = usePreferenceSettings();
  const colors = getThemeColors(theme);
  const { width } = useWindowDimensions();
  const { exerciseHistory, exerciseLogs, setExerciseHistory, setExerciseLogs } = useGymData();
  const { lifeData, setLifeData } = useLifeTrackerData();
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const [selectedDay, setSelectedDay] = useState<GymDay>('Push');
  const [selectedView, setSelectedView] = useState<GymView>('Workout');
  const [selectedLogDateKey, setSelectedLogDateKey] = useState(() => getTodayDateKey());
  const [activeExerciseKey, setActiveExerciseKey] = useState<string | null>(null);
  const [draftLog, setDraftLog] = useState<ExerciseLog>(createEmptyExerciseLog());
  const [draftWeight, setDraftWeight] = useState('');
  const [draftLoopRun, setDraftLoopRun] = useState('');
  const [selectedProgressExercise, setSelectedProgressExercise] = useState<Record<GymDay, string>>({
    Push: gymWorkoutTemplates.Push.exercises[0].name,
    Pull: gymWorkoutTemplates.Pull.exercises[0].name,
    Legs: gymWorkoutTemplates.Legs.exercises[0].name,
  });

  const workout = gymWorkoutTemplates[selectedDay];
  const isCompact = width < 430;
  const groupedWorkoutExercises = useMemo(() => {
    const grouped = new Map<string, typeof workout.exercises>();

    workout.exercises.forEach((exercise) => {
      const category = exercise.category ?? 'Exercises';
      const existing = grouped.get(category) ?? [];
      grouped.set(category, [...existing, exercise]);
    });

    return [...grouped.entries()];
  }, [workout]);

  const progressExerciseName = selectedProgressExercise[selectedDay];
  const {
    bestAtTopWeight,
    allWeights,
    bestLoopRun,
    estimatedOneRepMax,
    latestWeight,
    loopRunGoalPct,
    maxReps,
    oneRepMaxTrend,
    progressPointSummaries,
    qualifyingProgressPoints,
    recentLoopRuns,
    weeklyGymPacePct,
    weeklyGymPct,
    weeklyGymVisits,
    weightGoalDelta,
    weightGoalPacePct,
    weightGoalPct,
    weightMax,
    weightMin,
  } = useGymProgressMetrics({
    exerciseHistory,
    lifeData,
    progressExerciseName,
    selectedDay,
  });

  const todayEntry = getTodayEntryMeta();
  const todayKey = getTodayDateKey();
  const logDateOptions = useMemo(() => getRecentLogDateOptions(), []);
  const selectedLogDate =
    logDateOptions.find((option) => option.dateKey === selectedLogDateKey) ?? {
      dateKey: selectedLogDateKey,
      shortLabel: formatMonthDay(new Date(`${selectedLogDateKey}T12:00:00`)),
      fullLabel: formatFullDate(new Date(`${selectedLogDateKey}T12:00:00`)),
    };
  const activeExercise = useMemo(
    () => workout.exercises.find((exercise) => `${selectedDay}-${exercise.name}` === activeExerciseKey) ?? null,
    [activeExerciseKey, selectedDay, workout.exercises]
  );
  const gymViewOptions: { label: string; value: GymView }[] = gymViews.map((view) => ({ label: view, value: view }));
  const gymDayOptions: { label: string; value: GymDay }[] = gymDays.map((day) => ({ label: day, value: day }));

  const openExerciseLogger = async (exerciseName: string) => {
    const nextKey = `${selectedDay}-${exerciseName}`;
    await triggerHaptic();
    setActiveExerciseKey(nextKey);
  };

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

  const addDraftSet = async () => {
    await triggerHaptic();
    setDraftLog((current) => ({
      ...current,
      setEntries: [...current.setEntries, createDraftExerciseSet()],
    }));
  };

  const removeDraftSet = async (setId: string) => {
    await triggerHaptic();
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
    });
  };

  const saveExerciseLogger = async () => {
    if (!activeExerciseKey || !activeExercise) {
      return;
    }

    await triggerHaptic();
    const trimmedNote = draftLog.note?.trim() ? draftLog.note.trim() : undefined;
    const sanitizedDraftSets = draftLog.setEntries.filter((setEntry) => setEntry.reps.trim() || setEntry.weight.trim());
    const parsedSets = sanitizedDraftSets
      .map((setEntry) => {
        const reps = parseNumber(setEntry.reps);
        const weight = parseNumber(setEntry.weight);

        if (reps === null || reps <= 0 || weight === null || weight <= 0) {
          return null;
        }

        return { reps, weight };
      })
      .filter((setEntry): setEntry is ExerciseSet => setEntry !== null);

    setExerciseLogs((current) => {
      if (sanitizedDraftSets.length === 0 && !trimmedNote) {
        const nextLogs = { ...current };
        delete nextLogs[activeExerciseKey];
        return nextLogs;
      }

      return {
        ...current,
        [activeExerciseKey]: {
          setEntries: sanitizedDraftSets.length > 0 ? sanitizedDraftSets : [createDraftExerciseSet()],
          note: trimmedNote ?? '',
        },
      };
    });

    setExerciseHistory((current) => {
      const dayHistory = current[selectedDay];
      const exerciseName = activeExercise.name;
      const existingPoints = dayHistory[exerciseName] ?? [];
      const existingIndex = existingPoints.findIndex((point) => point.dateKey === selectedLogDate.dateKey);

      let nextPoints = existingPoints;

      if (parsedSets.length > 0) {
        const updatedPoint = {
          dateKey: selectedLogDate.dateKey,
          label: formatMonthDay(new Date(`${selectedLogDate.dateKey}T12:00:00`)),
          setEntries: parsedSets,
          note: trimmedNote,
        };

        nextPoints =
          existingIndex >= 0
            ? existingPoints.map((point, index) => (index === existingIndex ? updatedPoint : point))
            : [...existingPoints, updatedPoint];
      } else if (existingIndex >= 0) {
        nextPoints = existingPoints.filter((_, index) => index !== existingIndex);
      }

      return {
        ...current,
        [selectedDay]: {
          ...dayHistory,
          [exerciseName]: nextPoints,
        },
      };
    });

    setActiveExerciseKey(null);
  };

  const logWeight = async () => {
    const parsed = parseNumber(draftWeight);

    if (parsed === null) {
      return;
    }

    await triggerHaptic();
    const nextEntry: WeightEntry = {
      id: `weight-${todayKey}-${Date.now()}`,
      dateKey: todayKey,
      label: formatDateKey(todayKey),
      weight: parsed,
    };

    setLifeData((current) => ({
      ...current,
      weightEntries: [...current.weightEntries, nextEntry].slice(-60),
    }));
    setDraftWeight('');
  };

  const logLoopRun = async () => {
    const seconds = parseSeconds(draftLoopRun);

    if (seconds === null) {
      return;
    }

    await triggerHaptic();
    const nextEntry: LoopRunEntry = {
      id: `loop-${todayKey}-${Date.now()}`,
      dateKey: todayKey,
      label: formatDateKey(todayKey),
      timeSeconds: seconds,
    };

    setLifeData((current) => ({
      ...current,
      loopRuns: [nextEntry, ...current.loopRuns],
    }));
    setDraftLoopRun('');
  };

  return (
    <>
      <AppScreenShell
        colors={colors}
        refreshing={refreshing}
        onRefresh={triggerRefresh}
        hero={
          <View
            style={{
              backgroundColor: colors.hero,
              borderRadius: 16,
              padding: 20,
              minHeight: 112,
              justifyContent: 'center',
              marginBottom: 18,
            }}
          >
            <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800', marginBottom: 10 }}>Health</Text>
            <Text style={{ color: colors.heroSubtext, fontSize: 12, lineHeight: 18 }}>
              Preferred split: {preferences.preferredWorkoutSplit} | {weeklyGymVisits}/3 gym visits this week
            </Text>
          </View>
        }
      >

        <GymPaceSection
          colors={colors}
          latestWeightLabel={latestWeight ? `Current ${formatWeight(latestWeight.weight)} lb` : `Baseline ${STARTING_WEIGHT_LB} lb`}
          loopRunGoalPct={loopRunGoalPct}
          weeklyGymPacePct={weeklyGymPacePct}
          weeklyGymPct={weeklyGymPct}
          weightGoalPacePct={weightGoalPacePct}
          weightGoalPct={weightGoalPct}
          bestLoopRunSeconds={bestLoopRun?.timeSeconds}
          goalWeightLb={GOAL_WEIGHT_LB}
        />

        <MobilityRoutineSection colors={colors} />

        <LoopRunSection
          bestLoopRun={bestLoopRun}
          colors={colors}
          draftLoopRun={draftLoopRun}
          recentLoopRuns={recentLoopRuns}
          totalLoopRuns={lifeData.loopRuns.length}
          onDraftLoopRunChange={setDraftLoopRun}
          onLogLoopRun={() => {
            void logLoopRun();
          }}
        />

        <BodyMetricsSection
          colors={colors}
          draftWeight={draftWeight}
          goalWeightDelta={weightGoalDelta}
          goalWeightLb={GOAL_WEIGHT_LB}
          latestWeight={latestWeight}
          recentWeights={allWeights}
          weightMax={weightMax}
          weightMin={weightMin}
          onDraftWeightChange={setDraftWeight}
          onLogWeight={() => {
            void logWeight();
          }}
        />

        <SectionCard title="Gym View" emoji={'⇄'} colors={colors}>
          <SegmentedToggleRow
            colors={colors}
            options={gymViewOptions}
            selectedValue={selectedView}
            onSelect={async (view) => {
              await triggerHaptic();
              setSelectedView(view);
            }}
          />
        </SectionCard>

        <SectionCard title="Day Selector" emoji={'📋'} colors={colors}>
          <SegmentedToggleRow
            colors={colors}
            options={gymDayOptions}
            selectedValue={selectedDay}
            onSelect={async (day) => {
              await triggerHaptic();
              setSelectedDay(day);
            }}
          />
        </SectionCard>

        {selectedView === 'Workout' ? (
          <WorkoutSection
            colors={colors}
            exerciseLogs={exerciseLogs}
            groupedWorkoutExercises={groupedWorkoutExercises}
            selectedDay={selectedDay}
            todayLabel={todayEntry.fullLabel}
            workout={workout}
            onExercisePress={(exerciseName) => {
              void openExerciseLogger(exerciseName);
            }}
          />
        ) : (
          <ExerciseProgressSection
            bestAtTopWeight={bestAtTopWeight}
            colors={colors}
            estimatedOneRepMax={estimatedOneRepMax}
            formatWeight={formatWeight}
            isCompact={isCompact}
            maxReps={maxReps}
            oneRepMaxTrend={oneRepMaxTrend}
            progressExerciseName={progressExerciseName}
            progressPointSummaries={progressPointSummaries}
            qualifyingProgressPoints={qualifyingProgressPoints}
            selectedDay={selectedDay}
            workout={workout}
            onExerciseSelect={async (exerciseName) => {
              await triggerHaptic();
              setSelectedProgressExercise((current) => ({
                ...current,
                [selectedDay]: exerciseName,
              }));
            }}
          />
        )}
      </AppScreenShell>

      <ExerciseLogModal
        activeExercise={activeExercise}
        colors={colors}
        dateOptions={logDateOptions}
        selectedDateKey={selectedLogDate.dateKey}
        draftLog={draftLog}
        selectedDateLabel={selectedLogDate.fullLabel}
        onClose={() => setActiveExerciseKey(null)}
        onAddSet={() => {
          void addDraftSet();
        }}
        onDateSelect={async (dateKey) => {
          await triggerHaptic();
          setSelectedLogDateKey(dateKey);
        }}
        onDraftLogChange={(updates) => setDraftLog((current) => ({ ...current, ...updates }))}
        onDraftSetChange={updateDraftSet}
        onRemoveSet={(setId) => {
          void removeDraftSet(setId);
        }}
        onSave={() => {
          void saveExerciseLogger();
        }}
      />
    </>
  );
}
