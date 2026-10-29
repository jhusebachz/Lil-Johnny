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
import { buildFriendSummaries, buildOwnAccountSummaries } from './osrsTrackerBuilders.ts';
import { buildIronmanComparison, ironmanComparisonLeads, ironmanComparisonPeriod } from './osrsIronmanComparison.ts';
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

test('Ironman account starts with totals and a baseline rather than lifetime XP gains', () => {
  const ironman = buildPlayerFromBaseline({}, { level: 52, experience: 3495 });
  const [account] = buildOwnAccountSummaries({ JorbisBTW: ironman });

  assert.equal(account.name, 'JorbisBTW');
  assert.equal(account.accountType, 'Ironman');
  assert.equal(account.available, true);
  assert.equal(account.totalLevel, 52);
  assert.equal(account.totalXp, 3495);
  assert.equal(account.gainedXp, null);
  assert.deepEqual(account.topSkills, []);
});

test('Ironman progress prefers published daily gains over the latest local snapshot delta', () => {
  const previous = buildPlayerFromBaseline({}, { experience: 3495 });
  const current = buildPlayerFromBaseline({}, { experience: 3995 });
  const [account] = buildOwnAccountSummaries({
    JorbisBTW: current,
    _meta: {
      dailySummary: { byPlayer: {
        JorbisBTW: { totalXp: 1500, topSkills: [{ skill: 'attack', xp: 1500, level: 10 }] },
      } },
    },
  }, { JorbisBTW: previous });

  assert.equal(account.gainedXp, 1500);
  assert.deepEqual(account.topSkills, [{ skill: 'Attack', xp: 1500 }]);
  assert.equal(buildOwnAccountSummaries({ JorbisBTW: current }, { JorbisBTW: previous })[0].gainedXp, 500);
});

test('Ironman account stays visible when the feed has no account stats', () => {
  const [account] = buildOwnAccountSummaries({});
  assert.equal(account.available, false);
  assert.equal(account.gainedXp, null);
});

test('both Ironmen are excluded from the main-account friend comparisons', () => {
  const player = buildPlayerFromBaseline();
  const data = { jhusebachz: player, JorbisBTW: player, IronXDabber: player, '3Sixteen': player };
  const friends = buildFriendSummaries(data, undefined, 'jhusebachz', player, null, false);
  assert.deepEqual(friends.map((friend) => friend.name), ['3Sixteen']);

  const summary = readTrackerDailySummary({ dailySummary: { byPlayer: {
    jhusebachz: { totalXp: 200 },
    JorbisBTW: { totalXp: 100 },
    IronXDabber: { totalXp: 500 },
    '3Sixteen': { totalXp: 50, diff: 150 },
  } } }, 'jhusebachz');
  assert.deepEqual(summary?.friends.map((friend) => friend.name), ['3Sixteen']);
});

function publishedIronmanComparison() {
  return {
    status: 'comparison', periodStart: '2026-10-28T08:30:00Z', periodEnd: '2026-10-29T08:30:00Z',
    accounts: [
      { name: 'JorbisBTW', available: true, totalLevel: 100, totalXp: 5000, gainedLevels: 10, gainedXp: 2000,
        topSkills: [
          { skill: 'attack', xp: 100, level: 5, levelsGained: 1 },
          { skill: 'fishing', xp: 600, level: 10, levelsGained: 3 },
          { skill: 'cooking', xp: 500, level: 9, levelsGained: 2 },
          { skill: 'mining', xp: 400, level: 8, levelsGained: 2 },
          { skill: 'smithing', xp: 300, level: 7, levelsGained: 1 },
          { skill: 'strength', xp: 200, level: 6, levelsGained: 1 },
        ] },
      { name: 'IronXDabber', available: true, totalLevel: 80, totalXp: 4000, gainedLevels: 5, gainedXp: 1000,
        topSkills: [{ skill: 'magic', xp: 1000, level: 10, levelsGained: 4 }] },
    ],
  };
}

test('Ironman comparison uses the published shared interval and top five positive XP gains', () => {
  const comparison = buildIronmanComparison({ _meta: {
    ironmanComparison: publishedIronmanComparison(),
    dailySummary: { byPlayer: { JorbisBTW: { totalXp: 999999 } } },
  } });
  assert.equal(comparison.status, 'comparison');
  assert.deepEqual(comparison.accounts.map((account) => account.name), ['JorbisBTW', 'IronXDabber']);
  assert.equal(comparison.accounts[0].gainedLevels, 10);
  assert.equal(comparison.accounts[0].gainedXp, 2000);
  assert.deepEqual(comparison.accounts[0].topSkills.map((skill) => skill.skill), ['Fishing', 'Cooking', 'Mining', 'Smithing', 'Strength']);
  assert.equal(comparison.accounts[0].topSkills[0].levelsGained, 3);
  assert.deepEqual(ironmanComparisonLeads(comparison), ['JorbisBTW gained 1,000 more XP.', 'JorbisBTW gained 5 more total levels.']);
  assert.match(ironmanComparisonPeriod(comparison), /Oct 28.*Oct 29.*ET/);
});

test('older feeds show both Ironmen and do not invent friend or lifetime progress', () => {
  const comparison = buildIronmanComparison({ JorbisBTW: buildPlayerFromBaseline() });
  assert.equal(comparison.status, 'unavailable');
  assert.equal(comparison.accounts[0].available, true);
  assert.equal(comparison.accounts[1].available, false);
  assert.ok(comparison.accounts.every((account) => account.gainedXp === null && account.gainedLevels === null));
  assert.deepEqual(ironmanComparisonLeads(comparison), []);
});

test('first shared baseline displays totals with progress pending for both accounts', () => {
  const raw = { ...publishedIronmanComparison(), status: 'baseline', periodStart: null };
  const comparison = buildIronmanComparison({ _meta: { ironmanComparison: raw } });
  assert.equal(comparison.status, 'baseline');
  assert.equal(comparison.accounts[1].totalLevel, 80);
  assert.ok(comparison.accounts.every((account) => account.gainedXp === null && account.topSkills.length === 0));
  assert.match(ironmanComparisonPeriod(comparison), /Baseline established/);
});

test('failed lookups and invalid intervals suppress all progress comparisons', () => {
  const failed = publishedIronmanComparison();
  failed.accounts[1].available = false;
  const failedResult = buildIronmanComparison({ _meta: { ironmanComparison: failed } });
  assert.equal(failedResult.status, 'unavailable');
  assert.deepEqual(ironmanComparisonLeads(failedResult), []);
  assert.equal(failedResult.accounts[0].gainedXp, null);

  for (const periodStart of ['bad-date', '2026-10-30T08:30:00Z']) {
    const raw = { ...publishedIronmanComparison(), periodStart };
    assert.equal(buildIronmanComparison({ _meta: { ironmanComparison: raw } }).status, 'baseline');
  }
});

test('Ironman comparison shows ties and either account can lead independently on XP and levels', () => {
  const raw = publishedIronmanComparison();
  raw.accounts[1].gainedXp = 3000;
  let comparison = buildIronmanComparison({ _meta: { ironmanComparison: raw } });
  assert.deepEqual(ironmanComparisonLeads(comparison), ['IronXDabber gained 1,000 more XP.', 'JorbisBTW gained 5 more total levels.']);
  raw.accounts[0].gainedXp = 3000;
  raw.accounts[0].gainedLevels = 5;
  comparison = buildIronmanComparison({ _meta: { ironmanComparison: raw } });
  assert.deepEqual(ironmanComparisonLeads(comparison), ['XP gained: tied.', 'total levels gained: tied.']);
});

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
