import { formatOsrsSkillName, resolveOsrsEffectiveHours } from './osrsEffectiveHours.ts';
import {
  buildBaseGoalRemaining,
  buildDerivedTopSkills,
  buildFriendSummaries,
  buildHoursToNextLevel,
  buildMaxClosest,
  buildMaxRemainingAll,
} from './osrsTrackerBuilders.ts';
import { fetchRawRunescapeData } from './osrsTrackerFetch.ts';
import {
  createEmptyTrackerWeekSummary,
  readTrackerCurrentWeekSummary,
  readTrackerDailySummary,
  readTrackerGeneratedAt,
  readTrackerReportDateKey,
} from './osrsTrackerMetadata.ts';
import {
  GOAL_ONE_DEADLINE,
  GOAL_ONE_LABEL,
  GOAL_PROGRESS_BASELINE,
  buildGoalProjection,
  buildRuneFestProjection,
  buildTargetProgress,
  daysUntil,
  describeGoalStatus,
  getEffectiveLevelsRemaining,
  getPacePct,
  isSlayerTrackedSkill,
  xpForLevel,
} from './osrsTrackerGoals.ts';
import { getPlayerStats, getSkillDelta, getTrackerMetadata } from './osrsTrackerParsers.ts';
import {
  buildTrackerSevenDaySummaryFromSnapshotStore,
  createEmptySevenDaySummary,
  readTrackerSevenDaySummaryFromMetadata,
} from './osrsTrackerSevenDay.ts';
import {
  findLatestSnapshotKey,
  findPreviousSnapshotKey,
  readSnapshotStore,
  writeSnapshotStore,
} from './osrsSnapshotStore.ts';
import type { SnapshotStore } from './osrsSnapshotStore.ts';
import { FRIEND_ORDER, SKILL_ORDER } from './osrsTrackerTypes.ts';
import type {
  GoalProjection,
  LiveRunescapeTracker,
  OsrsApiResponse,
  OsrsSkillStat,
  SkillName,
  TrackerSevenDaySummary,
} from './osrsTrackerTypes.ts';

const TRACKER_TIME_ZONE = 'America/New_York';
const SNAPSHOT_HOUR = 4;
const SNAPSHOT_MINUTE = 45;
const PRIMARY_USERNAME = 'jhusebachz';
const MAX_CAPE_DEADLINE = '2027-12-31';

export type {
  GoalProjection,
  LiveRunescapeTracker,
  OsrsApiResponse,
  OsrsPlayerStats,
  OsrsSkillStat,
  RunescapeTrackerMetadata,
  SkillName,
  TrackerFriendSummary,
  TrackerGoal,
  TrackerSevenDayEntry,
  TrackerSevenDaySummary,
  TrackerSummaryItem,
} from './osrsTrackerTypes.ts';

export class CachedRunescapeTrackerError extends Error {
  tracker: LiveRunescapeTracker;

  constructor(message: string, tracker: LiveRunescapeTracker) {
    super(message);
    this.name = 'CachedRunescapeTrackerError';
    this.tracker = tracker;
  }
}

function getEffectiveHours(
  currentData: OsrsApiResponse,
  previousData: OsrsApiResponse | undefined,
  username: string,
  skills: (OsrsSkillStat & { skill: SkillName })[]
) {
  const currentPlayer = getPlayerStats(currentData, username);
  const previousPlayer = previousData ? getPlayerStats(previousData, username) : null;
  const gainsBySkill =
    currentPlayer && previousPlayer
      ? Object.fromEntries(skills.map((skill) => [skill.skill, getSkillDelta(currentPlayer, previousPlayer, skill.skill)]))
      : null;

  return resolveOsrsEffectiveHours(getTrackerMetadata(currentData)?.effectiveHours?.[username], gainsBySkill);
}

function getEasternTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TRACKER_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

  return {
    year: value('year'),
    month: value('month'),
    day: value('day'),
    hour: Number(value('hour')),
    minute: Number(value('minute')),
  };
}

