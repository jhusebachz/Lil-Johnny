import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type GymDay = 'Push' | 'Pull' | 'Legs';
export type GymView = 'Workout' | 'Progress';

export type WorkoutExercise = {
  name: string;
  category?: string;
  sets: string;
  reps: string;
  note?: string;
};

export type WorkoutBlock = {
  title: string;
  focus: string;
  coaching: string;
  exercises: WorkoutExercise[];
};

export type ExerciseProgressPoint = {
  dateKey: string;
  label: string;
  setEntries: ExerciseSet[];
  note?: string;
};

export type ExerciseSet = {
  reps: number;
  weight: number;
};

export type ExerciseDraftSet = {
  id: string;
  reps: string;
  weight: string;
};

export type ExerciseLog = {
  setEntries: ExerciseDraftSet[];
  note?: string;
};

export type GymExerciseHistory = Record<GymDay, Record<string, ExerciseProgressPoint[]>>;

export type PersistedGymData = {
  exerciseLogs: Record<string, ExerciseLog>;
  exerciseHistory: GymExerciseHistory;
};

const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}lil-johnny-gym.json`;
const WEB_STORAGE_KEY = 'lil-johnny-gym';
const EXERCISE_ALIASES: Partial<Record<GymDay, Record<string, string>>> = {
  Push: {
    'Barbell Bench Press': 'Barbell Bench Press (Flat)',
    'Incline Dumbbell Press': 'Incline Dumbbell Bench Press',
    'Seated Shoulder Press': 'Machine Shoulder Press (Military Press)',
    'Cable Lateral Raise': 'Dumbbell Lateral Raise',
    'Rope Pressdown': 'Cable Triceps Pushdown',
  },
  Pull: {
    'Weighted Pull-Up': 'Pull-Ups / Chin-Ups',
    'Face Pull': 'Rear Delt Cable Face Pull',
    'EZ Bar Curl': 'Barbell Curl',
  },
  Legs: {
    'Back Squat': 'Smith Machine Squats',
    'Romanian Deadlift': 'Deadlift',
    'Standing Calf Raise': 'Calf Raise',
  },
};

function exercise(
  name: string,
  category: string,
  sets: string,
  reps: string,
  note?: string
): WorkoutExercise {
  return { name, category, sets, reps, note };
}

function createDraftSetId() {
  return `set-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDraftExerciseSet(
  initial: Partial<Pick<ExerciseDraftSet, 'reps' | 'weight'>> = {}
): ExerciseDraftSet {
  return {
    id: createDraftSetId(),
    reps: initial.reps ?? '',
    weight: initial.weight ?? '',
  };
}

export function createEmptyExerciseLog(): ExerciseLog {
  return {
    setEntries: [createDraftExerciseSet()],
    note: '',
  };
}

