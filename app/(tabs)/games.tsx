import { useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RunescapeSection from '../../components/games/RunescapeSection';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getThemeColors } from '../../data/theme';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

export default function Games() {
  const { theme } = useAppSettings();
  const colors = getThemeColors(theme);
  const [runescapeRefreshToken, setRunescapeRefreshToken] = useState(0);
  const { refreshing, triggerRefresh } = useTimedRefresh();

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              triggerRefresh(700);
              setRunescapeRefreshToken((current) => current + 1);
            }}
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
            marginBottom: 18,
          }}
        >
          <Text style={{ color: colors.heroSubtext, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            Games Trackers
          </Text>
          <Text style={{ color: colors.heroText, fontSize: 28, fontWeight: '800', marginBottom: 10 }}>
            OSRS progress lives here
          </Text>
        </View>

        <RunescapeSection colors={colors} refreshToken={runescapeRefreshToken} />
      </ScrollView>
    </SafeAreaView>
  );
}