function getTodaySnapshotKey(date = new Date()) {
  const parts = getEasternTimeParts(date);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function hasReachedDailySnapshotTime(date = new Date()) {
  const parts = getEasternTimeParts(date);
  return parts.hour > SNAPSHOT_HOUR || (parts.hour === SNAPSHOT_HOUR && parts.minute >= SNAPSHOT_MINUTE);
}

function formatSnapshotDate(snapshotKey: string) {
  const [year, month, day] = snapshotKey.split('-');
  const date = new Date(`${year}-${month}-${day}T12:00:00-05:00`);

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function formatGeneratedAtLabel(generatedAt: string | null) {
  if (!generatedAt) {
    return 'No tracker timestamp yet';
  }

  const parsedDate = new Date(generatedAt);

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Unknown tracker timestamp';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsedDate);
}

function getTodaySnapshotSummaryFromMetadata(data: OsrsApiResponse, username: string) {
  return readTrackerSevenDaySummaryFromMetadata(getTrackerMetadata(data)?.lastSevenDays?.[username]);
}

function getReportedSnapshotKey(data: OsrsApiResponse, fallbackKey: string) {
  return readTrackerReportDateKey(getTrackerMetadata(data)) ?? fallbackKey;
}

function shouldUpdateStoredTodaySnapshot(existingSnapshot: OsrsApiResponse | undefined, nextSnapshot: OsrsApiResponse) {
  if (!existingSnapshot) {
    return true;
  }

  const existingGeneratedAt = getTrackerMetadata(existingSnapshot)?.generatedAt;
  const nextGeneratedAt = getTrackerMetadata(nextSnapshot)?.generatedAt;

  if (existingGeneratedAt !== nextGeneratedAt) {
    return true;
  }

  const existingPlayer = getPlayerStats(existingSnapshot, PRIMARY_USERNAME);
  const nextPlayer = getPlayerStats(nextSnapshot, PRIMARY_USERNAME);

  if (!existingPlayer || !nextPlayer) {
    return false;
  }

  return nextPlayer.overall.experience !== existingPlayer.overall.experience;
}

function fallbackTracker(): LiveRunescapeTracker {
  return {
    currentWeek: createEmptyTrackerWeekSummary(),
    generatedAt: null,
    generatedAtLabel: 'No tracker timestamp yet',
    mode: 'snapshot',
    reportDateKey: null,
    snapshotDateLabel: 'No snapshot yet',
    totalXp: 0,
    totalLevel: 0,
    effectiveHours: {
      totalHours: 0,
      bySkill: [],
      skippedSkills: [],
      source: 'unavailable',
    },
    topSkills: [],
    friends: [],
    lastSevenDays: createEmptySevenDaySummary(),
    baseGoalRemaining: [],
    maxClosest: [],
    maxedSkills: [],
    hoursToNextLevel: [],
    milestoneAlerts: [],
    goalProjections: {
      baseGoal: {
        label: GOAL_ONE_LABEL,
        daysLeft: 0,
        hoursLeft: null,
        hoursPerDay: null,
        status: 'Off track',
        unestimatedSkills: [],
        progressPct: 0,
        pacePct: 0,
      },
      runefest: {
        label: 'Total Level 2250',
        daysLeft: 0,
        hoursLeft: null,
        hoursPerDay: null,
        status: 'On track',
        unestimatedSkills: [],
        progressPct: 100,
        pacePct: 100,
      },
      maxCape: {
        label: 'Max Cape',
        daysLeft: 0,
        hoursLeft: null,
        hoursPerDay: null,
        status: 'Off track',
        unestimatedSkills: [],
        progressPct: 0,
        pacePct: 0,
      },
    },
    runefestEffectiveLevelsPerDayNeeded: 0,
    runefestEffectiveLevelsRemaining: 0,
    runefestLevelsPerDayNeeded: 0,
    coachingText:
      'No live or cached OSRS tracker data is available yet. Once the feed is reachable, this view will build from real snapshots instead of placeholder stats.',
  };
}

async function buildTrackerFromLatestStoredSnapshot(store?: SnapshotStore) {
  const resolvedStore = store ?? (await readSnapshotStore());
  const latestSnapshotKey = findLatestSnapshotKey(resolvedStore);

  if (!latestSnapshotKey) {
    return fallbackTracker();
  }

  const latestData = resolvedStore.snapshots[latestSnapshotKey];
  const previousKey = findPreviousSnapshotKey(resolvedStore, latestSnapshotKey);
  const metadataSummary = getTodaySnapshotSummaryFromMetadata(latestData, PRIMARY_USERNAME);
  const lastSevenDays = buildTrackerSevenDaySummaryFromSnapshotStore(resolvedStore, PRIMARY_USERNAME, metadataSummary);

  return buildLiveRunescapeTracker(
    latestData,
    previousKey ? resolvedStore.snapshots[previousKey] : undefined,
    PRIMARY_USERNAME,
    latestSnapshotKey,
    lastSevenDays
  );
}

export function buildLiveRunescapeTracker(
  currentData: OsrsApiResponse,
  previousData?: OsrsApiResponse,
  username = PRIMARY_USERNAME,
  snapshotKey?: string,
  lastSevenDays: TrackerSevenDaySummary = createEmptySevenDaySummary()
): LiveRunescapeTracker {
  const player = getPlayerStats(currentData, username);
  const previousPlayer = previousData ? getPlayerStats(previousData, username) : null;
  const metadata = getTrackerMetadata(currentData);
  const generatedAt = readTrackerGeneratedAt(metadata);
  const reportDateKey = readTrackerReportDateKey(metadata);
  const currentWeek = readTrackerCurrentWeekSummary(metadata, username) ?? createEmptyTrackerWeekSummary();
  const dailySummary = readTrackerDailySummary(metadata, username);

  if (!player) {
    return fallbackTracker();
  }

  const hasDelta = Boolean(previousPlayer) || Boolean(dailySummary);

  const skills = SKILL_ORDER
    .filter((skill) => player[skill] && player[skill].experience >= 0)
    .map((skill) => ({
      skill,
      ...player[skill],
    }));
  const effectiveHours = getEffectiveHours(currentData, previousData, username, skills);

  const derivedTopSkills = buildDerivedTopSkills(player, previousPlayer, hasDelta);
  const topSkills =
    dailySummary?.topSkills.map(({ skill, xp }) => ({
      skill: formatOsrsSkillName(skill),
      xp,
    })) ?? derivedTopSkills;
  const derivedFriends = buildFriendSummaries(currentData, previousData, username, player, previousPlayer, hasDelta);
  const friends =
    dailySummary?.friends
      .map((friend) => ({
        ...friend,
        effectiveHours: friend.effectiveHours ?? 0,
        topSkills: friend.topSkills.map((entry) => ({
          skill: formatOsrsSkillName(entry.skill),
          xp: entry.xp,
          level: entry.level,
        })),
      }))
      .sort((left, right) => {
        const leftIndex = FRIEND_ORDER.indexOf(left.name as (typeof FRIEND_ORDER)[number]);
        const rightIndex = FRIEND_ORDER.indexOf(right.name as (typeof FRIEND_ORDER)[number]);
        const safeLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
        const safeRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

        return safeLeftIndex - safeRightIndex;
      }) ?? derivedFriends;

  const baseGoalRemaining = buildBaseGoalRemaining(skills);
  const maxRemainingAll = buildMaxRemainingAll(skills);
  const maxClosest = buildMaxClosest(maxRemainingAll);

  const maxedSkills = skills.filter((skill) => skill.level >= 99).map((skill) => formatOsrsSkillName(skill.skill));
  const totalLevelTarget = 2250;
  const totalLevelsNeeded = Math.max(totalLevelTarget - player.overall.level, 0);

  const hoursToNextLevel = buildHoursToNextLevel(skills);

  const milestoneAlerts = [...skills]
    .map((skill) => {
      const targetLevel = skill.level < 90 ? 90 : skill.level < 99 ? 99 : null;

      if (!targetLevel) {
        return null;
      }

      const remainingXp = Math.max(xpForLevel(targetLevel) - skill.experience, 0);

      if (remainingXp <= 0 || remainingXp > 150000) {
        return null;
      }

      return {
        skill: formatOsrsSkillName(skill.skill),
        target: `Lv${targetLevel}`,
        remainingXp,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => left.remainingXp - right.remainingXp)
    .slice(0, 5);

  const baseGoalHours = baseGoalRemaining.reduce((total, item) => total + (item.hoursLeft ?? 0), 0);
  const baseGoalUnestimated = baseGoalRemaining
    .filter((item) => item.hoursLeft === null && !isSlayerTrackedSkill(item.skill.toLowerCase()))
    .map((item) => item.skill);
  const maxHours = maxRemainingAll.reduce((total, item) => total + (item.hoursLeft ?? 0), 0);
  const maxUnestimated = maxRemainingAll
    .filter((item) => item.hoursLeft === null && !isSlayerTrackedSkill(item.skill.toLowerCase()))
    .map((item) => item.skill);
  const runefestDaysLeft = Math.max(daysUntil('2026-10-03'), 1);
  const runefestEffectiveLevelsRemaining = getEffectiveLevelsRemaining(player, totalLevelTarget);
  const runefestEffectiveLevelsPerDayNeeded =
    runefestEffectiveLevelsRemaining > 0 ? runefestEffectiveLevelsRemaining / runefestDaysLeft : 0;
  const runefestLevelsPerDayNeeded = totalLevelsNeeded > 0 ? totalLevelsNeeded / runefestDaysLeft : 0;
  const runefestProjectionPlan = buildRuneFestProjection(skills, totalLevelsNeeded);
  const baseGoalProgressPct = buildTargetProgress(GOAL_PROGRESS_BASELINE, player, 'baseGoal');
  const runefestProgressPct = buildTargetProgress(GOAL_PROGRESS_BASELINE, player, 'runefest');
  const maxCapeProgressPct = buildTargetProgress(GOAL_PROGRESS_BASELINE, player, 'maxCape');
  const runefestProjection = buildGoalProjection(
    'Total Level 2250',
    runefestDaysLeft,
    runefestProjectionPlan.hoursLeft,
    runefestProjectionPlan.unestimatedSkills,
    runefestProgressPct,
    getPacePct('2026-10-03')
  );
  const goalProjections: {
    baseGoal: GoalProjection;
    runefest: GoalProjection;
    maxCape: GoalProjection;
  } = {
    baseGoal: buildGoalProjection(
      GOAL_ONE_LABEL,
      daysUntil(GOAL_ONE_DEADLINE),
      baseGoalHours,
      baseGoalUnestimated,
      baseGoalProgressPct,
      getPacePct(GOAL_ONE_DEADLINE)
    ),
    runefest: runefestProjection,
    maxCape: buildGoalProjection(
      'Max Cape',
      daysUntil(MAX_CAPE_DEADLINE),
      maxHours,
      maxUnestimated,
      maxCapeProgressPct,
      getPacePct(MAX_CAPE_DEADLINE)
    ),
  };
  const coachingParts = [
    `${goalProjections.baseGoal.label} ${describeGoalStatus(goalProjections.baseGoal.status)}${goalProjections.baseGoal.hoursPerDay !== null ? ` at ${goalProjections.baseGoal.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
    `${goalProjections.maxCape.label} ${describeGoalStatus(goalProjections.maxCape.status)}${goalProjections.maxCape.hoursPerDay !== null ? ` at ${goalProjections.maxCape.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
  ];

  return {
    currentWeek,
    generatedAt,
    generatedAtLabel: formatGeneratedAtLabel(generatedAt),
    mode: hasDelta ? 'delta' : 'snapshot',
    reportDateKey,
    snapshotDateLabel: snapshotKey ? formatSnapshotDate(snapshotKey) : reportDateKey ? formatSnapshotDate(reportDateKey) : 'Live snapshot',
    totalXp:
      dailySummary?.totalXp ??
      (hasDelta
        ? Math.max(player.overall.experience - (previousPlayer?.overall.experience ?? player.overall.experience), 0)
        : player.overall.experience),
    totalLevel: player.overall.level,
    effectiveHours,
    topSkills,
    friends,
    lastSevenDays,
    baseGoalRemaining,
    maxClosest,
    maxedSkills,
    hoursToNextLevel,
    milestoneAlerts,
    goalProjections,
    runefestEffectiveLevelsPerDayNeeded,
    runefestEffectiveLevelsRemaining,
    runefestLevelsPerDayNeeded,
    coachingText: coachingParts.join(' '),
  };
}

export async function fetchRunescapeTrackerSnapshot() {
  let store: SnapshotStore = { snapshots: {} };

  try {
    store = await readSnapshotStore();
  } catch {
    store = { snapshots: {} };
  }

  let liveData: OsrsApiResponse;

  try {
    liveData = await fetchRawRunescapeData();
  } catch (error) {
    const cachedTracker = await buildTrackerFromLatestStoredSnapshot(store);
    const message = error instanceof Error ? error.message : 'Unable to reach the live OSRS tracker feed.';

    throw new CachedRunescapeTrackerError(`${message} Showing the latest cached OSRS snapshot instead.`, cachedTracker);
  }

  const todayKey = getTodaySnapshotKey();
  const reportedSnapshotKey = getReportedSnapshotKey(liveData, todayKey);

  if (
    hasReachedDailySnapshotTime() &&
    shouldUpdateStoredTodaySnapshot(store.snapshots[reportedSnapshotKey], liveData)
  ) {
    store.snapshots[reportedSnapshotKey] = liveData;

    try {
      await writeSnapshotStore(store);
    } catch {
      const metadataSummary = getTodaySnapshotSummaryFromMetadata(liveData, PRIMARY_USERNAME) ?? createEmptySevenDaySummary();
      return buildLiveRunescapeTracker(liveData, undefined, PRIMARY_USERNAME, reportedSnapshotKey, metadataSummary);
    }
  }

  const metadataSummary = getTodaySnapshotSummaryFromMetadata(liveData, PRIMARY_USERNAME);
  const lastSevenDays = buildTrackerSevenDaySummaryFromSnapshotStore(store, PRIMARY_USERNAME, metadataSummary);
  const latestSnapshotKey = store.snapshots[reportedSnapshotKey] ? reportedSnapshotKey : findLatestSnapshotKey(store);

  if (latestSnapshotKey) {
    const previousKey =
      latestSnapshotKey === reportedSnapshotKey ? findPreviousSnapshotKey(store, latestSnapshotKey) : latestSnapshotKey;

    return buildLiveRunescapeTracker(
      liveData,
      previousKey ? store.snapshots[previousKey] : undefined,
      PRIMARY_USERNAME,
      latestSnapshotKey,
      lastSevenDays
    );
  }

  return buildLiveRunescapeTracker(
    liveData,
    undefined,
    PRIMARY_USERNAME,
    reportedSnapshotKey,
    metadataSummary ?? createEmptySevenDaySummary()
  );
}

export function getFallbackRunescapeTracker() {
  return fallbackTracker();
}
