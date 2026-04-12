import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { YearGoal } from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';

export default function StreakGoalCard({
  goal,
  colors,
  streak,
  bestStreak,
  onMarkFailureToday,
  onMarkFailureYesterday,
}: {
  goal: YearGoal;
  colors: ReturnType<typeof getThemeColors>;
  streak: number;
  bestStreak: number;
  onMarkFailureToday: () => Promise<void>;
  onMarkFailureYesterday: () => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 430;

  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.inputBackground,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <View
        style={{
          flexDirection: isCompact ? 'column' : 'row',
          alignItems: isCompact ? 'stretch' : 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: isCompact ? 0 : 1, paddingRight: isCompact ? 0 : 14, marginBottom: isCompact ? 12 : 0 }}>
          <Text style={{ fontSize: 17, color: colors.text, fontWeight: '800', marginBottom: 6 }}>{goal.title}</Text>
          <Text style={{ fontSize: 16, color: colors.subtext }}>
            Current streak: <Text style={{ color: colors.text, fontWeight: '800' }}>{streak}</Text>{' '}
            {streak === 1 ? 'day' : 'days'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginTop: 4 }}>
            All-time best: <Text style={{ color: colors.text, fontWeight: '800' }}>{bestStreak}</Text>{' '}
            {bestStreak === 1 ? 'day' : 'days'}
          </Text>
        </View>

        <View
          style={{
            width: isCompact ? '100%' : 176,
            gap: 8,
          }}
        >
          <Pressable
            onPress={() => {
              void onMarkFailureYesterday();
            }}
            style={{
              minHeight: 52,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.warning,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800', fontSize: 12, lineHeight: 15 }}>
              I broke this streak yesterday
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void onMarkFailureToday();
            }}
            style={{
              minHeight: 52,
              borderRadius: 18,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.danger,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ color: 'white', textAlign: 'center', fontWeight: '800', fontSize: 12, lineHeight: 15 }}>
              I broke this streak today
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
