import type { ResolvedOsrsEffectiveHoursSummary } from './osrsEffectiveHours.ts';

export const FRIEND_ORDER = ['gwahpy', 'beefmissle13', 'kingxdabber', 'hedith'] as const;

export const SKILL_ORDER = [
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

export type SkillName = (typeof SKILL_ORDER)[number];

export type GoalProjection = {
  label: string;
  daysLeft: number;
  hoursLeft: number | null;
  hoursPerDay: number | null;
  status: 'On track' | 'Tight' | 'Off track';
  unestimatedSkills: string[];
  progressPct: number;
  pacePct: number;
};

export type GoalTrainingPlan = {
  xpPerHour: number;
  mode: string;
};

export type TrackerGoal = {
  skill: string;
  level: number;
  targetLevel?: number;
  pct: number;
  remainingXp: number;
  xpPerHour?: number;
  hoursLeft?: number | null;
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

export type TrackerSevenDayEntry = {
  dateKey: string;
  effectiveHours: number;
  label: string;
  topSkills: TrackerSummaryItem[];
  totalXp: number;
};

export type TrackerSevenDaySummary = {
  activeDays: number;
  averageEffectiveHours: number;
  averageXp: number;
  days: TrackerSevenDayEntry[];
  daysTracked: number;
  totalEffectiveHours: number;
  totalXp: number;
};

export type RunescapeTrackerMetadata = {
  effectiveHours?: Record<string, unknown>;
  generatedAt?: string;
  lastSevenDays?: Record<string, unknown>;
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

export type OsrsApiResponse = Record<string, unknown>;

export type LiveRunescapeTracker = {
  mode: 'delta' | 'snapshot';
  snapshotDateLabel: string;
  totalXp: number;
  totalLevel: number;
  effectiveHours: ResolvedOsrsEffectiveHoursSummary;
  topSkills: TrackerSummaryItem[];
  friends: TrackerFriendSummary[];
  lastSevenDays: TrackerSevenDaySummary;
  baseGoalRemaining: TrackerGoal[];
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
    baseGoal: GoalProjection;
    runefest: GoalProjection;
    maxCape: GoalProjection;
  };
  runefestLevelsPerDayNeeded: number;
  coachingText: string;
};
