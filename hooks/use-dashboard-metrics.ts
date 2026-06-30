import { useMemo } from 'react';

import {
  DIY_RECENT_WINDOW_DAYS,
  hasRecentCompletedDiyTask,
  isTrackerGoalOnPace,
} from '../data/dashboardBlissMath';
import { GymExerciseHistory, getLoggedGymDateKeys } from '../data/gymData';
import {
  AvoidanceGoal,
  CertificationTracker,
  DiyTask,
  LifeTrackerMetadata,
  LoopRunEntry,
  WeightEntry,
  formatLongDate,
  getAvoidanceConsistencySummary,
  getAvoidanceStreak,
  getCurrentWeekDateKeys,
  getDateRangePacePct,
  getGreetingForTime,
  getScheduledGymPacePct,
  getTodayDateKey,
  getUniqueWeekCount,
} from '../data/lifeTrackerData';
import { LiveRunescapeTracker } from '../data/osrsTracker';
import { buildBlissTrend, buildSuggestedActions } from './use-dashboard-metrics-helpers';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function sanitizeUnitScore(value: number) {
  return Number.isFinite(value) ? clamp01(value) : 0;
}

function sanitizePercent(value: number) {
  return Number.isFinite(value) ? value : 0;
}

const CERT_WINDOW_END_TIME = 'T23:59:59';
const CERT_WINDOW_START_TIME = 'T00:00:00';

export type OverviewItem = {
  label: string;
  complete?: boolean;
  showCheck?: boolean;
};

type UseDashboardMetricsArgs = {
  certifications: CertificationTracker[];
  diyTasks: DiyTask[];
  exerciseHistory: GymExerciseHistory;
  goals2026: AvoidanceGoal[];
  loopRuns: LoopRunEntry[];
  metadata?: LifeTrackerMetadata;
  profileName?: string;
  tracker: LiveRunescapeTracker;
  weightEntries: WeightEntry[];
};

