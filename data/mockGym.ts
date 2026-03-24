export type GymDay = 'Push' | 'Pull' | 'Legs';
export type GymView = 'Workout' | 'Progress';

type WorkoutExercise = {
  name: string;
  sets: string;
  reps: string;
  note: string;
};

type WorkoutBlock = {
  title: string;
  focus: string;
  coaching: string;
  exercises: WorkoutExercise[];
};

export type ExerciseProgressPoint = {
  dateKey: string;
  label: string;
  sets: number;
  reps: number;
  weight: number;
};

export const gymMockData: Record<GymDay, WorkoutBlock> = {
  Push: {
    title: 'Push Day',
    focus: 'Chest, shoulders, triceps',
    coaching: 'Control the eccentric and keep 1-2 reps in reserve on your main press.',
    exercises: [
      { name: 'Barbell Bench Press', sets: '4', reps: '6-8', note: 'Main strength lift' },
      { name: 'Incline Dumbbell Press', sets: '3', reps: '8-10', note: 'Full stretch at bottom' },
      { name: 'Seated Shoulder Press', sets: '3', reps: '8-10', note: 'Smooth lockout' },
      { name: 'Cable Lateral Raise', sets: '3', reps: '12-15', note: 'Slow and controlled' },
      { name: 'Rope Pressdown', sets: '3', reps: '10-12', note: 'Hard triceps squeeze' },
    ],
  },
  Pull: {
    title: 'Pull Day',
    focus: 'Back, rear delts, biceps',
    coaching: 'Start each rep by pulling through the elbows instead of yanking with the hands.',
    exercises: [
      { name: 'Weighted Pull-Up', sets: '4', reps: '5-8', note: 'Full hang each rep' },
      { name: 'Chest-Supported Row', sets: '3', reps: '8-10', note: 'Pause at contraction' },
      { name: 'Lat Pulldown', sets: '3', reps: '10-12', note: 'Drive elbows down' },
      { name: 'Face Pull', sets: '3', reps: '12-15', note: 'Rear delt focus' },
      { name: 'EZ Bar Curl', sets: '3', reps: '10-12', note: 'No swinging' },
    ],
  },
  Legs: {
    title: 'Legs Day',
    focus: 'Quads, hamstrings, glutes, calves',
    coaching: 'Keep the first compound lift crisp, then chase volume on accessories.',
    exercises: [
      { name: 'Back Squat', sets: '4', reps: '5-8', note: 'Brace hard before descent' },
      { name: 'Romanian Deadlift', sets: '3', reps: '8-10', note: 'Stretch hamstrings' },
      { name: 'Leg Press', sets: '3', reps: '10-12', note: 'Controlled depth' },
      { name: 'Walking Lunge', sets: '3', reps: '12/leg', note: 'Long stride, steady pace' },
      { name: 'Standing Calf Raise', sets: '4', reps: '12-15', note: 'Pause at top and bottom' },
    ],
  },
};

