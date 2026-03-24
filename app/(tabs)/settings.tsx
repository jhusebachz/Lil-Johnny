import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SectionCard from '../../components/SectionCard';
import {
  DefaultGamesView,
  ThemeMode,
  useAppSettings,
} from '../../context/AppSettingsContext';
import { getThemeColors } from '../../data/theme';

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Gangsta Green', value: 'gangsta-green' },
];

const defaultGamesViewOptions: { label: string; value: DefaultGamesView }[] = [
  { label: 'Gaming News', value: 'gaming' },
  { label: 'Pokopia', value: 'pokopia' },
  { label: 'RuneScape', value: 'runescape' },
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
  const currentThemeLabel = themeOptions.find((option) => option.value === theme)?.label ?? theme;
  const defaultGamesViewLabel =
    defaultGamesViewOptions.find((option) => option.value === preferences.defaultGamesView)?.label ??
    preferences.defaultGamesView;

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28 }}>
        <SectionCard title="Notifications" emoji={'\uD83D\uDD14'} colors={colors}>
          <SettingToggle
            label="Notifications"
            description="Master switch for reminder-style alerts across the app."
            enabled={preferences.notificationsEnabled}
            onPress={async () => {
              await triggerHaptic();
              const nextEnabled = !preferences.notificationsEnabled;
              updatePreferences({ notificationsEnabled: nextEnabled });

              if (nextEnabled) {
                await requestNotificationAccess();
              }
            }}
            colors={colors}
          />
          <Text style={{ fontSize: 12, color: colors.subtext, marginBottom: 12 }}>
            Alert access: {notificationAccess}
          </Text>
          <SettingToggle
            label="Haptics"
            description="Keep tactile feedback enabled for interactions when supported."
            enabled={preferences.hapticsEnabled}
            onPress={async () => {
              await triggerHaptic(true);
              updatePreferences({ hapticsEnabled: !preferences.hapticsEnabled });
            }}
            colors={colors}
          />
        </SectionCard>

        <SectionCard title="Games Tab" emoji={'\uD83C\uDFAE'} colors={colors}>
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700', marginBottom: 12 }}>
            Starts on: {defaultGamesViewLabel}
          </Text>

          <SettingToggle
            label="Auto-refresh gaming news"
            description="Refresh Reddit-based Pokopia, Switch 2, and Steam headlines when opening Games."
            enabled={preferences.autoRefreshGamingNews}
            onPress={async () => {
              await triggerHaptic();
              updatePreferences({ autoRefreshGamingNews: !preferences.autoRefreshGamingNews });
            }}
            colors={colors}
          />

          {defaultGamesViewOptions.map((option) => {
            const selected = preferences.defaultGamesView === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={async () => {
                  await triggerHaptic();
                  updatePreferences({ defaultGamesView: option.value });
                }}
                style={{
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  backgroundColor: selected ? colors.accentSoft : colors.card,
                  borderWidth: 1,
                  borderColor: selected ? colors.accent : colors.cardBorder,
                  marginBottom: 10,
                }}
              >
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </SectionCard>

        <SectionCard title="Appearance" emoji={'\uD83C\uDFA8'} colors={colors}>
          <Text style={{ fontSize: 13, color: colors.subtext, marginBottom: 4 }}>Current theme</Text>
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700', marginBottom: 12 }}>
            {currentThemeLabel}
          </Text>

          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 12 }}>
            Choose the overall app color scheme.
          </Text>

          {themeOptions.map((option) => {
            const selected = theme === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={async () => {
                  await triggerHaptic();
                  setTheme(option.value);
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
                <Text
                  style={{
                    color: selected ? 'white' : colors.text,
                    fontSize: 14,
                    fontWeight: '700',
                  }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </SectionCard>

        <SectionCard title="System Snapshot" emoji={'\u2699'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 8 }}>
            Theme, reminders, and Games preferences update immediately and reminders now sync to real device alerts when notification access is granted.
          </Text>
          <Text style={{ fontSize: 13, color: colors.text }}>
            Notifications: {preferences.notificationsEnabled ? 'Enabled' : 'Disabled'} | Haptics:{' '}
            {preferences.hapticsEnabled ? 'Enabled' : 'Disabled'}
          </Text>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
