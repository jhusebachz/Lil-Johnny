import { readOsrsEffectiveHoursFromMetadata, resolveOsrsEffectiveHours } from './osrsEffectiveHours.ts';
import { getPlayerStats, getSkillDelta, getTrackerMetadata } from './osrsTrackerParsers.ts';
import { SKILL_ORDER } from './osrsTrackerTypes.ts';
import type {
  OsrsApiResponse,
  TrackerSevenDayEntry,
  TrackerSevenDaySummary,
  TrackerSummaryItem,
  SkillName,
} from './osrsTrackerTypes.ts';

type SnapshotStoreLike = {
  snapshots: Record<string, OsrsApiResponse>;
};

type RawTrackerSevenDayEntry = {
  dateKey?: unknown;
  effectiveHours?: unknown;
  label?: unknown;
  topSkills?: unknown;
  totalXp?: unknown;
};

type RawTrackerSevenDaySummary = {
  activeDays?: unknown;
  averageEffectiveHours?: unknown;
  averageXp?: unknown;
  days?: unknown;
  daysTracked?: unknown;
  totalEffectiveHours?: unknown;
  totalXp?: unknown;
};

function clampNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function formatSnapshotDayLabel(dateKey: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${dateKey}T12:00:00`));
}

function normalizeTopSkills(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is { skill: string; xp: number } =>
        Boolean(entry) &&
        typeof entry === 'object' &&
        typeof (entry as TrackerSummaryItem).skill === 'string' &&
        typeof (entry as TrackerSummaryItem).xp === 'number' &&
        Number.isFinite((entry as TrackerSummaryItem).xp) &&
        (entry as TrackerSummaryItem).xp >= 0
    )
    .map((entry) => ({
      skill: entry.skill,
      xp: entry.xp,
    }));
}

function normalizeSevenDayEntry(value: unknown): TrackerSevenDayEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RawTrackerSevenDayEntry;

  if (typeof raw.dateKey !== 'string') {
    return null;
  }

  return {
    dateKey: raw.dateKey,
    effectiveHours: clampNonNegativeNumber(raw.effectiveHours),
    label: typeof raw.label === 'string' ? raw.label : formatSnapshotDayLabel(raw.dateKey),
    topSkills: normalizeTopSkills(raw.topSkills).slice(0, 3),
    totalXp: clampNonNegativeNumber(raw.totalXp),
  };
}

export function createEmptySevenDaySummary(): TrackerSevenDaySummary {
  return {
    activeDays: 0,
    averageEffectiveHours: 0,
    averageXp: 0,
    days: [],
    daysTracked: 0,
    totalEffectiveHours: 0,
    totalXp: 0,
  };
}

export function buildTrackerSevenDaySummary(days: TrackerSevenDayEntry[]): TrackerSevenDaySummary {
  const sortedDays = [...days].sort((left, right) => right.dateKey.localeCompare(left.dateKey)).slice(0, 7);
  const daysTracked = sortedDays.length;
  const activeDays = sortedDays.filter((day) => day.totalXp > 0 || day.effectiveHours > 0).length;
  const totalXp = sortedDays.reduce((total, day) => total + day.totalXp, 0);
  const totalEffectiveHours = sortedDays.reduce((total, day) => total + day.effectiveHours, 0);

  return {
    activeDays,
    averageEffectiveHours: daysTracked > 0 ? totalEffectiveHours / daysTracked : 0,
    averageXp: daysTracked > 0 ? totalXp / daysTracked : 0,
    days: sortedDays,
    daysTracked,
    totalEffectiveHours,
    totalXp,
  };
}

export function readTrackerSevenDaySummaryFromMetadata(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RawTrackerSevenDaySummary;

  if (!Array.isArray(raw.days)) {
    return null;
  }

  const days = raw.days.map(normalizeSevenDayEntry).filter((entry): entry is TrackerSevenDayEntry => Boolean(entry));

  if (days.length === 0) {
    return null;
  }

  return {
    activeDays: clampNonNegativeNumber(raw.activeDays),
    averageEffectiveHours: clampNonNegativeNumber(raw.averageEffectiveHours),
    averageXp: clampNonNegativeNumber(raw.averageXp),
    days,
    daysTracked: clampNonNegativeNumber(raw.daysTracked) || days.length,
    totalEffectiveHours: clampNonNegativeNumber(raw.totalEffectiveHours),
    totalXp: clampNonNegativeNumber(raw.totalXp),
  } satisfies TrackerSevenDaySummary;
}

function buildTopSkillsForDay(
  currentData: OsrsApiResponse,
  previousData: OsrsApiResponse | undefined,
  username: string
): TrackerSummaryItem[] {
  const currentPlayer = getPlayerStats(currentData, username);
  const previousPlayer = previousData ? getPlayerStats(previousData, username) : null;

  if (!currentPlayer || !previousPlayer) {
    return [];
  }

  return SKILL_ORDER.map((skill) => ({
    skill,
    xp: getSkillDelta(currentPlayer, previousPlayer, skill),
  }))
    .filter((entry) => entry.xp > 0)
    .sort((left, right) => right.xp - left.xp)
    .slice(0, 3);
}

function buildSevenDayEntryFromSnapshot(
  currentData: OsrsApiResponse,
  previousData: OsrsApiResponse | undefined,
  dateKey: string,
  username: string
) {
  const currentPlayer = getPlayerStats(currentData, username);
  const previousPlayer = previousData ? getPlayerStats(previousData, username) : null;

  if (!currentPlayer) {
    return null;
  }

  const totalXp = previousPlayer
    ? Math.max(currentPlayer.overall.experience - previousPlayer.overall.experience, 0)
    : 0;
  const gainsBySkill =
    previousPlayer &&
    Object.fromEntries(
      SKILL_ORDER.map((skill) => [skill, getSkillDelta(currentPlayer, previousPlayer, skill)])
    ) as Record<SkillName, number>;
  const metadataSummary = readOsrsEffectiveHoursFromMetadata(getTrackerMetadata(currentData)?.effectiveHours?.[username]);
  const effectiveHours = metadataSummary?.totalHours ?? resolveOsrsEffectiveHours(null, gainsBySkill ?? null).totalHours;

  return {
    dateKey,
    effectiveHours,
    label: formatSnapshotDayLabel(dateKey),
    topSkills: buildTopSkillsForDay(currentData, previousData, username),
    totalXp,
  } satisfies TrackerSevenDayEntry;
}

export function buildTrackerSevenDaySummaryFromSnapshotStore(
  store: SnapshotStoreLike,
  username: string,
  metadataSummary?: TrackerSevenDaySummary | null
) {
  const snapshotKeys = Object.keys(store.snapshots).sort();

  if (snapshotKeys.length === 0) {
    return metadataSummary ?? createEmptySevenDaySummary();
  }

  const snapshotDays = snapshotKeys
    .slice(-7)
    .map((dateKey) => {
      const snapshotIndex = snapshotKeys.indexOf(dateKey);
      const previousKey = snapshotIndex > 0 ? snapshotKeys[snapshotIndex - 1] : null;

      return buildSevenDayEntryFromSnapshot(
        store.snapshots[dateKey],
        previousKey ? store.snapshots[previousKey] : undefined,
        dateKey,
        username
      );
    })
    .filter((entry): entry is TrackerSevenDayEntry => Boolean(entry));

  if (snapshotDays.length === 0) {
    return metadataSummary ?? createEmptySevenDaySummary();
  }

  const derivedSummary = buildTrackerSevenDaySummary(snapshotDays);

  if (metadataSummary && metadataSummary.daysTracked > derivedSummary.daysTracked) {
    return metadataSummary;
  }

  return derivedSummary;
}
