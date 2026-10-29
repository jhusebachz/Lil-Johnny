import { formatOsrsSkillName } from './osrsEffectiveHours.ts';
import { getPlayerStats, getTrackerMetadata } from './osrsTrackerParsers.ts';
import { IRONMAN_ACCOUNTS } from './osrsTrackerTypes.ts';
import type { OsrsApiResponse, TrackerIronmanAccount, TrackerIronmanComparison } from './osrsTrackerTypes.ts';

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nonNegative(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function timestamp(value: unknown): string | null {
  return typeof value === 'string' && Number.isFinite(Date.parse(value)) ? value : null;
}

export function buildIronmanComparison(data: OsrsApiResponse): TrackerIronmanComparison {
  const raw = record(getTrackerMetadata(data)?.ironmanComparison);
  const rawAccounts = Array.isArray(raw.accounts) ? raw.accounts.map(record) : [];
  const periodStart = timestamp(raw.periodStart);
  const periodEnd = timestamp(raw.periodEnd);
  const comparable = raw.status === 'comparison' && periodStart !== null && periodEnd !== null
    && Date.parse(periodStart) <= Date.parse(periodEnd)
    && IRONMAN_ACCOUNTS.every(({ name }) => {
      const account = rawAccounts.find((item) => item.name === name);
      return account?.available === true && nonNegative(account.gainedXp) !== null
        && nonNegative(account.gainedLevels) !== null
        && nonNegative(account.totalXp) !== null && nonNegative(account.totalLevel) !== null;
    });
  const accounts = IRONMAN_ACCOUNTS.map(({ name, accountType }): TrackerIronmanAccount => {
    const account = rawAccounts.find((item) => item.name === name);
    const player = getPlayerStats(data, name);
    const available = account ? account.available === true : Boolean(player);
    const skills = comparable && Array.isArray(account?.topSkills) ? account.topSkills.map(record) : [];
    return {
      name, accountType, available,
      totalLevel: nonNegative(account?.totalLevel) ?? player?.overall.level ?? 0,
      totalXp: nonNegative(account?.totalXp) ?? player?.overall.experience ?? 0,
      gainedXp: comparable ? nonNegative(account?.gainedXp) : null,
      gainedLevels: comparable ? nonNegative(account?.gainedLevels) : null,
      topSkills: skills
        .filter((skill) => typeof skill.skill === 'string' && (nonNegative(skill.xp) ?? 0) > 0
          && nonNegative(skill.level) !== null && nonNegative(skill.levelsGained) !== null)
        .map((skill) => ({
          skill: formatOsrsSkillName(skill.skill as string), xp: skill.xp as number,
          level: skill.level as number, levelsGained: skill.levelsGained as number,
        }))
        .sort((left, right) => right.xp - left.xp).slice(0, 5),
    };
  });
  return {
    status: comparable ? 'comparison' : accounts.every((account) => account.available) ? 'baseline' : 'unavailable',
    periodStart: comparable ? periodStart : null, periodEnd, accounts,
  };
}

export function ironmanComparisonPeriod(comparison: TrackerIronmanComparison): string {
  if (comparison.status === 'baseline') {
    return 'Baseline established; comparison begins with the next successful report.';
  }
  if (comparison.status !== 'comparison' || !comparison.periodStart || !comparison.periodEnd) {
    return 'Comparison paused until both HiScores lookups succeed.';
  }
  const format = (date: string) => new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(date));
  return `Since previous paired report: ${format(comparison.periodStart)} to ${format(comparison.periodEnd)} ET`;
}

export function ironmanComparisonLeads(comparison: TrackerIronmanComparison): string[] {
  if (comparison.status !== 'comparison') return [];
  const [left, right] = comparison.accounts;
  return ([['gainedXp', 'XP'], ['gainedLevels', 'total levels']] as const).map(([key, unit]) => {
    const diff = (left[key] ?? 0) - (right[key] ?? 0);
    if (diff === 0) return `${unit} gained: tied.`;
    return `${diff > 0 ? left.name : right.name} gained ${Math.abs(diff).toLocaleString()} more ${unit}.`;
  });
}
