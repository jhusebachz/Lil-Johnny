import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { readPersistedSettings, writePersistedSettings } from './appSettingsStorage';
import {
  createWebReminderPoller,
  getCurrentNotificationAccess,
  requestNotificationAccess as requestReminderNotificationAccess,
  syncNativeReminderNotifications,
} from './reminderNotifications';

export type ThemeMode = 'light' | 'dark' | 'gangsta-green' | 'silver-black';
export type DefaultGamesView = 'gaming' | 'pokopia' | 'runescape';
export type NotificationAccess = 'granted' | 'denied' | 'undetermined' | 'unsupported';
export type ReminderRecurrence = 'daily' | 'weekdays' | 'weekends';
export type FavoriteFocus = 'cyber' | 'gym' | 'reminders';
export type AppTabKey = 'dashboard' | 'cyber' | 'gym' | 'games' | 'goals' | 'reminders' | 'settings';

export type ReminderItem = {
  id: string;
  topic: string;
  time: string;
  enabled: boolean;
  notes: string;
  recurrence: ReminderRecurrence;
  completedDates: string[];
};

export type AppPreferences = {
  notificationsEnabled: boolean;
  privateNotifications: boolean;
  hapticsEnabled: boolean;
  autoRefreshGamingNews: boolean;
  defaultGamesView: DefaultGamesView;
  favoriteFocus: FavoriteFocus;
  profileName: string;
  preferredWorkoutSplit: string;
  scheduleWindow: string;
  customTabLabels: Record<AppTabKey, string>;
  gamesFeeds: {
    pokopiaQuery: string;
    switchQuery: string;
    steamQuery: string;
  };
  usageCounts: Record<AppTabKey, number>;
};

export type PersistedSettings = {
  theme: ThemeMode;
  reminders: ReminderItem[];
  preferences: AppPreferences;
};

export type AppPreferencesUpdate = Partial<
  Omit<AppPreferences, 'customTabLabels' | 'gamesFeeds' | 'usageCounts'>
> & {
  customTabLabels?: Partial<Record<AppTabKey, string>>;
  gamesFeeds?: Partial<AppPreferences['gamesFeeds']>;
  usageCounts?: Partial<Record<AppTabKey, number>>;
};

type AppSettingsContextType = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  reminders: ReminderItem[];
  addReminder: () => ReminderItem;
  updateReminder: (id: string, updates: Partial<ReminderItem>) => void;
  toggleReminderCompletion: (id: string, dateKey?: string) => void;
  preferences: AppPreferences;
  updatePreferences: (updates: AppPreferencesUpdate) => void;
  notificationAccess: NotificationAccess;
  requestNotificationAccess: () => Promise<boolean>;
  triggerHaptic: (force?: boolean) => Promise<void>;
  triggerTabHaptic: () => Promise<void>;
  trackTabVisit: (tab: AppTabKey) => void;
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

const initialReminders: ReminderItem[] = [
  {
    id: '1',
    topic: 'Linux+ Study',
    time: '6:00 PM',
    enabled: true,
    notes: 'Focus on one practice block or one lab objective.',
    recurrence: 'weekdays',
    completedDates: [],
  },
  {
    id: '2',
    topic: 'Cyber Study Block',
    time: '8:45 AM',
    enabled: true,
    notes: 'Use this as the first clean certification study block for the day.',
    recurrence: 'daily',
    completedDates: [],
  },
  {
    id: '3',
    topic: 'Games Check-in',
    time: '7:30 PM',
    enabled: false,
    notes: 'Use this only when you actually want a games window later in the day.',
    recurrence: 'weekends',
    completedDates: [],
  },
];

const initialPreferences: AppPreferences = {
  notificationsEnabled: true,
  privateNotifications: false,
  hapticsEnabled: true,
  autoRefreshGamingNews: true,
  defaultGamesView: 'gaming',
  favoriteFocus: 'cyber',
  profileName: 'John',
  preferredWorkoutSplit: 'Push / Pull / Legs',
  scheduleWindow: 'Early focus block',
  customTabLabels: {
    dashboard: 'Dashboard',
    cyber: 'Cyber',
    gym: 'Health',
    games: 'Games',
    goals: 'Hobbies',
    reminders: 'Reminders',
    settings: 'Settings',
  },
  gamesFeeds: {
    pokopiaQuery: 'Pokopia',
    switchQuery: '"Nintendo Switch 2"',
    steamQuery: 'Steam PC gaming',
  },
  usageCounts: {
    dashboard: 0,
    cyber: 0,
    gym: 0,
    games: 0,
    goals: 0,
    reminders: 0,
    settings: 0,
  },
};

