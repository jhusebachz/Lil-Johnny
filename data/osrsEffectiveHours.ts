export const DEFAULT_OSRS_XP_PER_HOUR_BY_SKILL: Record<string, number> = {
  attack: 80000,
  strength: 90000,
  defence: 80000,
  ranged: 70000,
  prayer: 150000,
  magic: 90000,
  runecraft: 50000,
  construction: 220000,
  hitpoints: 45000,
  agility: 50000,
  herblore: 200000,
  thieving: 180000,
  crafting: 200000,
  fletching: 180000,
  slayer: 40000,
  hunter: 70000,
  mining: 40000,
  smithing: 220000,
  fishing: 40000,
  cooking: 250000,
  firemaking: 250000,
  woodcutting: 70000,
  farming: 120000,
  sailing: 60000,
};

const ALWAYS_PASSIVE_EFFECTIVE_HOUR_SKILLS = new Set(['hitpoints']);
const SLAYER_OVERLAP_EFFECTIVE_HOUR_SKILLS = new Set(['attack', 'strength', 'defence', 'ranged', 'magic']);

// These XP/hour values are directional estimates for comparing daily progress to pacing goals.
// They are intentionally easy to tune later as your training methods change.
export type OsrsEffectiveHoursSummary = {
  bySkill: {
    hours: number;
    skill: string;
  }[];
  skippedSkills: string[];
  totalHours: number;
};

export type ResolvedOsrsEffectiveHoursSummary = OsrsEffectiveHoursSummary & {
  source: 'derived' | 'metadata' | 'unavailable';
};

type RawEffectiveHoursMetadata = {
  bySkill?: Record<string, number>;
  skippedSkills?: string[];
  totalHours?: number;
};

export function formatOsrsSkillName(skill: string) {
  if (skill === 'runecraft') {
    return 'Runecraft';
  }

  return `${skill.charAt(0).toUpperCase()}${skill.slice(1)}`;
}

function shouldSuppressEffectiveHourSkill(skill: string, gainsBySkill: Record<string, number>) {
  if (ALWAYS_PASSIVE_EFFECTIVE_HOUR_SKILLS.has(skill)) {
    return true;
  }

  return gainsBySkill.slayer > 0 && SLAYER_OVERLAP_EFFECTIVE_HOUR_SKILLS.has(skill);
}

export function calculateOsrsEffectiveHoursFromGains(
  gainsBySkill: Record<string, number>,
  xpPerHourBySkill = DEFAULT_OSRS_XP_PER_HOUR_BY_SKILL
): OsrsEffectiveHoursSummary {
  const bySkill = Object.entries(gainsBySkill)
    .filter(([skill, xp]) => skill !== 'overall' && xp > 0 && !shouldSuppressEffectiveHourSkill(skill, gainsBySkill))
    .reduce<OsrsEffectiveHoursSummary['bySkill']>((entries, [skill, xp]) => {
      const xpPerHour = xpPerHourBySkill[skill];

      if (!xpPerHour || xpPerHour <= 0) {
        return entries;
      }

      entries.push({
        skill,
        hours: xp / xpPerHour,
      });

      return entries;
    }, [])
    .sort((left, right) => right.hours - left.hours);

  const skippedSkills = Object.entries(gainsBySkill)
    .filter(([skill, xp]) => skill !== 'overall' && xp > 0 && !(xpPerHourBySkill[skill] > 0))
    .map(([skill]) => skill)
    .sort();

  const totalHours = bySkill.reduce((total, entry) => total + entry.hours, 0);

  return {
    bySkill,
    skippedSkills,
    totalHours,
  };
}

export function readOsrsEffectiveHoursFromMetadata(value: unknown): OsrsEffectiveHoursSummary | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const raw = value as RawEffectiveHoursMetadata;

  if (typeof raw.totalHours !== 'number' || !Number.isFinite(raw.totalHours)) {
    return null;
  }

  const bySkill = Object.entries(raw.bySkill ?? {})
    .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && Number.isFinite(entry[1]) && entry[1] > 0)
    .map(([skill, hours]) => ({
      skill,
      hours,
    }))
    .sort((left, right) => right.hours - left.hours);

  const skippedSkills = Array.isArray(raw.skippedSkills)
    ? raw.skippedSkills.filter((skill): skill is string => typeof skill === 'string').sort()
    : [];

  return {
    bySkill,
    skippedSkills,
    totalHours: raw.totalHours,
  };
}

export function resolveOsrsEffectiveHours(
  metadataValue: unknown,
  gainsBySkill?: Record<string, number> | null
): ResolvedOsrsEffectiveHoursSummary {
  const metadataSummary = readOsrsEffectiveHoursFromMetadata(metadataValue);

  if (metadataSummary) {
    return {
      ...metadataSummary,
      source: 'metadata',
    };
  }

  if (gainsBySkill) {
    return {
      ...calculateOsrsEffectiveHoursFromGains(gainsBySkill),
      source: 'derived',
    };
  }

  return {
    totalHours: 0,
    bySkill: [],
    skippedSkills: [],
    source: 'unavailable',
  };
}
