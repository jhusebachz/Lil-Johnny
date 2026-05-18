import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIY_RECENT_WINDOW_DAYS,
  getHobbiesBlissScore,
  hasRecentCompletedDiyTask,
  isTrackerGoalOnPace,
} from './dashboardBlissMath.ts';

test('recent DIY completion counts toward hobbies activity', () => {
  const referenceDate = new Date('2026-05-11T12:00:00-04:00');
  const diyTasks = [{ completedAt: '2026-05-08' }];

  assert.equal(hasRecentCompletedDiyTask(diyTasks, referenceDate), true);
  assert.equal(
    getHobbiesBlissScore({
      baseGoalOnPace: false,
      diyTasks,
      referenceDate,
      runefestOnPace: false,
    }),
    1 / 3
  );
});

test('old DIY completion falls out of the hobbies activity window', () => {
  const referenceDate = new Date('2026-05-11T12:00:00-04:00');
  const diyTasks = [{ completedAt: '2026-04-12' }];

  assert.equal(hasRecentCompletedDiyTask(diyTasks, referenceDate), false);
});

test('DIY activity counts on the last in-window day and drops after that', () => {
  const referenceDate = new Date('2026-05-11T12:00:00-04:00');
  const inWindow = [{ completedAt: '2026-04-14' }];
  const outOfWindow = [{ completedAt: '2026-04-13' }];

  assert.equal(hasRecentCompletedDiyTask(inWindow, referenceDate, DIY_RECENT_WINDOW_DAYS), true);
  assert.equal(hasRecentCompletedDiyTask(outOfWindow, referenceDate, DIY_RECENT_WINDOW_DAYS), false);
});

test('missing OSRS tracker data does not count as on pace for hobbies scoring', () => {
  assert.equal(isTrackerGoalOnPace(false, 0, 0), false);
  assert.equal(isTrackerGoalOnPace(false, 55, 50), false);
  assert.equal(isTrackerGoalOnPace(true, 55, 50), true);
});
