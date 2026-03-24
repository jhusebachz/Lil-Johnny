import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getThemeColors } from '../../data/theme';

export default function TabLayout() {
  const { theme, preferences, trackTabVisit } = useAppSettings();
  const colors = getThemeColors(theme);

  return (
    <Tabs
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        lazy: false,
        freezeOnBlur: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.cardBorder,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: preferences.customTabLabels.dashboard,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
        listeners={{ tabPress: () => trackTabVisit('dashboard') }}
      />
      <Tabs.Screen
        name="cyber"
        options={{
          title: preferences.customTabLabels.cyber,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
        listeners={{ tabPress: () => trackTabVisit('cyber') }}
      />
      <Tabs.Screen
        name="gym"
        options={{
          title: preferences.customTabLabels.gym,
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
        listeners={{ tabPress: () => trackTabVisit('gym') }}
      />
      <Tabs.Screen
        name="games"
        options={{
          title: preferences.customTabLabels.games,
          tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" size={size} color={color} />,
        }}
        listeners={{ tabPress: () => trackTabVisit('games') }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: preferences.customTabLabels.reminders,
          tabBarIcon: ({ color, size }) => <Ionicons name="alarm" size={size} color={color} />,
        }}
        listeners={{ tabPress: () => trackTabVisit('reminders') }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: preferences.customTabLabels.settings,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
        listeners={{ tabPress: () => trackTabVisit('settings') }}
      />
    </Tabs>
  );
}
