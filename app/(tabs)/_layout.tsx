import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getThemeColors } from '../../data/theme';

export default function TabLayout() {
  const { theme } = useAppSettings();
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
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cyber"
        options={{
          title: 'Cyber',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="gym"
        options={{
          title: 'Health',
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Hobbies',
          tabBarIcon: ({ color, size }) => <Ionicons name="construct" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reminders"
        options={{
          title: 'Streaks',
          tabBarIcon: ({ color, size }) => <Ionicons name="flame" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
