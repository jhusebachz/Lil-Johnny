import { GOAL_TRAINING_PLANS, xpForLevel } from './osrsTrackerGoals.ts';
import { getPlayerStats, getTrackerMetadata } from './osrsTrackerParsers.ts';
import { SKILL_ORDER } from './osrsTrackerTypes.ts';
import type {
  OsrsApiResponse,
  OsrsPlayerStats,
  SkillName,
  TrackerIronmanMilestone,
  TrackerMaxCapePace,
} from './osrsTrackerTypes.ts';

const START_DATE = '2026-11-10';
const DEADLINE = '2027-12-31';
const COMBAT_SKILLS = new Set<SkillName>(['attack', 'strength', 'defence', 'hitpoints', 'ranged', 'magic']);
const IRONMAN_TIERS = [30, 40, 50, 60, 70, 80, 90, 99];

// Fixed November 10, 2026 HiScores snapshot; does not advance after a refresh.
// Used as an offline/older-feed fallback until the tracker publishes maxCapePace.
const START_XP: Record<SkillName, number> = {
  attack: 6911064, defence: 7346630, strength: 8978556, hitpoints: 11963566,
  ranged: 9539002, prayer: 5913748, magic: 10269148, cooking: 13068433,
  woodcutting: 13079713, fletching: 13071209, fishing: 7969315,
  firemaking: 13044442, crafting: 6615502, smithing: 6570952,
  mining: 7364278, herblore: 6558088, agility: 6368115,
  thieving: 6521043, slayer: 6881525, farming: 14439043,
  runecraft: 5351333, hunter: 6529179, construction: 6537896,
  sailing: 12331208,
};

function validPlayer(player: OsrsPlayerStats | null): player is OsrsPlayerStats {
  return Boolean(player && SKILL_ORDER.every((skill) =>
    player[skill] && Number.isFinite(player[skill].level) && player[skill].level >= 1 &&
    Number.isFinite(player[skill].experience) && player[skill].experience >= 0
  ));
}

function wholeDays(start: string, end: string) {
  const startTime = Date.parse(`${start}T12:00:00Z`);
  const endTime = Date.parse(`${end}T12:00:00Z`);
  return Number.isFinite(startTime) && Number.isFinite(endTime)
    ? Math.round((endTime - startTime) / 86_400_000)
    : 0;
}

function rounded(value: number, places = 4) {
  return Math.round(value * 10 ** places) / 10 ** places;
}

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === 'object' && !Array.isArray(raw);
}

function readPublishedMaxPace(raw: unknown): TrackerMaxCapePace | null {
  if (!isRecord(raw) || raw.available !== true || !Array.isArray(raw.timedSkills) || !Array.isArray(raw.untimedCombat)) {
    return null;
  }
  const fields = [
    'daysLeft', 'maxedSkills', 'totalSkills', 'totalLevel', 'xpProgressPct', 'startingTimedHours',
    'completedTimedHours', 'expectedTimedHours', 'remainingTimedHours', 'hoursAhead', 'timedProgressPct',
  ];
  if (typeof raw.startDate !== 'string' || typeof raw.deadline !== 'string' ||
      fields.some((key) => typeof raw[key] !== 'number' || !Number.isFinite(raw[key]))) {
    return null;
  }
  const skillEntriesValid = raw.timedSkills.every((item) => isRecord(item) &&
    typeof item.skill === 'string' && SKILL_ORDER.includes(item.skill as SkillName) &&
    ['level', 'remainingXp', 'hoursLeft', 'xpPerHour'].every((key) => typeof item[key] === 'number' && Number.isFinite(item[key])));
  const combatValid = raw.untimedCombat.every((item) => isRecord(item) &&
    typeof item.skill === 'string' && SKILL_ORDER.includes(item.skill as SkillName) &&
    typeof item.level === 'number' && typeof item.remainingXp === 'number');
  if (!skillEntriesValid || !combatValid) return null;
  return raw as unknown as TrackerMaxCapePace;
}

