import * as FileSystem from 'expo-file-system/legacy';

const TRACKER_URL =
  'https://raw.githubusercontent.com/jhusebachz/OSRS-Daily-Tracker/main/data/last_stats.json';
const TRACKER_TIME_ZONE = 'America/New_York';
const SNAPSHOT_HOUR = 8;
const SNAPSHOT_MINUTE = 45;
const SNAPSHOT_FILE = `${FileSystem.documentDirectory ?? ''}osrs-daily-snapshots.json`;
const GOAL_PROGRESS_START = '2026-03-25';

const SKILL_ORDER = [
  'attack',
  'defence',
  'strength',
  'hitpoints',
  'ranged',
  'prayer',
  'magic',
  'cooking',
  'woodcutting',
  'fletching',
  'fishing',
  'firemaking',
  'crafting',
  'smithing',
  'mining',
  'herblore',
  'agility',
  'thieving',
  'slayer',
  'farming',
  'runecraft',
  'hunter',
  'construction',
  'sailing',
] as const;

type SkillName = (typeof SKILL_ORDER)[number];

type GoalTrainingPlan = {
  xpPerHour: number;
  mode: string;
};

type GoalProjection = {
  label: string;
  daysLeft: number;
  hoursLeft: number | null;
  hoursPerDay: number | null;
  status: 'On track' | 'Tight' | 'Off track' | 'Needs manual lane';
  unestimatedSkills: string[];
  progressPct: number;
  pacePct: number;
};

export type OsrsSkillStat = {
  metric: string;
  experience: number;
  rank: number;
  level: number;
  ehp: number;
};

export type OsrsPlayerStats = {
  overall: OsrsSkillStat;
} & Record<SkillName, OsrsSkillStat>;

export type OsrsApiResponse = Record<string, OsrsPlayerStats>;

type SnapshotStore = {
  snapshots: Record<string, OsrsApiResponse>;
};

export type TrackerSummaryItem = {
  skill: string;
  xp: number;
};

export type TrackerFriendSummary = {
  name: string;
  overallXp: number;
  diff: number;
  topSkills: {
    skill: string;
    xp: number;
    level: number;
  }[];
};

export type TrackerGoal = {
  skill: string;
  level: number;
  pct: number;
  remainingXp: number;
  xpPerHour?: number;
  hoursLeft?: number | null;
};

export type LiveRunescapeTracker = {
  mode: 'delta' | 'snapshot';
  snapshotDateLabel: string;
  totalXp: number;
  totalLevel: number;
  topSkills: TrackerSummaryItem[];
  friends: TrackerFriendSummary[];
  base90Remaining: TrackerGoal[];
  maxClosest: TrackerGoal[];
  maxedSkills: string[];
  hoursToNextLevel: {
    skill: string;
    level: number;
    targetLevel: number;
    remainingXp: number;
    xpPerHour: number;
    hoursLeft: number | null;
    mode: string;
  }[];
  milestoneAlerts: {
    skill: string;
    target: string;
    remainingXp: number;
  }[];
  goalProjections: {
    base90: GoalProjection;
    runefest: GoalProjection;
    maxCape: GoalProjection;
  };
  runefestLevelsPerDayNeeded: number;
  coachingText: string;
};

const GOAL_TRAINING_PLANS: Partial<Record<SkillName, GoalTrainingPlan>> = {
  attack: { xpPerHour: 0, mode: 'trained via Slayer' },
  strength: { xpPerHour: 0, mode: 'trained via Slayer' },
  defence: { xpPerHour: 0, mode: 'trained via Slayer' },
  hitpoints: { xpPerHour: 0, mode: 'trained via Slayer' },
  ranged: { xpPerHour: 0, mode: 'trained via Slayer' },
  magic: { xpPerHour: 0, mode: 'trained via Slayer' },
  slayer: { xpPerHour: 40000, mode: 'active' },
  prayer: { xpPerHour: 150000, mode: 'semi-afk' },
  runecraft: { xpPerHour: 50000, mode: 'active' },
  construction: { xpPerHour: 220000, mode: 'active' },
  herblore: { xpPerHour: 200000, mode: 'active' },
  agility: { xpPerHour: 50000, mode: 'active' },
  crafting: { xpPerHour: 200000, mode: 'active' },
  smithing: { xpPerHour: 220000, mode: 'active' },
  woodcutting: { xpPerHour: 70000, mode: 'afk' },
  fishing: { xpPerHour: 40000, mode: 'afk' },
  mining: { xpPerHour: 40000, mode: 'afk' },
  hunter: { xpPerHour: 70000, mode: 'afk' },
  thieving: { xpPerHour: 180000, mode: 'active' },
  sailing: { xpPerHour: 60000, mode: 'afk' },
};

