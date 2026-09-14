import type {
  TrackerBossProgression,
  TrackerBossTarget,
  TrackerSummaryItem,
  TrackerSummaryItemWithLevel,
  TrackerFriendSummary,
  TrackerRaidGain,
  TrackerWeeklyRaidGoal,
  RunescapeTrackerMetadata,
} from './osrsTrackerTypes.ts';

type RawDailyPlayerSummary = {
  diff?: unknown;
  effectiveHours?: unknown;
  topSkills?: unknown;
  totalXp?: unknown;
};

type RawCurrentWeekSummary = {
  activeDays?: unknown;
  daysTracked?: unknown;
  raidGoal?: unknown;
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
    effectiveHours: clampNonNegativeNumber(raw.effectiveHours),
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
          effectiveHours: summary.effectiveHours,
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

export function readTrackerBossProgression(
  metadata: RunescapeTrackerMetadata | null,
  username: string
): TrackerBossProgression {
  const value = metadata?.bossProgression?.[username];

  if (!value || typeof value !== 'object') {
    return { triedCount: 0, totalTracked: 0, untriedCount: 0, nextUntried: [] };
  }

  const raw = value as Record<string, unknown>;
  const nextUntried = Array.isArray(raw.nextUntried)
    ? raw.nextUntried
        .filter(
          (entry): entry is TrackerBossTarget =>
            Boolean(entry) &&
            typeof entry === 'object' &&
            typeof (entry as TrackerBossTarget).name === 'string' &&
            typeof (entry as TrackerBossTarget).kc === 'number' &&
            typeof (entry as TrackerBossTarget).targetKc === 'number'
        )
        .map((entry) => ({ name: entry.name, kc: Math.max(entry.kc, 0), targetKc: Math.max(entry.targetKc, 1) }))
    : [];

  return {
    triedCount: clampNonNegativeNumber(raw.triedCount),
    totalTracked: clampNonNegativeNumber(raw.totalTracked),
    untriedCount: clampNonNegativeNumber(raw.untriedCount),
    nextUntried,
  };
}

export function readTrackerWeeklyRaidGoal(
  metadata: RunescapeTrackerMetadata | null,
  username: string
): TrackerWeeklyRaidGoal {
  const weekValue = metadata?.currentWeek?.[username];
  if (!weekValue || typeof weekValue !== 'object') {
    return { target: 1, completed: 0, weekStartDateKey: null, gainsByRaid: [] };
  }

  const raidValue = (weekValue as RawCurrentWeekSummary).raidGoal;
  if (!raidValue || typeof raidValue !== 'object') {
    return { target: 1, completed: 0, weekStartDateKey: null, gainsByRaid: [] };
  }

  const raw = raidValue as Record<string, unknown>;
  const gainsByRaid: TrackerRaidGain[] = Array.isArray(raw.gainsByRaid)
    ? raw.gainsByRaid
        .filter(
          (entry): entry is TrackerRaidGain =>
            Boolean(entry) &&
            typeof entry === 'object' &&
            typeof (entry as TrackerRaidGain).name === 'string' &&
            typeof (entry as TrackerRaidGain).gained === 'number' &&
            Number.isFinite((entry as TrackerRaidGain).gained)
        )
        .map((entry) => ({ name: entry.name, gained: Math.max(entry.gained, 0) }))
    : [];

  return {
    target: Math.max(clampNonNegativeNumber(raw.target), 1),
    completed: clampNonNegativeNumber(raw.completed),
    weekStartDateKey: typeof raw.weekStartDateKey === 'string' ? raw.weekStartDateKey : null,
    gainsByRaid,
  };
}
