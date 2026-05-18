import { daysUntilGoalDate, getGoalPacePct } from './osrsGoalMath.ts';
import { formatOsrsSkillName } from './osrsEffectiveHours.ts';
import { SKILL_ORDER } from './osrsTrackerTypes.ts';
import type {
  GoalProjection,
  GoalTrainingPlan,
  OsrsPlayerStats,
  OsrsSkillStat,
  SkillName,
} from './osrsTrackerTypes.ts';

const GOAL_PROGRESS_START = '2026-03-25';
export const GOAL_ONE_DEADLINE = '2026-10-03';
export const GOAL_ONE_LABEL = 'Base 92s (Runecrafting 90)';

type PassiveCombatRatios = Partial<Record<SkillName, number>>;

type ProjectedSkillState = {
  skill: SkillName;
  level: number;
  experience: number;
};

export const GOAL_TRAINING_PLANS: Partial<Record<SkillName, GoalTrainingPlan>> = {
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

export const GOAL_PROGRESS_BASELINE: Record<SkillName | 'overall', Pick<OsrsSkillStat, 'level' | 'experience'>> = {
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

const PASSIVE_COMBAT_SKILLS: readonly SkillName[] = ['attack', 'defence', 'strength', 'hitpoints', 'ranged', 'magic'];

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function getGoalStatus(hoursPerDay: number | null) {
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

export function describeGoalStatus(status: GoalProjection['status']) {
  switch (status) {
    case 'On track':
      return 'is on track';
    case 'Tight':
      return 'looks tight';
    case 'Off track':
      return 'looks off track';
    default:
      return 'needs review';
  }
}

export function xpForLevel(level: number) {
  let points = 0;

  for (let current = 1; current < level; current += 1) {
    points += Math.floor(current + 300 * Math.pow(2, current / 7));
  }

  return Math.floor(points / 4);
}

export function percentToTarget(experience: number, targetLevel: number) {
  const targetXp = xpForLevel(targetLevel);
  const progressed = Math.max(experience, 0);

  return Math.max(0, Math.min(100, (progressed / Math.max(targetXp, 1)) * 100));
}

export function getGoalOneTargetLevel(skill: SkillName) {
  return skill === 'runecraft' ? 90 : 92;
}

export function getPartialLevelProgress(level: number, experience: number) {
  if (level >= 99) {
    return 0;
  }

  const currentLevelXp = xpForLevel(Math.max(level, 1));
  const nextLevelXp = xpForLevel(Math.max(level + 1, 2));
  const span = Math.max(nextLevelXp - currentLevelXp, 1);
  const progressedXp = Math.max(experience - currentLevelXp, 0);

  return Math.max(0, Math.min(1, progressedXp / span));
}

export function getEffectiveTotalLevel(currentPlayer: OsrsPlayerStats) {
  const partialLevelProgress = SKILL_ORDER.reduce((total, skill) => {
    const stat = currentPlayer[skill];

    if (!stat) {
      return total;
    }

    return total + getPartialLevelProgress(stat.level, stat.experience);
  }, 0);

  return currentPlayer.overall.level + partialLevelProgress;
}

export function getEffectiveLevelsRemaining(currentPlayer: OsrsPlayerStats, targetTotalLevel: number) {
  return Math.max(targetTotalLevel - getEffectiveTotalLevel(currentPlayer), 0);
}

export function daysUntil(targetDate: string, now = new Date()) {
  return daysUntilGoalDate(targetDate, now);
}

export function isSlayerTrackedSkill(skill: string) {
  return GOAL_TRAINING_PLANS[skill as SkillName]?.mode === 'trained via Slayer';
}

export function getPacePct(targetDate: string, now = new Date()) {
  return getGoalPacePct(GOAL_PROGRESS_START, targetDate, now);
}

export function buildGoalProjection(
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
    status: getGoalStatus(hoursPerDay),
    unestimatedSkills,
    progressPct,
    pacePct,
  };
}

function buildPassiveCombatRatios(
  baselineSkills: Record<SkillName | 'overall', Pick<OsrsSkillStat, 'level' | 'experience'>>,
  currentSkills: (OsrsSkillStat & { skill: SkillName })[]
): PassiveCombatRatios {
  const currentSkillMap = Object.fromEntries(currentSkills.map((skill) => [skill.skill, skill])) as Record<
    SkillName,
    OsrsSkillStat & { skill: SkillName }
  >;
  const slayerXpGained = Math.max(currentSkillMap.slayer.experience - baselineSkills.slayer.experience, 0);

  if (slayerXpGained <= 0) {
    return {};
  }

  return PASSIVE_COMBAT_SKILLS.reduce<PassiveCombatRatios>((ratios, skill) => {
    const baselineXp = baselineSkills[skill].experience;
    const currentXp = currentSkillMap[skill].experience;
    const gainedXp = Math.max(currentXp - baselineXp, 0);
    const ratio = gainedXp / slayerXpGained;

    if (ratio > 0) {
      ratios[skill] = ratio;
    }

    return ratios;
  }, {});
}

function syncProjectedSkillLevel(projectedSkill: ProjectedSkillState) {
  while (projectedSkill.level < 99 && projectedSkill.experience >= xpForLevel(projectedSkill.level + 1)) {
    projectedSkill.level += 1;
  }
}

function applyPassiveCombatXp(
  projectedSkills: ProjectedSkillState[],
  slayerXpGain: number,
  passiveCombatRatios: PassiveCombatRatios
) {
  PASSIVE_COMBAT_SKILLS.forEach((skillName) => {
    const ratio = passiveCombatRatios[skillName] ?? 0;

    if (ratio <= 0) {
      return;
    }

    const projectedSkill = projectedSkills.find((skill) => skill.skill === skillName);

    if (!projectedSkill || projectedSkill.level >= 99) {
      return;
    }

    projectedSkill.experience += slayerXpGain * ratio;
    syncProjectedSkillLevel(projectedSkill);
  });
}

export function buildRuneFestProjection(skills: (OsrsSkillStat & { skill: SkillName })[], levelsNeeded: number) {
  if (levelsNeeded <= 0) {
    return {
      hoursLeft: 0,
      xpLeft: 0,
      unestimatedSkills: [] as string[],
    };
  }

  const passiveCombatRatios = buildPassiveCombatRatios(GOAL_PROGRESS_BASELINE, skills);
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

      if (!trainingPlan || skill.level >= 99 || isSlayerTrackedSkill(skill.skill)) {
        return;
      }

      const nextLevel = skill.level + 1;
      const remainingXp = Math.max(xpForLevel(nextLevel) - skill.experience, 0);
      const levelHours = remainingXp / Math.max(trainingPlan.xpPerHour, 1);

      if (remainingXp > 0 && levelHours < bestHours) {
        bestHours = levelHours;
        bestIndex = index;
      }
    });

    if (bestIndex === -1) {
      projectedSkills
        .filter((skill) => skill.level < 99)
        .forEach((skill) => unestimatedSkills.add(formatOsrsSkillName(skill.skill)));
      break;
    }

    const chosenSkill = projectedSkills[bestIndex];
    const xpNeededForChosenLevel = Math.max(xpForLevel(chosenSkill.level + 1) - chosenSkill.experience, 0);
    chosenSkill.level += 1;
    chosenSkill.experience = xpForLevel(chosenSkill.level);
    hoursLeft += bestHours;
    xpLeft += xpNeededForChosenLevel;
    if (chosenSkill.skill === 'slayer') {
      applyPassiveCombatXp(projectedSkills, xpNeededForChosenLevel, passiveCombatRatios);
    }
    remainingLevels -= 1;
  }

  return {
    hoursLeft,
    xpLeft,
    unestimatedSkills: [...unestimatedSkills],
  };
}

export function buildTargetProgress(
  baselineSkills: Record<SkillName | 'overall', Pick<OsrsSkillStat, 'level' | 'experience'>>,
  currentPlayer: OsrsPlayerStats,
  targetType: 'baseGoal' | 'runefest' | 'maxCape'
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

  let totalNeededXp = 0;
  let remainingXp = 0;

  SKILL_ORDER.forEach((skill) => {
    const targetLevel = targetType === 'baseGoal' ? getGoalOneTargetLevel(skill) : 99;
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

export function getNextLevel(level: number): number | null {
  if (level >= 99) {
    return null;
  }

  return level + 1;
}
