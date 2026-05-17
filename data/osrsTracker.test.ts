import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateOsrsEffectiveHoursFromGains, resolveOsrsEffectiveHours } from './osrsEffectiveHours.ts';

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