export const gymProgressMockData: Record<GymDay, Record<string, ExerciseProgressPoint[]>> = {
  Push: {
    'Barbell Bench Press': [
      { dateKey: '2026-02-24', label: 'Feb 24', sets: 4, reps: 6, weight: 185 },
      { dateKey: '2026-02-28', label: 'Feb 28', sets: 4, reps: 7, weight: 190 },
      { dateKey: '2026-03-03', label: 'Mar 3', sets: 4, reps: 6, weight: 195 },
      { dateKey: '2026-03-07', label: 'Mar 7', sets: 4, reps: 7, weight: 195 },
    ],
    'Incline Dumbbell Press': [
      { dateKey: '2026-02-24', label: 'Feb 24', sets: 3, reps: 9, weight: 65 },
      { dateKey: '2026-02-28', label: 'Feb 28', sets: 3, reps: 10, weight: 65 },
      { dateKey: '2026-03-03', label: 'Mar 3', sets: 3, reps: 8, weight: 70 },
      { dateKey: '2026-03-07', label: 'Mar 7', sets: 3, reps: 9, weight: 70 },
    ],
    'Seated Shoulder Press': [
      { dateKey: '2026-02-24', label: 'Feb 24', sets: 3, reps: 8, weight: 55 },
      { dateKey: '2026-02-28', label: 'Feb 28', sets: 3, reps: 9, weight: 55 },
      { dateKey: '2026-03-03', label: 'Mar 3', sets: 3, reps: 8, weight: 60 },
      { dateKey: '2026-03-07', label: 'Mar 7', sets: 3, reps: 9, weight: 60 },
    ],
    'Cable Lateral Raise': [
      { dateKey: '2026-02-24', label: 'Feb 24', sets: 3, reps: 12, weight: 15 },
      { dateKey: '2026-02-28', label: 'Feb 28', sets: 3, reps: 13, weight: 15 },
      { dateKey: '2026-03-03', label: 'Mar 3', sets: 3, reps: 12, weight: 17.5 },
      { dateKey: '2026-03-07', label: 'Mar 7', sets: 3, reps: 13, weight: 17.5 },
    ],
    'Rope Pressdown': [
      { dateKey: '2026-02-24', label: 'Feb 24', sets: 3, reps: 10, weight: 55 },
      { dateKey: '2026-02-28', label: 'Feb 28', sets: 3, reps: 11, weight: 55 },
      { dateKey: '2026-03-03', label: 'Mar 3', sets: 3, reps: 10, weight: 60 },
      { dateKey: '2026-03-07', label: 'Mar 7', sets: 3, reps: 11, weight: 60 },
    ],
  },
  Pull: {
    'Weighted Pull-Up': [
      { dateKey: '2026-02-25', label: 'Feb 25', sets: 4, reps: 5, weight: 45 },
      { dateKey: '2026-03-01', label: 'Mar 1', sets: 4, reps: 6, weight: 45 },
      { dateKey: '2026-03-04', label: 'Mar 4', sets: 4, reps: 5, weight: 50 },
      { dateKey: '2026-03-08', label: 'Mar 8', sets: 4, reps: 6, weight: 50 },
    ],
    'Chest-Supported Row': [
      { dateKey: '2026-02-25', label: 'Feb 25', sets: 3, reps: 8, weight: 80 },
      { dateKey: '2026-03-01', label: 'Mar 1', sets: 3, reps: 9, weight: 80 },
      { dateKey: '2026-03-04', label: 'Mar 4', sets: 3, reps: 8, weight: 85 },
      { dateKey: '2026-03-08', label: 'Mar 8', sets: 3, reps: 9, weight: 85 },
    ],
    'Lat Pulldown': [
      { dateKey: '2026-02-25', label: 'Feb 25', sets: 3, reps: 10, weight: 120 },
      { dateKey: '2026-03-01', label: 'Mar 1', sets: 3, reps: 11, weight: 120 },
      { dateKey: '2026-03-04', label: 'Mar 4', sets: 3, reps: 10, weight: 130 },
      { dateKey: '2026-03-08', label: 'Mar 8', sets: 3, reps: 11, weight: 130 },
    ],
    'Face Pull': [
      { dateKey: '2026-02-25', label: 'Feb 25', sets: 3, reps: 12, weight: 35 },
      { dateKey: '2026-03-01', label: 'Mar 1', sets: 3, reps: 13, weight: 35 },
      { dateKey: '2026-03-04', label: 'Mar 4', sets: 3, reps: 12, weight: 40 },
      { dateKey: '2026-03-08', label: 'Mar 8', sets: 3, reps: 13, weight: 40 },
    ],
    'EZ Bar Curl': [
      { dateKey: '2026-02-25', label: 'Feb 25', sets: 3, reps: 10, weight: 60 },
      { dateKey: '2026-03-01', label: 'Mar 1', sets: 3, reps: 11, weight: 60 },
      { dateKey: '2026-03-04', label: 'Mar 4', sets: 3, reps: 10, weight: 65 },
      { dateKey: '2026-03-08', label: 'Mar 8', sets: 3, reps: 11, weight: 65 },
    ],
  },
  Legs: {
    'Back Squat': [
      { dateKey: '2026-02-26', label: 'Feb 26', sets: 4, reps: 5, weight: 245 },
      { dateKey: '2026-03-02', label: 'Mar 2', sets: 4, reps: 6, weight: 245 },
      { dateKey: '2026-03-05', label: 'Mar 5', sets: 4, reps: 5, weight: 255 },
      { dateKey: '2026-03-09', label: 'Mar 9', sets: 4, reps: 6, weight: 255 },
    ],
    'Romanian Deadlift': [
      { dateKey: '2026-02-26', label: 'Feb 26', sets: 3, reps: 8, weight: 185 },
      { dateKey: '2026-03-02', label: 'Mar 2', sets: 3, reps: 9, weight: 185 },
      { dateKey: '2026-03-05', label: 'Mar 5', sets: 3, reps: 8, weight: 195 },
      { dateKey: '2026-03-09', label: 'Mar 9', sets: 3, reps: 9, weight: 195 },
    ],
    'Leg Press': [
      { dateKey: '2026-02-26', label: 'Feb 26', sets: 3, reps: 10, weight: 405 },
      { dateKey: '2026-03-02', label: 'Mar 2', sets: 3, reps: 11, weight: 405 },
      { dateKey: '2026-03-05', label: 'Mar 5', sets: 3, reps: 10, weight: 450 },
      { dateKey: '2026-03-09', label: 'Mar 9', sets: 3, reps: 11, weight: 450 },
    ],
    'Walking Lunge': [
      { dateKey: '2026-02-26', label: 'Feb 26', sets: 3, reps: 12, weight: 35 },
      { dateKey: '2026-03-02', label: 'Mar 2', sets: 3, reps: 13, weight: 35 },
      { dateKey: '2026-03-05', label: 'Mar 5', sets: 3, reps: 12, weight: 40 },
      { dateKey: '2026-03-09', label: 'Mar 9', sets: 3, reps: 13, weight: 40 },
    ],
    'Standing Calf Raise': [
      { dateKey: '2026-02-26', label: 'Feb 26', sets: 4, reps: 12, weight: 140 },
      { dateKey: '2026-03-02', label: 'Mar 2', sets: 4, reps: 13, weight: 140 },
      { dateKey: '2026-03-05', label: 'Mar 5', sets: 4, reps: 12, weight: 150 },
      { dateKey: '2026-03-09', label: 'Mar 9', sets: 4, reps: 13, weight: 150 },
    ],
  },
};