const defaultSettings: PersistedSettings = {
  theme: 'dark',
  reminders: initialReminders,
  preferences: initialPreferences,
};

function mergeReminder(reminder?: Partial<ReminderItem>, fallback?: ReminderItem): ReminderItem {
  return {
    id: reminder?.id ?? fallback?.id ?? `${Date.now()}`,
    topic: reminder?.topic ?? fallback?.topic ?? 'New Reminder',
    time: reminder?.time ?? fallback?.time ?? '9:00 AM',
    enabled: reminder?.enabled ?? fallback?.enabled ?? true,
    notes: reminder?.notes ?? fallback?.notes ?? '',
    recurrence: reminder?.recurrence ?? fallback?.recurrence ?? 'daily',
    completedDates: reminder?.completedDates ?? fallback?.completedDates ?? [],
  };
}

function normalizePersistedSettings(persisted: PersistedSettings): PersistedSettings {
  return {
    theme: persisted.theme ?? defaultSettings.theme,
    reminders: (persisted.reminders ?? defaultSettings.reminders).map((reminder, index) =>
      mergeReminder(reminder, defaultSettings.reminders[index])
    ),
    preferences: {
      ...defaultSettings.preferences,
      ...persisted.preferences,
      customTabLabels: {
        ...defaultSettings.preferences.customTabLabels,
        ...persisted.preferences?.customTabLabels,
      },
      gamesFeeds: {
        ...defaultSettings.preferences.gamesFeeds,
        ...persisted.preferences?.gamesFeeds,
      },
      usageCounts: {
        ...defaultSettings.preferences.usageCounts,
        ...persisted.preferences?.usageCounts,
      },
    },
  };
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
          const normalized = normalizePersistedSettings(persisted);
          setTheme(normalized.theme);
          setReminders(normalized.reminders);
          setPreferences(normalized.preferences);
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

    void syncNativeReminderNotifications(
      reminders,
      preferences.notificationsEnabled,
      preferences.privateNotifications
    );
  }, [hasHydrated, preferences.notificationsEnabled, preferences.privateNotifications, reminders]);

  useEffect(() => {
    if (!hasHydrated || Platform.OS !== 'web') {
      return;
    }

    if (!preferences.notificationsEnabled || notificationAccess !== 'granted') {
      return;
    }

    const interval = createWebReminderPoller(
      reminders,
      preferences,
      notificationAccess,
      webFiredKeysRef
    );

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [hasHydrated, notificationAccess, preferences.notificationsEnabled, preferences.privateNotifications, reminders]);

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
      notes: '',
      recurrence: 'daily',
      completedDates: [],
    };

    setReminders((current) => [...current, nextReminder]);
    return nextReminder;
  };

  const toggleReminderCompletion = (id: string, dateKey = new Date().toISOString().slice(0, 10)) => {
    setReminders((current) =>
      current.map((item) => {
        if (item.id !== id) {
          return item;
        }

        const alreadyComplete = item.completedDates.includes(dateKey);

        return {
          ...item,
          completedDates: alreadyComplete
            ? item.completedDates.filter((entry) => entry !== dateKey)
            : [...item.completedDates, dateKey].sort(),
        };
      })
    );
  };

  const updatePreferences = (updates: AppPreferencesUpdate) => {
    setPreferences((current) => ({
      ...current,
      ...updates,
      customTabLabels: updates.customTabLabels
        ? { ...current.customTabLabels, ...updates.customTabLabels }
        : current.customTabLabels,
      gamesFeeds: updates.gamesFeeds ? { ...current.gamesFeeds, ...updates.gamesFeeds } : current.gamesFeeds,
      usageCounts: updates.usageCounts ? { ...current.usageCounts, ...updates.usageCounts } : current.usageCounts,
    }));
  };

  const requestNotificationAccess = async () =>
    requestReminderNotificationAccess(reminders, preferences, setNotificationAccess);

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

  const trackTabVisit = (tab: AppTabKey) => {
    setPreferences((current) => ({
      ...current,
      usageCounts: {
        ...current.usageCounts,
        [tab]: (current.usageCounts[tab] ?? 0) + 1,
      },
    }));
  };

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      reminders,
      addReminder,
      updateReminder,
      toggleReminderCompletion,
      preferences,
      updatePreferences,
      notificationAccess,
      requestNotificationAccess,
      triggerHaptic,
      triggerTabHaptic,
      trackTabVisit,
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
