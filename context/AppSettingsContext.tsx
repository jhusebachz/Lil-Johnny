import * as Haptics from 'expo-haptics';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { getTodayDateKey } from '../data/lifeTrackerData';
import { readPersistedSettings, writePersistedSettings } from './appSettingsStorage';
import {
  createWebReminderPoller,
  getCurrentNotificationAccess,
  requestNotificationAccess as requestReminderNotificationAccess,
  syncNativeReminderNotifications,
} from './reminderNotifications';

export type ThemeMode = 'light' | 'dark' | 'gangsta-green' | 'silver-black';
export type NotificationAccess = 'granted' | 'denied' | 'undetermined' | 'unsupported';
export type ReminderRecurrence = 'daily' | 'weekdays' | 'weekends';

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
  profileName: string;
  preferredWorkoutSplit: string;
  scheduleWindow: string;
};

export type PersistedSettings = {
  theme: ThemeMode;
  reminders: ReminderItem[];
  preferences: AppPreferences;
};

export type AppPreferencesUpdate = Partial<AppPreferences>;

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
};

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);
const ThemeSettingsContext = createContext<Pick<AppSettingsContextType, 'theme' | 'setTheme'> | undefined>(undefined);
const ReminderSettingsContext = createContext<
  Pick<AppSettingsContextType, 'reminders' | 'addReminder' | 'updateReminder' | 'toggleReminderCompletion'> | undefined
>(undefined);
const PreferenceSettingsContext = createContext<
  Pick<
    AppSettingsContextType,
    | 'preferences'
    | 'updatePreferences'
    | 'notificationAccess'
    | 'requestNotificationAccess'
    | 'triggerHaptic'
    | 'triggerTabHaptic'
  > | undefined
>(undefined);

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
    topic: 'Hobbies Check-in',
    time: '7:30 PM',
    enabled: false,
    notes: 'Use this only when you actually want a hobbies window later in the day.',
    recurrence: 'weekends',
    completedDates: [],
  },
];

const initialPreferences: AppPreferences = {
  notificationsEnabled: true,
  privateNotifications: false,
  hapticsEnabled: true,
  profileName: 'John',
  preferredWorkoutSplit: 'Push / Pull / Legs',
  scheduleWindow: 'Early focus block',
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
    reminders: (persisted.reminders ?? defaultSettings.reminders).map((reminder, index) => {
      const merged = mergeReminder(reminder, defaultSettings.reminders[index]);

      if (merged.topic === 'Cyber Threat Intel Review') {
        return {
          ...merged,
          topic: 'Cyber Study Block',
          notes: 'Use this as the first clean certification study block for the day.',
        };
      }

      if (merged.topic === 'Games Check-in') {
        return {
          ...merged,
          topic: 'Hobbies Check-in',
          notes: 'Use this only when you actually want a hobbies window later in the day.',
        };
      }

      return merged;
    }),
    preferences: {
      ...defaultSettings.preferences,
      ...persisted.preferences,
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
        const persisted = await readPersistedSettings<PersistedSettings>();

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

  const updateReminder = useCallback((id: string, updates: Partial<ReminderItem>) => {
    setReminders((current) =>
      current.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  }, []);

  const addReminder = useCallback(() => {
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
  }, []);

  const toggleReminderCompletion = useCallback((id: string, dateKey = getTodayDateKey()) => {
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
  }, []);

  const updatePreferences = useCallback((updates: AppPreferencesUpdate) => {
    setPreferences((current) => ({
      ...current,
      ...updates,
    }));
  }, []);

  const requestNotificationAccess = useCallback(
    async () => requestReminderNotificationAccess(reminders, preferences, setNotificationAccess),
    [preferences, reminders]
  );

  const triggerHaptic = useCallback(async (force = false) => {
    if (Platform.OS === 'web') {
      return;
    }

    if (!force && !preferences.hapticsEnabled) {
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
  }, [preferences.hapticsEnabled]);

  const triggerTabHaptic = useCallback(async () => {
    if (Platform.OS === 'web' || !preferences.hapticsEnabled) {
      return;
    }

    await Haptics.selectionAsync();
  }, [preferences.hapticsEnabled]);

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
    }),
    [
      addReminder,
      notificationAccess,
      preferences,
      reminders,
      requestNotificationAccess,
      theme,
      toggleReminderCompletion,
      triggerHaptic,
      triggerTabHaptic,
      updatePreferences,
      updateReminder,
    ]
  );

  const themeValue = useMemo(
    () => ({
      theme,
      setTheme,
    }),
    [theme]
  );

  const reminderValue = useMemo(
    () => ({
      reminders,
      addReminder,
      updateReminder,
      toggleReminderCompletion,
    }),
    [addReminder, reminders, toggleReminderCompletion, updateReminder]
  );

  const preferenceValue = useMemo(
    () => ({
      preferences,
      updatePreferences,
      notificationAccess,
      requestNotificationAccess,
      triggerHaptic,
      triggerTabHaptic,
    }),
    [notificationAccess, preferences, requestNotificationAccess, triggerHaptic, triggerTabHaptic, updatePreferences]
  );

  return (
    <AppSettingsContext.Provider value={value}>
      <ThemeSettingsContext.Provider value={themeValue}>
        <ReminderSettingsContext.Provider value={reminderValue}>
          <PreferenceSettingsContext.Provider value={preferenceValue}>{children}</PreferenceSettingsContext.Provider>
        </ReminderSettingsContext.Provider>
      </ThemeSettingsContext.Provider>
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);

  if (!context) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }

  return context;
}

export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext);

  if (!context) {
    throw new Error('useThemeSettings must be used inside AppSettingsProvider');
  }

  return context;
}

export function useReminderSettings() {
  const context = useContext(ReminderSettingsContext);

  if (!context) {
    throw new Error('useReminderSettings must be used inside AppSettingsProvider');
  }

  return context;
}

export function usePreferenceSettings() {
  const context = useContext(PreferenceSettingsContext);

  if (!context) {
    throw new Error('usePreferenceSettings must be used inside AppSettingsProvider');
  }

  return context;
}
