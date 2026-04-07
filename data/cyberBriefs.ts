import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export type CyberBriefEntry = {
  dateKey: string;
  label: string;
  note: string;
};

type CyberBriefStore = {
  entries: CyberBriefEntry[];
};

const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}lil-johnny-cyber-briefs.json`;
const WEB_STORAGE_KEY = 'lil-johnny-cyber-briefs';

export function getCyberBriefMeta(date = new Date()) {
  const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return {
    dateKey,
    label: new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(date),
  };
}

export function getCyberBriefStreak(entries: CyberBriefEntry[], now = new Date()) {
  const entrySet = new Set(entries.filter((entry) => entry.note.trim()).map((entry) => entry.dateKey));
  let streak = 0;

  for (let offset = 0; offset < 60; offset += 1) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() - offset);
    const dateKey = `${candidate.getFullYear()}-${String(candidate.getMonth() + 1).padStart(2, '0')}-${String(candidate.getDate()).padStart(2, '0')}`;

    if (!entrySet.has(dateKey)) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export async function readCyberBriefs(): Promise<CyberBriefEntry[]> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    const raw = localStorage.getItem(WEB_STORAGE_KEY);
    return raw ? ((JSON.parse(raw) as CyberBriefStore).entries ?? []) : [];
  }

  const info = await FileSystem.getInfoAsync(STORAGE_FILE);

  if (!info.exists) {
    return [];
  }

  const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);

  if (!raw.trim()) {
    return [];
  }

  return ((JSON.parse(raw) as CyberBriefStore).entries ?? []).filter((entry) => entry.note.trim());
}

export async function writeCyberBriefs(entries: CyberBriefEntry[]) {
  const raw = JSON.stringify({ entries });

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_STORAGE_KEY, raw);
    }

    return;
  }

  await FileSystem.writeAsStringAsync(STORAGE_FILE, raw);
}
