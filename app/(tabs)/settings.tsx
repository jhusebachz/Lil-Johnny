import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionCard from '../../components/SectionCard';
import { ThemeMode, useAppSettings } from '../../context/AppSettingsContext';
import { getThemeColors } from '../../data/theme';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Silver & Black \u2620\uFE0F', value: 'silver-black' },
  { label: 'Gangsta Green', value: 'gangsta-green' },
];

function SettingToggle({
  label,
  description,
  enabled,
  onPress,
  colors,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onPress: () => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800', marginBottom: 4 }}>{label}</Text>
        <Text style={{ fontSize: 12, color: colors.subtext, lineHeight: 18 }}>{description}</Text>
      </View>
      <View
        style={{
          width: 52,
          height: 30,
          backgroundColor: enabled ? colors.success : colors.inputBorder,
          borderRadius: 999,
          padding: 3,
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 999,
            backgroundColor: 'white',
            alignSelf: enabled ? 'flex-end' : 'flex-start',
          }}
        />
      </View>
    </Pressable>
  );
}

function SettingsInput({
  label,
  value,
  onChangeText,
  placeholder,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 6 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.subtext}
        style={{
          backgroundColor: colors.inputBackground,
          borderWidth: 1,
          borderColor: colors.inputBorder,
          borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: colors.text,
        }}
      />
    </View>
  );
}

export default function Settings() {
  const {
    theme,
    setTheme,
    preferences,
    updatePreferences,
    notificationAccess,
    requestNotificationAccess,
    triggerHaptic,
  } = useAppSettings();
  const colors = getThemeColors(theme);
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const currentThemeLabel = themeOptions.find((option) => option.value === theme)?.label ?? theme;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={triggerRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <SectionCard title="Profile" emoji={'\u{1F464}'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 12 }}>
            These settings shape the way Lil Johnny talks to you across the tracker app. Changes save automatically.
          </Text>
          <SettingsInput
            label="Name"
            value={preferences.profileName}
            onChangeText={(text) => updatePreferences({ profileName: text })}
            placeholder="Your name"
            colors={colors}
          />
          <SettingsInput
            label="Preferred health split"
            value={preferences.preferredWorkoutSplit}
            onChangeText={(text) => updatePreferences({ preferredWorkoutSplit: text })}
            placeholder="Push / Pull / Legs"
            colors={colors}
          />
          <SettingsInput
            label="Primary schedule window"
            value={preferences.scheduleWindow}
            onChangeText={(text) => updatePreferences({ scheduleWindow: text })}
            placeholder="Morning focus block"
            colors={colors}
          />
        </SectionCard>

        <SectionCard title="Notifications" emoji={'\u{1F514}'} colors={colors}>
          <SettingToggle
            label="Notifications"
            description="Master switch for reminder alerts across the app."
            enabled={preferences.notificationsEnabled}
            onPress={() => {
              void (async () => {
                await triggerHaptic();
                const nextEnabled = !preferences.notificationsEnabled;
                updatePreferences({ notificationsEnabled: nextEnabled });

                if (nextEnabled) {
                  await requestNotificationAccess();
                }
              })();
            }}
            colors={colors}
          />
          <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 12 }}>Alert access: {notificationAccess}</Text>
          <SettingToggle
            label="Haptics"
            description="Keep tactile feedback enabled for interactions when supported."
            enabled={preferences.hapticsEnabled}
            onPress={() => {
              void (async () => {
                await triggerHaptic(true);
                updatePreferences({ hapticsEnabled: !preferences.hapticsEnabled });
              })();
            }}
            colors={colors}
          />
          <SettingToggle
            label="Private reminder notifications"
            description="Hide reminder topic text in alerts and use generic notification copy instead."
            enabled={preferences.privateNotifications}
            onPress={() => {
              void (async () => {
                await triggerHaptic();
                updatePreferences({ privateNotifications: !preferences.privateNotifications });
              })();
            }}
            colors={colors}
          />
        </SectionCard>

        <SectionCard title="Tracker Layout" emoji={'\u{1F9ED}'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 12 }}>
            Lil Johnny is now set up as one tracker system for the main lanes you care about through the year.
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 6 }}>
            Dashboard: fast overview of Cyber, Health, Hobbies, and the year-goal lane
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 6 }}>
            Cyber: certification chapter progress, pace tracking, and practice scores
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 6 }}>
            Health: gym tracking, weight entries, loop runs, and weekly consistency
          </Text>
          <Text style={{ fontSize: 13, color: colors.text, marginBottom: 6 }}>
            Hobbies: OSRS progress, DIY house tasks, and year-long personal trackers in one lane
          </Text>
          <Text style={{ fontSize: 13, color: colors.text }}>
            Reminders: your schedule lane for study blocks, habits, and daily accountability
          </Text>
        </SectionCard>

        <SectionCard title="Appearance" emoji={'\u{1F3A8}'} colors={colors}>
          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 4 }}>Current theme</Text>
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700', marginBottom: 12 }}>
            {currentThemeLabel}
          </Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 12 }}>
            Choose the overall color treatment for the tracker app.
          </Text>

          {themeOptions.map((option) => {
            const selected = theme === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  void (async () => {
                    await triggerHaptic();
                    setTheme(option.value);
                  })();
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: selected ? colors.accent : colors.card,
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : colors.cardBorder,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: selected ? 'white' : colors.text, fontSize: 14, fontWeight: '700' }}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </SectionCard>

        <SectionCard title="System Snapshot" emoji={'\u2699\uFE0F'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 8 }}>
            Preferences apply immediately, and reminder alerts keep syncing to the device whenever access is granted.
          </Text>
          <Text style={{ fontSize: 13, color: colors.text }}>
            Notifications: {preferences.notificationsEnabled ? 'Enabled' : 'Disabled'} | Haptics:{' '}
            {preferences.hapticsEnabled ? 'Enabled' : 'Disabled'} | Privacy:{' '}
            {preferences.privateNotifications ? 'Private alerts' : 'Full alerts'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8 }}>
            Profile: {preferences.profileName || 'Not set'} | Health split: {preferences.preferredWorkoutSplit} |
            Window: {preferences.scheduleWindow}
          </Text>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
