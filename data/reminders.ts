import type { ReminderItem, ReminderRecurrence } from '../context/AppSettingsContext';

export function parseReminderTime(time: string) {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return null;
  }

  const hourValue = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3].toUpperCase();

  if (hourValue < 1 || hourValue > 12 || minute < 0 || minute > 59) {
    return null;
  }

  return {
    hour: hourValue,
    minute: String(minute).padStart(2, '0'),
    meridiem: meridiem === 'AM' ? ('AM' as const) : ('PM' as const),
  };
}

export function formatReminderTime(hour: number, minute: string, meridiem: 'AM' | 'PM') {
  return `${hour}:${minute} ${meridiem}`;
}

export function getNextReminderOccurrence(time: string, now = new Date()) {
  const parts = parseReminderTime(time);

  if (!parts) {
    return null;
  }

  const occurrence = new Date(now);
  let hour = parts.hour % 12;

  if (parts.meridiem === 'PM') {
    hour += 12;
  }

  occurrence.setHours(hour, Number(parts.minute), 0, 0);

  if (occurrence <= now) {
    occurrence.setDate(occurrence.getDate() + 1);
  }

  return occurrence;
}

export function getReminderOccurrenceForDate(time: string, date: Date) {
  const parts = parseReminderTime(time);

  if (!parts) {
    return null;
  }

  const occurrence = new Date(date);
  let hour = parts.hour % 12;

  if (parts.meridiem === 'PM') {
    hour += 12;
  }

  occurrence.setHours(hour, Number(parts.minute), 0, 0);
  return occurrence;
}

export function getDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getReminderRecurrenceLabel(recurrence: ReminderRecurrence) {
  if (recurrence === 'weekdays') {
    return 'Weekdays';
  }

  if (recurrence === 'weekends') {
    return 'Weekends';
  }

  return 'Daily';
}

export function isReminderScheduledOnDate(reminder: ReminderItem, date: Date) {
  const day = date.getDay();

  if (reminder.recurrence === 'weekdays') {
    return day >= 1 && day <= 5;
  }

  if (reminder.recurrence === 'weekends') {
    return day === 0 || day === 6;
  }

  return true;
}

export function isReminderCompleteOnDate(reminder: ReminderItem, date: Date) {
  return reminder.completedDates.includes(getDateKey(date));
}

export function getNextReminder(reminders: ReminderItem[], now = new Date()) {
  const candidates = reminders.flatMap((reminder) => {
    if (!reminder.enabled) {
      return [];
    }

    for (let offset = 0; offset < 8; offset += 1) {
      const candidateDate = new Date(now);
      candidateDate.setDate(now.getDate() + offset);

      if (!isReminderScheduledOnDate(reminder, candidateDate) || isReminderCompleteOnDate(reminder, candidateDate)) {
        continue;
      }

      const occurrence = getReminderOccurrenceForDate(reminder.time, candidateDate);

      if (!occurrence) {
        continue;
      }

      if (offset === 0 && occurrence <= now) {
        continue;
      }

      return [{ reminder, occurrence }];
    }

    return [];
  });

  return candidates.sort((left, right) => left.occurrence.getTime() - right.occurrence.getTime())[0] ?? null;
}

export function getTodayReminderSummary(reminders: ReminderItem[], now = new Date()) {
  const todayReminders = reminders.filter(
    (reminder) => reminder.enabled && isReminderScheduledOnDate(reminder, now)
  );
  const completed = todayReminders.filter((reminder) => isReminderCompleteOnDate(reminder, now)).length;

  return {
    scheduled: todayReminders.length,
    completed,
    remaining: Math.max(todayReminders.length - completed, 0),
  };
}

export function getReminderCompletionStreak(reminders: ReminderItem[], now = new Date()) {
  let streak = 0;

  for (let offset = 0; offset < 60; offset += 1) {
    const date = new Date(now);
    date.setDate(now.getDate() - offset);
    const scheduled = reminders.filter((reminder) => reminder.enabled && isReminderScheduledOnDate(reminder, date));

    if (scheduled.length === 0) {
      continue;
    }

    const allCompleted = scheduled.every((reminder) => isReminderCompleteOnDate(reminder, date));

    if (!allCompleted) {
      break;
    }

    streak += 1;
  }

  return streak;
}

export function formatUpcomingReminder(occurrence: Date, now = new Date()) {
  const sameDay = occurrence.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);

  const timeLabel = occurrence.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });

  if (sameDay) {
    return timeLabel;
  }

  if (occurrence.toDateString() === tomorrow.toDateString()) {
    return `Tomorrow, ${timeLabel}`;
  }

  const weekday = occurrence.toLocaleDateString([], { weekday: 'short' });
  return `${weekday}, ${timeLabel}`;
}
