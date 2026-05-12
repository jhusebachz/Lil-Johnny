import { useMemo } from 'react';

import {
  DIY_RECENT_WINDOW_DAYS,
  getHobbiesBlissScore,
  hasRecentCompletedDiyTask,
} from '../data/dashboardBlissMath';
import { GymExerciseHistory, getLoggedGymDateKeys } from '../data/gymData';
import {
  AvoidanceGoal,
  CertificationTracker,
  DiyTask,
  GOAL_WEIGHT_LB,
  LoopRunEntry,
  TRACKER_BASELINE_DATE,
  WEIGHT_GOAL_TARGET_DATE,
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
  getWeightLossProgressPct,
} from '../data/lifeTrackerData';
import { LiveRunescapeTracker } from '../data/osrsTracker';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

const BLISS_TREND_WEEKS = 4;
const CERT_WINDOW_END_TIME = 'T23:59:59';
const CERT_WINDOW_START_TIME = 'T00:00:00';

function getWeeksAgoDate(referenceDate: Date, weeksAgo: number) {
  const nextDate = new Date(referenceDate);
  nextDate.setDate(nextDate.getDate() - weeksAgo * 7);
  return nextDate;
}

function getReferenceWeekEndDateKey(referenceDate: Date) {
  return getCurrentWeekDateKeys(referenceDate)[referenceDate.getDay()];
}

function sumWeights(count: number) {
  return (count * (count + 1)) / 2;
}

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
  const streaksScore =
    avoidanceGoals.length > 0
      ? avoidanceGoals.reduce((total, goal) => total + getAvoidanceConsistencySummary(goal, now).multiplier, 0) /
        avoidanceGoals.length
      : 1;
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
  const baseGoalOnPace = tracker.goalProjections.baseGoal.progressPct >= tracker.goalProjections.baseGoal.pacePct;
  const runefestOnPace = tracker.goalProjections.runefest.progressPct >= tracker.goalProjections.runefest.pacePct;
  const diyRecentlyActive = hasRecentCompletedDiyTask(diyTasks, now, DIY_RECENT_WINDOW_DAYS);
  const cyberScore = cyberOnPace ? 1 : 0;
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
      const referenceLoopRunLogged = loopRuns.some((run) => referenceWeekKeys.has(run.dateKey));
      const referenceWeekEndDateKey = getReferenceWeekEndDateKey(referenceDate);
      const referenceWeightEntry = sortedWeightEntries.find((entry) => entry.dateKey <= referenceWeekEndDateKey);
      const referenceWeightLossActualPct = referenceWeightEntry ? getWeightLossProgressPct(referenceWeightEntry.weight) : 0;
      const referenceWeightLossPacePct = getDateRangePacePct(TRACKER_BASELINE_DATE, WEIGHT_GOAL_TARGET_DATE, referenceDate);
      const referenceWeightLossOnPace = referenceWeightLossActualPct >= referenceWeightLossPacePct;
      const referenceHealthScore = [
        referenceGymOnPace ? 1 : 0,
        referenceLoopRunLogged ? 1 : 0,
        referenceWeightLossOnPace ? 1 : 0,
      ].reduce((total, value) => total + value, 0) / 3;
      const referenceHobbiesScore = getHobbiesBlissScore({
        baseGoalOnPace,
        diyTasks,
        referenceDate,
        runefestOnPace,
      });
      const referenceBlissScore = cyberScore * 0.3 + referenceHealthScore * 0.4 + streaksScore * 0.25 + referenceHobbiesScore * 0.05;

      return {
        weight,
        cyber: cyberScore,
        health: referenceHealthScore,
        hobbies: referenceHobbiesScore,
        streaks: streaksScore,
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
  }, [baseGoalOnPace, cyberScore, diyTasks, loggedGymDateKeys, loopRuns, now, runefestOnPace, sortedWeightEntries, streaksScore]);
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

    if (!baseGoalOnPace) {
      candidates.push({
        label: 'OSRS base 92s are behind pace. Give the highest-pressure RuneFest skill some focused time soon.',
        urgency: tracker.goalProjections.baseGoal.progressPct + 8 < tracker.goalProjections.baseGoal.pacePct ? 0.88 : 0.74,
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
    if (!diyRecentlyActive) {
      candidates.push({
        label: 'Finish one DIY task soon so the hobbies score reflects real movement outside OSRS.',
        urgency: 0.62,
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
    baseGoalOnPace,
    currentCertHasActiveWindow,
    currentDay,
    diyRecentlyActive,
    gymVisitCount,
    hobbiesOpenTasks,
    latestWeight,
    loopRunLoggedThisWeek,
    lowestCert,
    runefestOnPace,
    tracker.goalProjections.baseGoal.pacePct,
    tracker.goalProjections.baseGoal.progressPct,
    tracker.goalProjections.runefest.pacePct,
    tracker.goalProjections.runefest.progressPct,
  ]);

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
