import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getNotificationsModule, isExpoGo } from '../utils/notifications';

export type ThemeMode = 'light' | 'dark' | 'gangsta-green';
export type DefaultGamesView = 'gaming' | 'pokopia' | 'runescape';
export type NotificationAccess = 'granted' | 'denied' | 'undetermined' | 'unsupported';

export type ReminderItem = {
  id: string;
  topic: string;
  time: string;
  enabled: boolean;
};

export type AppPreferences = {
  notificationsEnabled: boolean;
  hapticsEnabled: boolean;
  autoRefreshGamingNews: boolean;
  defaultGamesView: DefaultGamesView;
};

type PersistedSettings = {
  theme: ThemeMode;
  reminders: ReminderItem[];
  preferences: AppPreferences;
};

type AppSettingsContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  reminders: ReminderItem[];
  addReminder: () => ReminderItem;
  updateReminder: (id: string, updates: Partial<ReminderItem>) => void;
  preferences: AppPreferences;
  updatePreferences: (updates: Partial<AppPreferences>) => void;
  notificationAccess: NotificationAccess;
  requestNotificationAccess: () => Promise<boolean>;
  triggerHaptic: (force?: boolean) => Promise<void>;
  triggerTabHaptic: () => Promise<void>;
};

const STORAGE_FILE = `${FileSystem.documentDirectory ?? ''}lil-johnny-settings.json`;
const WEB_STORAGE_KEY = 'lil-johnny-settings';

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const initialReminders: ReminderItem[] = [
  { id: '1', topic: 'Linux+ Study', time: '6:00 PM', enabled: true },
  { id: '2', topic: 'Cyber Threat Intel Review', time: '8:45 AM', enabled: true },
  { id: '3', topic: 'Games Check-in', time: '7:30 PM', enabled: false },
];

const initialPreferences: AppPreferences = {
  notificationsEnabled: true,
  hapticsEnabled: true,
  autoRefreshGamingNews: true,
  defaultGamesView: 'gaming',
};

const defaultSettings: PersistedSettings = {
  theme: 'dark',
  reminders: initialReminders,
  preferences: initialPreferences,
};

function parseReminderTime(time: string): { hour: number; minute: number } | null {
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

async function readPersistedSettings(): Promise<PersistedSettings | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    const raw = localStorage.getItem(WEB_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as PersistedSettings;
  }

  const fileInfo = await FileSystem.getInfoAsync(STORAGE_FILE);

  if (!fileInfo.exists) {
    return null;
  }

  const raw = await FileSystem.readAsStringAsync(STORAGE_FILE);
  return JSON.parse(raw) as PersistedSettings;
}

async function writePersistedSettings(settings: PersistedSettings) {
  const raw = JSON.stringify(settings);

  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(WEB_STORAGE_KEY, raw);
    }

    return;
  }

  await FileSystem.writeAsStringAsync(STORAGE_FILE, raw);
}

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

async function getCurrentNotificationAccess(): Promise<NotificationAccess> {
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

async function ensureAndroidChannel() {
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

async function syncNativeReminderNotifications(
  reminders: ReminderItem[],
  notificationsEnabled: boolean
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

    const parsedTime = parseReminderTime(reminder.time);

    if (!parsedTime) {
      continue;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.topic,
        body: `Lil Johnny reminder for ${reminder.time}`,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: parsedTime.hour,
        minute: parsedTime.minute,
        channelId: 'reminders',
      },
    });
  }
}

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(defaultSettings.theme);
  const [reminders, setReminders] = useState<ReminderItem[]>(defaultSettings.reminders);
  const [preferences, setPreferences] = useState<AppPreferences>(defaultSettings.preferences);
  const [notificationAccess, setNotificationAccess] = useState<NotificationAccess>('undetermined');
  const [hasHydrated, setHasHydrated] = useState(false);
  const webFiredKeysRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      try {
        const persisted = await readPersistedSettings();

        if (persisted && mounted) {
          setTheme(persisted.theme ?? defaultSettings.theme);
          setReminders(persisted.reminders ?? defaultSettings.reminders);
          setPreferences(persisted.preferences ?? defaultSettings.preferences);
        }
      } catch {
        // Ignore corrupt local state and keep defaults.
      } finally {
        if (mounted) {
          const access = await getCurrentNotificationAccess().catch(() => 'unsupported' as const);
          setNotificationAccess(access);
          setHasHydrated(true);
        }
      }
    };

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    void writePersistedSettings({ theme, reminders, preferences });
  }, [hasHydrated, preferences, reminders, theme]);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    void syncNativeReminderNotifications(reminders, preferences.notificationsEnabled);
  }, [hasHydrated, preferences.notificationsEnabled, reminders]);

  useEffect(() => {
    if (!hasHydrated || Platform.OS !== 'web') {
      return;
    }

    if (!preferences.notificationsEnabled || notificationAccess !== 'granted') {
      return;
    }

    const interval = setInterval(() => {
      const now = new Date();
      const dateKey = now.toISOString().slice(0, 10);

      reminders.forEach((reminder) => {
        if (!reminder.enabled) {
          return;
        }

        const parsedTime = parseReminderTime(reminder.time);

        if (!parsedTime) {
          return;
        }

        if (parsedTime.hour !== now.getHours() || parsedTime.minute !== now.getMinutes()) {
          return;
        }

        const reminderKey = `${reminder.id}-${dateKey}-${parsedTime.hour}-${parsedTime.minute}`;

        if (webFiredKeysRef.current[reminderKey]) {
          return;
        }

        webFiredKeysRef.current[reminderKey] = true;
        new Notification(reminder.topic, {
          body: `Lil Johnny reminder for ${reminder.time}`,
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [hasHydrated, notificationAccess, preferences.notificationsEnabled, reminders]);

  const updateReminder = (id: string, updates: Partial<ReminderItem>) => {
    setReminders((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const addReminder = () => {
    const nextReminder: ReminderItem = {
      id: `${Date.now()}`,
      topic: 'New Reminder',
      time: '9:00 AM',
      enabled: true,
    };

    setReminders((current) => [...current, nextReminder]);
    return nextReminder;
  };

  const updatePreferences = (updates: Partial<AppPreferences>) => {
    setPreferences((current) => ({ ...current, ...updates }));
  };

  const requestNotificationAccess = async () => {
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
      await syncNativeReminderNotifications(reminders, preferences.notificationsEnabled);
      return true;
    }

    return false;
  };

  const triggerHaptic = async (force = false) => {
    if (Platform.OS === 'web') {
      return;
    }

    if (!force && !preferences.hapticsEnabled) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  };

  const triggerTabHaptic = async () => {
    if (Platform.OS === 'web' || !preferences.hapticsEnabled) {
      return;
    }

    await Haptics.selectionAsync();
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      reminders,
      addReminder,
      updateReminder,
      preferences,
      updatePreferences,
      notificationAccess,
      requestNotificationAccess,
      triggerHaptic,
      triggerTabHaptic,
    }),
    [notificationAccess, preferences, reminders, theme]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }

  return context;
}
