import type {
  TrackerBossActivityPlayer,
  TrackerBossProgression,
  TrackerBossTarget,
  TrackerBossTier,
  TrackerDailyBossActivity,
  TrackerSummaryItem,
  TrackerSummaryItemWithLevel,
  TrackerFriendSummary,
  TrackerRaidGain,
  TrackerWeeklyRaidGoal,
  RunescapeTrackerMetadata,
} from './osrsTrackerTypes.ts';
import { BOSS_TIER_ORDER } from './osrsTrackerTypes.ts';

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
  const emptyRemainingByTier = Object.fromEntries(
    BOSS_TIER_ORDER.map((tier) => [tier, [] as TrackerBossTarget[]])
  ) as Record<TrackerBossTier, TrackerBossTarget[]>;
  const value = metadata?.bossProgression?.[username];

  if (!value || typeof value !== 'object') {
    return { triedCount: 0, totalTracked: 0, untriedCount: 0, remainingByTier: emptyRemainingByTier };
  }

  const raw = value as Record<string, unknown>;
  const rawRemainingByTier = raw.remainingByTier;
  const remainingByTier = Object.fromEntries(
    BOSS_TIER_ORDER.map((tier) => {
      const entries =
        rawRemainingByTier && typeof rawRemainingByTier === 'object'
          ? (rawRemainingByTier as Record<string, unknown>)[tier]
          : undefined;
      const normalized = Array.isArray(entries)
        ? entries
            .filter(
              (entry): entry is Record<string, unknown> =>
                Boolean(entry) &&
                typeof entry === 'object' &&
                typeof (entry as Record<string, unknown>).name === 'string' &&
                typeof (entry as Record<string, unknown>).kc === 'number' &&
                typeof (entry as Record<string, unknown>).targetKc === 'number'
            )
            .map((entry) => ({
              name: entry.name as string,
              kc: Math.max(entry.kc as number, 0),
              targetKc: Math.max(entry.targetKc as number, 1),
              tier,
            }))
        : [];

      return [tier, normalized];
    })
  ) as Record<TrackerBossTier, TrackerBossTarget[]>;

  // Keep older snapshots readable until the first tracker run publishes the
  // full remainingByTier schema. New snapshots never use this queue field.
  if (
    (!rawRemainingByTier || typeof rawRemainingByTier !== 'object') &&
    Array.isArray(raw.nextUntried)
  ) {
    for (const entry of raw.nextUntried) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const candidate = entry as Record<string, unknown>;
      const tier = BOSS_TIER_ORDER.find((name) => name === candidate.tier);
      if (
        !tier ||
        typeof candidate.name !== 'string' ||
        typeof candidate.kc !== 'number' ||
        typeof candidate.targetKc !== 'number'
      ) {
        continue;
      }

      remainingByTier[tier].push({
        name: candidate.name,
        kc: Math.max(candidate.kc, 0),
        targetKc: Math.max(candidate.targetKc, 1),
        tier,
      });
    }
  }

  return {
    triedCount: clampNonNegativeNumber(raw.triedCount),
    totalTracked: clampNonNegativeNumber(raw.totalTracked),
    untriedCount: clampNonNegativeNumber(raw.untriedCount),
    remainingByTier,
  };
}

export function readTrackerDailyBossActivity(
  metadata: RunescapeTrackerMetadata | null
): TrackerDailyBossActivity {
  const value = metadata?.dailyBossActivity;
  const rawTopPlayers = value?.topPlayers;

  if (!Array.isArray(rawTopPlayers)) {
    return { topPlayers: [] };
  }

  const topPlayers = rawTopPlayers
    .map((entry): TrackerBossActivityPlayer | null => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const raw = entry as Record<string, unknown>;
      if (
        typeof raw.name !== 'string' ||
        typeof raw.totalBossKcGained !== 'number' ||
        !Number.isFinite(raw.totalBossKcGained) ||
        raw.totalBossKcGained <= 0
      ) {
        return null;
      }

      const bossGains = raw.bossGains && typeof raw.bossGains === 'object'
        ? Object.entries(raw.bossGains as Record<string, unknown>)
            .filter(
              (entry): entry is [string, number] =>
                typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0
            )
            .map(([name, gained]) => ({ name, gained }))
        : [];

      return {
        name: raw.name,
        totalBossKcGained: raw.totalBossKcGained,
        bossGains,
      };
    })
    .filter((entry): entry is TrackerBossActivityPlayer => entry !== null)
    .slice(0, 3);

  return { topPlayers };
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
