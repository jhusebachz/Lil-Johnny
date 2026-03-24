import * as FileSystem from 'expo-file-system/legacy';

const TRACKER_URL =
  'https://raw.githubusercontent.com/jhusebachz/OSRS-Daily-Tracker/main/data/last_stats.json';
const TRACKER_TIME_ZONE = 'America/New_York';
const SNAPSHOT_HOUR = 8;
const SNAPSHOT_MINUTE = 45;
const SNAPSHOT_FILE = `${FileSystem.documentDirectory ?? ''}osrs-daily-snapshots.json`;

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
  hunter: { xpPerHour: 130000, mode: 'active' },
  thieving: { xpPerHour: 180000, mode: 'active' },
  sailing: { xpPerHour: 60000, mode: 'afk' },
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
    }));

  const maxClosest = [...skills]
    .filter((skill) => skill.level < 99)
    .sort((left, right) => xpForLevel(99) - left.experience - (xpForLevel(99) - right.experience))
    .slice(0, 5)
    .map((skill) => ({
      skill: formatSkillName(skill.skill),
      level: skill.level,
      pct: percentToTarget(skill.experience, 99),
      remainingXp: Math.max(xpForLevel(99) - skill.experience, 0),
    }));

  const maxedSkills = skills
    .filter((skill) => skill.level >= 99)
    .map((skill) => formatSkillName(skill.skill))
    .slice(0, 8);

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

  const mostUrgent = base90Remaining[0];
  const strongestGain = topSkills[0];
  const coachingText = hasDelta
    ? `${
        strongestGain ? `${strongestGain.skill} led the gain block with ${strongestGain.xp.toLocaleString()} xp.` : ''
      } ${
        mostUrgent
          ? `${mostUrgent.skill} is still the biggest gap to close for Base 90, with ${mostUrgent.remainingXp.toLocaleString()} xp left.`
          : 'Most of the account is already in a strong place.'
      }`
    : mostUrgent
      ? `${mostUrgent.skill} is the biggest push to shore up right now, with ${mostUrgent.remainingXp.toLocaleString()} xp left to 90.`
      : 'Most skills are already in a strong place. Keep momentum on the closest 99 targets.';
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
