import { Pressable, Text, View } from 'react-native';
import { ExerciseLog } from '../../data/gymData';
import { ThemeColors } from '../../data/theme';

type WorkoutExerciseCardProps = {
  name: string;
  sets: string;
  reps: string;
  note?: string;
  exerciseLog?: ExerciseLog;
  colors: ThemeColors;
  onPress: () => void;
};

export default function WorkoutExerciseCard({
  name,
  sets,
  reps,
  note,
  exerciseLog,
  colors,
  onPress,
}: WorkoutExerciseCardProps) {
  const loggedSets = exerciseLog?.setEntries.filter((setEntry) => setEntry.reps.trim() && setEntry.weight.trim()) ?? [];
  const topLoggedSet =
    loggedSets.length > 0
      ? loggedSets.reduce((best, current) => {
          const currentWeight = Number(current.weight);
          const bestWeight = Number(best.weight);

          if (currentWeight > bestWeight) {
            return current;
          }

          if (currentWeight === bestWeight && Number(current.reps) > Number(best.reps)) {
            return current;
          }

          return best;
        }, loggedSets[0])
      : null;

  return (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.inputBackground,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <View
          style={{
            flex: 1,
          }}
        >
          <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 3 }}>{name}</Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: note ? 3 : loggedSets.length ? 3 : 0 }}>
            {sets} x {reps}
          </Text>
          {note ? (
            <Text numberOfLines={1} style={{ fontSize: 11, color: colors.subtext, marginBottom: loggedSets.length ? 3 : 0 }}>
              {note}
            </Text>
          ) : null}
          {exerciseLog ? (
            <Text style={{ fontSize: 11, color: colors.text }}>
              {loggedSets.length > 0
                ? `${loggedSets.length} set${loggedSets.length === 1 ? '' : 's'} • top ${topLoggedSet?.weight} x ${topLoggedSet?.reps}`
                : exerciseLog.note
                  ? 'Note saved for today'
                  : 'Ready to log'}
            </Text>
          ) : null}
        </View>

        <View
          style={{
            alignSelf: 'center',
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 10,
            backgroundColor: colors.accent,
            minWidth: 64,
          }}
        >
          <Text style={{ fontSize: 12, color: 'white', fontWeight: '800', textAlign: 'center' }}>
            {exerciseLog ? 'Edit' : 'Log'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
