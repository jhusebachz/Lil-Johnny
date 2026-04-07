import { Pressable, Text, View } from 'react-native';

import { GymDay, WorkoutBlock } from '../../data/gymData';
import { ThemeColors } from '../../data/theme';
import SectionCard from '../SectionCard';

type ProgressSummary = {
  point: {
    dateKey: string;
    label: string;
    note?: string;
  };
  setCount: number;
  bestSet: { reps: number; weight: number } | null;
  qualifyingSet: { reps: number; weight: number } | null;
};

type ExerciseProgressSectionProps = {
  bestAtTopWeight: { topWeight: number; bestReps: number } | null;
  colors: ThemeColors;
  estimatedOneRepMax: number | null;
  formatWeight: (weight: number) => string;
  isCompact: boolean;
  maxReps: number;
  oneRepMaxTrend: number | null;
  progressExerciseName: string;
  progressPointSummaries: ProgressSummary[];
  qualifyingProgressPoints: ProgressSummary[];
  selectedDay: GymDay;
  workout: WorkoutBlock;
  onExerciseSelect: (exerciseName: string) => void;
};

export default function ExerciseProgressSection({
  bestAtTopWeight,
  colors,
  estimatedOneRepMax,
  formatWeight,
  isCompact,
  maxReps,
  oneRepMaxTrend,
  progressExerciseName,
  progressPointSummaries,
  qualifyingProgressPoints,
  selectedDay,
  workout,
  onExerciseSelect,
}: ExerciseProgressSectionProps) {
  return (
    <>
      <SectionCard title="Exercise Progress" emoji={'\uD83D\uDCCA'} colors={colors}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {workout.exercises.map((exercise) => {
            const selected = exercise.name === progressExerciseName;

            return (
              <Pressable
                key={`${selectedDay}-progress-${exercise.name}`}
                onPress={() => onExerciseSelect(exercise.name)}
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
                <Text style={{ color: selected ? 'white' : colors.text, fontSize: 13, fontWeight: '700' }}>
                  {exercise.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={{ fontSize: 16, color: colors.text, fontWeight: '800', marginBottom: 6 }}>{progressExerciseName}</Text>
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
              {oneRepMaxTrend === null ? 'Need 2 entries' : `${oneRepMaxTrend >= 0 ? '+' : ''}${formatWeight(oneRepMaxTrend)} lb`}
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
          {progressPointSummaries.map((summary) => {
            if (!summary.bestSet) {
              return null;
            }

            const barHeight = Math.max(44, Math.round((summary.bestSet.reps / maxReps) * 140));
            const isTopWeight = bestAtTopWeight ? summary.qualifyingSet?.weight === bestAtTopWeight.topWeight : false;

            return (
              <View key={`${selectedDay}-${progressExerciseName}-${summary.point.dateKey}`} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>
                  {summary.bestSet.reps} reps
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
                <Text style={{ color: colors.subtext, fontSize: 11, fontWeight: '700', marginBottom: 4 }}>{summary.point.label}</Text>
                <Text style={{ color: colors.subtext, fontSize: 10 }}>{formatWeight(summary.bestSet.weight)} lb</Text>
              </View>
            );
          })}
        </View>
        {progressPointSummaries.length === 0 ? (
          <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 14 }}>
            No entries logged yet for this exercise. Save today&apos;s sets to start the trend line.
          </Text>
        ) : null}
      </SectionCard>

      <SectionCard title="Recent Entries" emoji={'\uD83D\uDD0D'} colors={colors}>
        {[...qualifyingProgressPoints].reverse().map((summary) => (
          <View
            key={`${selectedDay}-detail-${progressExerciseName}-${summary.point.dateKey}`}
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.inputBackground,
              borderWidth: 1,
              borderColor: colors.cardBorder,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', marginBottom: 4 }}>{summary.point.label}</Text>
            <Text style={{ color: colors.subtext, fontSize: 13, marginBottom: 2 }}>
              Best set: {summary.qualifyingSet?.reps} reps
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 13, marginBottom: 2 }}>
              Weight: {formatWeight(summary.qualifyingSet?.weight ?? 0)} lb
            </Text>
            <Text style={{ color: colors.subtext, fontSize: 13 }}>Sets logged: {summary.setCount}</Text>
            {summary.point.note ? <Text style={{ color: colors.subtext, fontSize: 13, marginTop: 4 }}>{summary.point.note}</Text> : null}
          </View>
        ))}
        {qualifyingProgressPoints.length === 0 ? (
          <Text style={{ color: colors.subtext, fontSize: 13 }}>No recent entries reached the 6-rep minimum for best-set tracking.</Text>
        ) : null}
      </SectionCard>
    </>
  );
}
