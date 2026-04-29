import { useEffect, useState } from 'react';
import { Animated, Easing, Image, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionCard from '../../components/SectionCard';
import { usePreferenceSettings, useThemeSettings } from '../../context/AppSettingsContext';
import { useGymData } from '../../context/GymDataContext';
import { useLifeTrackerData } from '../../context/LifeTrackerContext';
import { getThemeColors } from '../../data/theme';
import { OverviewItem, useDashboardMetrics } from '../../hooks/use-dashboard-metrics';
import { useRunescapeTracker } from '../../hooks/use-runescape-tracker';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

function OverviewCard({
  title,
  items,
  colors,
  align = 'left',
  minWidth = 160,
  fullWidth = false,
  fixedWidth,
}: {
  title: string;
  items: OverviewItem[];
  colors: ReturnType<typeof getThemeColors>;
  align?: 'left' | 'center';
  minWidth?: number;
  fullWidth?: boolean;
  fixedWidth?: number;
}) {
  const centered = align === 'center';

  return (
    <View
      style={{
        flex: fixedWidth ? undefined : 1,
        minWidth: fullWidth || fixedWidth ? undefined : minWidth,
        width: fixedWidth ?? (fullWidth ? '100%' : undefined),
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.inputBackground,
        padding: 14,
        marginBottom: 12,
        marginRight: fixedWidth ? 12 : 0,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6, textAlign: centered ? 'center' : 'left' }}>
        {title}
      </Text>
      {items.map((item) => (
        <View
          key={`${title}-${item.label}`}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: centered ? 'center' : 'flex-start',
            marginTop: 8,
          }}
        >
          {item.showCheck === false ? null : (
            <View
              style={{
                width: 13,
                height: 13,
                borderRadius: 4,
                marginRight: 8,
                borderWidth: 1,
                borderColor: item.complete ? colors.success : colors.cardBorder,
                backgroundColor: item.complete ? colors.success : 'transparent',
              }}
            />
          )}
          <Text
            numberOfLines={centered ? 1 : undefined}
            style={{
              color: colors.text,
              fontSize: 12,
              fontWeight: '700',
              flex: centered ? 1 : 1,
              textAlign: centered ? 'center' : 'left',
            }}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function Dashboard() {
  const { theme } = useThemeSettings();
  const { preferences } = usePreferenceSettings();
  const colors = getThemeColors(theme);
  const { width } = useWindowDimensions();
  const { lifeData } = useLifeTrackerData();
  const { exerciseHistory } = useGymData();
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const [trackerRefreshToken, setTrackerRefreshToken] = useState(0);
  const { tracker } = useRunescapeTracker(trackerRefreshToken);
  const heroOpacity = useState(() => new Animated.Value(0))[0];
  const heroLift = useState(() => new Animated.Value(18))[0];
  const logoFloat = useState(() => new Animated.Value(0))[0];
  const haloPulse = useState(() => new Animated.Value(0.94))[0];
  const isCompact = width < 430;
  const isVeryCompact = width < 380;

  useEffect(() => {
    const reveal = Animated.parallel([
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(heroLift, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: -8,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(haloPulse, {
          toValue: 1.04,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(haloPulse, {
          toValue: 0.94,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    reveal.start();
    floatLoop.start();
    pulseLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [haloPulse, heroLift, heroOpacity, logoFloat]);
  const {
    alcoholStreak,
    blissBreakdown,
    blissScore,
    cyberOverviewItems,
    greeting,
    healthOverviewItems,
    hobbiesOverviewItems,
    snacksStreak,
    stretchingStreak,
    suggestedActions,
    todayLabel,
  } = useDashboardMetrics({
    exerciseHistory,
    lifeData,
    profileName: preferences.profileName,
    tracker,
  });

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              triggerRefresh();
              setTrackerRefreshToken((current) => current + 1);
            }}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressBackgroundColor={colors.card}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
      >
        <Animated.View
          style={{
            backgroundColor: colors.hero,
            borderRadius: 28,
            paddingHorizontal: 24,
            paddingTop: 24,
            paddingBottom: 22,
            marginBottom: 20,
            overflow: 'hidden',
            minHeight: isCompact ? 0 : 300,
            opacity: heroOpacity,
            transform: [{ translateY: heroLift }],
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 260,
              height: 260,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.08)',
              top: -90,
              right: -70,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: 999,
              backgroundColor: colors.accentSoft,
              opacity: 0.18,
              bottom: -120,
              left: -70,
            }}
          />
          <View
            style={{
              flexDirection: isCompact ? 'column' : 'row',
              alignItems: isCompact ? 'flex-start' : 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: isCompact ? 0 : 1, width: '100%', paddingRight: isCompact ? 0 : 12 }}>
              <Text
                style={{
                  color: colors.heroText,
                  fontSize: isVeryCompact ? 24 : isCompact ? 26 : 30,
                  fontWeight: '800',
                  letterSpacing: 0.2,
                  marginBottom: 10,
                }}
              >
                {greeting}
              </Text>
              <Text style={{ color: colors.heroSubtext, fontSize: 12, letterSpacing: 0.2, lineHeight: 18 }}>
                {todayLabel}
              </Text>
            </View>
            <Animated.View
              style={{
                width: isVeryCompact ? 132 : isCompact ? 148 : 176,
                height: isVeryCompact ? 132 : isCompact ? 148 : 176,
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: isCompact ? 'center' : 'auto',
                marginTop: isCompact ? 18 : 0,
                transform: [{ translateY: logoFloat }],
              }}
            >
              <Animated.View
                style={{
                  position: 'absolute',
                  width: isVeryCompact ? 132 : isCompact ? 148 : 176,
                  height: isVeryCompact ? 132 : isCompact ? 148 : 176,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.18)',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  transform: [{ scale: haloPulse }],
                }}
              />
              <Animated.View
                style={{
                  position: 'absolute',
                  width: isVeryCompact ? 108 : isCompact ? 120 : 144,
                  height: isVeryCompact ? 108 : isCompact ? 120 : 144,
                  borderRadius: 999,
                  backgroundColor: colors.accentSoft,
                  opacity: 0.22,
                  transform: [{ scale: haloPulse }],
                }}
              />
              <Image
                source={require('../../assets/images/Huse Logo.png')}
                style={{ width: isVeryCompact ? 112 : isCompact ? 124 : 150, height: isVeryCompact ? 112 : isCompact ? 124 : 150 }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </Animated.View>

        <SectionCard title="Bliss Score" emoji={'\u2728'} colors={colors}>
          <Text
            style={{
              fontSize: isVeryCompact ? 48 : isCompact ? 52 : 58,
              color: colors.text,
              fontWeight: '900',
              marginBottom: 8,
              lineHeight: isVeryCompact ? 52 : isCompact ? 56 : 62,
              textAlign: 'center',
            }}
          >
            {blissScore}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', marginTop: 2 }}>
            {blissBreakdown.map((item) => (
              <Text
                key={item}
                style={{ fontSize: 13, color: colors.text, textAlign: 'center', marginHorizontal: 6, marginBottom: 4 }}
              >
                {item}
              </Text>
            ))}
          </View>
        </SectionCard>

        <SectionCard title="Overview" emoji={'\uD83E\uDDE9'} colors={colors}>
          <View style={{ flexDirection: isCompact ? 'column' : 'row', flexWrap: 'wrap', gap: 12 }}>
            <OverviewCard
              title="Cyber"
              items={cyberOverviewItems}
              colors={colors}
              align="left"
              fullWidth={isCompact}
            />
            <OverviewCard
              title="Health"
              items={healthOverviewItems}
              colors={colors}
              align="left"
              fullWidth={isCompact}
            />
            <OverviewCard
              title="Hobbies"
              items={hobbiesOverviewItems}
              colors={colors}
              align="left"
              fullWidth={isCompact}
            />
          </View>
        </SectionCard>

        <SectionCard title="Streaks" emoji={'\uD83D\uDD25'} colors={colors}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <OverviewCard
              title="No Alcohol"
              items={[
                {
                  label: `Current streak: ${alcoholStreak} day${alcoholStreak === 1 ? '' : 's'}`,
                  showCheck: false,
                },
              ]}
              colors={colors}
              align="center"
              minWidth={220}
              fullWidth={isCompact}
            />
            <OverviewCard
              title="Stretching"
              items={[
                {
                  label: `Current streak: ${stretchingStreak} day${stretchingStreak === 1 ? '' : 's'}`,
                  showCheck: false,
                },
              ]}
              colors={colors}
              align="center"
              minWidth={220}
              fullWidth={isCompact}
            />
            <OverviewCard
              title="No Snacks or Sweets"
              items={[
                {
                  label: `Current streak: ${snacksStreak} day${snacksStreak === 1 ? '' : 's'}`,
                  showCheck: false,
                },
              ]}
              colors={colors}
              align="center"
              minWidth={220}
              fullWidth={isCompact}
            />
          </View>
        </SectionCard>

        <SectionCard title="Suggested Next Actions" emoji={'\uD83E\uDDED'} colors={colors}>
          {suggestedActions.map((action) => (
            <View
              key={action.label}
              style={{
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.cardBorder,
                backgroundColor: colors.inputBackground,
                padding: 12,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, lineHeight: 22 }}>{action.label}</Text>
            </View>
          ))}
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
