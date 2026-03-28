import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import WorkoutExerciseCard from '../../components/gym/WorkoutExerciseCard';
import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';
import {
  ExerciseProgressPoint,
  ExerciseLog,
  GymDay,
  GymExerciseHistory,
  GymView,
  createEmptyGymProgressHistory,
  getLoggedGymDateKeys,
  gymWorkoutTemplates,
  readPersistedGymData,
  writePersistedGymData,
} from '../../data/gymData';
import {
  GOAL_WEIGHT_LB,
  LifeTrackerData,
  LoopRunEntry,
  STARTING_WEIGHT_LB,
  TRACKER_BASELINE_DATE,
  WEIGHT_GOAL_TARGET_DATE,
  WeightEntry,
  defaultLifeTrackerData,
  formatDateKey,
  formatLoopRunTime,
  getDateRangePacePct,
  getScheduledGymPacePct,
  getTodayDateKey,
  getUniqueWeekCount,
  getWeightLossProgressPct,
  readPersistedLifeTrackerData,
  writePersistedLifeTrackerData,
} from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';
import ProgressBar from '../../components/ProgressBar';

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
    dateKey: now.toISOString().slice(0, 10),
    label: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(now),
    fullLabel: new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(now),
  };
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getBestAtTopWeight(points: ExerciseProgressPoint[]) {
  const qualifyingPoints = points.filter((point) => point.reps >= 6);

  if (qualifyingPoints.length === 0) {
    return null;
  }

  const topWeight = Math.max(...qualifyingPoints.map((point) => point.weight));
  const topWeightPoints = qualifyingPoints.filter((point) => point.weight === topWeight);
  const bestReps = Math.max(...topWeightPoints.map((point) => point.reps));

  return { topWeight, bestReps };
}

