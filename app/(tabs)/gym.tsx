import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BodyMetricsSection from '../../components/gym/BodyMetricsSection';
import ExerciseLogModal from '../../components/gym/ExerciseLogModal';
import ExerciseProgressSection from '../../components/gym/ExerciseProgressSection';
import GymPaceSection from '../../components/gym/GymPaceSection';
import LoopRunSection from '../../components/gym/LoopRunSection';
import MobilityRoutineSection from '../../components/gym/MobilityRoutineSection';
import WorkoutSection from '../../components/gym/WorkoutSection';
import SectionCard from '../../components/SectionCard';
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
  getLoggedGymDateKeys,
  gymWorkoutTemplates,
} from '../../data/gymData';
import {
  GOAL_WEIGHT_LB,
  LoopRunEntry,
  STARTING_WEIGHT_LB,
  TRACKER_BASELINE_DATE,
  WEIGHT_GOAL_TARGET_DATE,
  WeightEntry,
  formatDateKey,
  formatFullDate,
  formatMonthDay,
  getDateRangePacePct,
  getScheduledGymPacePct,
  getTodayDateKey,
  getUniqueWeekCount,
  getWeightLossProgressPct,
} from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';
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

function estimateOneRepMax(weight: number, reps: number) {
  return weight * (1 + reps / 30);
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

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

type ExerciseProgressSummary = {
  point: ExerciseProgressPoint;
  setCount: number;
  bestSet: BestLoggedSet | null;
  qualifyingSet: BestLoggedSet | null;
};

type BestLoggedSet = Pick<ExerciseSet, 'reps' | 'weight'>;

function getBestSet(setEntries: ExerciseSet[], minimumReps = 0) {
  const qualifyingSets = setEntries.filter((setEntry) => setEntry.reps >= minimumReps);

  if (qualifyingSets.length === 0) {
    return null;
  }

  const topWeight = Math.max(...qualifyingSets.map((setEntry) => setEntry.weight));
  const topWeightSets = qualifyingSets.filter((setEntry) => setEntry.weight === topWeight);
  const bestReps = Math.max(...topWeightSets.map((setEntry) => setEntry.reps));

  return { reps: bestReps, weight: topWeight };
}

function summarizeProgressPoint(point: ExerciseProgressPoint): ExerciseProgressSummary {
  return {
    point,
    setCount: point.setEntries.length,
    bestSet: getBestSet(point.setEntries, 0),
    qualifyingSet: getBestSet(point.setEntries, 6),
  };
}

function getBestAtTopWeight(points: ExerciseProgressSummary[]) {
  const qualifyingPoints = points
    .map((point) => point.qualifyingSet)
    .filter((point): point is BestLoggedSet => point !== null);

  if (qualifyingPoints.length === 0) {
    return null;
  }

  const topWeight = Math.max(...qualifyingPoints.map((point) => point.weight));
  const topWeightPoints = qualifyingPoints.filter((point) => point.weight === topWeight);
  const bestReps = Math.max(...topWeightPoints.map((point) => point.reps));

  return { bestReps, topWeight };
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
    estimatedOneRepMax,
    maxReps,
    oneRepMaxTrend,
    progressPointSummaries,
    qualifyingProgressPoints,
  } = useMemo(() => {
    const rawProgressPoints = exerciseHistory[selectedDay][progressExerciseName] ?? [];
    const progressPoints = [...rawProgressPoints]
      .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
      .slice(-10);
    const progressPointSummaries = progressPoints
      .map(summarizeProgressPoint)
      .filter((point) => point.bestSet !== null);
    const qualifyingProgressPoints = progressPointSummaries.filter((point) => point.qualifyingSet !== null);
    const maxReps = Math.max(...progressPointSummaries.map((point) => point.bestSet?.reps ?? 0), 1);
    const bestAtTopWeight = progressPointSummaries.length > 0 ? getBestAtTopWeight(progressPointSummaries) : null;
    const estimatedOneRepMax =
      bestAtTopWeight && bestAtTopWeight.bestReps >= 1
        ? estimateOneRepMax(bestAtTopWeight.topWeight, bestAtTopWeight.bestReps)
        : null;
    const oneRepMaxTrend =
      qualifyingProgressPoints.length >= 2
        ? estimateOneRepMax(
            qualifyingProgressPoints.at(-1)?.qualifyingSet?.weight ?? 0,
            qualifyingProgressPoints.at(-1)?.qualifyingSet?.reps ?? 0
          ) -
          estimateOneRepMax(
            qualifyingProgressPoints.at(-2)?.qualifyingSet?.weight ?? 0,
            qualifyingProgressPoints.at(-2)?.qualifyingSet?.reps ?? 0
          )
        : null;

    return {
      bestAtTopWeight,
      estimatedOneRepMax,
      maxReps,
      oneRepMaxTrend,
      progressPointSummaries,
      qualifyingProgressPoints,
    };
  }, [exerciseHistory, progressExerciseName, selectedDay]);

  const todayEntry = getTodayEntryMeta();
  const todayKey = getTodayDateKey();
  const {
    allWeights,
    bestLoopRun,
    latestWeight,
    loopRunGoalPct,
    recentLoopRuns,
    weeklyGymPacePct,
    weeklyGymPct,
    weeklyGymVisits,
    weightGoalDelta,
    weightGoalPacePct,
    weightGoalPct,
    weightMax,
    weightMin,
  } = useMemo(() => {
    const weeklyGymVisits = getUniqueWeekCount(getLoggedGymDateKeys(exerciseHistory));
    const allWeights = [...lifeData.weightEntries].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
    const latestWeight = allWeights.at(-1);
    const weightMin = allWeights.length > 0 ? Math.min(...allWeights.map((entry) => entry.weight)) : 0;
    const weightMax = allWeights.length > 0 ? Math.max(...allWeights.map((entry) => entry.weight)) : 1;
    const recentLoopRuns = [...lifeData.loopRuns]
      .sort((left, right) => right.dateKey.localeCompare(left.dateKey))
      .slice(0, 10);
    const bestLoopRun = lifeData.loopRuns.reduce(
      (best, run) => (!best || run.timeSeconds < best.timeSeconds ? run : best),
      lifeData.loopRuns[0]
    );
    const weeklyGymPct = clampPct((weeklyGymVisits / 3) * 100);
    const weeklyGymPacePct = getScheduledGymPacePct();
    const loopRunGoalPct = bestLoopRun
      ? clampPct(((12 * 60 - bestLoopRun.timeSeconds) / (12 * 60 - 9 * 60)) * 100)
      : 0;
    const weightGoalPct = latestWeight ? getWeightLossProgressPct(latestWeight.weight) : 0;
    const weightGoalPacePct = getDateRangePacePct(TRACKER_BASELINE_DATE, WEIGHT_GOAL_TARGET_DATE);
    const weightGoalDelta = latestWeight ? latestWeight.weight - GOAL_WEIGHT_LB : null;

    return {
      allWeights,
      bestLoopRun,
      latestWeight,
      loopRunGoalPct,
      recentLoopRuns,
      weeklyGymPacePct,
      weeklyGymPct,
      weeklyGymVisits,
      weightGoalDelta,
      weightGoalPacePct,
      weightGoalPct,
      weightMax,
      weightMin,
    };
  }, [exerciseHistory, lifeData.loopRuns, lifeData.weightEntries]);

  const activeExercise = useMemo(
    () => workout.exercises.find((exercise) => `${selectedDay}-${exercise.name}` === activeExerciseKey) ?? null,
    [activeExerciseKey, selectedDay, workout.exercises]
  );

  const openExerciseLogger = async (exerciseName: string) => {
    const nextKey = `${selectedDay}-${exerciseName}`;
    await triggerHaptic();
    const existingLog = exerciseLogs[nextKey];
    setDraftLog(existingLog && existingLog.setEntries.length > 0 ? existingLog : createEmptyExerciseLog());
    setActiveExerciseKey(nextKey);
  };

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
      const existingIndex = existingPoints.findIndex((point) => point.dateKey === todayEntry.dateKey);

      let nextPoints = existingPoints;

      if (parsedSets.length > 0) {
        const updatedPoint = {
          dateKey: todayEntry.dateKey,
          label: todayEntry.label,
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
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={triggerRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {gymViews.map((view) => {
              const selected = view === selectedView;

              return (
                <Pressable
                  key={view}
                  onPress={async () => {
                    await triggerHaptic();
                    setSelectedView(view);
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: selected ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.cardBorder,
                    marginRight: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: selected ? 'white' : colors.text, fontSize: 14, fontWeight: '700' }}>{view}</Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Day Selector" emoji={'📋'} colors={colors}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {gymDays.map((day) => {
              const selected = day === selectedDay;

              return (
                <Pressable
                  key={day}
                  onPress={() => setSelectedDay(day)}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 14,
                    borderRadius: 12,
                    backgroundColor: selected ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.cardBorder,
                    marginRight: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: selected ? 'white' : colors.text, fontSize: 14, fontWeight: '700' }}>{day}</Text>
                </Pressable>
              );
            })}
          </View>
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
      </ScrollView>

      <ExerciseLogModal
        activeExercise={activeExercise}
        colors={colors}
        draftLog={draftLog}
        todayLabel={todayEntry.fullLabel}
        onClose={() => setActiveExerciseKey(null)}
        onAddSet={() => {
          void addDraftSet();
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
    </SafeAreaView>
  );
}