function computeMaxPace(player: OsrsPlayerStats, reportDate: string): TrackerMaxCapePace {
  const targetXp = xpForLevel(99);
  let starting = 0;
  let remaining = 0;
  let cappedXp = 0;
  let maxed = 0;
  const timedSkills: TrackerMaxCapePace['timedSkills'] = [];
  const untimedCombat: TrackerMaxCapePace['untimedCombat'] = [];
  const unestimatedSkills: SkillName[] = [];

  for (const skill of SKILL_ORDER) {
    const current = player[skill];
    cappedXp += Math.min(targetXp, current.experience);
    if (current.level >= 99) maxed += 1;
    if (COMBAT_SKILLS.has(skill)) {
      if (current.level < 99) untimedCombat.push({
        skill, level: current.level, remainingXp: Math.max(targetXp - current.experience, 0),
      });
      continue;
    }
    const rate = GOAL_TRAINING_PLANS[skill]?.xpPerHour ?? 0;
    if (rate <= 0) {
      if (current.level < 99) unestimatedSkills.push(skill);
      continue;
    }
    starting += Math.max(targetXp - START_XP[skill], 0) / rate;
    const hoursLeft = Math.max(targetXp - current.experience, 0) / rate;
    remaining += hoursLeft;
    if (current.level < 99) timedSkills.push({
      skill, level: current.level, remainingXp: Math.max(targetXp - current.experience, 0),
      hoursLeft, xpPerHour: rate,
    });
  }
  timedSkills.sort((a, b) => b.hoursLeft - a.hoursLeft);
  const totalDays = Math.max(wholeDays(START_DATE, DEADLINE), 1);
  const elapsedDays = Math.max(0, Math.min(wholeDays(START_DATE, reportDate), totalDays));
  const expected = starting * elapsedDays / totalDays;
  const completed = starting - remaining;

  return {
    available: true,
    startDate: START_DATE,
    deadline: DEADLINE,
    daysLeft: Math.max(wholeDays(reportDate, DEADLINE), 0),
    maxedSkills: maxed,
    totalSkills: SKILL_ORDER.length,
    totalLevel: player.overall.level,
    xpProgressPct: rounded(100 * cappedXp / (SKILL_ORDER.length * targetXp), 2),
    startingTimedHours: rounded(starting),
    completedTimedHours: rounded(completed),
    expectedTimedHours: rounded(expected),
    remainingTimedHours: rounded(remaining),
    hoursAhead: rounded(completed - expected),
    timedProgressPct: starting > 0 ? rounded(100 * completed / starting, 2) : 100,
    timedSkills,
    untimedCombat,
    unestimatedSkills,
  };
}

export function buildMaxCapePace(data: OsrsApiResponse, username: string): TrackerMaxCapePace | null {
  const metadata = getTrackerMetadata(data);
  const published = readPublishedMaxPace(metadata?.maxCapePace);
  if (published) return published;
  const player = getPlayerStats(data, username);
  if (!validPlayer(player)) return null;
  const date = metadata?.reportDateKey;
  const reportDate = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : START_DATE;
  return computeMaxPace(player, reportDate);
}

function readPublishedMilestone(raw: unknown): TrackerIronmanMilestone | null {
  if (!isRecord(raw) || raw.available !== true || !Array.isArray(raw.remaining) || !Array.isArray(raw.stages) ||
      typeof raw.account !== 'string' || typeof raw.totalLevel !== 'number' || typeof raw.targetLevel !== 'number' ||
      typeof raw.completed !== 'number' || typeof raw.totalSkills !== 'number') return null;
  if (!raw.remaining.every((item) => isRecord(item) && typeof item.skill === 'string' &&
    SKILL_ORDER.includes(item.skill as SkillName) && typeof item.level === 'number')) return null;
  if (!raw.stages.every((stage) => isRecord(stage) && typeof stage.level === 'number' && typeof stage.completed === 'number')) return null;
  return raw as unknown as TrackerIronmanMilestone;
}

export function buildIronmanMilestone(data: OsrsApiResponse, previous?: OsrsApiResponse): TrackerIronmanMilestone | null {
  const published = readPublishedMilestone(getTrackerMetadata(data)?.ironmanMilestone);
  if (published) return published;
  const player = getPlayerStats(data, 'JorbisBTW');
  if (!validPlayer(player)) return null;
  const previousPlayer = previous ? getPlayerStats(previous, 'JorbisBTW') : null;
  const stages = IRONMAN_TIERS.map((level) => ({
    level, completed: SKILL_ORDER.filter((skill) => player[skill].level >= level).length,
  }));
  const index = Math.max(stages.findIndex((stage) => stage.completed < SKILL_ORDER.length), 0);
  const targetLevel = stages[index].level;
  const remaining = SKILL_ORDER.filter((skill) => player[skill].level < targetLevel)
    .map((skill) => ({ skill, level: player[skill].level }))
    .sort((a, b) => a.level - b.level || a.skill.localeCompare(b.skill));
  return {
    available: true,
    account: 'JorbisBTW',
    totalLevel: player.overall.level,
    levelsGainedSincePrevious: previousPlayer ? Math.max(player.overall.level - previousPlayer.overall.level, 0) : null,
    targetLevel,
    completed: stages[index].completed,
    totalSkills: SKILL_ORDER.length,
    remaining,
    stages,
    nextTier: stages[index + 1] ?? null,
    maxed: stages[stages.length - 1].completed === SKILL_ORDER.length,
  };
}
