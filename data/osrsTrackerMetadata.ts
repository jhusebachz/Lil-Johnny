import type {
  TrackerSummaryItem,
  TrackerSummaryItemWithLevel,
  TrackerFriendSummary,
  RunescapeTrackerMetadata,
} from './osrsTrackerTypes.ts';

type RawDailyPlayerSummary = {
  diff?: unknown;
  topSkills?: unknown;
  totalXp?: unknown;
};

type RawCurrentWeekSummary = {
  activeDays?: unknown;
  daysTracked?: unknown;
  topSkills?: unknown;
  totalEffectiveHours?: unknown;
  totalXp?: unknown;
  weekStartDateKey?: unknown;
};

function clampNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeTopSkillsWithLevel(value: unknown): TrackerSummaryItemWithLevel[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (entry): entry is { skill: string; xp: number; level: number } =>
        Boolean(entry) &&
        typeof entry === 'object' &&
        typeof (entry as TrackerSummaryItemWithLevel).skill === 'string' &&
        typeof (entry as TrackerSummaryItemWithLevel).xp === 'number' &&
        Number.isFinite((entry as TrackerSummaryItemWithLevel).xp) &&
        (entry as TrackerSummaryItemWithLevel).xp >= 0 &&
        typeof (entry as TrackerSummaryItemWithLevel).level === 'number' &&
        Number.isFinite((entry as TrackerSummaryItemWithLevel).level)
    )
    .map((entry) => ({
      skill: entry.skill,
      xp: entry.xp,
      level: entry.level,
    }));
}

function normalizeTopSkills(value: unknown): TrackerSummaryItem[] {
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

function normalizeDailyPlayerSummary(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RawDailyPlayerSummary;

  return {
    diff: typeof raw.diff === 'number' && Number.isFinite(raw.diff) ? raw.diff : 0,
    topSkills: normalizeTopSkillsWithLevel(raw.topSkills),
    totalXp: clampNonNegativeNumber(raw.totalXp),
  };
}

export function readTrackerReportDateKey(metadata: RunescapeTrackerMetadata | null) {
  return typeof metadata?.reportDateKey === 'string' ? metadata.reportDateKey : null;
}

export function readTrackerGeneratedAt(metadata: RunescapeTrackerMetadata | null) {
  return typeof metadata?.generatedAt === 'string' ? metadata.generatedAt : null;
}

export function readTrackerDailySummary(metadata: RunescapeTrackerMetadata | null, username: string) {
  const rawByPlayer = metadata?.dailySummary?.byPlayer;

  if (!rawByPlayer || typeof rawByPlayer !== 'object') {
    return null;
  }

  const byPlayer = rawByPlayer as Record<string, unknown>;
  const primary = normalizeDailyPlayerSummary(byPlayer[username]);

  if (!primary) {
    return null;
  }

  return {
    totalXp: primary.totalXp,
    topSkills: primary.topSkills,
    friends: Object.entries(byPlayer)
      .filter(([name]) => name !== username)
      .map(([name, value]) => {
        const summary = normalizeDailyPlayerSummary(value);

        if (!summary) {
          return null;
        }

        return {
          name,
          overallXp: summary.totalXp,
          diff: summary.diff,
          topSkills: summary.topSkills,
        } satisfies TrackerFriendSummary;
      })
      .filter((summary): summary is TrackerFriendSummary => Boolean(summary)),
  };
}

export function createEmptyTrackerWeekSummary() {
  return {
    activeDays: 0,
    daysTracked: 0,
    topSkills: [] as TrackerSummaryItem[],
    totalEffectiveHours: 0,
    totalXp: 0,
    weekStartDateKey: null as string | null,
  };
}

export function readTrackerCurrentWeekSummary(metadata: RunescapeTrackerMetadata | null, username: string) {
  const value = metadata?.currentWeek?.[username];

  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RawCurrentWeekSummary;

  return {
    activeDays: clampNonNegativeNumber(raw.activeDays),
    daysTracked: clampNonNegativeNumber(raw.daysTracked),
    topSkills: normalizeTopSkills(raw.topSkills).slice(0, 5),
    totalEffectiveHours: clampNonNegativeNumber(raw.totalEffectiveHours),
    totalXp: clampNonNegativeNumber(raw.totalXp),
    weekStartDateKey: typeof raw.weekStartDateKey === 'string' ? raw.weekStartDateKey : null,
  };
}
