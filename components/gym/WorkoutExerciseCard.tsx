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
  return (
    <Pressable
      onPress={onPress}
      style={{
        marginBottom: 10,
        padding: 12,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.inputBackground,
      }}
    >
      <Text style={{ fontSize: 15, color: colors.text, fontWeight: '800', marginBottom: 4 }}>{name}</Text>
      <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: note ? 4 : 10 }}>
        {sets} sets x {reps}
      </Text>
      {note ? <Text style={{ fontSize: 12, color: colors.text, marginBottom: 10 }}>{note}</Text> : null}
      {exerciseLog ? (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 10,
            marginBottom: 10,
          }}
        >
          <Text style={{ fontSize: 11, color: colors.subtext, textTransform: 'uppercase', marginBottom: 4 }}>
            Logged for today
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, fontWeight: '700' }}>
            {exerciseLog.sets} sets | {exerciseLog.reps} reps | {exerciseLog.weight} lb
          </Text>
          {exerciseLog.note ? (
            <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 6 }}>{exerciseLog.note}</Text>
          ) : null}
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
}
