import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildTrackerSevenDaySummary,
  buildTrackerSevenDaySummaryFromSnapshotStore,
  readTrackerSevenDaySummaryFromMetadata,
} from './osrsTrackerSevenDay.ts';
import { SKILL_ORDER } from './osrsTrackerTypes.ts';
import type { OsrsApiResponse } from './osrsTrackerTypes.ts';

type SnapshotStore = {
  snapshots: Record<string, OsrsApiResponse>;
};

function buildPlayer(overallXp: number, overrides: Partial<Record<(typeof SKILL_ORDER)[number], number>> = {}) {
  const skillEntries = Object.fromEntries(
    SKILL_ORDER.map((skill) => [
      skill,
      {
        metric: skill,
        experience: overrides[skill] ?? 1_000_000,
        rank: 1,
        level: 99,
        ehp: 0,
      },
    ])
  );

  return {
    overall: {
      metric: 'overall',
      experience: overallXp,
      rank: 1,
      level: 2277,
      ehp: 0,
    },
    ...skillEntries,
  };
}

function buildSnapshot(overallXp: number, hunterXp: number, metadataHours: number): OsrsApiResponse {
  return {
    _meta: {
      effectiveHours: {
        jhusebachz: {
          totalHours: metadataHours,
          bySkill: {
            hunter: metadataHours,
          },
          skippedSkills: [],
        },
      },
    },
    jhusebachz: buildPlayer(overallXp, { hunter: hunterXp }),
  };
}

test('seven-day summary totals and averages are computed from compact day entries', () => {
  const summary = buildTrackerSevenDaySummary([
    {
      dateKey: '2026-05-17',
      label: 'May 17',
      totalXp: 200_000,
      effectiveHours: 2,
      topSkills: [{ skill: 'Hunter', xp: 200_000 }],
    },
    {
      dateKey: '2026-05-16',
      label: 'May 16',
      totalXp: 100_000,
      effectiveHours: 1,
      topSkills: [{ skill: 'Slayer', xp: 100_000 }],
    },
  ]);

  assert.equal(summary.daysTracked, 2);
  assert.equal(summary.activeDays, 2);
  assert.equal(summary.totalXp, 300_000);
  assert.equal(summary.totalEffectiveHours, 3);
  assert.equal(summary.averageXp, 150_000);
  assert.equal(summary.averageEffectiveHours, 1.5);
});

test('seven-day metadata parser accepts valid saved summaries', () => {
  const summary = readTrackerSevenDaySummaryFromMetadata({
    daysTracked: 2,
    activeDays: 2,
    totalXp: 300_000,
    totalEffectiveHours: 3,
    averageXp: 150_000,
    averageEffectiveHours: 1.5,
    days: [
      {
        dateKey: '2026-05-17',
        label: 'May 17',
        totalXp: 200_000,
        effectiveHours: 2,
        topSkills: [{ skill: 'Hunter', xp: 200_000 }],
      },
    ],
  });

  assert.ok(summary);
  assert.equal(summary?.days[0].dateKey, '2026-05-17');
  assert.equal(summary?.totalXp, 300_000);
});

test('seven-day summary can be derived from locally cached snapshots', () => {
  const store: SnapshotStore = {
    snapshots: {
      '2026-05-15': buildSnapshot(10_000_000, 1_000_000, 1.2),
      '2026-05-16': buildSnapshot(10_150_000, 1_070_000, 1.4),
      '2026-05-17': buildSnapshot(10_400_000, 1_170_000, 2),
    },
  };

  const summary = buildTrackerSevenDaySummaryFromSnapshotStore(store, 'jhusebachz');

  assert.equal(summary.daysTracked, 3);
  assert.equal(summary.days[0].dateKey, '2026-05-17');
  assert.equal(summary.days[0].totalXp, 250_000);
  assert.equal(summary.days[0].effectiveHours, 2);
  assert.equal(summary.totalXp, 400_000);
  assert.equal(Number(summary.totalEffectiveHours.toFixed(1)), 4.6);
});
