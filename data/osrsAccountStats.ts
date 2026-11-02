import { getPlayerStats, isOsrsSkillStat } from './osrsTrackerParsers.ts';
import { SKILL_ORDER } from './osrsTrackerTypes.ts';
import type { OsrsApiResponse } from './osrsTrackerTypes.ts';

export const REPORT_ACCOUNT_NAMES = ['jhusebachz', 'JorbisBTW'] as const;

export type TrackerAccountStats = {
  name: string;
  available: boolean;
  totalLevel: number | null;
  totalXp: number | null;
  skills: { skill: string; level: number | null; xp: number | null }[];
};

function statValue(value: number | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

export function buildAccountStats(data: OsrsApiResponse): TrackerAccountStats[] {
  return REPORT_ACCOUNT_NAMES.map((name) => {
    const player = getPlayerStats(data, name);
    return {
      name, available: Boolean(player),
      totalLevel: statValue(player?.overall.level),
      totalXp: statValue(player?.overall.experience),
      skills: SKILL_ORDER.map((skill) => {
        const stat = player?.[skill];
        return {
          skill,
          level: statValue(isOsrsSkillStat(stat) ? stat.level : undefined),
          xp: statValue(isOsrsSkillStat(stat) ? stat.experience : undefined),
        };
      }),
    };
  });
}
