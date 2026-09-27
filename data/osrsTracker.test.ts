import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateOsrsEffectiveHoursFromGains, resolveOsrsEffectiveHours } from './osrsEffectiveHours.ts';
import {
  readTrackerBossProgression,
  readTrackerCurrentWeekSummary,
  readTrackerDailyBossActivity,
  readTrackerDailySummary,
  readTrackerGeneratedAt,
  readTrackerReportDateKey,
} from './osrsTrackerMetadata.ts';
import {
  GOAL_PROGRESS_BASELINE,
  buildRuneFestProjection,
  getEffectiveLevelsRemaining,
  xpForLevel,
} from './osrsTrackerGoals.ts';
import { getPlayerStats } from './osrsTrackerParsers.ts';
import { SKILL_ORDER } from './osrsTrackerTypes.ts';
import type { OsrsPlayerStats, OsrsSkillStat, SkillName } from './osrsTrackerTypes.ts';

function buildPlayerFromBaseline(
  overrides: Partial<Record<SkillName, Partial<Pick<OsrsSkillStat, 'experience' | 'level'>>>> = {},
  overallOverrides: Partial<Pick<OsrsSkillStat, 'experience' | 'level'>> = {}
): OsrsPlayerStats {
  const skills = Object.fromEntries(
    SKILL_ORDER.map((skill) => {
      const baseline = GOAL_PROGRESS_BASELINE[skill];
      const skillOverrides = overrides[skill] ?? {};

      return [
        skill,
        {
          metric: skill,
          experience: skillOverrides.experience ?? baseline.experience,
          level: skillOverrides.level ?? baseline.level,
          rank: 1,
          ehp: 0,
        },
      ];
    })
  ) as Record<SkillName, OsrsSkillStat>;

  return {
    overall: {
      metric: 'overall',
      experience: overallOverrides.experience ?? GOAL_PROGRESS_BASELINE.overall.experience,
      level: overallOverrides.level ?? GOAL_PROGRESS_BASELINE.overall.level,
      rank: 1,
      ehp: 0,
    },
    ...skills,
  };
}

test('tracker effective-hours fallback derives hours from XP deltas when metadata is absent', () => {
  const summary = resolveOsrsEffectiveHours(null, {
    hunter: 98_000,
    herblore: 160_000,
    slayer: 24_000,
  });

  assert.equal(summary.source, 'derived');
  assert.equal(Number(summary.totalHours.toFixed(1)), 2.8);
  assert.deepEqual(
    summary.bySkill.slice(0, 3).map((entry) => [entry.skill, Number(entry.hours.toFixed(1))]),
    [
      ['hunter', 1.4],
      ['herblore', 0.8],
      ['slayer', 0.6],
    ]
  );
});

test('tracker effective-hours fallback stays safe for older payloads without metadata or prior gains', () => {
  const summary = resolveOsrsEffectiveHours(null, null);

  assert.equal(summary.source, 'unavailable');
  assert.equal(summary.totalHours, 0);
  assert.deepEqual(summary.bySkill, []);
});

test('tracker effective-hours prefers tracker-provided metadata when available', () => {
  const summary = resolveOsrsEffectiveHours(
    {
      totalHours: 3.25,
      bySkill: {
        hunter: 1.5,
        herblore: 1.0,
        slayer: 0.75,
      },
      skippedSkills: ['unknown-skill'],
    },
    {
      hunter: 98_000,
      herblore: 160_000,
      slayer: 24_000,
    }
  );

  assert.equal(summary.source, 'metadata');
  assert.equal(summary.totalHours, 3.25);
  assert.deepEqual(summary.skippedSkills, ['unknown-skill']);
});

test('effective-hours helper skips skills without configured XP-per-hour assumptions', () => {
  const summary = calculateOsrsEffectiveHoursFromGains({
    hunter: 70_000,
    unknownskill: 50_000,
  });

  assert.equal(summary.totalHours, 1);
  assert.deepEqual(
    summary.bySkill.map((entry) => [entry.skill, entry.hours]),
    [['hunter', 1]]
  );
  assert.deepEqual(summary.skippedSkills, ['unknownskill']);
});

test('effective-hours helper suppresses combat skills for efficient-hour totals', () => {
  const summary = calculateOsrsEffectiveHoursFromGains({
    defence: 41_221,
    hitpoints: 54_879,
    magic: 54_880,
    herblore: 178,
    slayer: 42_330,
  });

  assert.equal(Number(summary.totalHours.toFixed(4)), 1.0591);
  assert.deepEqual(
    summary.bySkill.map((entry) => [entry.skill, Number(entry.hours.toFixed(4))]),
    [
      ['slayer', 1.0582],
      ['herblore', 0.0009],
    ]
  );
});

