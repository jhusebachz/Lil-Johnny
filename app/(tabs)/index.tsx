import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SectionCard from '../../components/SectionCard';
import { useAppSettings } from '../../context/AppSettingsContext';
import { readPersistedGymData } from '../../data/gymData';
import {
  DailyCheckGoal,
  LifeTrackerData,
  defaultLifeTrackerData,
  formatLoopRunTime,
  getAvoidanceStreak,
  getDailyCheckStreak,
  getTodayDateKey,
  getUniqueWeekCount,
  readPersistedLifeTrackerData,
} from '../../data/lifeTrackerData';
import { formatUpcomingReminder, getNextReminder } from '../../data/reminders';
import { fetchRunescapeTrackerSnapshot, getFallbackRunescapeTracker, LiveRunescapeTracker } from '../../data/osrsTracker';
import { getThemeColors } from '../../data/theme';
import { useTimedRefresh } from '../../hooks/use-timed-refresh';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function OverviewCard({
  title,
  summary,
  footer,
  colors,
}: {
  title: string;
  summary: string;
  footer: string;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 160,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.cardBorder,
        backgroundColor: colors.inputBackground,
        padding: 14,
        marginBottom: 12,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>{title}</Text>
      <Text style={{ color: colors.subtext, fontSize: 13, lineHeight: 20, marginBottom: 10 }}>{summary}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{footer}</Text>
    </View>
  );
}