export function useDashboardMetrics({
  certifications,
  diyTasks,
  exerciseHistory,
  goals2026,
  loopRuns,
  metadata,
  profileName,
  tracker,
  weightEntries,
}: UseDashboardMetricsArgs) {
  const todayDateKey = getTodayDateKey();
  const now = useMemo(() => new Date(`${todayDateKey}T12:00:00`), [todayDateKey]);
  const todayLabel = formatLongDate(now);
  const greeting = `${getGreetingForTime(now)}, ${profileName || 'John'}!`;
  const sortedCertifications = useMemo(
    () =>
      [...certifications].sort(
        (left, right) =>
          left.chaptersCompleted / Math.max(left.chapterCount, 1) - right.chaptersCompleted / Math.max(right.chapterCount, 1)
      ),
    [certifications]
  );
  const lowestCert = sortedCertifications[0];
  const currentCert = useMemo(
    () =>
      certifications.find(
        (cert) =>
          cert.startDate &&
          cert.examDate &&
          now >= new Date(`${cert.startDate}${CERT_WINDOW_START_TIME}`) &&
          now <= new Date(`${cert.examDate}${CERT_WINDOW_END_TIME}`)
      ) ??
      certifications.find((cert) => cert.startDate && now < new Date(`${cert.startDate}${CERT_WINDOW_START_TIME}`)) ??
      certifications[certifications.length - 1],
    [certifications, now]
  );
  const sortedWeightEntries = useMemo(
    () => [...weightEntries].sort((left, right) => right.dateKey.localeCompare(left.dateKey)),
    [weightEntries]
  );
  const latestWeight = sortedWeightEntries[0];
  const avoidanceGoals = useMemo(() => goals2026.filter((goal) => goal.type === 'avoidance'), [goals2026]);
  const hobbiesOpenTasks = useMemo(() => diyTasks.filter((task) => !task.completed), [diyTasks]);
  const alcoholGoal = avoidanceGoals.find((goal) => goal.id === 'alcohol');
  const stretchingGoal = avoidanceGoals.find((goal) => goal.id === 'stretching');
  const snacksGoal = avoidanceGoals.find((goal) => goal.id === 'snacks-sweets');
  const alcoholStreak = alcoholGoal ? getAvoidanceStreak(alcoholGoal, now) : 0;
  const stretchingStreak = stretchingGoal ? getAvoidanceStreak(stretchingGoal, now) : 0;
  const snacksStreak = snacksGoal ? getAvoidanceStreak(snacksGoal, now) : 0;
  const blissTrendResetDate = metadata?.blissTrendResetDate ?? null;
  const streaksScore = sanitizeUnitScore(
    avoidanceGoals.length > 0
      ? avoidanceGoals.reduce((total, goal) => total + getAvoidanceConsistencySummary(goal, now).multiplier, 0) /
        avoidanceGoals.length
      : 1
  );
  const currentDay = now.getDay();
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
    now >= new Date(`${currentCert.startDate}${CERT_WINDOW_START_TIME}`) &&
    now <= new Date(`${currentCert.examDate}${CERT_WINDOW_END_TIME}`);
  const loggedGymDateKeys = useMemo(() => getLoggedGymDateKeys(exerciseHistory), [exerciseHistory]);
  const currentWeekKeys = useMemo(() => new Set(getCurrentWeekDateKeys(now)), [now]);
  const gymVisitCount = useMemo(() => getUniqueWeekCount(loggedGymDateKeys, now), [loggedGymDateKeys, now]);
  const weeklyGymPacePct = getScheduledGymPacePct(now);
  const weeklyGymActualPct = clamp01(gymVisitCount / 3) * 100;
  const gymOnPace = gymVisitCount >= 3 || weeklyGymActualPct >= weeklyGymPacePct;
  const loopRunLoggedThisWeek = loopRuns.some((run) => currentWeekKeys.has(run.dateKey));
  const cyberOnPace = currentCertPacePct !== null ? currentCertPct >= currentCertPacePct : false;
  const baseGoalProgressPct = sanitizePercent(tracker.goalProjections.baseGoal.progressPct);
  const baseGoalPacePct = sanitizePercent(tracker.goalProjections.baseGoal.pacePct);
  const runefestProgressPct = sanitizePercent(tracker.goalProjections.runefest.progressPct);
  const runefestPacePct = sanitizePercent(tracker.goalProjections.runefest.pacePct);
  const trackerHasOsrsData = tracker.totalLevel > 0;
  const baseGoalOnPace = isTrackerGoalOnPace(trackerHasOsrsData, baseGoalProgressPct, baseGoalPacePct);
  const runefestOnPace = isTrackerGoalOnPace(trackerHasOsrsData, runefestProgressPct, runefestPacePct);
  const diyRecentlyActive = hasRecentCompletedDiyTask(diyTasks, now, DIY_RECENT_WINDOW_DAYS);
  const cyberScore = cyberOnPace ? 1 : 0;
  const blissTrend = useMemo(
    () =>
      buildBlissTrend({
        baseGoalOnPace,
        blissTrendResetDate,
        cyberScore,
        diyTasks,
        loggedGymDateKeys,
        loopRuns,
        now,
        runefestOnPace,
        sortedWeightEntries,
        streaksScore,
        todayDateKey,
      }),
    [
      baseGoalOnPace,
      blissTrendResetDate,
      cyberScore,
      diyTasks,
      loggedGymDateKeys,
      loopRuns,
      now,
      runefestOnPace,
      sortedWeightEntries,
      streaksScore,
      todayDateKey,
    ]
  );
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
      label: 'Base 92s (RC 90) by RuneFest',
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: baseGoalOnPace,
    },
    {
      label: '2250 Total Level by RuneFest',
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: runefestOnPace,
    },
    {
      label: 'DIY completed in last 4 weeks',
      showCheck: false,
    },
    {
      label: 'On Pace',
      complete: diyRecentlyActive,
    },
  ];
  const suggestedActions = useMemo(
    () =>
      buildSuggestedActions({
        baseGoalOnPace,
        baseGoalPacePct,
        baseGoalProgressPct,
        currentCertHasActiveWindow,
        currentDay,
        diyRecentlyActive,
        gymVisitCount,
        hobbiesOpenTasks,
        latestWeight,
        loopRunLoggedThisWeek,
        lowestCert,
        runefestOnPace,
        runefestPacePct,
        runefestProgressPct,
      }),
    [
      baseGoalOnPace,
      baseGoalPacePct,
      baseGoalProgressPct,
      currentCertHasActiveWindow,
      currentDay,
      diyRecentlyActive,
      gymVisitCount,
      hobbiesOpenTasks,
      latestWeight,
      loopRunLoggedThisWeek,
      lowestCert,
      runefestOnPace,
      runefestPacePct,
      runefestProgressPct,
    ]
  );

  return {
    alcoholStreak,
    blissBreakdown,
    blissScore,
    cyberOverviewItems,
    currentCert,
    currentCertHasActiveWindow,
    currentCertPct,
    cyberOnPace,
    greeting,
    healthOverviewItems,
    hobbiesOverviewItems,
    now,
    snacksStreak,
    stretchingStreak,
    suggestedActions,
    todayLabel,
  };
}
