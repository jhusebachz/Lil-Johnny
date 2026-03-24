import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import {
  ExerciseProgressPoint,
  GymDay,
  GymView,
  gymMockData,
  gymProgressMockData,
} from '../../data/mockGym';
import { getThemeColors } from '../../data/theme';

const gymDays: GymDay[] = ['Push', 'Pull', 'Legs'];
const gymViews: GymView[] = ['Workout', 'Progress'];

type ExerciseLog = {
  sets: string;
  reps: string;
  weight: string;
};

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
  const { theme, triggerHaptic } = useAppSettings();
  const colors = getThemeColors(theme);
  const [selectedDay, setSelectedDay] = useState<GymDay>('Push');
  const [selectedView, setSelectedView] = useState<GymView>('Workout');
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, ExerciseLog>>({});
  const [exerciseHistory, setExerciseHistory] =
    useState<Record<GymDay, Record<string, ExerciseProgressPoint[]>>>(gymProgressMockData);
  const [activeExerciseKey, setActiveExerciseKey] = useState<string | null>(null);
  const [draftLog, setDraftLog] = useState<ExerciseLog>({ sets: '', reps: '', weight: '' });
  const [selectedProgressExercise, setSelectedProgressExercise] = useState<Record<GymDay, string>>({
    Push: gymMockData.Push.exercises[0].name,
    Pull: gymMockData.Pull.exercises[0].name,
    Legs: gymMockData.Legs.exercises[0].name,
  });
  const workout = gymMockData[selectedDay];
  const progressExerciseName = selectedProgressExercise[selectedDay];
  const rawProgressPoints = exerciseHistory[selectedDay][progressExerciseName] ?? [];
  const progressPoints = [...rawProgressPoints]
    .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
    .slice(-10);
  const qualifyingProgressPoints = progressPoints.filter((point) => point.reps >= 6);
  const maxReps = Math.max(...progressPoints.map((point) => point.reps), 1);
  const todayEntry = getTodayEntryMeta();
  const activeExercise = useMemo(
    () => workout.exercises.find((exercise) => `${selectedDay}-${exercise.name}` === activeExerciseKey) ?? null,
    [activeExerciseKey, selectedDay, workout.exercises]
  );
  const bestAtTopWeight = progressPoints.length > 0 ? getBestAtTopWeight(progressPoints) : null;

  const openExerciseLogger = async (exerciseName: string) => {
    const nextKey = `${selectedDay}-${exerciseName}`;
    await triggerHaptic();
    setDraftLog(exerciseLogs[nextKey] ?? { sets: '', reps: '', weight: '' });
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

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <View
          style={{
            backgroundColor: colors.hero,
            borderRadius: 16,
            padding: 20,
            marginBottom: 18,
          }}
        >
          <Text
            style={{
              color: colors.heroSubtext,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1,
              marginBottom: 6,
            }}
          >
            Training Center
          </Text>
          <Text style={{ color: colors.heroText, fontSize: 26, fontWeight: '800', marginBottom: 10 }}>
            Train with intent
          </Text>
          <Text style={{ color: colors.heroSubtext, fontSize: 15, lineHeight: 22 }}>
            Pick the block for today and keep the workout structure clean, simple, and easy to update.
          </Text>
        </View>

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
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 12 }}>
            Choose the training day you want to run.
          </Text>

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
              <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 10 }}>
                You are logging this {selectedDay.toLowerCase()} session for {todayEntry.fullLabel}.
              </Text>
              <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 20, marginBottom: 14 }}>
                Save today&apos;s actual numbers for each exercise. If you edit the same lift again today, it updates
                today&apos;s entry instead of creating empty chart space.
              </Text>

              {workout.exercises.map((exercise) => {
                const exerciseKey = `${selectedDay}-${exercise.name}`;
                const exerciseLog = exerciseLogs[exerciseKey];

                return (
                  <Pressable
                    key={exerciseKey}
                    onPress={() => {
                      void openExerciseLogger(exercise.name);
                    }}
                    style={{
                      marginBottom: 12,
                      padding: 14,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.cardBorder,
                      backgroundColor: colors.inputBackground,
                    }}
                  >
                    <Text style={{ fontSize: 15, color: colors.text, fontWeight: '800', marginBottom: 4 }}>
                      {exercise.name}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 4 }}>
                      {exercise.sets} sets x {exercise.reps}
                    </Text>
                    <Text style={{ fontSize: 13, color: colors.text, marginBottom: 12 }}>{exercise.note}</Text>
                    {exerciseLog ? (
                      <View
                        style={{
                          backgroundColor: colors.card,
                          borderRadius: 12,
                          padding: 10,
                          marginBottom: 10,
                        }}
                      >
                        <Text
                          style={{ fontSize: 11, color: colors.subtext, textTransform: 'uppercase', marginBottom: 4 }}
                        >
                          Logged for today
                        </Text>
                        <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700' }}>
                          {exerciseLog.sets} sets | {exerciseLog.reps} reps | {exerciseLog.weight} lb
                        </Text>
                      </View>
                    ) : null}
                    <View
                      style={{
                        alignSelf: 'flex-start',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        backgroundColor: colors.accent,
                      }}
                    >
                      <Text style={{ fontSize: 13, color: 'white', fontWeight: '800' }}>
                        {exerciseLog ? 'Update today' : 'Log today'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </SectionCard>

            <SectionCard title="Coaching Insight" emoji={'\uD83C\uDFAF'} colors={colors}>
              <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22 }}>{workout.coaching}</Text>
            </SectionCard>
          </>
        ) : (
          <>
            <SectionCard title="Exercise Progress" emoji={'\uD83D\uDCCA'} colors={colors}>
              <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 14 }}>
                Pick an exercise to see the last ten logged entries for this training day. The chart tracks the most
                recent actual sessions only.
              </Text>

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
                  No qualifying sets at 6+ reps logged yet.
                </Text>
              )}

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
                <Text style={{ fontSize: 13, color: colors.subtext, lineHeight: 20, marginBottom: 14 }}>
                  Enter what you did for {todayEntry.fullLabel}.
                </Text>

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
