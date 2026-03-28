import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type CertificationTracker = {
  id: string;
  name: string;
  chapterCount: number;
  chaptersCompleted: number;
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
};

export type DailyCheckGoal = {
  id: string;
  title: string;
  type: 'daily-check';
  completedDates: string[];
};

export type YearGoal = AvoidanceGoal | DailyCheckGoal;

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

export type GameSessionEntry = {
  id: string;
  dateKey: string;
  label: string;
  game: string;
  hours: number;
  note?: string;
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
  gameSessions: GameSessionEntry[];
  diyTasks: DiyTask[];
};

const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}lil-johnny-life-trackers.json`;
const WEB_STORAGE_KEY = 'lil-johnny-life-trackers';
export const TRACKER_BASELINE_DATE = '2026-03-28';

export const defaultLifeTrackerData: LifeTrackerData = {
  certifications: [
    {
      id: 'linux-plus',
      name: 'Linux+',
      chapterCount: 31,
      chaptersCompleted: 0,
      examDate: '2026-07-15',
      studyGuide: 'Sybex Linux+ Study Guide (XK0-006, 6th Edition)',
    },
    {
      id: 'pentest-plus',
      name: 'PenTest+',
      chapterCount: 12,
      chaptersCompleted: 0,
      examDate: '2026-09-15',
      studyGuide: 'Sybex PenTest+ Study Guide (PT0-003, 3rd Edition)',
    },
    {
      id: 'cloud-plus',
      name: 'Cloud+',
      chapterCount: 10,
      chaptersCompleted: 0,
      examDate: '2026-11-15',
      studyGuide: 'Sybex Cloud+ Study Guide (CV0-004, 4th Edition)',
    },
  ],
  studyLogs: [],
  chapterPracticeScores: [],
  goals2026: [
    { id: 'alcohol', title: 'No alcohol', type: 'avoidance', startedAt: TRACKER_BASELINE_DATE, lastFailureDate: null },
    { id: 'stretching', title: 'Stretching daily', type: 'daily-check', completedDates: [] },
    { id: 'fast-food', title: 'No fast food', type: 'avoidance', startedAt: TRACKER_BASELINE_DATE, lastFailureDate: null },
    { id: 'coffee', title: 'No coffees purchased', type: 'avoidance', startedAt: TRACKER_BASELINE_DATE, lastFailureDate: null },
    { id: 'soda', title: 'Only one Zero Sugar soda', type: 'daily-check', completedDates: [] },
  ],
  weightEntries: [],
  loopRuns: [],
  gameSessions: [],
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
  return date.toISOString().slice(0, 10);
}

export function formatTrackerDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function formatDateKey(dateKey: string) {
  return formatTrackerDate(new Date(`${dateKey}T12:00:00`));
}

export function formatLoopRunTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function getAvoidanceStreak(goal: AvoidanceGoal, now = new Date()) {
  const anchor = goal.lastFailureDate ? new Date(`${goal.lastFailureDate}T12:00:00`) : new Date(`${goal.startedAt}T12:00:00`);
  const today = new Date(`${getTodayDateKey(now)}T12:00:00`);
  const diffDays = Math.max(Math.round((today.getTime() - anchor.getTime()) / (1000 * 60 * 60 * 24)), 0);
  return goal.lastFailureDate ? diffDays : diffDays;
}

export function getDailyCheckStreak(goal: DailyCheckGoal, now = new Date()) {
  const completed = new Set(goal.completedDates);
  let streak = 0;

  for (let offset = 0; offset < 366; offset += 1) {
    const checkDate = new Date(now);
    checkDate.setDate(now.getDate() - offset);
    const key = getTodayDateKey(checkDate);

    if (!completed.has(key)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function getCurrentWeekDateKeys(now = new Date()) {
  const current = new Date(now);
  const day = current.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  current.setDate(current.getDate() + diffToMonday);
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

function normalizeLifeTrackerData(data: Partial<LifeTrackerData>): LifeTrackerData {
  const certificationFallbacks = new Map(
    defaultLifeTrackerData.certifications.map((cert) => [cert.id, cert])
  );

  return {
    ...defaultLifeTrackerData,
    ...data,
    certifications:
      data.certifications?.length
        ? data.certifications.map((cert, index) => {
            const normalizedId = cert.id === 'pnpt' ? 'cloud-plus' : cert.id;
            const fallback =
              certificationFallbacks.get(normalizedId) ??
              defaultLifeTrackerData.certifications[index] ??
              defaultLifeTrackerData.certifications[0];
            const legacyTarget = (cert as CertificationTracker & { targetHours?: number }).targetHours;
            const legacyCompleted = (cert as CertificationTracker & { hoursCompleted?: number }).hoursCompleted;

            return {
              ...fallback,
              ...cert,
              id: normalizedId,
              name: cert.id === 'pnpt' ? fallback.name : cert.name ?? fallback.name,
              studyGuide: cert.id === 'pnpt' ? fallback.studyGuide : cert.studyGuide ?? fallback.studyGuide,
              examDate: cert.id === 'pnpt' ? fallback.examDate : cert.examDate ?? fallback.examDate,
              chapterCount: cert.chapterCount ?? legacyTarget ?? fallback.chapterCount,
              chaptersCompleted: cert.chaptersCompleted ?? legacyCompleted ?? fallback.chaptersCompleted,
            };
          })
        : defaultLifeTrackerData.certifications,
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
    goals2026: data.goals2026 ?? defaultLifeTrackerData.goals2026,
    weightEntries: data.weightEntries ?? [],
    loopRuns: data.loopRuns ?? [],
    gameSessions: data.gameSessions ?? [],
    diyTasks: data.diyTasks?.length ? data.diyTasks : defaultLifeTrackerData.diyTasks,
  };
}
