import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type CertificationTracker = {
  id: string;
  name: string;
  chapterCount: number;
  chaptersCompleted: number;
  startDate?: string;
  examDate?: string;
  studyGuide?: string;
};

export type StudyLogEntry = {
  id: string;
  certId: string;
  dateKey: string;
  label: string;
  chapters: number;
  note?: string;
};

export type ChapterPracticeScore = {
  id: string;
  certId: string;
  chapterNumber: number;
  score: number;
  dateKey: string;
  label: string;
  note?: string;
};

export type AvoidanceGoal = {
  id: string;
  title: string;
  type: 'avoidance';
  startedAt: string;
  lastFailureDate?: string | null;
  bestStreakDays?: number;
};

type LegacyDailyCheckGoal = {
  id: string;
  title: string;
  type: 'daily-check';
  completedDates: string[];
};

export type YearGoal = AvoidanceGoal;

export type WeightEntry = {
  id: string;
  dateKey: string;
  label: string;
  weight: number;
};

export type LoopRunEntry = {
  id: string;
  dateKey: string;
  label: string;
  timeSeconds: number;
};

export type DiyTask = {
  id: string;
  title: string;
  note?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string | null;
};

export type LifeTrackerData = {
  certifications: CertificationTracker[];
  studyLogs: StudyLogEntry[];
  chapterPracticeScores: ChapterPracticeScore[];
  goals2026: YearGoal[];
  weightEntries: WeightEntry[];
  loopRuns: LoopRunEntry[];
  diyTasks: DiyTask[];
};

