import { Platform } from 'react-native';
import { getDateKey, isReminderScheduledOnDate } from '../data/reminders';
import { getNotificationsModule, isExpoGo } from '../utils/notifications';
import type { AppPreferences, NotificationAccess, ReminderItem } from './AppSettingsContext';

function mapNotificationPermission(status: string): NotificationAccess {
  if (status === 'granted') {
    return 'granted';
  }

  if (status === 'denied') {
    return 'denied';
  }

  if (status === 'undetermined') {
    return 'undetermined';
  }

  return 'unsupported';
}

function parseNotificationTime(time: string): { hour: number; minute: number } | null {
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

  let hour = hourValue % 12;

  if (meridiem === 'PM') {
    hour += 12;
  }

  return { hour, minute };
}

function getReminderNotificationCopy(reminder: ReminderItem, privateNotifications: boolean) {
  return {
    title: privateNotifications ? 'Lil Johnny reminder' : reminder.topic,
    body: privateNotifications ? `Scheduled for ${reminder.time}` : `Lil Johnny reminder for ${reminder.time}`,
  };
}

function getReminderWeekdays(reminder: ReminderItem) {
  if (reminder.recurrence === 'weekdays') {
    return [2, 3, 4, 5, 6];
  }

  if (reminder.recurrence === 'weekends') {
    return [1, 7];
  }

  return null;
}

export function createWebReminderPoller(
  reminders: ReminderItem[],
  preferences: AppPreferences,
  notificationAccess: NotificationAccess,
  firedKeysRef: { current: Record<string, boolean> }
) {
  if (Platform.OS !== 'web') {
    return null;
  }

  if (!preferences.notificationsEnabled || notificationAccess !== 'granted') {
    return null;
  }

  return setInterval(() => {
    const now = new Date();
    const dateKey = getDateKey(now);

    reminders.forEach((reminder) => {
      if (!reminder.enabled) {
        return;
      }

      if (!isReminderScheduledOnDate(reminder, now)) {
        return;
      }

      if (reminder.completedDates.includes(dateKey)) {
        return;
      }

      const parsedTime = parseNotificationTime(reminder.time);

      if (!parsedTime) {
        return;
      }

      if (parsedTime.hour !== now.getHours() || parsedTime.minute !== now.getMinutes()) {
        return;
      }

      const reminderKey = `${reminder.id}-${dateKey}-${parsedTime.hour}-${parsedTime.minute}`;

      if (firedKeysRef.current[reminderKey]) {
        return;
      }

      firedKeysRef.current[reminderKey] = true;
      const content = getReminderNotificationCopy(reminder, preferences.privateNotifications);
      new Notification(content.title, { body: content.body });
    });
  }, 30000);
}

export async function getCurrentNotificationAccess(): Promise<NotificationAccess> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') {
      return 'unsupported';
    }

    return mapNotificationPermission(Notification.permission);
  }

  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return 'unsupported';
  }

  const permission = await Notifications.getPermissionsAsync();
  return mapNotificationPermission(permission.status);
}

export async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') {
    return;
  }

  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return;
  }

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function syncNativeReminderNotifications(
  reminders: ReminderItem[],
  notificationsEnabled: boolean,
  privateNotifications: boolean
) {
  if (Platform.OS === 'web') {
    return;
  }

  const Notifications = getNotificationsModule();

  if (!Notifications) {
    return;
  }

  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!notificationsEnabled) {
    return;
  }

  const permission = await Notifications.getPermissionsAsync();

  if (permission.status !== 'granted') {
    return;
  }

  for (const reminder of reminders) {
    if (!reminder.enabled) {
      continue;
    }

    const parsedTime = parseNotificationTime(reminder.time);

    if (!parsedTime) {
      continue;
    }

    const content = getReminderNotificationCopy(reminder, privateNotifications);
    const weekdays = getReminderWeekdays(reminder);

    if (!weekdays) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: parsedTime.hour,
          minute: parsedTime.minute,
          channelId: 'reminders',
        },
      });
      continue;
    }

    for (const weekday of weekdays) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: content.title,
          body: content.body,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: parsedTime.hour,
          minute: parsedTime.minute,
          channelId: 'reminders',
        },
      });
    }
  }
}

export async function requestNotificationAccess(
  reminders: ReminderItem[],
  preferences: AppPreferences,
  setNotificationAccess: (access: NotificationAccess) => void
) {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') {
      setNotificationAccess('unsupported');
      return false;
    }

    const result = await Notification.requestPermission();
    const access = mapNotificationPermission(result);
    setNotificationAccess(access);
    return access === 'granted';
  }

  const Notifications = getNotificationsModule();

  if (!Notifications || isExpoGo) {
    setNotificationAccess('unsupported');
    return false;
  }

  await ensureAndroidChannel();

  const current = await Notifications.getPermissionsAsync();
  let nextStatus = current.status;

  if (nextStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    nextStatus = requested.status;
  }

  const access = mapNotificationPermission(nextStatus);
  setNotificationAccess(access);

  if (access === 'granted') {
    await syncNativeReminderNotifications(
      reminders,
      preferences.notificationsEnabled,
      preferences.privateNotifications
    );
    return true;
  }

  return false;
}