export const gymWorkoutTemplates: Record<GymDay, WorkoutBlock> = {
  Push: {
    title: 'Push Day',
    focus: 'Chest, shoulders, triceps',
    coaching: 'Control the eccentric and keep 1-2 reps in reserve on your main press.',
    exercises: [
      exercise('Barbell Bench Press (Flat)', 'Pressing', '4', '5-8', 'Main flat press'),
      exercise('Barbell Bench Press (Incline)', 'Pressing', '4', '5-8'),
      exercise('Close-Grip Bench Press (Flat)', 'Pressing', '3', '6-8'),
      exercise('Incline Dumbbell Bench Press', 'Pressing', '3', '8-10'),
      exercise('Machine Shoulder Press (Military Press)', 'Pressing', '3', '8-10'),
      exercise('Chest Press Machine', 'Pressing', '3', '8-10'),
      exercise('Triceps Dips', 'Pressing', '3', '6-10'),
      exercise('Push-Ups', 'Pressing', '2', 'AMRAP'),
      exercise('Dual Cable Crossover', 'Chest Isolation', '3', '12-15'),
      exercise('Dumbbell Chest Fly', 'Chest Isolation', '3', '10-15'),
      exercise('Cable Triceps Pushdown', 'Triceps', '3', '10-15'),
      exercise('Dumbbell Lateral Raise', 'Delts', '3', '12-20'),
      exercise('Shoulder Internal/External Rotation', 'Shoulder Health', '2', '12-20'),
    ],
  },
  Pull: {
    title: 'Pull Day',
    focus: 'Back, rear delts, biceps',
    coaching: 'Start each rep by pulling through the elbows instead of yanking with the hands.',
    exercises: [
      exercise('Pull-Ups / Chin-Ups', 'Vertical Pull', '4', '5-10'),
      exercise('Deadlift', 'Posterior Chain', '3', '3-6'),
      exercise('Chest-Supported Row', 'Rows', '3', '8-10'),
      exercise('Lat Pulldown', 'Vertical Pull', '3', '8-12'),
      exercise('Upright Barbell Row', 'Upper Back', '3', '8-12'),
      exercise('Upright Cable Row', 'Upper Back', '3', '10-12'),
      exercise('Rear Delt Cable Face Pull', 'Rear Delts', '3', '12-15'),
      exercise('Barbell Curl', 'Biceps', '3', '8-12'),
      exercise('Preacher Curl', 'Biceps', '3', '10-12'),
      exercise('Cable Biceps Curl', 'Biceps', '3', '10-15'),
      exercise('Bayesian Cable Curl', 'Biceps', '3', '10-15'),
      exercise('Cable 45-Degree Raise', 'Rear Delts', '3', '12-20'),
      exercise('Back Extension', 'Posterior Chain', '3', '10-15'),
    ],
  },
  Legs: {
    title: 'Legs Day',
    focus: 'Quads, hamstrings, glutes, calves',
    coaching: 'Keep the first compound lift crisp, then chase volume on accessories.',
    exercises: [
      exercise('Smith Machine Squats', 'Squat Pattern', '4', '5-8'),
      exercise('Leg Press', 'Squat Pattern', '3', '10-12'),
      exercise('Bodyweight Squats', 'Squat Pattern', '2', 'AMRAP'),
      exercise('Leg Curl', 'Hamstrings', '3', '10-15'),
      exercise('Leg Extension', 'Quads', '3', '10-15'),
      exercise('Hip Adduction Machine (pushing inward)', 'Hip Machines', '3', '12-20'),
      exercise('Hip Abduction Machine (pushing outward)', 'Hip Machines', '3', '12-20'),
      exercise('Calf Raise', 'Calves', '4', '12-20'),
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

export function getLoggedGymDateKeys(exerciseHistory?: GymExerciseHistory | null) {
  const loggedDateKeys = new Set<string>();

  Object.values(exerciseHistory ?? {}).forEach((dayHistory) => {
    Object.values(dayHistory).forEach((points) => {
      points.forEach((point) => {
        // One saved exercise entry is enough to count that calendar day as a gym day.
        loggedDateKeys.add(point.dateKey);
      });
    });
  });

  return [...loggedDateKeys];
}

function normalizeExerciseName(day: GymDay, name: string) {
  return EXERCISE_ALIASES[day]?.[name] ?? name;
}

function createRepeatedSetEntries(setCount: number, reps: number, weight: number) {
  const count = Math.max(1, Math.round(setCount || 1));
  return Array.from({ length: count }, () => ({ reps, weight }));
}

function normalizeProgressPoint(point: any): ExerciseProgressPoint | null {
  const normalizedSetEntries = Array.isArray(point?.setEntries)
    ? point.setEntries
        .map((setEntry: any) => {
          const reps = Number(setEntry?.reps);
          const weight = Number(setEntry?.weight);

          if (!Number.isFinite(reps) || reps <= 0 || !Number.isFinite(weight) || weight <= 0) {
            return null;
          }

          return { reps, weight };
        })
        .filter(Boolean) as ExerciseSet[]
    : [];

  if (normalizedSetEntries.length > 0) {
    return {
      dateKey: point.dateKey,
      label: point.label,
      setEntries: normalizedSetEntries,
      note: point.note,
    };
  }

  const reps = Number(point?.reps);
  const weight = Number(point?.weight);
  const setCount = Number(point?.sets);

  if (!Number.isFinite(reps) || reps <= 0 || !Number.isFinite(weight) || weight <= 0) {
    return null;
  }

  return {
    dateKey: point.dateKey,
    label: point.label,
    setEntries: createRepeatedSetEntries(setCount, reps, weight),
    note: point.note,
  };
}

function normalizeExerciseLog(value: any): ExerciseLog {
  const setEntries = Array.isArray(value?.setEntries)
    ? value.setEntries
        .map((setEntry: any) => ({
          id: typeof setEntry?.id === 'string' ? setEntry.id : createDraftSetId(),
          reps: typeof setEntry?.reps === 'string' ? setEntry.reps : String(setEntry?.reps ?? ''),
          weight: typeof setEntry?.weight === 'string' ? setEntry.weight : String(setEntry?.weight ?? ''),
        }))
        .filter((setEntry: ExerciseDraftSet) => setEntry.reps.trim() || setEntry.weight.trim())
    : [];

  if (setEntries.length > 0) {
    return {
      setEntries,
      note: typeof value?.note === 'string' ? value.note : '',
    };
  }

  const reps = value?.reps;
  const weight = value?.weight;
  const setCount = Number(value?.sets);

  if ((reps ?? '').toString().trim() || (weight ?? '').toString().trim()) {
    return {
      setEntries: Array.from({ length: Math.max(1, Math.round(setCount || 1)) }, () =>
        createDraftExerciseSet({
          reps: String(reps ?? ''),
          weight: String(weight ?? ''),
        })
      ),
      note: typeof value?.note === 'string' ? value.note : '',
    };
  }

  return createEmptyExerciseLog();
}

function normalizePersistedGymData(data: PersistedGymData): PersistedGymData {
  const exerciseHistory = createEmptyGymProgressHistory();

  (Object.keys(data.exerciseHistory ?? {}) as GymDay[]).forEach((day) => {
    const dayHistory = data.exerciseHistory?.[day] ?? {};

    Object.entries(dayHistory).forEach(([exerciseName, points]) => {
      const normalizedName = normalizeExerciseName(day, exerciseName);
      const existing = exerciseHistory[day][normalizedName] ?? [];
      const normalizedPoints = Array.isArray(points)
        ? points.map((point) => normalizeProgressPoint(point)).filter(Boolean) as ExerciseProgressPoint[]
        : [];
      exerciseHistory[day][normalizedName] = [...existing, ...normalizedPoints];
    });
  });

  const exerciseLogs = Object.fromEntries(
    Object.entries(data.exerciseLogs ?? {}).map(([key, value]) => {
      const separatorIndex = key.indexOf('-');

      if (separatorIndex <= 0) {
        return [key, value];
      }

      const day = key.slice(0, separatorIndex) as GymDay;
      const exerciseName = key.slice(separatorIndex + 1);
      const normalizedName = normalizeExerciseName(day, exerciseName);

      return [`${day}-${normalizedName}`, normalizeExerciseLog(value)];
    })
  );

  return {
    exerciseLogs,
    exerciseHistory,
  };
}

export async function readPersistedGymData(): Promise<PersistedGymData | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? normalizePersistedGymData(JSON.parse(raw) as PersistedGymData) : null;
  }

  const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);

  if (!fileInfo.exists) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);
  return raw.trim() ? normalizePersistedGymData(JSON.parse(raw) as PersistedGymData) : null;
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