test('effective-hours helper ignores combat gains even without slayer xp', () => {
  const summary = calculateOsrsEffectiveHoursFromGains({
    attack: 24_000,
    ranged: 42_000,
    hitpoints: 13_000,
    hunter: 70_000,
  });

  assert.equal(summary.totalHours, 1);
  assert.deepEqual(
    summary.bySkill.map((entry) => [entry.skill, entry.hours]),
    [['hunter', 1]]
  );
});

test('malformed effective-hours metadata falls back to derived gains safely', () => {
  const summary = resolveOsrsEffectiveHours(
    {
      totalHours: Number.NaN,
      bySkill: {
        hunter: Number.POSITIVE_INFINITY,
      },
    },
    {
      hunter: 70_000,
      slayer: 40_000,
    }
  );

  assert.equal(summary.source, 'derived');
  assert.equal(Number(summary.totalHours.toFixed(1)), 2);
  assert.deepEqual(
    summary.bySkill
      .map((entry) => [entry.skill, Number(entry.hours.toFixed(1))] as const)
      .sort((left, right) => left[0].localeCompare(right[0])),
    [
      ['hunter', 1],
      ['slayer', 1],
    ]
  );
});

test('runefest required pace drops with xp progress even before total level changes', () => {
  const hunterBaselineXp = GOAL_PROGRESS_BASELINE.hunter.experience;
  const hunterNextLevelXp = xpForLevel(GOAL_PROGRESS_BASELINE.hunter.level + 1);
  const hunterXpGain = Math.min(30_000, Math.max(hunterNextLevelXp - hunterBaselineXp - 1, 1));
  const baselinePlayer = buildPlayerFromBaseline();
  const progressedPlayer = buildPlayerFromBaseline(
    {
      hunter: {
        experience: hunterBaselineXp + hunterXpGain,
      },
    },
    {
      experience: GOAL_PROGRESS_BASELINE.overall.experience + hunterXpGain,
    }
  );
  const totalLevelsNeeded = Math.max(2250 - baselinePlayer.overall.level, 0);
  const baselineProjection = buildRuneFestProjection(
    SKILL_ORDER.map((skill) => ({
      skill,
      ...baselinePlayer[skill],
    })),
    totalLevelsNeeded
  );
  const progressedProjection = buildRuneFestProjection(
    SKILL_ORDER.map((skill) => ({
      skill,
      ...progressedPlayer[skill],
    })),
    totalLevelsNeeded
  );
  const daysLeft = 1;
  const baselineHoursPerDay = baselineProjection.hoursLeft / daysLeft;
  const progressedHoursPerDay = progressedProjection.hoursLeft / daysLeft;
  const baselineEffectiveLevelsRemaining = getEffectiveLevelsRemaining(baselinePlayer, 2250);
  const progressedEffectiveLevelsRemaining = getEffectiveLevelsRemaining(progressedPlayer, 2250);

  assert.equal(progressedPlayer.overall.level, baselinePlayer.overall.level);
  assert.ok(progressedEffectiveLevelsRemaining < baselineEffectiveLevelsRemaining);
  assert.ok(progressedHoursPerDay < baselineHoursPerDay);
});

