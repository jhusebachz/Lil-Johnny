import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
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
  enabled,
  onPress,
  colors,
}: {
  label: string;
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
        <Text style={{ fontSize: 14, color: colors.text, fontWeight: '800' }}>{label}</Text>
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
        <View
          style={{
            backgroundColor: colors.hero,
            borderRadius: 16,
            padding: 20,
            minHeight: 112,
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800' }}>Settings</Text>
        </View>

        <SectionCard title="Notifications" emoji={'\u{1F514}'} colors={colors}>
          <SettingToggle
            label="Notifications"
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

        <SectionCard title="Appearance" emoji={'\u{1F3A8}'} colors={colors}>
          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 4 }}>Current theme</Text>
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700', marginBottom: 12 }}>
            {currentThemeLabel}
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
          <Text style={{ fontSize: 13, color: colors.text }}>
            Notifications: {preferences.notificationsEnabled ? 'Enabled' : 'Disabled'} | Haptics:{' '}
            {preferences.hapticsEnabled ? 'Enabled' : 'Disabled'} | Privacy:{' '}
            {preferences.privateNotifications ? 'Private alerts' : 'Full alerts'}
          </Text>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
