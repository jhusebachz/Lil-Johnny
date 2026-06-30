import { useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';

import { YearGoal } from '../../data/lifeTrackerData';
import { getThemeColors } from '../../data/theme';

export default function StreakGoalCard({
  goal,
  colors,
  streak,
  bestStreak,
  consistencyLabel,
  consistencyPct,
  goodDays,
  trackedDays,
  windowDays,
  blissImpactText,
  onMarkFailureToday,
  onMarkFailureYesterday,
  onResetStreak,
}: {
  goal: YearGoal;
  colors: ReturnType<typeof getThemeColors>;
  streak: number;
  bestStreak: number;
  consistencyLabel: string;
  consistencyPct: number;
  goodDays: number;
  trackedDays: number;
  windowDays: number;
  blissImpactText: string;
  onMarkFailureToday: () => Promise<void>;
  onMarkFailureYesterday: () => Promise<void>;
  onResetStreak: () => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const [menuOpen, setMenuOpen] = useState(false);

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
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <Text style={{ flex: 1, fontSize: 17, color: colors.text, fontWeight: '800', paddingTop: 4 }}>
          {goal.title}
        </Text>

        <View style={{ alignItems: 'flex-end' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open ${goal.title} streak actions`}
            onPress={() => {
              setMenuOpen((current) => !current);
            }}
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.cardBorder,
              backgroundColor: colors.card,
              gap: 3,
            }}
          >
            {[0, 1, 2].map((bar) => (
              <View
                key={bar}
                style={{
                  width: 15,
                  height: 2,
                  borderRadius: 999,
                  backgroundColor: colors.text,
                }}
              />
            ))}
          </Pressable>

          {menuOpen ? (
            <Pressable
              onPress={async () => {
                setMenuOpen(false);
                await onResetStreak();
              }}
              style={{
                marginTop: 8,
                borderRadius: 12,
                backgroundColor: colors.danger,
                paddingVertical: 10,
                paddingHorizontal: 12,
                minWidth: 158,
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '900', textAlign: 'center' }}>
                Reset streak history
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flexDirection: isCompact ? 'column' : 'row',
          alignItems: isCompact ? 'stretch' : 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flex: isCompact ? 0 : 1, paddingRight: isCompact ? 0 : 14, marginBottom: isCompact ? 12 : 0 }}>
          <Text style={{ fontSize: 15, color: colors.text, fontWeight: '700', marginBottom: 4 }}>
            Good Days: <Text style={{ fontWeight: '800' }}>{goodDays}</Text> / {windowDays}
          </Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 2 }}>
            Consistency:{' '}
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {trackedDays === 0 ? 'Starting now' : `${consistencyPct}%`}
            </Text>
          </Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 2 }}>
            Status: <Text style={{ color: colors.text, fontWeight: '800' }}>{consistencyLabel}</Text>
          </Text>
          <Text style={{ fontSize: 14, color: colors.subtext, marginBottom: 6 }}>
            Bliss Impact: <Text style={{ color: colors.text, fontWeight: '800' }}>{blissImpactText}</Text>
          </Text>
          <Text style={{ fontSize: 13, color: colors.subtext }}>
            Tracking window: <Text style={{ color: colors.text, fontWeight: '700' }}>{trackedDays}</Text> day
            {trackedDays === 1 ? '' : 's'} logged
          </Text>
          <Text style={{ fontSize: 13, color: colors.subtext, marginTop: 4 }}>
            Current streak: <Text style={{ color: colors.text, fontWeight: '800' }}>{streak}</Text>{' '}
            {streak === 1 ? 'day' : 'days'} | All-time high:{' '}
            <Text style={{ color: colors.text, fontWeight: '800' }}>{bestStreak}</Text>{' '}
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
