import type { ReminderItem } from '../context/AppSettingsContext';

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

export function getNextReminder(reminders: ReminderItem[], now = new Date()) {
  return reminders
    .filter((reminder) => reminder.enabled)
    .map((reminder) => ({
      reminder,
      occurrence: getNextReminderOccurrence(reminder.time, now),
    }))
    .filter(
      (entry): entry is { reminder: ReminderItem; occurrence: Date } => entry.occurrence instanceof Date
    )
    .sort((left, right) => left.occurrence.getTime() - right.occurrence.getTime())[0] ?? null;
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
