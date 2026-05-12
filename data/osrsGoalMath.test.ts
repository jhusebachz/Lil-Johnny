import test from 'node:test';
import assert from 'node:assert/strict';

import { daysUntilGoalDate, getGoalPacePct } from './osrsGoalMath.ts';

test('daysUntilGoalDate stays stable morning versus late night on the same calendar day', () => {
  const morning = new Date('2026-05-11T08:15:00-04:00');
  const lateNight = new Date('2026-05-11T23:45:00-04:00');

  assert.equal(daysUntilGoalDate('2026-10-03', morning), 145);
  assert.equal(daysUntilGoalDate('2026-10-03', lateNight), 145);
});

test('daysUntilGoalDate never drops below one on or after the deadline day', () => {
  assert.equal(daysUntilGoalDate('2026-10-03', new Date('2026-10-03T09:00:00-04:00')), 1);
  assert.equal(daysUntilGoalDate('2026-10-03', new Date('2026-10-05T09:00:00-04:00')), 1);
});

test('getGoalPacePct uses calendar-day math instead of time-of-day math', () => {
  const morning = new Date('2026-05-11T08:15:00-04:00');
  const lateNight = new Date('2026-05-11T23:45:00-04:00');
  const morningPace = getGoalPacePct('2026-03-25', '2026-10-03', morning);
  const lateNightPace = getGoalPacePct('2026-03-25', '2026-10-03', lateNight);

  assert.equal(morningPace, lateNightPace);
  assert.equal(Number(morningPace.toFixed(6)), 24.479167);
});
