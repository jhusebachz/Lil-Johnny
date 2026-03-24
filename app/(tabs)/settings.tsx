import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SectionCard from '../../components/SectionCard';
import { DefaultGamesView, ThemeMode, useAppSettings } from '../../context/AppSettingsContext';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';
import { getThemeColors } from '../../data/theme';

const themeOptions: { label: string; value: ThemeMode }[] = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'Silver & Black ☠️', value: 'silver-black' },
  { label: 'Gangsta Green', value: 'gangsta-green' },
];

const defaultGamesViewOptions: { label: string; value: DefaultGamesView }[] = [
  { label: 'Gaming News', value: 'gaming' },
  { label: 'Pokopia', value: 'pokopia' },
  { label: 'RuneScape', value: 'runescape' },
];

const favoriteFocusOptions = [
  { label: 'Cyber', value: 'cyber' as const },
  { label: 'Gym', value: 'gym' as const },
  { label: 'Reminders', value: 'reminders' as const },
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
  const defaultGamesViewLabel =
    defaultGamesViewOptions.find((option) => option.value === preferences.defaultGamesView)?.label ??
    preferences.defaultGamesView;
  const mostUsedKey = Object.entries(preferences.usageCounts).sort((left, right) => right[1] - left[1])[0]?.[0] as
    | keyof typeof preferences.customTabLabels
    | undefined;
  const mostUsedLane = mostUsedKey ? preferences.customTabLabels[mostUsedKey] : undefined;

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
        <SectionCard title="Profile" emoji={'\uD83D\uDC64'} colors={colors}>
          <SettingsInput
            label="Name"
            value={preferences.profileName}
            onChangeText={(text) => updatePreferences({ profileName: text })}
            placeholder="Your name"
            colors={colors}
          />
          <SettingsInput
            label="Preferred workout split"
            value={preferences.preferredWorkoutSplit}
            onChangeText={(text) => updatePreferences({ preferredWorkoutSplit: text })}
            placeholder="Push / Pull / Legs"
            colors={colors}
          />
          <SettingsInput
            label="Default daily schedule window"
            value={preferences.scheduleWindow}
            onChangeText={(text) => updatePreferences({ scheduleWindow: text })}
            placeholder="Early focus block"
            colors={colors}
          />
        </SectionCard>

        <SectionCard title="Notifications" emoji={'\uD83D\uDD14'} colors={colors}>
          <SettingToggle
            label="Notifications"
            description="Master switch for reminder-style alerts across the app."
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

        <SectionCard title="Games Tab" emoji={'\uD83C\uDFAE'} colors={colors}>
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700', marginBottom: 12 }}>
            Starts on: {defaultGamesViewLabel}
          </Text>

          <SettingToggle
            label="Auto-refresh gaming news"
            description="Refresh Reddit-based Pokopia, Switch 2, and Steam headlines when opening Games."
            enabled={preferences.autoRefreshGamingNews}
            onPress={() => {
              void (async () => {
                await triggerHaptic();
                updatePreferences({ autoRefreshGamingNews: !preferences.autoRefreshGamingNews });
              })();
            }}
            colors={colors}
          />

          {defaultGamesViewOptions.map((option) => {
            const selected = preferences.defaultGamesView === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => {
                  void (async () => {
                    await triggerHaptic();
                    updatePreferences({ defaultGamesView: option.value });
                  })();
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
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{option.label}</Text>
              </Pressable>
            );
          })}

          <Text style={{ fontSize: 13, color: colors.subtext, marginTop: 6, marginBottom: 8 }}>
            Favorite feed queries or subreddits
          </Text>
          <SettingsInput
            label="Pokopia query"
            value={preferences.gamesFeeds.pokopiaQuery}
            onChangeText={(text) => updatePreferences({ gamesFeeds: { pokopiaQuery: text } })}
            placeholder="Pokopia"
            colors={colors}
          />
          <SettingsInput
            label="Switch 2 query"
            value={preferences.gamesFeeds.switchQuery}
            onChangeText={(text) => updatePreferences({ gamesFeeds: { switchQuery: text } })}
            placeholder="Nintendo Switch 2"
            colors={colors}
          />
          <SettingsInput
            label="Steam / PC query"
            value={preferences.gamesFeeds.steamQuery}
            onChangeText={(text) => updatePreferences({ gamesFeeds: { steamQuery: text } })}
            placeholder="Steam PC gaming"
            colors={colors}
          />
        </SectionCard>

        <SectionCard title="Personalization" emoji={'\u2728'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 12 }}>
            Favorite focus decides what the dashboard puts in the front lane first.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
            {favoriteFocusOptions.map((option) => {
              const selected = preferences.favoriteFocus === option.value;

              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    void (async () => {
                      await triggerHaptic();
                      updatePreferences({ favoriteFocus: option.value });
                    })();
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    borderRadius: 12,
                    backgroundColor: selected ? colors.accent : colors.card,
                    borderWidth: 1,
                    borderColor: selected ? colors.accent : colors.cardBorder,
                    marginRight: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: selected ? 'white' : colors.text, fontWeight: '700' }}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <SettingsInput
            label="Cyber tab label"
            value={preferences.customTabLabels.cyber}
            onChangeText={(text) => updatePreferences({ customTabLabels: { cyber: text || 'Cyber' } })}
            placeholder="Cyber"
            colors={colors}
          />
          <SettingsInput
            label="Gym tab label"
            value={preferences.customTabLabels.gym}
            onChangeText={(text) => updatePreferences({ customTabLabels: { gym: text || 'Gym' } })}
            placeholder="Gym"
            colors={colors}
          />
          <SettingsInput
            label="Games tab label"
            value={preferences.customTabLabels.games}
            onChangeText={(text) => updatePreferences({ customTabLabels: { games: text || 'Games' } })}
            placeholder="Games"
            colors={colors}
          />
          <SettingsInput
            label="Reminders tab label"
            value={preferences.customTabLabels.reminders}
            onChangeText={(text) => updatePreferences({ customTabLabels: { reminders: text || 'Reminders' } })}
            placeholder="Reminders"
            colors={colors}
          />
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

        <SectionCard title="System Snapshot" emoji={'\u2699'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 8 }}>
            Theme, reminders, and Games preferences update immediately and reminders sync to device alerts when notification access is granted.
          </Text>
          <Text style={{ fontSize: 13, color: colors.text }}>
            Notifications: {preferences.notificationsEnabled ? 'Enabled' : 'Disabled'} | Haptics:{' '}
            {preferences.hapticsEnabled ? 'Enabled' : 'Disabled'} | Privacy:{' '}
            {preferences.privateNotifications ? 'Private alerts' : 'Full alerts'}
          </Text>
          <Text style={{ fontSize: 12, color: colors.subtext, marginTop: 8 }}>
            Most-used lane: {mostUsedLane ?? 'none'} | Favorite focus: {preferences.favoriteFocus}
          </Text>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