const GOAL_PROGRESS_BASELINE: Record<SkillName | 'overall', Pick<OsrsSkillStat, 'level' | 'experience'>> = {
  overall: { level: 2203, experience: 173773255 },
  attack: { level: 91, experience: 6122415 },
  defence: { level: 90, experience: 5712800 },
  strength: { level: 92, experience: 7038075 },
  hitpoints: { level: 95, experience: 9363218 },
  ranged: { level: 92, experience: 7052764 },
  prayer: { level: 89, experience: 5079595 },
  magic: { level: 95, experience: 8857017 },
  cooking: { level: 99, experience: 13063406 },
  woodcutting: { level: 90, experience: 5440702 },
  fletching: { level: 99, experience: 13038303 },
  fishing: { level: 90, experience: 5424395 },
  firemaking: { level: 99, experience: 13044402 },
  crafting: { level: 90, experience: 5382552 },
  smithing: { level: 90, experience: 5414717 },
  mining: { level: 90, experience: 5367729 },
  herblore: { level: 90, experience: 5618952 },
  agility: { level: 90, experience: 5361513 },
  thieving: { level: 87, experience: 4003425 },
  slayer: { level: 89, experience: 4932213 },
  farming: { level: 99, experience: 14415682 },
  runecraft: { level: 83, experience: 2749504 },
  hunter: { level: 86, experience: 3625366 },
  construction: { level: 90, experience: 5361184 },
  sailing: { level: 98, experience: 12303326 },
};

function formatSkillName(skill: string) {
  if (skill === 'runecraft') {
    return 'Runecraft';
  }

  return `${skill.charAt(0).toUpperCase()}${skill.slice(1)}`;
}

function xpForLevel(level: number) {
  let points = 0;

  for (let current = 1; current < level; current += 1) {
    points += Math.floor(current + 300 * Math.pow(2, current / 7));
  }

  return Math.floor(points / 4);
}

function percentToTarget(experience: number, targetLevel: number) {
  const targetXp = xpForLevel(targetLevel);
  const progressed = Math.max(experience, 0);

  return Math.max(0, Math.min(100, (progressed / Math.max(targetXp, 1)) * 100));
}

function daysUntil(targetDate: string, now = new Date()) {
  const goalDate = new Date(`${targetDate}T12:00:00-05:00`);
  const diff = goalDate.getTime() - now.getTime();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
}

function getGoalStatus(hoursPerDay: number | null, unestimatedSkills: string[]) {
  if (unestimatedSkills.length > 0) {
    return 'Needs manual lane' as const;
  }

  if (hoursPerDay === null) {
    return 'Off track' as const;
  }

  if (hoursPerDay <= 1.5) {
    return 'On track' as const;
  }

  if (hoursPerDay <= 3) {
    return 'Tight' as const;
  }

  return 'Off track' as const;
}

function describeGoalStatus(status: GoalProjection['status']) {
  switch (status) {
    case 'On track':
      return 'is on track';
    case 'Tight':
      return 'looks tight';
    case 'Off track':
      return 'looks off track';
    case 'Needs manual lane':
      return 'needs a manual estimate';
    default:
      return 'needs review';
  }
}

function isSlayerTrackedSkill(skill: string) {
  return GOAL_TRAINING_PLANS[skill as SkillName]?.mode === 'trained via Slayer';
}

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getPacePct(targetDate: string, now = new Date()) {
  const start = new Date(`${GOAL_PROGRESS_START}T00:00:00-05:00`).getTime();
  const end = new Date(`${targetDate}T23:59:59-05:00`).getTime();
  const current = now.getTime();

  if (end <= start) {
    return 100;
  }

  return clampPct(((current - start) / (end - start)) * 100);
}

function buildGoalProjection(
  label: string,
  daysLeft: number,
  estimatedHours: number,
  unestimatedSkills: string[],
  progressPct = 0,
  pacePct = 0
): GoalProjection {
  const safeDaysLeft = Math.max(daysLeft, 1);
  const hoursLeft = estimatedHours > 0 ? estimatedHours : 0;
  const hoursPerDay = hoursLeft / safeDaysLeft;

  return {
    label,
    daysLeft,
    hoursLeft,
    hoursPerDay,
    status: getGoalStatus(hoursPerDay, unestimatedSkills),
    unestimatedSkills,
    progressPct,
    pacePct,
  };
}

