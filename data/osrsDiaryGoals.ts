import type { SkillName } from './osrsTrackerTypes.ts';

export const DIARY_SKILL_TARGETS: Record<SkillName, number> = {
  attack: 50,
  defence: 70,
  strength: 76,
  hitpoints: 70,
  ranged: 70,
  prayer: 85,
  magic: 96,
  cooking: 95,
  woodcutting: 90,
  fletching: 95,
  fishing: 96,
  firemaking: 85,
  crafting: 85,
  smithing: 91,
  mining: 85,
  herblore: 90,
  agility: 90,
  thieving: 91,
  slayer: 95,
  farming: 91,
  runecraft: 91,
  hunter: 70,
  construction: 78,
  sailing: 62,
};

export function getDiaryTargetLevel(skill: SkillName) {
  return DIARY_SKILL_TARGETS[skill];
}
