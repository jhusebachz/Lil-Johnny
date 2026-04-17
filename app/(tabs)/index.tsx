import { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, Image, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionCard from '../../components/SectionCard';
import { usePreferenceSettings, useThemeSettings } from '../../context/AppSettingsContext';
import { useGymData } from '../../context/GymDataContext';
import { useLifeTrackerData } from '../../context/LifeTrackerContext';
import { getLoggedGymDateKeys } from '../../data/gymData';
import {
  AvoidanceGoal,
  GOAL_WEIGHT_LB,
  TRACKER_BASELINE_DATE,
  WEIGHT_GOAL_TARGET_DATE,
  getDateRangePacePct,
  getAvoidanceStreak,
  getCurrentWeekDateKeys,
  getGreetingForTime,
  getScheduledGymPacePct,
  getUniqueWeekCount,
  getWeightLossProgressPct,
  formatLongDate,
} from '../../data/lifeTrackerData';
import { fetchRunescapeTrackerSnapshot, getFallbackRunescapeTracker, LiveRunescapeTracker } from '../../data/osrsTracker';
import { getThemeColors } from '../../data/theme';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

const BLISS_TREND_WEEKS = 4;

function getWeeksAgoDate(referenceDate: Date, weeksAgo: number) {
  const nextDate = new Date(referenceDate);
  nextDate.setDate(nextDate.getDate() - weeksAgo * 7);
  return nextDate;
}

function sumWeights(count: number) {
  return (count * (count + 1)) / 2;
}

type OverviewItem = {
  label: string;
  complete?: boolean;
  showCheck?: boolean;
};

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
  const [tracker, setTracker] = useState<LiveRunescapeTracker>(getFallbackRunescapeTracker());
  const { refreshing, triggerRefresh } = useTimedRefresh();
  const heroOpacity = useState(() => new Animated.Value(0))[0];
  const heroLift = useState(() => new Animated.Value(18))[0];
  const logoFloat = useState(() => new Animated.Value(0))[0];
  const haloPulse = useState(() => new Animated.Value(0.94))[0];
  const isCompact = width < 430;
  const isVeryCompact = width < 380;

  const refreshDashboard = useCallback(async () => {
    triggerRefresh();

    const [osrs] = await Promise.all([
      fetchRunescapeTrackerSnapshot().catch(() => getFallbackRunescapeTracker()),
    ]);

    setTracker(osrs);
  }, [triggerRefresh]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

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

  const lowestCert = [...lifeData.certifications]
    .sort(
      (left, right) =>
        left.chaptersCompleted / Math.max(left.chapterCount, 1) - right.chaptersCompleted / Math.max(right.chapterCount, 1)
    )[0];
  const currentCert = (() => {
    const now = new Date();
    return (
      lifeData.certifications.find((cert) => cert.startDate && cert.examDate && now >= new Date(`${cert.startDate}T00:00:00`) && now <= new Date(`${cert.examDate}T23:59:59`)) ??
      lifeData.certifications.find((cert) => cert.startDate && now < new Date(`${cert.startDate}T00:00:00`)) ??
      lifeData.certifications[lifeData.certifications.length - 1]
    );
  })();
  const latestWeight = [...lifeData.weightEntries].sort((left, right) => right.dateKey.localeCompare(left.dateKey))[0];
  const avoidanceGoals = lifeData.goals2026.filter((goal) => goal.type === 'avoidance');
  const hobbiesOpenTasks = lifeData.diyTasks.filter((task) => !task.completed);

  const alcoholGoal = lifeData.goals2026.find(
    (goal): goal is AvoidanceGoal => goal.id === 'alcohol' && goal.type === 'avoidance'
  );
  const stretchingGoal = lifeData.goals2026.find(
    (goal): goal is AvoidanceGoal => goal.id === 'stretching' && goal.type === 'avoidance'
  );
  const alcoholStreak = alcoholGoal ? getAvoidanceStreak(alcoholGoal) : 0;
  const stretchingStreak = stretchingGoal ? getAvoidanceStreak(stretchingGoal) : 0;
  const now = new Date();
  const currentDay = now.getDay();
  const todayLabel = formatLongDate(now);
  const greeting = `${getGreetingForTime(now)}, ${preferences.profileName || 'John'}!`;
  const currentCertPct = currentCert
    ? Math.round((currentCert.chaptersCompleted / Math.max(currentCert.chapterCount, 1)) * 100)
    : 0;
  const currentCertPacePct =
    currentCert?.startDate && currentCert.examDate
      ? getDateRangePacePct(currentCert.startDate, currentCert.examDate)
      : null;
  const currentCertStartLabel = currentCert?.startDate
    ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(`${currentCert.startDate}T12:00:00`))
    : null;
  const currentCertHasActiveWindow =
    !!currentCert?.startDate &&
    !!currentCert?.examDate &&
    now >= new Date(`${currentCert.startDate}T00:00:00`) &&
    now <= new Date(`${currentCert.examDate}T23:59:59`);
  const currentWeekKeys = new Set(getCurrentWeekDateKeys());
  const gymVisitCount = useMemo(() => getUniqueWeekCount(getLoggedGymDateKeys(exerciseHistory)), [exerciseHistory]);
  const weeklyGymPacePct = getScheduledGymPacePct();
  const weeklyGymActualPct = clamp01(gymVisitCount / 3) * 100;
  const gymOnPace = gymVisitCount >= 3 || weeklyGymActualPct >= weeklyGymPacePct;
  const loopRunLoggedThisWeek = lifeData.loopRuns.some((run) => currentWeekKeys.has(run.dateKey));
  const cyberOnPace = currentCertPacePct !== null ? currentCertPct >= currentCertPacePct : false;
  const base90OnPace = tracker.goalProjections.base90.progressPct >= tracker.goalProjections.base90.pacePct;
  const runefestOnPace = tracker.goalProjections.runefest.progressPct >= tracker.goalProjections.runefest.pacePct;
  const hobbiesScore = [
    base90OnPace ? 1 : 0,
    runefestOnPace ? 1 : 0,
  ].reduce((total, value) => total + value, 0) / 2;
  const cyberScore = cyberOnPace ? 1 : 0;
  const loggedGymDateKeys = useMemo(() => getLoggedGymDateKeys(exerciseHistory), [exerciseHistory]);
  const blissTrend = useMemo(() => {
    const weightedScores = Array.from({ length: BLISS_TREND_WEEKS }, (_, index) => {
      const weeksAgo = BLISS_TREND_WEEKS - index - 1;
      const referenceDate = getWeeksAgoDate(now, weeksAgo);
      const weight = index + 1;
      const referenceWeekKeys = new Set(getCurrentWeekDateKeys(referenceDate));
      const referenceGymVisitCount = getUniqueWeekCount(loggedGymDateKeys, referenceDate);
      const referenceGymPacePct = getScheduledGymPacePct(referenceDate);
      const referenceGymActualPct = clamp01(referenceGymVisitCount / 3) * 100;
      const referenceGymOnPace = referenceGymVisitCount >= 3 || referenceGymActualPct >= referenceGymPacePct;
      const referenceLoopRunLogged = lifeData.loopRuns.some((run) => referenceWeekKeys.has(run.dateKey));
      const referenceWeightEntry = [...lifeData.weightEntries]
        .filter((entry) => entry.dateKey <= getCurrentWeekDateKeys(referenceDate)[referenceDate.getDay()])
        .sort((left, right) => right.dateKey.localeCompare(left.dateKey))[0];
      const referenceWeightLossActualPct = referenceWeightEntry ? getWeightLossProgressPct(referenceWeightEntry.weight) : 0;
      const referenceWeightLossPacePct = getDateRangePacePct(TRACKER_BASELINE_DATE, WEIGHT_GOAL_TARGET_DATE, referenceDate);
      const referenceWeightLossOnPace = referenceWeightLossActualPct >= referenceWeightLossPacePct;
      const referenceHealthScore = [
        referenceGymOnPace ? 1 : 0,
        referenceLoopRunLogged ? 1 : 0,
        referenceWeightLossOnPace ? 1 : 0,
      ].reduce((total, value) => total + value, 0) / 3;
      const referenceStreaksScore =
        avoidanceGoals.length > 0
          ? avoidanceGoals.reduce((total, goal) => total + clamp01(getAvoidanceStreak(goal, referenceDate) / 30), 0) /
            avoidanceGoals.length
          : 1;
      const referenceBlissScore = cyberScore * 0.3 + referenceHealthScore * 0.4 + referenceStreaksScore * 0.25 + hobbiesScore * 0.05;

      return {
        weight,
        cyber: cyberScore,
        health: referenceHealthScore,
        hobbies: hobbiesScore,
        streaks: referenceStreaksScore,
        total: referenceBlissScore,
      };
    });
    const totalWeight = sumWeights(weightedScores.length);
    const weightedAverage = (key: 'cyber' | 'health' | 'hobbies' | 'streaks' | 'total') =>
      weightedScores.reduce((sum, score) => sum + score[key] * score.weight, 0) / totalWeight;

    return {
      total: weightedAverage('total'),
      cyber: weightedAverage('cyber'),
      health: weightedAverage('health'),
      hobbies: weightedAverage('hobbies'),
      streaks: weightedAverage('streaks'),
    };
  }, [avoidanceGoals, cyberScore, hobbiesScore, lifeData.loopRuns, lifeData.weightEntries, loggedGymDateKeys, now]);
  const blissScore = Math.round(blissTrend.total * 100);
  const blissBreakdown = [
    `Cyber: ${Math.round(blissTrend.cyber * 100)}`,
    `Health: ${Math.round(blissTrend.health * 100)}`,
    `Hobbies: ${Math.round(blissTrend.hobbies * 100)}`,
    `Streaks: ${Math.round(blissTrend.streaks * 100)}`,
  ];
  const cyberOverviewItems: OverviewItem[] = [
    {
      label: currentCert
        ? `${currentCert.name}${currentCertStartLabel ? ` starts ${currentCertStartLabel}` : ''}`
        : 'No certification schedule set',
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: cyberOnPace,
    },
  ];
  const healthOverviewItems: OverviewItem[] = [
    {
      label: `Gym visits this week (${gymVisitCount}/3)`,
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: gymOnPace,
    },
    {
      label: 'Loop run this week',
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: loopRunLoggedThisWeek,
    },
  ];
  const hobbiesOverviewItems: OverviewItem[] = [
    {
      label: 'Base 90 by May 22',
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: base90OnPace,
    },
    {
      label: '2250 Total Level by RuneFest',
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: runefestOnPace,
    },
  ];
  const suggestedActions = useMemo(() => {
    const candidates: { label: string; urgency: number }[] = [];

    if (lowestCert && currentCertHasActiveWindow) {
      const certPct = lowestCert.chaptersCompleted / Math.max(lowestCert.chapterCount, 1);
      candidates.push({
        label: `Move ${lowestCert.name} forward. It is the furthest behind its study-guide chapter target right now.`,
        urgency: 1 - certPct,
      });
    }

    if (gymVisitCount < 3) {
      const gymUrgency = currentDay < 3 ? 0.26 : (3 - gymVisitCount) / 3;
      candidates.push({
        label: `Get ${3 - gymVisitCount} more gym visit${3 - gymVisitCount === 1 ? '' : 's'} in this week to stay on the health target.`,
        urgency: gymUrgency,
      });
    }

    if (!loopRunLoggedThisWeek) {
      candidates.push({
        label: 'Log a Loop run this week so the health progress stays honest and current.',
        urgency: 0.72,
      });
    }

    if (!base90OnPace) {
      candidates.push({
        label: 'OSRS base 90 is behind pace. Give the highest-pressure skill some time soon.',
        urgency: tracker.goalProjections.base90.progressPct + 8 < tracker.goalProjections.base90.pacePct ? 0.88 : 0.74,
      });
    }

    if (!runefestOnPace) {
      candidates.push({
        label: '2250 total by RuneFest is behind pace. Put some focused OSRS time into the total-level path.',
        urgency: tracker.goalProjections.runefest.progressPct + 8 < tracker.goalProjections.runefest.pacePct ? 0.84 : 0.69,
      });
    }

    if (hobbiesOpenTasks.length > 0) {
      candidates.push({
        label: `Knock out one DIY task: ${hobbiesOpenTasks[0].title}. Keeping the house list moving will lower background drag.`,
        urgency: 0.58,
      });
    }

    if (!latestWeight) {
      candidates.push({
        label: 'Log a weight entry so the health progress has a real body-metrics baseline to work from.',
        urgency: 0.7,
      });
    } else if (Math.abs(latestWeight.weight - GOAL_WEIGHT_LB) > 1) {
      candidates.push({
        label: `Keep the weight progress moving toward ${GOAL_WEIGHT_LB} lb. You are currently ${Math.abs(
          latestWeight.weight - GOAL_WEIGHT_LB
        ).toFixed(1)} lb ${latestWeight.weight > GOAL_WEIGHT_LB ? 'above' : 'below'} target.`,
        urgency: Math.min(Math.abs(latestWeight.weight - GOAL_WEIGHT_LB) / 10, 0.78),
      });
    }

    return candidates.sort((left, right) => right.urgency - left.urgency).slice(0, 3);
  }, [
    currentCertHasActiveWindow,
    gymVisitCount,
    hobbiesOpenTasks,
    latestWeight,
    loopRunLoggedThisWeek,
    lowestCert,
    currentDay,
    base90OnPace,
    runefestOnPace,
    tracker.goalProjections.base90.pacePct,
    tracker.goalProjections.base90.progressPct,
    tracker.goalProjections.runefest.pacePct,
    tracker.goalProjections.runefest.progressPct,
  ]);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              void refreshDashboard();
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
