import { formatOsrsSkillName, resolveOsrsEffectiveHours } from './osrsEffectiveHours.ts';
import { fetchRawRunescapeData } from './osrsTrackerFetch.ts';
import {
  GOAL_ONE_DEADLINE,
  GOAL_ONE_LABEL,
  GOAL_PROGRESS_BASELINE,
  GOAL_TRAINING_PLANS,
  buildGoalProjection,
  buildRuneFestProjection,
  buildTargetProgress,
  daysUntil,
  describeGoalStatus,
  getEffectiveLevelsRemaining,
  getGoalOneTargetLevel,
  getNextLevel,
  getPacePct,
  isSlayerTrackedSkill,
  percentToTarget,
  xpForLevel,
} from './osrsTrackerGoals.ts';
import { getPlayerEntries, getPlayerStats, getSkillDelta, getTrackerMetadata } from './osrsTrackerParsers.ts';
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

function getTodaySnapshotSummaryFromMetadata(data: OsrsApiResponse, username: string) {
  return readTrackerSevenDaySummaryFromMetadata(getTrackerMetadata(data)?.lastSevenDays?.[username]);
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
    mode: 'snapshot',
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
        label: 'RuneFest 2250',
        daysLeft: 0,
        hoursLeft: null,
        hoursPerDay: null,
        status: 'Off track',
        unestimatedSkills: [],
        progressPct: 0,
        pacePct: 0,
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

  if (!player) {
    return fallbackTracker();
  }

  const hasDelta = Boolean(previousPlayer);

  const skills = SKILL_ORDER
    .filter((skill) => player[skill] && player[skill].experience >= 0)
    .map((skill) => ({
      skill,
      ...player[skill],
    }));
  const effectiveHours = getEffectiveHours(currentData, previousData, username, skills);

  const topSkills = [...skills]
    .map((skill) => ({
      skill: formatOsrsSkillName(skill.skill),
      xp: hasDelta ? getSkillDelta(player, previousPlayer, skill.skill) : skill.experience,
      level: skill.level,
    }))
    .filter((skill) => !hasDelta || skill.xp > 0)
    .sort((left, right) => right.xp - left.xp)
    .slice(0, 5)
    .map(({ skill, xp }) => ({ skill, xp }));

  const friends = getPlayerEntries(currentData)
    .filter(([name]) => name !== username)
    .map(([name, stats]) => {
      const previousFriend = previousData ? getPlayerStats(previousData, name) : null;
      const overallXp = hasDelta
        ? Math.max(stats.overall.experience - (previousFriend?.overall.experience ?? stats.overall.experience), 0)
        : stats.overall.experience;
      const yourValue = hasDelta
        ? Math.max(player.overall.experience - (previousPlayer?.overall.experience ?? player.overall.experience), 0)
        : player.overall.experience;

      return {
        name,
        overallXp,
        diff: yourValue - overallXp,
        topSkills: SKILL_ORDER.filter((skill) => stats[skill] && stats[skill].experience >= 0)
          .map((skill) => ({
            skill,
            xp: hasDelta ? getSkillDelta(stats, previousFriend, skill) : stats[skill].experience,
            level: stats[skill].level,
          }))
          .filter((skill) => !hasDelta || skill.xp > 0)
          .sort((left, right) => right.xp - left.xp)
          .slice(0, 3)
          .map((skill) => ({
            skill: formatOsrsSkillName(skill.skill),
            xp: skill.xp,
            level: skill.level,
          })),
      };
    })
    .sort((left, right) => {
      const leftIndex = FRIEND_ORDER.indexOf(left.name as (typeof FRIEND_ORDER)[number]);
      const rightIndex = FRIEND_ORDER.indexOf(right.name as (typeof FRIEND_ORDER)[number]);
      const safeLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
      const safeRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

      return safeLeftIndex - safeRightIndex;
    });

  const baseGoalRemaining = [...skills]
    .filter((skill) => skill.level < getGoalOneTargetLevel(skill.skill))
    .sort(
      (left, right) =>
        xpForLevel(getGoalOneTargetLevel(left.skill)) -
        left.experience -
        (xpForLevel(getGoalOneTargetLevel(right.skill)) - right.experience)
    )
    .map((skill) => ({
      skill: formatOsrsSkillName(skill.skill),
      level: skill.level,
      targetLevel: getGoalOneTargetLevel(skill.skill),
      pct: percentToTarget(skill.experience, getGoalOneTargetLevel(skill.skill)),
      remainingXp: Math.max(xpForLevel(getGoalOneTargetLevel(skill.skill)) - skill.experience, 0),
      xpPerHour: GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 0,
      hoursLeft:
        (GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 0) > 0
          ? Math.max(xpForLevel(getGoalOneTargetLevel(skill.skill)) - skill.experience, 0) /
            (GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 1)
          : null,
    }));

  const maxRemainingAll = [...skills]
    .filter((skill) => skill.level < 99)
    .sort((left, right) => xpForLevel(99) - left.experience - (xpForLevel(99) - right.experience))
    .map((skill) => ({
      skill: formatOsrsSkillName(skill.skill),
      level: skill.level,
      pct: percentToTarget(skill.experience, 99),
      remainingXp: Math.max(xpForLevel(99) - skill.experience, 0),
      xpPerHour: GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 0,
      hoursLeft:
        (GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 0) > 0
          ? Math.max(xpForLevel(99) - skill.experience, 0) / (GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 1)
          : null,
    }));
  const maxClosest = maxRemainingAll.slice(0, 5);

  const maxedSkills = skills.filter((skill) => skill.level >= 99).map((skill) => formatOsrsSkillName(skill.skill));
  const totalLevelTarget = 2250;
  const totalLevelsNeeded = Math.max(totalLevelTarget - player.overall.level, 0);

  const hoursToNextLevel = [...skills]
    .map((skill) => {
      const trainingPlan = GOAL_TRAINING_PLANS[skill.skill];
      const targetLevel = getNextLevel(skill.level);

      if (!trainingPlan || !targetLevel) {
        return null;
      }

      const remainingXp = Math.max(xpForLevel(targetLevel) - skill.experience, 0);

      if (remainingXp <= 0) {
        return null;
      }

      return {
        skill: formatOsrsSkillName(skill.skill),
        level: skill.level,
        targetLevel,
        remainingXp,
        xpPerHour: trainingPlan.xpPerHour,
        hoursLeft: trainingPlan.xpPerHour > 0 ? remainingXp / trainingPlan.xpPerHour : null,
        mode: trainingPlan.mode,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => {
      if (left.hoursLeft === null && right.hoursLeft === null) {
        return left.remainingXp - right.remainingXp;
      }

      if (left.hoursLeft === null) {
        return 1;
      }

      if (right.hoursLeft === null) {
        return -1;
      }

      return left.hoursLeft - right.hoursLeft;
    });

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
    'RuneFest 2250',
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
      daysUntil('2027-03-15'),
      maxHours,
      maxUnestimated,
      maxCapeProgressPct,
      getPacePct('2027-03-15')
    ),
  };
  const coachingParts = [
    `${goalProjections.baseGoal.label} ${describeGoalStatus(goalProjections.baseGoal.status)}${goalProjections.baseGoal.hoursPerDay !== null ? ` at ${goalProjections.baseGoal.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
    `${goalProjections.runefest.label} ${describeGoalStatus(goalProjections.runefest.status)}${goalProjections.runefest.hoursPerDay !== null ? ` at ${goalProjections.runefest.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
    `${goalProjections.maxCape.label} ${describeGoalStatus(goalProjections.maxCape.status)}${goalProjections.maxCape.hoursPerDay !== null ? ` at ${goalProjections.maxCape.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
  ];

  return {
    mode: hasDelta ? 'delta' : 'snapshot',
    snapshotDateLabel: snapshotKey ? formatSnapshotDate(snapshotKey) : 'Live snapshot',
    totalXp: hasDelta
      ? Math.max(player.overall.experience - (previousPlayer?.overall.experience ?? player.overall.experience), 0)
      : player.overall.experience,
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

  if (hasReachedDailySnapshotTime() && shouldUpdateStoredTodaySnapshot(store.snapshots[todayKey], liveData)) {
    store.snapshots[todayKey] = liveData;

    try {
      await writeSnapshotStore(store);
    } catch {
      const metadataSummary = getTodaySnapshotSummaryFromMetadata(liveData, PRIMARY_USERNAME) ?? createEmptySevenDaySummary();
      return buildLiveRunescapeTracker(liveData, undefined, PRIMARY_USERNAME, undefined, metadataSummary);
    }
  }

  const metadataSummary = getTodaySnapshotSummaryFromMetadata(liveData, PRIMARY_USERNAME);
  const lastSevenDays = buildTrackerSevenDaySummaryFromSnapshotStore(store, PRIMARY_USERNAME, metadataSummary);
  const latestSnapshotKey = store.snapshots[todayKey] ? todayKey : findLatestSnapshotKey(store);

  if (latestSnapshotKey) {
    const previousKey =
      latestSnapshotKey === todayKey ? findPreviousSnapshotKey(store, latestSnapshotKey) : latestSnapshotKey;

    return buildLiveRunescapeTracker(
      liveData,
      previousKey ? store.snapshots[previousKey] : undefined,
      PRIMARY_USERNAME,
      latestSnapshotKey,
      lastSevenDays
    );
  }

  return buildLiveRunescapeTracker(liveData, undefined, PRIMARY_USERNAME, undefined, metadataSummary ?? createEmptySevenDaySummary());
}

export function getFallbackRunescapeTracker() {
  return fallbackTracker();
}
