import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AVOIDANCE_CONSISTENCY_WINDOW_DAYS,
  getAvoidanceConsistencySummary,
  getAvoidanceBestStreak,
  getAvoidanceStreak,
  recordAvoidanceFailure,
} from './avoidanceGoalMath.ts';

function getDateKeyDaysAgo(daysAgo: number, now: Date) {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildGoal({
  now,
  trackedDays = AVOIDANCE_CONSISTENCY_WINDOW_DAYS,
  failureDaysAgo = [],
}: {
  now: Date;
  trackedDays?: number;
  failureDaysAgo?: number[];
}) {
  return {
    startedAt: getDateKeyDaysAgo(trackedDays, now),
    lastFailureDate: failureDaysAgo.length > 0 ? getDateKeyDaysAgo(Math.min(...failureDaysAgo), now) : null,
    bestStreakDays: 0,
    failureDates: failureDaysAgo.map((daysAgo) => getDateKeyDaysAgo(daysAgo, now)),
  };
}

test('120/120 good days is locked in with no penalty', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(buildGoal({ now }), now);

  assert.equal(summary.goodDays, 120);
  assert.equal(summary.consistencyRate, 1);
  assert.equal(summary.label, 'Locked In');
  assert.equal(summary.multiplier, 1);
  assert.equal(summary.blissPenaltyPct, 0);
});

test('115/120 good days stays locked in with no penalty', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(buildGoal({ now, failureDaysAgo: [5, 18, 41, 72, 101] }), now);

  assert.equal(summary.goodDays, 115);
  assert.equal(summary.label, 'Locked In');
  assert.equal(summary.multiplier, 1);
});

test('105/120 good days is very consistent with a small penalty', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(
    buildGoal({ now, failureDaysAgo: Array.from({ length: 15 }, (_, index) => index * 3 + 1) }),
    now
  );

  assert.equal(summary.goodDays, 105);
  assert.equal(summary.label, 'Very Consistent');
  assert.equal(summary.multiplier, 0.95);
});

test('95/120 good days is solid but slipping', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(
    buildGoal({ now, failureDaysAgo: Array.from({ length: 25 }, (_, index) => index * 2 + 1) }),
    now
  );

  assert.equal(summary.goodDays, 95);
  assert.equal(summary.label, 'Solid, but slipping');
  assert.equal(summary.multiplier, 0.85);
});

test('85/120 good days is inconsistent', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(
    buildGoal({ now, failureDaysAgo: Array.from({ length: 35 }, (_, index) => index * 2 + 1) }),
    now
  );

  assert.equal(summary.goodDays, 85);
  assert.equal(summary.label, 'Inconsistent');
  assert.equal(summary.multiplier, 0.7);
});

test('80/120 good days needs a reset', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(
    buildGoal({ now, failureDaysAgo: Array.from({ length: 40 }, (_, index) => index * 2 + 1) }),
    now
  );

  assert.equal(summary.goodDays, 80);
  assert.equal(summary.label, 'Needs a Reset');
  assert.equal(summary.multiplier, 0.5);
});

test('less than 120 tracked days shows real good days while keeping the same pace label', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(buildGoal({ now, trackedDays: 30, failureDaysAgo: [10] }), now);

  assert.equal(summary.trackedDays, 30);
  assert.equal(summary.actualGoodDays, 29);
  assert.equal(summary.goodDays, 29);
  assert.equal(summary.consistencyRate, 29 / 30);
  assert.equal(summary.label, 'Locked In');
  assert.equal(summary.multiplier, 1);
});

test('a brand-new streak starts from zero good days without an immediate penalty', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const summary = getAvoidanceConsistencySummary(buildGoal({ now, trackedDays: 0 }), now);

  assert.equal(summary.trackedDays, 0);
  assert.equal(summary.goodDays, 0);
  assert.equal(summary.consistencyRate, 1);
  assert.equal(summary.label, 'Fresh Start');
  assert.equal(summary.multiplier, 1);
});

test('calendar-day streak math does not count the day after a failure as one full streak day', () => {
  const goal = {
    startedAt: '2026-05-01',
    lastFailureDate: '2026-05-10',
    bestStreakDays: 0,
    failureDates: ['2026-05-10'],
  };

  assert.equal(getAvoidanceStreak(goal, new Date('2026-05-11T00:30:00-04:00')), 0);
  assert.equal(getAvoidanceStreak(goal, new Date('2026-05-12T00:30:00-04:00')), 1);
});

test('recording a streak break for yesterday immediately updates current streak, good days, and best streak from failure history', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const goal = buildGoal({ now, trackedDays: 10 });
  const updatedGoal = {
    ...goal,
    ...recordAvoidanceFailure(goal, '2026-05-10', now),
  };
  const summary = getAvoidanceConsistencySummary(updatedGoal, now);

  assert.equal(getAvoidanceStreak(updatedGoal, now), 0);
  assert.equal(getAvoidanceBestStreak(updatedGoal, now), 9);
  assert.equal(summary.goodDays, 9);
  assert.deepEqual(updatedGoal.failureDates, ['2026-05-10']);
  assert.equal(updatedGoal.lastFailureDate, '2026-05-10');
});

test('recording a streak break for today preserves the completed good-day history but resets the live streak immediately', () => {
  const now = new Date('2026-05-11T20:30:00-04:00');
  const goal = buildGoal({ now, trackedDays: 10 });
  const updatedGoal = {
    ...goal,
    ...recordAvoidanceFailure(goal, '2026-05-11', now),
  };
  const summary = getAvoidanceConsistencySummary(updatedGoal, now);

  assert.equal(getAvoidanceStreak(updatedGoal, now), 0);
  assert.equal(getAvoidanceBestStreak(updatedGoal, now), 10);
  assert.equal(summary.goodDays, 10);
  assert.equal(updatedGoal.lastFailureDate, '2026-05-11');
});
