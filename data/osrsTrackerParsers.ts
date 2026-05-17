import type {
  OsrsApiResponse,
  OsrsPlayerStats,
  OsrsSkillStat,
  RunescapeTrackerMetadata,
  SkillName,
} from './osrsTrackerTypes.ts';

export function isOsrsSkillStat(value: unknown): value is OsrsSkillStat {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const stat = value as Record<string, unknown>;

  return (
    typeof stat.metric === 'string' &&
    typeof stat.experience === 'number' &&
    typeof stat.rank === 'number' &&
    typeof stat.level === 'number' &&
    typeof stat.ehp === 'number'
  );
}

export function isOsrsPlayerStats(value: unknown): value is OsrsPlayerStats {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const player = value as Record<string, unknown>;

  return isOsrsSkillStat(player.overall);
}

export function getPlayerStats(data: OsrsApiResponse, username: string) {
  const player = data[username];
  return isOsrsPlayerStats(player) ? player : null;
}

export function getPlayerEntries(data: OsrsApiResponse) {
  return Object.entries(data).filter(
    (entry): entry is [string, OsrsPlayerStats] => entry[0] !== '_meta' && isOsrsPlayerStats(entry[1])
  );
}

export function getTrackerMetadata(data: OsrsApiResponse): RunescapeTrackerMetadata | null {
  const metadata = data._meta;

  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  return metadata as RunescapeTrackerMetadata;
}

export function getSkillDelta(
  currentPlayer: OsrsPlayerStats,
  previousPlayer: OsrsPlayerStats | null | undefined,
  skill: SkillName
) {
  const currentXp = currentPlayer[skill]?.experience ?? 0;
  const previousXp = previousPlayer?.[skill]?.experience ?? currentXp;

  return Math.max(currentXp - previousXp, 0);
}