export default function Gym() {
  const { theme, triggerHaptic, preferences } = useAppSettings();
  const colors = getThemeColors(theme);
  const { width } = useWindowDimensions();
  const [selectedDay, setSelectedDay] = useState<GymDay>('Push');
  const [selectedView, setSelectedView] = useState<GymView>('Workout');
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({});
  const [exerciseHistory, setExerciseHistory] = useState<GymExerciseHistory>(createEmptyGymProgressHistory());
  const [lifeData, setLifeData] = useState<LifeTrackerData>(defaultLifeTrackerData);
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [lifeHydrated, setLifeHydrated] = useState(false);
  const [activeExerciseKey, setActiveExerciseKey] = useState<string | null>(null);
  const [draftLog, setDraftLog] = useState<ExerciseLog>({ sets: '', reps: '', weight: '', note: '' });
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
  const rawProgressPoints = exerciseHistory[selectedDay][progressExerciseName] ?? [];
  const progressPoints = [...rawProgressPoints]
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
    .slice(-10);
  const qualifyingProgressPoints = progressPoints.filter((point) => point.reps >= 6);
  const maxReps = Math.max(...progressPoints.map((point) => point.reps), 1);
  const bestAtTopWeight = progressPoints.length > 0 ? getBestAtTopWeight(progressPoints) : null;
  const estimatedOneRepMax =
    bestAtTopWeight && bestAtTopWeight.bestReps >= 1
      ? estimateOneRepMax(bestAtTopWeight.topWeight, bestAtTopWeight.bestReps)
      : null;
  const oneRepMaxTrend =
    qualifyingProgressPoints.length >= 2
      ? estimateOneRepMax(
          qualifyingProgressPoints.at(-1)?.weight ?? 0,
          qualifyingProgressPoints.at(-1)?.reps ?? 0
        ) -
        estimateOneRepMax(
          qualifyingProgressPoints.at(-2)?.weight ?? 0,
          qualifyingProgressPoints.at(-2)?.reps ?? 0
        )
      : null;
  const todayEntry = getTodayEntryMeta();
  const todayKey = getTodayDateKey();
  const weeklyGymVisits = useMemo(() => {
    return getUniqueWeekCount(getLoggedGymDateKeys(exerciseHistory));
  }, [exerciseHistory]);
  const recentWeights = [...lifeData.weightEntries]
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
    .slice(-30);
  const latestWeight = recentWeights.at(-1);
  const weightMin = recentWeights.length > 0 ? Math.min(...recentWeights.map((entry) => entry.weight)) : 0;
  const weightMax = recentWeights.length > 0 ? Math.max(...recentWeights.map((entry) => entry.weight)) : 1;
  const recentLoopRuns = [...lifeData.loopRuns].sort((left, right) => right.dateKey.localeCompare(left.dateKey)).slice(0, 10);
  const bestLoopRun = lifeData.loopRuns.reduce(
    (best, run) => (!best || run.timeSeconds < best.timeSeconds ? run : best),
    lifeData.loopRuns[0]
  );
  const weeklyGymPct = clampPct((weeklyGymVisits / 3) * 100);
  const weeklyGymPacePct = getScheduledGymPacePct();
  const loopRunGoalPct = bestLoopRun
    ? clampPct(((12 * 60 - bestLoopRun.timeSeconds) / ((12 * 60) - (9 * 60))) * 100)
    : 0;
  const weightGoalPct = latestWeight ? getWeightLossProgressPct(latestWeight.weight) : 0;
  const weightGoalPacePct = getDateRangePacePct(TRACKER_BASELINE_DATE, WEIGHT_GOAL_TARGET_DATE);
  const weightGoalDelta = latestWeight ? latestWeight.weight - GOAL_WEIGHT_LB : null;
  const activeExercise = useMemo(
    () => workout.exercises.find((exercise) => `${selectedDay}-${exercise.name}` === activeExerciseKey) ?? null,
    [activeExerciseKey, selectedDay, workout.exercises]
  );

  useEffect(() => {
    let mounted = true;

    const hydrateGymData = async () => {
      try {
        const persisted = await readPersistedGymData();

        if (!persisted || !mounted) {
          return;
        }

        setExerciseLogs(persisted.exerciseLogs ?? {});
        setExerciseHistory(persisted.exerciseHistory ?? createEmptyGymProgressHistory());
      } catch {
        // Keep defaults if local gym data is unavailable.
      } finally {
        if (mounted) {
          setHasHydrated(true);
        }
      }
    };

    hydrateGymData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    const hydrateLifeData = async () => {
      try {
        const persisted = await readPersistedLifeTrackerData();

        if (persisted && mounted) {
          setLifeData({
            ...defaultLifeTrackerData,
            ...persisted,
            weightEntries: persisted.weightEntries?.length ? persisted.weightEntries : defaultLifeTrackerData.weightEntries,
            loopRuns: persisted.loopRuns ?? [],
          });
        }
      } finally {
        if (mounted) {
          setLifeHydrated(true);
        }
      }
    };

    void hydrateLifeData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    void writePersistedGymData({ exerciseLogs, exerciseHistory });
  }, [exerciseHistory, exerciseLogs, hasHydrated]);

  useEffect(() => {
    if (!lifeHydrated) {
      return;
    }

    void writePersistedLifeTrackerData(lifeData);
  }, [lifeData, lifeHydrated]);

  const openExerciseLogger = async (exerciseName: string) => {
    const nextKey = `${selectedDay}-${exerciseName}`;
    await triggerHaptic();
    setDraftLog(exerciseLogs[nextKey] ?? { sets: '', reps: '', weight: '', note: '' });
    setActiveExerciseKey(nextKey);
  };

  const closeExerciseLogger = () => {
    setActiveExerciseKey(null);
  };

  const saveExerciseLogger = async () => {
    if (!activeExerciseKey || !activeExercise) {
      return;
    }

    await triggerHaptic();
    setExerciseLogs((current) => ({
      ...current,
      [activeExerciseKey]: draftLog,
    }));

    const parsedSets = parseNumber(draftLog.sets);
    const parsedReps = parseNumber(draftLog.reps);
    const parsedWeight = parseNumber(draftLog.weight);

    if (parsedSets !== null && parsedReps !== null && parsedWeight !== null) {
      setExerciseHistory((current) => {
        const dayHistory = current[selectedDay];
        const exerciseName = activeExercise.name;
        const existingPoints = dayHistory[exerciseName] ?? [];
        const updatedPoint = {
          dateKey: todayEntry.dateKey,
          label: todayEntry.label,
          sets: parsedSets,
          reps: parsedReps,
          weight: parsedWeight,
          note: draftLog.note?.trim() ? draftLog.note.trim() : undefined,
        };
        const existingIndex = existingPoints.findIndex((point) => point.dateKey === todayEntry.dateKey);
        const nextPoints =
          existingIndex >= 0
            ? existingPoints.map((point, index) => (index === existingIndex ? updatedPoint : point))
            : [...existingPoints, updatedPoint];

        return {
          ...current,
          [selectedDay]: {
            ...dayHistory,
            [exerciseName]: nextPoints,
          },
        };
      });
    }

    closeExerciseLogger();
  };

  const refreshGym = () => {
    triggerRefresh();
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
            onRefresh={refreshGym}
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

        <SectionCard title="Health Pace" emoji={'📈'} colors={colors}>
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 6 }}>
              Weekly gym target
            </Text>
            <ProgressBar pct={weeklyGymPct} markerPct={weeklyGymPacePct} color={colors.accent} colors={colors} height={10} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Actual {weeklyGymPct.toFixed(1)}%</Text>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Pace {weeklyGymPacePct.toFixed(1)}%</Text>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 6 }}>
              Weight loss goal
            </Text>
            <ProgressBar pct={weightGoalPct} markerPct={weightGoalPacePct} color={colors.warning} colors={colors} height={10} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Actual {weightGoalPct.toFixed(1)}%</Text>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Pace {weightGoalPacePct.toFixed(1)}%</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontSize: 11, color: colors.subtext }}>
                {latestWeight ? `Current ${formatWeight(latestWeight.weight)} lb` : `Baseline ${STARTING_WEIGHT_LB} lb`}
              </Text>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Target {GOAL_WEIGHT_LB} lb</Text>
            </View>
          </View>

          <View>
            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 6 }}>
              Loop run sub-9 goal
            </Text>
            <ProgressBar pct={loopRunGoalPct} color={colors.success} colors={colors} height={10} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 11, color: colors.subtext }}>
                {bestLoopRun ? `Best ${formatLoopRunTime(bestLoopRun.timeSeconds)}` : 'No run logged'}
              </Text>
              <Text style={{ fontSize: 11, color: colors.subtext }}>Target 9:00</Text>
            </View>
          </View>
        </SectionCard>

        <SectionCard title="Body Metrics" emoji={'\u2696'} colors={colors}>
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 10 }}>
            Latest weight: {latestWeight ? `${latestWeight.weight.toFixed(1)} lb` : 'No entries yet'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 12 }}>
            2026 goal weight: {GOAL_WEIGHT_LB} lb
            {weightGoalDelta !== null
              ? weightGoalDelta === 0
                ? ' | On target'
                : ` | ${Math.abs(weightGoalDelta).toFixed(1)} lb ${weightGoalDelta > 0 ? 'above' : 'below'} target`
              : ''}
          </Text>

          <View
            style={{
              height: 190,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: colors.inputBackground,
              marginBottom: 12,
              overflow: 'hidden',
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            {[0.2, 0.5, 0.8].map((line) => (
              <View
                key={line}
                style={{
                  position: 'absolute',
                  left: 12,
                  right: 12,
                  bottom: 12 + line * 150,
                  height: 1,
                  backgroundColor: colors.cardBorder,
                }}
              />
            ))}
            <View
              style={{
                position: 'absolute',
                left: 12,
                right: 12,
                bottom: 12,
                height: 1,
                backgroundColor: colors.cardBorder,
              }}
            />

            {recentWeights.map((entry, index) => {
              const normalizedY = weightMax === weightMin ? 0.5 : (entry.weight - weightMin) / (weightMax - weightMin);
              const normalizedX = recentWeights.length === 1 ? 0.5 : index / Math.max(recentWeights.length - 1, 1);

              return (
                <View
                  key={entry.id}
                  style={{
                    position: 'absolute',
                    left: `${normalizedX * 100}%`,
                    bottom: 12 + normalizedY * 150,
                    marginLeft: -5,
                    marginBottom: -5,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: colors.accent,
                    borderWidth: 2,
                    borderColor: colors.card,
                  }}
                />
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ color: colors.subtext, fontSize: 10 }}>{recentWeights[0]?.label.split(',')[0] ?? ''}</Text>
            <Text style={{ color: colors.subtext, fontSize: 10 }}>
              {recentWeights.at(-1)?.label.split(',')[0] ?? ''}
            </Text>
          </View>

          <TextInput
            value={draftWeight}
            onChangeText={setDraftWeight}
            keyboardType="decimal-pad"
            placeholder="Log weight"
            placeholderTextColor={colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              marginBottom: 12,
            }}
          />
          <Pressable
            onPress={() => {
              void logWeight();
            }}
            style={{
              borderRadius: 12,
              backgroundColor: colors.accent,
              paddingVertical: 12,
              paddingHorizontal: 14,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Add weight entry</Text>
          </Pressable>
        </SectionCard>

        <SectionCard title="Gym View" emoji={'\u21C4'} colors={colors}>
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
                  <Text
                    style={{
                      color: selected ? 'white' : colors.text,
                      fontSize: 14,
                      fontWeight: '700',
                    }}
                  >
                    {view}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        <SectionCard title="Day Selector" emoji={'\uD83D\uDCCB'} colors={colors}>
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
                  <Text
                    style={{
                      color: selected ? 'white' : colors.text,
                      fontSize: 14,
                      fontWeight: '700',
                    }}
                  >
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </SectionCard>

        {selectedView === 'Workout' ? (
          <>
            <SectionCard title={workout.title} emoji={'\uD83C\uDFCB'} colors={colors}>
              <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 6 }}>
                Focus: <Text style={{ color: colors.text, fontWeight: '700' }}>{workout.focus}</Text>
              </Text>
              <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 14 }}>
                {todayEntry.fullLabel} | {workout.exercises.length} exercises
              </Text>

              {groupedWorkoutExercises.map(([category, exercises]) => (
                <View key={`${selectedDay}-${category}`} style={{ marginBottom: 8 }}>
                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.subtext,
                      fontWeight: '800',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 8,
                    }}
                  >
                    {category}
                  </Text>

                  {exercises.map((exercise) => {
                    const exerciseKey = `${selectedDay}-${exercise.name}`;
                    const exerciseLog = exerciseLogs[exerciseKey];

                    return (
                      <WorkoutExerciseCard
                        key={exerciseKey}
                        onPress={() => {
                          void openExerciseLogger(exercise.name);
                        }}
                        name={exercise.name}
                        sets={exercise.sets}
                        reps={exercise.reps}
                        note={exercise.note}
                        exerciseLog={exerciseLog}
                        colors={colors}
                      />
                    );
                  })}
                </View>
              ))}
            </SectionCard>
          </>
        ) : (
          <>
            <SectionCard title="Exercise Progress" emoji={'\uD83D\uDCCA'} colors={colors}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
                {workout.exercises.map((exercise) => {
                  const selected = exercise.name === progressExerciseName;

                  return (
                    <Pressable
                      key={`${selectedDay}-progress-${exercise.name}`}
                      onPress={async () => {
                        await triggerHaptic();
                        setSelectedProgressExercise((current) => ({
                          ...current,
                          [selectedDay]: exercise.name,
                        }));
                      }}
                      style={{
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 12,
                        backgroundColor: selected ? colors.accent : colors.card,
                        borderWidth: 1,
                        borderColor: selected ? colors.accent : colors.cardBorder,
                        marginRight: 10,
                        marginBottom: 10,
                      }}
                    >
                      <Text
                        style={{
                          color: selected ? 'white' : colors.text,
                          fontSize: 13,
                          fontWeight: '700',
                        }}
                      >
                        {exercise.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={{ fontSize: 16, color: colors.text, fontWeight: '800', marginBottom: 6 }}>
                {progressExerciseName}
              </Text>
              {bestAtTopWeight ? (
                <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 16 }}>
                  Best at top weight across the last ten entries: {bestAtTopWeight.bestReps} reps at{' '}
                  {formatWeight(bestAtTopWeight.topWeight)} lb
                </Text>
              ) : (
                <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 16 }}>
                  No qualifying sets at 6+ reps logged yet. Start logging your current day to build the chart.
                </Text>
              )}

              <View
                style={{
                  flexDirection: isCompact ? 'column' : 'row',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.inputBackground,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>Estimated 1RM</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                    {estimatedOneRepMax ? `${formatWeight(estimatedOneRepMax)} lb` : 'No estimate yet'}
                  </Text>
                </View>
                <View
                  style={{
                    flex: 1,
                    backgroundColor: colors.inputBackground,
                    borderRadius: 12,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ color: colors.subtext, fontSize: 11, marginBottom: 4 }}>PR trend</Text>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>
                    {oneRepMaxTrend === null
                      ? 'Need 2 entries'
                      : `${oneRepMaxTrend >= 0 ? '+' : ''}${formatWeight(oneRepMaxTrend)} lb`}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  minHeight: 180,
                }}
              >
                {progressPoints.map((point) => {
                  const barHeight = Math.max(44, Math.round((point.reps / maxReps) * 140));
                  const isTopWeight = bestAtTopWeight ? point.weight === bestAtTopWeight.topWeight : false;

                  return (
                    <View
                      key={`${selectedDay}-${progressExerciseName}-${point.dateKey}`}
                      style={{ flex: 1, alignItems: 'center' }}
                    >
                      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                        {point.reps} reps
                      </Text>
                      <View
                        style={{
                          width: 28,
                          height: barHeight,
                          borderRadius: 12,
                          backgroundColor: isTopWeight ? colors.accent : colors.success,
                          marginBottom: 8,
                        }}
                      />
                      <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>
                        {point.label}
                      </Text>
                      <Text style={{ color: colors.subtext, fontSize: 10 }}>{formatWeight(point.weight)} lb</Text>
                    </View>
                  );
                })}
              </View>
              {progressPoints.length === 0 ? (
                <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 14 }}>
                  No entries logged yet for this exercise. Save today&apos;s sets, reps, and weight to start the
                  trend line.
                </Text>
              ) : null}
            </SectionCard>

            <SectionCard title="Recent Entries" emoji={'\uD83D\uDD0D'} colors={colors}>
              {[...qualifyingProgressPoints].reverse().map((point) => (
                <View
                  key={`${selectedDay}-detail-${progressExerciseName}-${point.dateKey}`}
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: colors.inputBackground,
                    borderWidth: 1,
                    borderColor: colors.cardBorder,
                  }}
                >
                  <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 }}>
                    {point.label}
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, marginBottom: 2 }}>
                    Best set: {point.reps} reps
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 13, marginBottom: 2 }}>
                    Weight: {formatWeight(point.weight)} lb
                  </Text>
                  <Text style={{ color: colors.subtext, fontSize: 13 }}>Sets logged: {point.sets}</Text>
                  {point.note ? (
                    <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>{point.note}</Text>
                  ) : null}
                </View>
              ))}
              {qualifyingProgressPoints.length === 0 ? (
                <Text style={{ color: colors.subtext, fontSize: 13 }}>
                  No recent entries reached the 6-rep minimum for best-set tracking.
                </Text>
              ) : null}
            </SectionCard>
          </>
        )}

        <SectionCard title="Loop Run Tracker" emoji={'\uD83C\uDFC3'} colors={colors}>
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '800', marginBottom: 4 }}>
            Best time: {bestLoopRun ? formatLoopRunTime(bestLoopRun.timeSeconds) : 'No run logged yet'}
          </Text>
          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 12 }}>
            Total loop runs logged: {lifeData.loopRuns.length}
          </Text>

          <TextInput
            value={draftLoopRun}
            onChangeText={setDraftLoopRun}
            placeholder="8:57 or 537"
            placeholderTextColor={colors.subtext}
            style={{
              borderWidth: 1,
              borderColor: colors.inputBorder,
              borderRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontSize: 15,
              color: colors.text,
              backgroundColor: colors.inputBackground,
              marginBottom: 12,
            }}
          />
          <Pressable
            onPress={() => {
              void logLoopRun();
            }}
            style={{
              borderRadius: 12,
              backgroundColor: colors.accent,
              paddingVertical: 12,
              paddingHorizontal: 14,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800' }}>Log loop run</Text>
          </Pressable>

          {recentLoopRuns.map((run) => (
            <View
              key={run.id}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                backgroundColor: colors.inputBackground,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 2 }}>
                {formatLoopRunTime(run.timeSeconds)}
              </Text>
              <Text style={{ color: colors.subtext, fontSize: 13 }}>{run.label}</Text>
            </View>
          ))}
        </SectionCard>

        {selectedView === 'Workout' ? (
          <SectionCard title="Coaching Insight" emoji={'\uD83C\uDFAF'} colors={colors}>
            <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>{workout.coaching}</Text>
          </SectionCard>
        ) : null}
      </ScrollView>

      <Modal visible={activeExercise !== null} transparent animationType="fade" onRequestClose={closeExerciseLogger}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Pressable
            onPress={closeExerciseLogger}
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
            }}
          />
          {activeExercise ? (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 18,
                  padding: 18,
                  borderWidth: 1,
                  borderColor: colors.cardBorder,
                }}
              >
                <Text style={{ fontSize: 12, color: colors.subtext, textTransform: 'uppercase', marginBottom: 6 }}>
                  Exercise Log
                </Text>
                <Text style={{ fontSize: 22, color: colors.text, fontWeight: '800', marginBottom: 6 }}>
                  {activeExercise.name}
                </Text>
                <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 14 }}>{todayEntry.fullLabel}</Text>

                <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Sets</Text>
                <TextInput
                  value={draftLog.sets}
                  onChangeText={(text) => setDraftLog((current) => ({ ...current, sets: text }))}
                  keyboardType="number-pad"
                  placeholder="4"
                  placeholderTextColor={colors.subtext}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Reps</Text>
                <TextInput
                  value={draftLog.reps}
                  onChangeText={(text) => setDraftLog((current) => ({ ...current, reps: text }))}
                  keyboardType="number-pad"
                  placeholder="8"
                  placeholderTextColor={colors.subtext}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    marginBottom: 12,
                  }}
                />

                <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Weight</Text>
                <TextInput
                  value={draftLog.weight}
                  onChangeText={(text) => setDraftLog((current) => ({ ...current, weight: text }))}
                  keyboardType="decimal-pad"
                  placeholder="185"
                  placeholderTextColor={colors.subtext}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    marginBottom: 16,
                  }}
                />

                <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>Notes</Text>
                <TextInput
                  value={draftLog.note ?? ''}
                  onChangeText={(text) => setDraftLog((current) => ({ ...current, note: text }))}
                  placeholder="How did it feel today?"
                  placeholderTextColor={colors.subtext}
                  multiline
                  style={{
                    borderWidth: 1,
                    borderColor: colors.inputBorder,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: colors.text,
                    backgroundColor: colors.inputBackground,
                    marginBottom: 16,
                    minHeight: 76,
                    textAlignVertical: 'top',
                  }}
                />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <Pressable
                    onPress={closeExerciseLogger}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: colors.inputBackground,
                      borderWidth: 1,
                      borderColor: colors.inputBorder,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: colors.text, fontWeight: '800' }}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void saveExerciseLogger();
                    }}
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: '800' }}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