function buildRuneFestProjection(skills: (OsrsSkillStat & { skill: SkillName })[], levelsNeeded: number) {
  if (levelsNeeded <= 0) {
    return {
      hoursLeft: 0,
      xpLeft: 0,
      unestimatedSkills: [] as string[],
    };
  }

  const projectedSkills = skills.map((skill) => ({
    skill: skill.skill,
    level: skill.level,
    experience: skill.experience,
  }));
  const unestimatedSkills = new Set<string>();
  let hoursLeft = 0;
  let xpLeft = 0;
  let remainingLevels = levelsNeeded;

  while (remainingLevels > 0) {
    let bestIndex = -1;
    let bestHours = Number.POSITIVE_INFINITY;

    projectedSkills.forEach((skill, index) => {
      const trainingPlan = GOAL_TRAINING_PLANS[skill.skill];

      if (!trainingPlan || trainingPlan.xpPerHour <= 0 || skill.level >= 99) {
        return;
      }

      const nextLevel = skill.level + 1;
      const remainingXp = Math.max(xpForLevel(nextLevel) - skill.experience, 0);
      const levelHours = remainingXp / trainingPlan.xpPerHour;

      if (remainingXp > 0 && levelHours < bestHours) {
        bestHours = levelHours;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) {
      projectedSkills
        .filter((skill) => skill.level < 99)
        .forEach((skill) => unestimatedSkills.add(formatSkillName(skill.skill)));
      break;
    }

    const chosenSkill = projectedSkills[bestIndex];
    const xpNeededForChosenLevel = Math.max(xpForLevel(chosenSkill.level + 1) - chosenSkill.experience, 0);
    chosenSkill.level += 1;
    chosenSkill.experience = xpForLevel(chosenSkill.level);
    hoursLeft += bestHours;
    xpLeft += xpNeededForChosenLevel;
    remainingLevels -= 1;
  }

  return {
    hoursLeft,
    xpLeft,
    unestimatedSkills: [...unestimatedSkills],
  };
}

function buildTargetProgress(
  baselineSkills: Record<SkillName | 'overall', Pick<OsrsSkillStat, 'level' | 'experience'>>,
  currentPlayer: OsrsPlayerStats,
  targetType: 'base90' | 'runefest' | 'maxCape'
) {
  if (targetType === 'runefest') {
    const baselineLevelsNeeded = Math.max(2250 - baselineSkills.overall.level, 0);
    const baselineProjection = buildRuneFestProjection(
      SKILL_ORDER.map((skill) => ({
        skill,
        ...baselineSkills[skill],
        metric: skill,
        rank: 0,
        ehp: 0,
      })),
      baselineLevelsNeeded
    );
    const currentLevelsNeeded = Math.max(2250 - currentPlayer.overall.level, 0);
    const currentProjection = buildRuneFestProjection(
      SKILL_ORDER.map((skill) => ({
        skill,
        ...currentPlayer[skill],
      })),
      currentLevelsNeeded
    );
    const totalNeededXp = baselineProjection.xpLeft;
    const remainingXp = currentProjection.xpLeft;

    return clampPct(totalNeededXp > 0 ? ((totalNeededXp - remainingXp) / totalNeededXp) * 100 : 100);
  }

  const targetLevel = targetType === 'base90' ? 90 : 99;
  let totalNeededXp = 0;
  let remainingXp = 0;

  SKILL_ORDER.forEach((skill) => {
    const baseline = baselineSkills[skill];
    if (baseline.level >= targetLevel) {
      return;
    }

    const targetXp = xpForLevel(targetLevel);
    totalNeededXp += Math.max(targetXp - baseline.experience, 0);
    remainingXp += Math.max(targetXp - currentPlayer[skill].experience, 0);
  });

  return clampPct(totalNeededXp > 0 ? ((totalNeededXp - remainingXp) / totalNeededXp) * 100 : 100);
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

async function readSnapshotStore(): Promise<SnapshotStore> {
  const fileInfo = await FileSystem.getInfoAsync(SNAPSHOT_FILE);

  if (!fileInfo.exists) {
    return { snapshots: {} };
  }

  const raw = await FileSystem.readAsStringAsync(SNAPSHOT_FILE);

  if (!raw.trim()) {
    return { snapshots: {} };
  }

  try {
    return JSON.parse(raw) as SnapshotStore;
  } catch {
    return { snapshots: {} };
  }
}

async function writeSnapshotStore(store: SnapshotStore) {
  await FileSystem.writeAsStringAsync(SNAPSHOT_FILE, JSON.stringify(store));
}

async function fetchRawRunescapeData() {
  const response = await fetch(TRACKER_URL);

  if (!response.ok) {
    throw new Error(`OSRS tracker request failed: ${response.status}`);
  }

  return (await response.json()) as OsrsApiResponse;
}

function findLatestSnapshotKey(store: SnapshotStore) {
  return Object.keys(store.snapshots).sort().at(-1) ?? null;
}

function findPreviousSnapshotKey(store: SnapshotStore, currentKey: string) {
  return Object.keys(store.snapshots)
    .filter((key) => key < currentKey)
    .sort()
    .at(-1) ?? null;
}

function fallbackTracker(): LiveRunescapeTracker {
  return {
    mode: 'snapshot',
    snapshotDateLabel: 'No snapshot yet',
    totalXp: 0,
    totalLevel: 0,
    topSkills: [],
    friends: [],
    base90Remaining: [],
    maxClosest: [],
    maxedSkills: [],
    hoursToNextLevel: [],
    milestoneAlerts: [],
    goalProjections: {
      base90: {
        label: 'Base 90',
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

  return buildLiveRunescapeTracker(
    latestData,
    previousKey ? resolvedStore.snapshots[previousKey] : undefined,
    'jhusebachz',
    latestSnapshotKey
  );
}

function getSkillDelta(
  currentPlayer: OsrsPlayerStats,
  previousPlayer: OsrsPlayerStats | undefined,
  skill: SkillName
) {
  const currentXp = currentPlayer[skill]?.experience ?? 0;
  const previousXp = previousPlayer?.[skill]?.experience ?? currentXp;

  return Math.max(currentXp - previousXp, 0);
}

function getNextLevel(level: number): number | null {
  if (level >= 99) {
    return null;
  }

  return level + 1;
}

export function buildLiveRunescapeTracker(
  currentData: OsrsApiResponse,
  previousData?: OsrsApiResponse,
  username = 'jhusebachz',
  snapshotKey?: string
): LiveRunescapeTracker {
  const player = currentData[username];
  const previousPlayer = previousData?.[username];

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

  const topSkills = [...skills]
    .map((skill) => ({
      skill: formatSkillName(skill.skill),
      xp: hasDelta ? getSkillDelta(player, previousPlayer, skill.skill) : skill.experience,
      level: skill.level,
    }))
    .sort((left, right) => right.xp - left.xp)
    .slice(0, 5)
    .map(({ skill, xp }) => ({ skill, xp }));

  const friends = Object.entries(currentData)
    .filter(([name]) => name !== username)
    .map(([name, stats]) => {
      const previousFriend = previousData?.[name];
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
          .sort((left, right) => right.xp - left.xp)
          .slice(0, 3)
          .map((skill) => ({
            skill: formatSkillName(skill.skill),
            xp: skill.xp,
            level: skill.level,
          })),
      };
    })
    .sort((left, right) => right.overallXp - left.overallXp);

  const base90Remaining = [...skills]
    .filter((skill) => skill.level < 90)
    .sort((left, right) => xpForLevel(90) - left.experience - (xpForLevel(90) - right.experience))
    .slice(0, 5)
    .map((skill) => ({
      skill: formatSkillName(skill.skill),
      level: skill.level,
      pct: percentToTarget(skill.experience, 90),
      remainingXp: Math.max(xpForLevel(90) - skill.experience, 0),
      xpPerHour: GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 0,
      hoursLeft:
        (GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 0) > 0
          ? Math.max(xpForLevel(90) - skill.experience, 0) / (GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 1)
          : null,
    }));

  const maxRemainingAll = [...skills]
    .filter((skill) => skill.level < 99)
    .sort((left, right) => xpForLevel(99) - left.experience - (xpForLevel(99) - right.experience))
    .map((skill) => ({
      skill: formatSkillName(skill.skill),
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

  const maxedSkills = skills
    .filter((skill) => skill.level >= 99)
    .map((skill) => formatSkillName(skill.skill))
    .slice(0, 8);
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
        skill: formatSkillName(skill.skill),
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
        skill: formatSkillName(skill.skill),
        target: `Lv${targetLevel}`,
        remainingXp,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .sort((left, right) => left.remainingXp - right.remainingXp)
    .slice(0, 5);

  const base90Hours = base90Remaining.reduce((total, item) => total + (item.hoursLeft ?? 0), 0);
  const base90Unestimated = base90Remaining
    .filter((item) => item.hoursLeft === null && !isSlayerTrackedSkill(item.skill.toLowerCase()))
    .map((item) => item.skill);
  const maxHours = maxRemainingAll.reduce((total, item) => total + (item.hoursLeft ?? 0), 0);
  const maxUnestimated = maxRemainingAll
    .filter((item) => item.hoursLeft === null && !isSlayerTrackedSkill(item.skill.toLowerCase()))
    .map((item) => item.skill);
  const runefestLevelsPerDayNeeded = totalLevelsNeeded > 0 ? totalLevelsNeeded / Math.max(daysUntil('2026-10-03'), 1) : 0;
  const runefestProjectionPlan = buildRuneFestProjection(skills, totalLevelsNeeded);
  const base90ProgressPct = buildTargetProgress(GOAL_PROGRESS_BASELINE, player, 'base90');
  const runefestProgressPct = buildTargetProgress(GOAL_PROGRESS_BASELINE, player, 'runefest');
  const maxCapeProgressPct = buildTargetProgress(GOAL_PROGRESS_BASELINE, player, 'maxCape');
  const runefestProjection = buildGoalProjection(
    'RuneFest 2250',
    daysUntil('2026-10-03'),
    runefestProjectionPlan.hoursLeft,
    runefestProjectionPlan.unestimatedSkills,
    runefestProgressPct,
    getPacePct('2026-10-03')
  );
  const goalProjections = {
    base90: buildGoalProjection(
      'Base 90',
      daysUntil('2026-05-22'),
      base90Hours,
      base90Unestimated,
      base90ProgressPct,
      getPacePct('2026-05-22')
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
    `${goalProjections.base90.label} ${describeGoalStatus(goalProjections.base90.status)}${goalProjections.base90.hoursPerDay !== null ? ` at ${goalProjections.base90.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
    `${goalProjections.runefest.label} ${describeGoalStatus(goalProjections.runefest.status)}${goalProjections.runefest.hoursPerDay !== null ? ` at ${goalProjections.runefest.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
    `${goalProjections.maxCape.label} ${describeGoalStatus(goalProjections.maxCape.status)}${goalProjections.maxCape.hoursPerDay !== null ? ` at ${goalProjections.maxCape.hoursPerDay.toFixed(2)} hours/day` : ''}.`,
  ];
  const manualLaneSkills = [
    ...new Set([
      ...goalProjections.base90.unestimatedSkills,
      ...goalProjections.runefest.unestimatedSkills,
      ...goalProjections.maxCape.unestimatedSkills,
    ]),
  ];
  if (manualLaneSkills.length > 0) {
    coachingParts.push(`Manual estimate still needed for: ${manualLaneSkills.join(', ')}.`);
  }
  const coachingText = coachingParts.join(' ');
  return {
    mode: hasDelta ? 'delta' : 'snapshot',
    snapshotDateLabel: snapshotKey ? formatSnapshotDate(snapshotKey) : 'Live snapshot',
    totalXp: hasDelta
      ? Math.max(player.overall.experience - (previousPlayer?.overall.experience ?? player.overall.experience), 0)
      : player.overall.experience,
    totalLevel: player.overall.level,
    topSkills,
    friends,
    base90Remaining,
    maxClosest,
    maxedSkills,
    hoursToNextLevel,
    milestoneAlerts,
    goalProjections,
    runefestLevelsPerDayNeeded,
    coachingText,
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
  } catch {
    return buildTrackerFromLatestStoredSnapshot(store);
  }

  const todayKey = getTodaySnapshotKey();

  if (hasReachedDailySnapshotTime() && !store.snapshots[todayKey]) {
    store.snapshots[todayKey] = liveData;

    try {
      await writeSnapshotStore(store);
    } catch {
      return buildLiveRunescapeTracker(liveData, undefined, 'jhusebachz');
    }
  }

  const latestSnapshotKey = store.snapshots[todayKey] ? todayKey : findLatestSnapshotKey(store);

  if (latestSnapshotKey) {
    const previousKey =
      latestSnapshotKey === todayKey
        ? findPreviousSnapshotKey(store, latestSnapshotKey)
        : latestSnapshotKey;

    return buildLiveRunescapeTracker(
      liveData,
      previousKey ? store.snapshots[previousKey] : undefined,
      'jhusebachz',
      latestSnapshotKey
    );
  }

  return buildLiveRunescapeTracker(liveData, undefined, 'jhusebachz');
}

export function getFallbackRunescapeTracker() {
  return fallbackTracker();
}
