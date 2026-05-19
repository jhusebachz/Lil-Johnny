import assert from 'node:assert/strict';
import test from 'node:test';

import type { ReminderItem } from '../context/AppSettingsContext';
import {
  getNextReminder,
  getReminderCustomWeekdaySummary,
  getReminderRecurrenceLabel,
  getReminderScheduledWeekdays,
  isReminderScheduledOnDate,
} from './reminders.ts';

function buildReminder(overrides: Partial<ReminderItem> = {}): ReminderItem {
  return {
    id: 'reminder-1',
    topic: 'Gym bag',
    time: '7:30 PM',
    enabled: true,
    notes: '',
    recurrence: 'daily',
    customWeekdays: [0, 1, 2, 3, 4, 5, 6],
    completedDates: [],
    ...overrides,
  };
}

test('custom reminder recurrence only schedules the selected weekdays', () => {
  const reminder = buildReminder({
    recurrence: 'custom',
    customWeekdays: [2, 3, 4],
  });

  assert.deepEqual(getReminderScheduledWeekdays(reminder), [2, 3, 4]);
  assert.equal(isReminderScheduledOnDate(reminder, new Date('2026-05-19T12:00:00')), true);
  assert.equal(isReminderScheduledOnDate(reminder, new Date('2026-05-18T12:00:00')), false);
  assert.equal(getReminderCustomWeekdaySummary(reminder), 'Tue, Wed, Thu');
});

test('next reminder skips ahead to the next selected custom day', () => {
  const reminder = buildReminder({
    recurrence: 'custom',
    customWeekdays: [2, 3, 4],
  });

  const next = getNextReminder([reminder], new Date('2026-05-18T20:00:00'));

  assert.ok(next);
  assert.equal(next?.occurrence.getDay(), 2);
  assert.equal(next?.occurrence.getHours(), 19);
  assert.equal(next?.occurrence.getMinutes(), 30);
});

test('custom recurrence label is user friendly', () => {
  assert.equal(getReminderRecurrenceLabel('custom'), 'Custom days');
});