test('tracker metadata helpers preserve latest report timestamps and summaries for the app', () => {
  const metadata = {
    generatedAt: '2026-05-18T00:53:27Z',
    reportDateKey: '2026-05-17',
    currentWeek: {
      jhusebachz: {
        weekStartDateKey: '2026-05-11',
        totalXp: 420_000,
        totalEffectiveHours: 5.8,
        activeDays: 3,
        daysTracked: 4,
        topSkills: [
          { skill: 'hunter', xp: 250_000 },
          { skill: 'slayer', xp: 120_000 },
        ],
      },
    },
    dailySummary: {
      byPlayer: {
        jhusebachz: {
          totalXp: 100_000,
          topSkills: [
            { skill: 'hunter', xp: 70_000, level: GOAL_PROGRESS_BASELINE.hunter.level },
            { skill: 'slayer', xp: 30_000, level: GOAL_PROGRESS_BASELINE.slayer.level },
          ],
        },
        gwahpy: {
          totalXp: 60_000,
          diff: 40_000,
          effectiveHours: 0.9,
          topSkills: [{ skill: 'hunter', xp: 60_000, level: GOAL_PROGRESS_BASELINE.hunter.level }],
        },
      },
    },
  };

  const currentWeek = readTrackerCurrentWeekSummary(metadata, 'jhusebachz');
  const dailySummary = readTrackerDailySummary(metadata, 'jhusebachz');

  assert.equal(readTrackerGeneratedAt(metadata), '2026-05-18T00:53:27Z');
  assert.equal(readTrackerReportDateKey(metadata), '2026-05-17');
  assert.equal(currentWeek?.totalXp, 420_000);
  assert.equal(currentWeek?.topSkills.length, 2);
  assert.deepEqual(currentWeek?.topSkills[0], { skill: 'hunter', xp: 250_000 });
  assert.equal(dailySummary?.totalXp, 100_000);
  assert.equal(dailySummary?.friends[0]?.name, 'gwahpy');
  assert.equal(dailySummary?.friends[0]?.overallXp, 60_000);
  assert.equal(dailySummary?.friends[0]?.effectiveHours, 0.9);
});

test('OSRS tracker parser accepts published tracker players without metric or ehp fields', () => {
  const player = getPlayerStats(
    {
      jhusebachz: {
        overall: {
          rank: 182_827,
          level: 2216,
          experience: 179_498_724,
        },
        runecraft: {
          rank: 257_367,
          level: 86,
          experience: 3_644_872,
        },
      },
    },
    'jhusebachz'
  );

  assert.ok(player);
  assert.equal(player?.overall.level, 2216);
  assert.equal(player?.runecraft.experience, 3_644_872);
});

test('boss progression parser preserves the full tiered remaining checklist without truncation', () => {
  const easyBosses = Array.from({ length: 10 }, (_, index) => ({
    name: `Easy Boss ${index + 1}`,
    kc: 0,
    targetKc: 1,
    tier: 'Easy',
  }));
  const progression = readTrackerBossProgression(
    {
      bossProgression: {
        jhusebachz: {
          triedCount: 34,
          totalTracked: 61,
          untriedCount: 27,
          remainingByTier: {
            Easy: easyBosses,
            Medium: [{ name: 'Sarachnis', kc: 0, targetKc: 1, tier: 'Medium' }],
            Hard: [{ name: 'Chaos Elemental', kc: 0, targetKc: 1, tier: 'Hard' }],
            Elite: [],
            Master: [],
            Grandmaster: [],
          },
        },
      },
    },
    'jhusebachz'
  );

  assert.equal(progression.triedCount, 34);
  assert.equal(progression.untriedCount, 27);
  assert.equal(progression.remainingByTier.Easy.length, 10);
  assert.equal(progression.remainingByTier.Easy[9]?.name, 'Easy Boss 10');
  assert.equal(progression.remainingByTier.Medium[0]?.name, 'Sarachnis');
  assert.equal(progression.remainingByTier.Hard[0]?.name, 'Chaos Elemental');
});

test('daily boss activity parser exposes the tracker-ranked top three player totals and breakdowns', () => {
  const activity = readTrackerDailyBossActivity({
    dailyBossActivity: {
      topPlayers: [
        {
          name: 'jhusebachz',
          totalBossKcGained: 8,
          bossGains: { Vorkath: 5, 'Phantom Muspah': 3 },
        },
        { name: '3Sixteen', totalBossKcGained: 4, bossGains: { Zulrah: 4 } },
        { name: 'beefmissle13', totalBossKcGained: 1, bossGains: { Sarachnis: 1 } },
        { name: 'kingxdabber', totalBossKcGained: 1, bossGains: { Vorkath: 1 } },
      ],
    },
  });

  assert.deepEqual(
    activity.topPlayers.map((player) => [player.name, player.totalBossKcGained]),
    [
      ['jhusebachz', 8],
      ['3Sixteen', 4],
      ['beefmissle13', 1],
    ]
  );
  assert.deepEqual(activity.topPlayers[0]?.bossGains, [
    { name: 'Vorkath', gained: 5 },
    { name: 'Phantom Muspah', gained: 3 },
  ]);
});

test('daily boss activity parser stays empty when nobody gained boss KC', () => {
  assert.deepEqual(
    readTrackerDailyBossActivity({
      dailyBossActivity: { byPlayer: {}, topPlayers: [] },
    }),
    { topPlayers: [] }
  );
});