const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}lil-johnny-life-trackers.json`;
const WEB_STORAGE_KEY = 'lil-johnny-life-trackers';
export const TRACKER_BASELINE_DATE = '2026-03-28';
export const AVOIDANCE_STREAK_START_DATE = '2026-04-08';
export const GOAL_WEIGHT_LB = 185;
export const STARTING_WEIGHT_LB = 205;
export const WEIGHT_GOAL_TARGET_DATE = '2026-12-31';
export const WEEKLY_GYM_TARGET_DAYS = [3, 4, 5] as const;

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const defaultLifeTrackerData: LifeTrackerData = {
  certifications: [
    {
      id: 'linux-plus',
      name: 'Linux+',
      chapterCount: 26,
      chaptersCompleted: 0,
      startDate: '2026-06-20',
      examDate: '2026-09-15',
      studyGuide: 'Sybex Linux+ Study Guide (XK0-006, 6th Edition)',
    },
    {
      id: 'pentest-plus',
      name: 'PenTest+',
      chapterCount: 12,
      chaptersCompleted: 0,
      startDate: '2026-10-15',
      examDate: '2026-12-15',
      studyGuide: 'Sybex PenTest+ Study Guide (PT0-003, 3rd Edition)',
    },
    {
      id: 'cloud-plus',
      name: 'Cloud+',
      chapterCount: 10,
      chaptersCompleted: 0,
      startDate: '2027-01-15',
      examDate: '2027-03-15',
      studyGuide: 'Sybex Cloud+ Study Guide (CV0-004, 4th Edition)',
    },
  ],
  studyLogs: [],
  chapterPracticeScores: [],
  goals2026: [
    { id: 'alcohol', title: 'No alcohol', type: 'avoidance', startedAt: AVOIDANCE_STREAK_START_DATE, lastFailureDate: null, bestStreakDays: 0 },
    { id: 'stretching', title: 'Stretching daily', type: 'avoidance', startedAt: AVOIDANCE_STREAK_START_DATE, lastFailureDate: null, bestStreakDays: 0 },
    { id: 'fast-food', title: 'No fast food', type: 'avoidance', startedAt: AVOIDANCE_STREAK_START_DATE, lastFailureDate: null, bestStreakDays: 0 },
    { id: 'coffee', title: 'No coffees purchased', type: 'avoidance', startedAt: AVOIDANCE_STREAK_START_DATE, lastFailureDate: null, bestStreakDays: 0 },
    { id: 'soda', title: 'Only one Zero Sugar soda', type: 'avoidance', startedAt: AVOIDANCE_STREAK_START_DATE, lastFailureDate: null, bestStreakDays: 0 },
  ],
  weightEntries: [
    {
      id: 'weight-baseline-2026',
      dateKey: TRACKER_BASELINE_DATE,
      label: formatDateKey(TRACKER_BASELINE_DATE),
      weight: STARTING_WEIGHT_LB,
    },
  ],
  loopRuns: [],
  diyTasks: [
    {
      id: 'diy-1',
      title: 'Walk the house and build the first real DIY list',
      note: 'Use this to seed the tracker with actual projects.',
      completed: false,
      createdAt: TRACKER_BASELINE_DATE,
      completedAt: null,
    },
  ],
};

export function getTodayDateKey(date = new Date()) {
  return toLocalDateKey(date);
}

export function getRelativeDateKey(offsetDays: number, date = new Date()) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + offsetDays);
  return toLocalDateKey(nextDate);
}

export function formatTrackerDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatMonthDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateKey(dateKey: string) {
  return formatTrackerDate(new Date(`${dateKey}T12:00:00`));
}

export function formatFullDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatLongDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function getGreetingForTime(date = new Date()) {
  return date.getHours() < 12 ? 'Good morning' : 'Good evening';
}

export function formatLoopRunTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function getAvoidanceStreak(goal: AvoidanceGoal, now = new Date()) {
  const anchor = goal.lastFailureDate ? new Date(`${goal.lastFailureDate}T12:00:00`) : new Date(`${goal.startedAt}T12:00:00`);
  const today = new Date(`${getTodayDateKey(now)}T12:00:00`);
  const diffDays = Math.max(Math.round((today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24)), 0);
  return goal.lastFailureDate ? diffDays : diffDays;
}

export function getAvoidanceStreakBeforeFailure(goal: AvoidanceGoal, failureDate: string) {
  const anchorDateKey = goal.lastFailureDate ?? goal.startedAt;
  const anchor = new Date(`${anchorDateKey}T12:00:00`);
  const failure = new Date(`${failureDate}T12:00:00`);
  return Math.max(Math.round((failure.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24)), 0);
}

export function getAvoidanceBestStreak(goal: AvoidanceGoal, now = new Date()) {
  return Math.max(goal.bestStreakDays ?? 0, getAvoidanceStreak(goal, now));
}

export function getCurrentWeekDateKeys(now = new Date()) {
  const current = new Date(now);
  const day = current.getDay();
  current.setDate(current.getDate() - day);
  const start = new Date(current);
  start.setHours(0, 0, 0, 0);

  const keys: string[] = [];
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    keys.push(getTodayDateKey(date));
  }

  return keys;
}

export function getUniqueWeekCount(dateKeys: string[], now = new Date()) {
  const weekKeys = new Set(getCurrentWeekDateKeys(now));
  return new Set(dateKeys.filter((key) => weekKeys.has(key))).size;
}

export function getScheduledGymVisitsByToday(
  now = new Date(),
  targetDays: readonly number[] = WEEKLY_GYM_TARGET_DAYS
) {
  const currentDay = now.getDay();
  return targetDays.filter((day) => day < currentDay).length;
}

export function getScheduledGymPacePct(
  now = new Date(),
  targetDays: readonly number[] = WEEKLY_GYM_TARGET_DAYS
) {
  if (targetDays.length === 0) {
    return 0;
  }

  return clampPct((getScheduledGymVisitsByToday(now, targetDays) / targetDays.length) * 100);
}

export function getDateRangePacePct(startDate: string, targetDate: string, now = new Date()) {
  const start = new Date(`${startDate}T12:00:00`).getTime();
  const end = new Date(`${targetDate}T12:00:00`).getTime();
  const current = now.getTime();

  if (end <= start) {
    return 100;
  }

  if (current <= start) {
    return 0;
  }

  return clampPct(((current - start) / (end - start)) * 100);
}

export function getWeightLossProgressPct(weight: number) {
  const effectiveWeight = Math.min(weight, STARTING_WEIGHT_LB);
  const totalLossNeeded = Math.max(STARTING_WEIGHT_LB - GOAL_WEIGHT_LB, 1);
  const lossAchieved = Math.max(STARTING_WEIGHT_LB - effectiveWeight, 0);

  return clampPct((lossAchieved / totalLossNeeded) * 100);
}

export async function readPersistedLifeTrackerData(): Promise<LifeTrackerData | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? normalizeLifeTrackerData(JSON.parse(raw) as Partial<LifeTrackerData>) : null;
  }

  const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);
  if (!fileInfo.exists) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);
  return raw.trim() ? normalizeLifeTrackerData(JSON.parse(raw) as Partial<LifeTrackerData>) : null;
}

export async function writePersistedLifeTrackerData(data: LifeTrackerData) {
  const raw = JSON.stringify(data);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_STORAGE_KEY, raw);
    }
    return;
  }

  await FileSystem.writeAsStringAsync(STORAGE_FILE, raw);
}

export function mergeLifeTrackerData(data?: Partial<LifeTrackerData> | null): LifeTrackerData {
  return normalizeLifeTrackerData(data ?? {});
}

function normalizeLifeTrackerData(data: Partial<LifeTrackerData>): LifeTrackerData {
  const persistedCertifications = new Map(
    (data.certifications ?? []).map((cert) => [cert.id === 'pnpt' ? 'cloud-plus' : cert.id, cert])
  );
  const persistedGoals2026 = (data.goals2026 ?? []) as Array<AvoidanceGoal | LegacyDailyCheckGoal>;
  const normalizedGoals2026 = defaultLifeTrackerData.goals2026.map((fallback) => {
    const persistedGoal = persistedGoals2026.find((goal) => goal.id === fallback.id);

    if (!persistedGoal) {
      return fallback;
    }

    if ((fallback.id === 'stretching' || fallback.id === 'soda') && persistedGoal.type === 'daily-check') {
      return {
        id: fallback.id,
        title: fallback.title,
        type: 'avoidance' as const,
        startedAt: AVOIDANCE_STREAK_START_DATE,
        lastFailureDate: null,
        bestStreakDays: 0,
      };
    }

    if (fallback.type === 'avoidance') {
      if (persistedGoal.type === 'avoidance') {
        const shouldResetLegacyBaseline =
          persistedGoal.startedAt === TRACKER_BASELINE_DATE && (persistedGoal.lastFailureDate ?? null) === null;

        return {
          ...fallback,
          ...persistedGoal,
          id: fallback.id,
          title: fallback.title,
          type: 'avoidance' as const,
          startedAt: shouldResetLegacyBaseline
            ? AVOIDANCE_STREAK_START_DATE
            : persistedGoal.startedAt ?? fallback.startedAt,
          lastFailureDate: persistedGoal.lastFailureDate ?? null,
          bestStreakDays: Math.max(persistedGoal.bestStreakDays ?? 0, getAvoidanceStreak({
            ...fallback,
            ...persistedGoal,
            startedAt: shouldResetLegacyBaseline
              ? AVOIDANCE_STREAK_START_DATE
              : persistedGoal.startedAt ?? fallback.startedAt,
            lastFailureDate: persistedGoal.lastFailureDate ?? null,
          })),
        };
      }

      return fallback;
    }

    return fallback;
  });

  return {
    certifications: defaultLifeTrackerData.certifications.map((fallback) => {
      const cert = persistedCertifications.get(fallback.id);
      const legacyTarget = (cert as CertificationTracker & { targetHours?: number } | undefined)?.targetHours;
      const legacyCompleted = (cert as CertificationTracker & { hoursCompleted?: number } | undefined)?.hoursCompleted;

      if (!cert) {
        return fallback;
      }

      return {
        ...fallback,
        ...cert,
        id: fallback.id,
        name: fallback.name,
        studyGuide: fallback.studyGuide,
        startDate: fallback.startDate,
        examDate: fallback.examDate,
        chapterCount: fallback.chapterCount,
        chaptersCompleted: cert.chaptersCompleted ?? legacyCompleted ?? fallback.chaptersCompleted,
      };
    }),
    studyLogs:
      data.studyLogs?.map((entry) => ({
        ...entry,
        certId: entry.certId === 'pnpt' ? 'cloud-plus' : entry.certId,
        chapters: entry.chapters ?? (entry as StudyLogEntry & { hours?: number }).hours ?? 0,
      })) ?? [],
    chapterPracticeScores:
      data.chapterPracticeScores?.map((entry) => ({
        ...entry,
        certId: entry.certId === 'pnpt' ? 'cloud-plus' : entry.certId,
      })) ?? [],
    goals2026: normalizedGoals2026,
    weightEntries: data.weightEntries?.length ? data.weightEntries : defaultLifeTrackerData.weightEntries,
    loopRuns: data.loopRuns ?? [],
    diyTasks: data.diyTasks?.length ? data.diyTasks : defaultLifeTrackerData.diyTasks,
  };
}
