import { formatOsrsSkillName } from './osrsEffectiveHours.ts';
import {
  GOAL_TRAINING_PLANS,
  getGoalOneTargetLevel,
  getNextLevel,
  isSlayerTrackedSkill,
  percentToTarget,
  xpForLevel,
} from './osrsTrackerGoals.ts';
import { getPlayerEntries, getPlayerStats, getSkillDelta } from './osrsTrackerParsers.ts';
import { FRIEND_ORDER, SKILL_ORDER } from './osrsTrackerTypes.ts';
import type {
  LiveRunescapeTracker,
  OsrsApiResponse,
  OsrsPlayerStats,
  OsrsSkillStat,
  SkillName,
  TrackerFriendSummary,
  TrackerGoal,
  TrackerSummaryItem,
  TrackerSummaryItemWithLevel,
} from './osrsTrackerTypes.ts';

export type TrackerSkillEntry = OsrsSkillStat & { skill: SkillName };

type HoursSortable = {
  hoursLeft?: number | null;
  remainingXp: number;
};

function compareHoursThenXp(left: HoursSortable, right: HoursSortable) {
  const leftHours = left.hoursLeft ?? null;
  const rightHours = right.hoursLeft ?? null;

  if (leftHours === null && rightHours === null) {
    return left.remainingXp - right.remainingXp;
  }

  if (leftHours === null) {
    return 1;
  }

  if (rightHours === null) {
    return -1;
  }

  if (leftHours !== rightHours) {
    return leftHours - rightHours;
  }

  return left.remainingXp - right.remainingXp;
}

function sortFriendsByConfiguredOrder<T extends { name: string }>(friends: T[]) {
  return [...friends].sort((left, right) => {
    const leftIndex = FRIEND_ORDER.indexOf(left.name as (typeof FRIEND_ORDER)[number]);
    const rightIndex = FRIEND_ORDER.indexOf(right.name as (typeof FRIEND_ORDER)[number]);
    const safeLeftIndex = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const safeRightIndex = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    return safeLeftIndex - safeRightIndex;
  });
}

function buildDeltaTopSkillsWithLevels(
  player: OsrsPlayerStats,
  previousPlayer: OsrsPlayerStats | null,
  hasDelta: boolean,
  limit: number
): TrackerSummaryItemWithLevel[] {
  return SKILL_ORDER.filter((skill) => player[skill] && player[skill].experience >= 0)
    .map((skill) => ({
      skill,
      xp: hasDelta ? getSkillDelta(player, previousPlayer, skill) : player[skill].experience,
      level: player[skill].level,
    }))
    .filter((skill) => !hasDelta || skill.xp > 0)
    .sort((left, right) => right.xp - left.xp)
    .slice(0, limit)
    .map((skill) => ({
      skill: formatOsrsSkillName(skill.skill),
      xp: skill.xp,
      level: skill.level,
    }));
}

function buildGoalItem(skill: TrackerSkillEntry, targetLevel: number): TrackerGoal {
  const remainingXp = Math.max(xpForLevel(targetLevel) - skill.experience, 0);
  const xpPerHour = GOAL_TRAINING_PLANS[skill.skill]?.xpPerHour ?? 0;

  return {
    skill: formatOsrsSkillName(skill.skill),
    level: skill.level,
    targetLevel,
    pct: percentToTarget(skill.experience, targetLevel),
    remainingXp,
    xpPerHour,
    hoursLeft: xpPerHour > 0 ? remainingXp / xpPerHour : null,
  };
}

export function buildDerivedTopSkills(
  player: OsrsPlayerStats,
  previousPlayer: OsrsPlayerStats | null,
  hasDelta: boolean,
  limit = 5
): TrackerSummaryItem[] {
  return buildDeltaTopSkillsWithLevels(player, previousPlayer, hasDelta, limit).map(({ skill, xp }) => ({
    skill,
    xp,
  }));
}

export function buildFriendSummaries(
  currentData: OsrsApiResponse,
  previousData: OsrsApiResponse | undefined,
  username: string,
  player: OsrsPlayerStats,
  previousPlayer: OsrsPlayerStats | null,
  hasDelta: boolean
): TrackerFriendSummary[] {
  const yourValue = hasDelta
    ? Math.max(player.overall.experience - (previousPlayer?.overall.experience ?? player.overall.experience), 0)
    : player.overall.experience;

  return sortFriendsByConfiguredOrder(
    getPlayerEntries(currentData)
      .filter(([name]) => name !== username)
      .map(([name, stats]) => {
        const previousFriend = previousData ? getPlayerStats(previousData, name) : null;
        const overallXp = hasDelta
          ? Math.max(stats.overall.experience - (previousFriend?.overall.experience ?? stats.overall.experience), 0)
          : stats.overall.experience;

        return {
          name,
          overallXp,
          diff: yourValue - overallXp,
          topSkills: buildDeltaTopSkillsWithLevels(stats, previousFriend, hasDelta, 3),
        };
      })
  );
}

export function buildBaseGoalRemaining(skills: TrackerSkillEntry[]) {
  return skills
    .filter((skill) => skill.level < getGoalOneTargetLevel(skill.skill))
    .map((skill) => buildGoalItem(skill, getGoalOneTargetLevel(skill.skill)))
    .sort(compareHoursThenXp);
}

export function buildMaxRemainingAll(skills: TrackerSkillEntry[]) {
  return skills
    .filter((skill) => skill.level < 99)
    .map((skill) => buildGoalItem(skill, 99))
    .sort(compareHoursThenXp);
}

export function buildHoursToNextLevel(skills: TrackerSkillEntry[]): LiveRunescapeTracker['hoursToNextLevel'] {
  return skills
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
    .filter((item): item is LiveRunescapeTracker['hoursToNextLevel'][number] => Boolean(item))
    .sort(compareHoursThenXp);
}

export function buildMaxClosest(maxRemainingAll: TrackerGoal[]) {
  return maxRemainingAll.filter((item) => !isSlayerTrackedSkill(item.skill.toLowerCase())).slice(0, 5);
}
