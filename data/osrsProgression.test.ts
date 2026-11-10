import assert from 'node:assert/strict';
import test from 'node:test';

import { buildIronmanMilestone, buildMaxCapePace } from './osrsProgression.ts';
import { xpForLevel } from './osrsTrackerGoals.ts';
import { SKILL_ORDER } from './osrsTrackerTypes.ts';
import type { OsrsPlayerStats, SkillName } from './osrsTrackerTypes.ts';

function player(levels: Partial<Record<SkillName, number>> = {}, xp: Partial<Record<SkillName, number>> = {}): OsrsPlayerStats {
  const skills = Object.fromEntries(SKILL_ORDER.map((skill) => [skill, {
    rank: -1,
    level: levels[skill] ?? 99,
    experience: xp[skill] ?? xpForLevel(levels[skill] ?? 99),
  }]));
  return {
    overall: { rank: -1, level: SKILL_ORDER.reduce((n, skill) => n + (levels[skill] ?? 99), 0), experience: 0 },
    ...skills,
  } as OsrsPlayerStats;
}

test('max pace uses cumulative XP/hour work and ignores combat gains for the hours clock', () => {
  const one = player({ agility: 91, attack: 92 }, { agility: 6_368_115, attack: 6_911_064 });
  const two = player({ agility: 91, attack: 95 }, { agility: 6_418_115, attack: 8_978_556 });
  const first = buildMaxCapePace({ jhusebachz: one, _meta: { reportDateKey: '2026-11-11' } }, 'jhusebachz');
  const second = buildMaxCapePace({ jhusebachz: two, _meta: { reportDateKey: '2026-11-11' } }, 'jhusebachz');
  assert.ok(first && second);
  assert.equal(Math.round((second.completedTimedHours - first.completedTimedHours) * 10) / 10, 1);
  assert.equal(Math.round((second.hoursAhead - first.hoursAhead) * 10) / 10, 1);
  assert.ok(second.untimedCombat.some((item) => item.skill === 'attack'));
  assert.ok(second.timedSkills.every((item) => item.skill !== 'attack'));
});

test('Ironman milestone tracks base levels, next tier, and level gains without XP/hour', () => {
  const current = player({ hunter: 9, construction: 17, fletching: 20, herblore: 22, slayer: 26 });
  const previous = player({ hunter: 9, construction: 17, fletching: 19, herblore: 21, slayer: 26 });
  const result = buildIronmanMilestone({ JorbisBTW: current }, { JorbisBTW: previous });
  assert.ok(result);
  assert.equal(result.targetLevel, 30);
  assert.equal(result.completed, 19);
  assert.equal(result.nextTier?.level, 40);
  assert.equal(result.levelsGainedSincePrevious, 2);
  assert.equal(result.remaining.length, 5);
  assert.equal('hoursLeft' in result, false);
});

test('published goal summaries are preferred to local fallback calculations', () => {
  const snapshot = { jhusebachz: player(), _meta: { reportDateKey: '2026-11-11' } };
  const derived = buildMaxCapePace(snapshot, 'jhusebachz');
  assert.ok(derived);
  const published = { ...derived, hoursAhead: 42 };
  assert.equal(buildMaxCapePace({ ...snapshot, _meta: { maxCapePace: published } }, 'jhusebachz')?.hoursAhead, 42);
});

test('missing skills do not count as completed milestones', () => {
  const missing = player();
  delete (missing as unknown as Record<string, unknown>).hunter;
  assert.equal(buildIronmanMilestone({ JorbisBTW: missing }), null);
  assert.equal(buildMaxCapePace({ jhusebachz: missing }, 'jhusebachz'), null);
});
