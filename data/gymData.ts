import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

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
  note?: string;
};

export type ExerciseLog = {
  sets: string;
  reps: string;
  weight: string;
  note?: string;
};

export type GymExerciseHistory = Record<GymDay, Record<string, ExerciseProgressPoint[]>>;

type PersistedGymData = {
  exerciseLogs: Record<string, ExerciseLog>;
  exerciseHistory: GymExerciseHistory;
};

const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}lil-johnny-gym.json`;
const WEB_STORAGE_KEY = 'lil-johnny-gym';

export const gymWorkoutTemplates: Record<GymDay, WorkoutBlock> = {
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

export function createEmptyGymProgressHistory(): GymExerciseHistory {
  return {
    Push: Object.fromEntries(gymWorkoutTemplates.Push.exercises.map((exercise) => [exercise.name, []])),
    Pull: Object.fromEntries(gymWorkoutTemplates.Pull.exercises.map((exercise) => [exercise.name, []])),
    Legs: Object.fromEntries(gymWorkoutTemplates.Legs.exercises.map((exercise) => [exercise.name, []])),
  };
}

export async function readPersistedGymData(): Promise<PersistedGymData | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedGymData) : null;
  }

  const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);

  if (!fileInfo.exists) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);
  return raw.trim() ? (JSON.parse(raw) as PersistedGymData) : null;
}

export async function writePersistedGymData(data: PersistedGymData) {
  const raw = JSON.stringify(data);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_STORAGE_KEY, raw);
    }
    return;
  }

  await FileSystem.writeAsStringAsync(STORAGE_FILE, raw);
}