export default function Dashboard() {
  const { theme, reminders, preferences } = useAppSettings();
  const colors = getThemeColors(theme);
  const [lifeData, setLifeData] = useState<LifeTrackerData>(defaultLifeTrackerData);
  const [tracker, setTracker] = useState<LiveRunescapeTracker>(getFallbackRunescapeTracker());
  const [gymVisitCount, setGymVisitCount] = useState(0);
  const { refreshing, triggerRefresh } = useTimedRefresh();

  const refreshDashboard = useCallback(async () => {
    triggerRefresh();

    const [life, osrs, gym] = await Promise.all([
      readPersistedLifeTrackerData().catch(() => null),
      fetchRunescapeTrackerSnapshot().catch(() => getFallbackRunescapeTracker()),
      readPersistedGymData().catch(() => null),
    ]);

    if (life) {
      setLifeData({ ...defaultLifeTrackerData, ...life });
    }
    setTracker(osrs);

    const gymDateKeys = new Set<string>();
    Object.values(gym?.exerciseHistory ?? {}).forEach((dayHistory) => {
      Object.values(dayHistory).forEach((points) => {
        points.forEach((point) => gymDateKeys.add(point.dateKey));
      });
    });
    setGymVisitCount(getUniqueWeekCount([...gymDateKeys]));
  }, [triggerRefresh]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  const nextReminder = getNextReminder(reminders);
  const nextReminderLabel = nextReminder ? formatUpcomingReminder(nextReminder.occurrence) : 'No reminder set';
  const certChapters = lifeData.certifications.reduce((total, cert) => total + cert.chaptersCompleted, 0);
  const certTargets = lifeData.certifications.reduce((total, cert) => total + cert.chapterCount, 0);
  const certProgress = certTargets > 0 ? certChapters / certTargets : 0;
  const lowestCert = [...lifeData.certifications]
    .sort(
      (left, right) =>
        left.chaptersCompleted / Math.max(left.chapterCount, 1) - right.chaptersCompleted / Math.max(right.chapterCount, 1)
    )[0];
  const latestWeight = [...lifeData.weightEntries].sort((left, right) => right.dateKey.localeCompare(left.dateKey))[0];
  const latestLoopRun = [...lifeData.loopRuns].sort((left, right) => right.dateKey.localeCompare(left.dateKey))[0];
  const dailyGoals = lifeData.goals2026.filter((goal): goal is DailyCheckGoal => goal.type === 'daily-check');
  const todayKey = getTodayDateKey();
  const dailyChecksCompleted = dailyGoals.filter((goal) => goal.completedDates.includes(todayKey)).length;
  const dailyCheckScore = dailyGoals.length > 0 ? dailyChecksCompleted / dailyGoals.length : 0;
  const avoidanceGoals = lifeData.goals2026.filter((goal) => goal.type === 'avoidance');
  const avoidanceScore =
    avoidanceGoals.length > 0
      ? avoidanceGoals.reduce((total, goal) => total + clamp01(getAvoidanceStreak(goal) / 14), 0) / avoidanceGoals.length
      : 0;
  const hobbiesOpenTasks = lifeData.diyTasks.filter((task) => !task.completed);
  const hobbiesCompletedTasks = lifeData.diyTasks.filter((task) => task.completed);
  const diyScore =
    lifeData.diyTasks.length > 0
      ? hobbiesCompletedTasks.length / lifeData.diyTasks.length
      : 0.5;
  const osrsStatuses = [
    tracker.goalProjections.base90.status,
    tracker.goalProjections.runefest.status,
    tracker.goalProjections.maxCape.status,
  ];
  const osrsScore =
    osrsStatuses.reduce((total, status) => {
      if (status === 'On track') {
        return total + 1;
      }
      if (status === 'Tight') {
        return total + 0.65;
      }
      if (status === 'Needs manual lane') {
        return total + 0.55;
      }
      return total + 0.35;
    }, 0) / osrsStatuses.length;
  const healthScore = [clamp01(gymVisitCount / 3), latestWeight ? 1 : 0.35, lifeData.loopRuns.length > 0 ? 0.85 : 0.35].reduce(
    (total, value) => total + value,
    0
  ) / 3;
  const cyberScore = clamp01(certProgress);
  const goalsScore = (dailyCheckScore + avoidanceScore) / 2;
  const hobbiesScore = (osrsScore + diyScore) / 2;
  const blissScore = Math.round(((cyberScore + healthScore + goalsScore + hobbiesScore) / 4) * 100);

  const alcoholGoal = lifeData.goals2026.find((goal) => goal.id === 'alcohol' && goal.type === 'avoidance');
  const stretchingGoal = lifeData.goals2026.find((goal) => goal.id === 'stretching' && goal.type === 'daily-check');
  const alcoholStreak = alcoholGoal ? getAvoidanceStreak(alcoholGoal) : 0;
  const stretchingStreak = stretchingGoal ? getDailyCheckStreak(stretchingGoal) : 0;
  const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const greeting = `${new Intl.DateTimeFormat('en-US', { hour: 'numeric' }).format(new Date()).includes('AM') ? 'Good morning' : 'Good evening'}, ${preferences.profileName || 'John'}`;
  const studySummary = certTargets > 0 ? `${certChapters} / ${certTargets} chapters covered` : 'No study target set';
  const hobbiesSummary =
    tracker.totalLevel > 0
      ? `OSRS total level ${tracker.totalLevel} | ${hobbiesOpenTasks.length} DIY tasks open`
      : `${hobbiesOpenTasks.length} DIY tasks open`;
  const weightSummary = latestWeight ? `${latestWeight.weight.toFixed(1)} lb latest` : 'No weight entries yet';
  const loopSummary = latestLoopRun ? `Best loop: ${formatLoopRunTime(latestLoopRun.timeSeconds)}` : 'No loop runs logged';
  const goalsSummary = `${alcoholStreak} days alcohol-free | ${stretchingStreak} day stretch streak`;

  const suggestedActions = useMemo(() => {
    const candidates: { label: string; urgency: number }[] = [];

    if (lowestCert) {
      const certPct = lowestCert.chaptersCompleted / Math.max(lowestCert.chapterCount, 1);
      candidates.push({
        label: `Move ${lowestCert.name} forward. It is the furthest behind its study-guide chapter target right now.`,
        urgency: 1 - certPct,
      });
    }

    if (gymVisitCount < 3) {
      candidates.push({
        label: `Get ${3 - gymVisitCount} more gym visit${3 - gymVisitCount === 1 ? '' : 's'} in this week to stay on the health target.`,
        urgency: (3 - gymVisitCount) / 3,
      });
    }

    if (dailyGoals.some((goal) => !goal.completedDates.includes(todayKey))) {
      candidates.push({
        label: 'Close out today’s daily-check streaks before the day ends so you do not leak easy momentum.',
        urgency: 0.82,
      });
    }

    if (tracker.goalProjections.base90.status !== 'On track') {
      candidates.push({
        label: `OSRS base 90 is ${tracker.goalProjections.base90.status.toLowerCase()}. Give the highest-pressure skill some time soon.`,
        urgency: tracker.goalProjections.base90.status === 'Off track' ? 0.88 : 0.74,
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
        label: 'Log a weight entry so the health lane has a real body-metrics baseline to work from.',
        urgency: 0.7,
      });
    }

    return candidates.sort((left, right) => right.urgency - left.urgency).slice(0, 3);
  }, [dailyGoals, gymVisitCount, hobbiesOpenTasks, latestWeight, lowestCert, todayKey, tracker.goalProjections.base90.status]);

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
        <View
          style={{
            backgroundColor: colors.hero,
            borderRadius: 16,
            padding: 20,
            marginBottom: 18,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: 999,
              backgroundColor: 'rgba(255,255,255,0.08)',
              top: -60,
              right: -20,
            }}
          />
          <Text style={{ color: colors.heroSubtext, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 }}>
            Life Tracker
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ color: colors.heroText, fontSize: 30, fontWeight: '900', marginBottom: 8 }}>{greeting}</Text>
              <Text style={{ color: colors.heroSubtext, fontSize: 12 }}>
                {todayLabel} | Next reminder: {nextReminderLabel}
              </Text>
            </View>
            <Image source={require('../../assets/images/Huse Logo.png')} style={{ width: 132, height: 132 }} resizeMode="contain" />
          </View>
        </View>

        <SectionCard title="Bliss Score" emoji={'✨'} colors={colors}>
          <Text style={{ fontSize: 34, color: colors.text, fontWeight: '900', marginBottom: 6 }}>{blissScore}</Text>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 12 }}>
            This is the quick health check on how aligned the whole system feels right now across Cyber, Health, Hobbies, and the 2026 habit lane.
          </Text>
          <Text style={{ fontSize: 13, color: colors.text }}>
            Cyber {Math.round(cyberScore * 100)} | Health {Math.round(healthScore * 100)} | Hobbies {Math.round(hobbiesScore * 100)} |
            Goals {Math.round(goalsScore * 100)}
          </Text>
        </SectionCard>

        <SectionCard title="Suggested Next Actions" emoji={'🧭'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.subtext, lineHeight: 22, marginBottom: 12 }}>
            These are the moves that look most useful right now based on where the tracker says you are behind.
          </Text>
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

        <SectionCard title="Overview" emoji={'🧩'} colors={colors}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <OverviewCard
              title="Cyber"
              summary="Certification study progress, logged hours, and your next exam lane all live here now."
              footer={studySummary}
              colors={colors}
            />
            <OverviewCard
              title="Health"
              summary="Gym logging, weight entries, loop runs, and the weekly three-visit target all roll up here."
              footer={`${weightSummary} | ${gymVisitCount}/3 gym visits this week`}
              colors={colors}
            />
            <OverviewCard
              title="Hobbies"
              summary="OSRS progress stays contained here, and the DIY list keeps house projects visible instead of floating around in your head."
              footer={`${hobbiesSummary} | ${loopSummary}`}
              colors={colors}
            />
          </View>
        </SectionCard>

        <SectionCard title="2026 Goals" emoji={'🏁'} colors={colors}>
          <Text style={{ fontSize: 14, color: colors.text, lineHeight: 22, marginBottom: 12 }}>
            Keep the year visible. This is the quick read on the habit lane that supports everything else.
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <OverviewCard
              title="Alcohol"
              summary="This resets only when you log that you drank."
              footer={`${alcoholStreak} days without alcohol`}
              colors={colors}
            />
            <OverviewCard
              title="Stretching"
              summary="A simple daily check so mobility does not drift into the background."
              footer={`${stretchingStreak} day current streak`}
              colors={colors}
            />
            <OverviewCard
              title="Year view"
              summary="Fast food, coffee spending, soda limit, and the rest of the discipline lane now sit inside Hobbies."
              footer={goalsSummary}
              colors={colors}
            />
          </View>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
