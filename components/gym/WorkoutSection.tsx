import { Text, View } from 'react-native';

import { ExerciseLog, GymDay, WorkoutExercise, WorkoutBlock } from '../../data/gymData';
import { ThemeColors } from '../../data/theme';
import SectionCard from '../SectionCard';
import WorkoutExerciseCard from './WorkoutExerciseCard';

type WorkoutSectionProps = {
  colors: ThemeColors;
  exerciseLogs: Record<string, ExerciseLog>;
  groupedWorkoutExercises: [string, WorkoutExercise[]][];
  selectedDay: GymDay;
  todayLabel: string;
  workout: WorkoutBlock;
  onExercisePress: (exerciseName: string) => void;
};

export default function WorkoutSection({
  colors,
  exerciseLogs,
  groupedWorkoutExercises,
  selectedDay,
  todayLabel,
  workout,
  onExercisePress,
}: WorkoutSectionProps) {
  return (
    <SectionCard title={workout.title} emoji={'🏋'} colors={colors}>
      <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 12 }}>
        {workout.focus} • {todayLabel} • {workout.exercises.length} exercises
      </Text>

      {groupedWorkoutExercises.map(([category, exercises]) => (
        <View key={`${selectedDay}-${category}`} style={{ marginBottom: 6 }}>
          <Text
            style={{
              fontSize: 11,
              color: colors.subtext,
              fontWeight: '800',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 6,
            }}
          >
            {category}
          </Text>

          {exercises.map((exercise) => {
            const exerciseKey = `${selectedDay}-${exercise.name}`;

            return (
              <WorkoutExerciseCard
                key={exerciseKey}
                onPress={() => onExercisePress(exercise.name)}
                name={exercise.name}
                sets={exercise.sets}
                reps={exercise.reps}
                note={exercise.note}
                exerciseLog={exerciseLogs[exerciseKey]}
                colors={colors}
              />
            );
          })}
        </View>
      ))}
    </SectionCard>
  );
}
