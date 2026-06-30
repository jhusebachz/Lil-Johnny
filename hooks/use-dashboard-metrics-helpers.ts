import { getHobbiesBlissScore } from '../data/dashboardBlissMath';
import {
  CertificationTracker,
  DiyTask,
  GOAL_WEIGHT_LB,
  LoopRunEntry,
  TRACKER_BASELINE_DATE,
  WEIGHT_GOAL_TARGET_DATE,
  WeightEntry,
  getCurrentWeekDateKeys,
  getDateRangePacePct,
  getScheduledGymPacePct,
  getUniqueWeekCount,
  getWeightLossProgressPct,
} from '../data/lifeTrackerData';

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function sanitizeUnitScore(value: number) {
  return Number.isFinite(value) ? clamp01(value) : 0;
}

const BLISS_TREND_WEEKS = 4;

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

export type BlissTrendSummary = {
  cyber: number;
  health: number;
  hobbies: number;
  streaks: number;
  total: number;
};

export type SuggestedAction = {
  label: string;
  urgency: number;
};

type BuildBlissTrendArgs = {
  baseGoalOnPace: boolean;
  blissTrendResetDate: string | null;
  cyberScore: number;
  diyTasks: DiyTask[];
  loggedGymDateKeys: string[];
  loopRuns: LoopRunEntry[];
  now: Date;
  runefestOnPace: boolean;
  sortedWeightEntries: WeightEntry[];
  streaksScore: number;
  todayDateKey: string;
};

type BuildSuggestedActionsArgs = {
  baseGoalOnPace: boolean;
  baseGoalPacePct: number;
  baseGoalProgressPct: number;
  currentCertHasActiveWindow: boolean;
  currentDay: number;
  diyRecentlyActive: boolean;
  gymVisitCount: number;
  hobbiesOpenTasks: DiyTask[];
  latestWeight?: WeightEntry;
  loopRunLoggedThisWeek: boolean;
  lowestCert?: CertificationTracker;
  runefestOnPace: boolean;
  runefestPacePct: number;
  runefestProgressPct: number;
};

export function buildBlissTrend({
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
}: BuildBlissTrendArgs): BlissTrendSummary {
  const weightedScores = Array.from({ length: BLISS_TREND_WEEKS }, (_, index) => {
    const weeksAgo = BLISS_TREND_WEEKS - index - 1;
    const referenceDate = getWeeksAgoDate(now, weeksAgo);
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
    const referenceHealthScore = sanitizeUnitScore(
      [referenceGymOnPace ? 1 : 0, referenceLoopRunLogged ? 1 : 0, referenceWeightLossOnPace ? 1 : 0].reduce(
        (total, value) => total + value,
        0
      ) / 3
    );
    const referenceHobbiesScore = sanitizeUnitScore(
      getHobbiesBlissScore({
        baseGoalOnPace,
        diyTasks,
        referenceDate,
        runefestOnPace,
      })
    );
    const referenceBlissScore = sanitizeUnitScore(
      cyberScore * 0.3 + referenceHealthScore * 0.4 + sanitizeUnitScore(streaksScore) * 0.25 + referenceHobbiesScore * 0.05
    );

    return {
      referenceWeekEndDateKey,
      cyber: sanitizeUnitScore(cyberScore),
      health: referenceHealthScore,
      hobbies: referenceHobbiesScore,
      streaks: sanitizeUnitScore(streaksScore),
      total: referenceBlissScore,
    };
  })
    .filter((score) => !blissTrendResetDate || score.referenceWeekEndDateKey >= blissTrendResetDate)
    .map((score, index) => ({
      ...score,
      weight: index + 1,
    }));

  const scoresForAverage =
    weightedScores.length > 0
      ? weightedScores
      : [
          {
            cyber: sanitizeUnitScore(cyberScore),
            health: 0,
            hobbies: 0,
            streaks: sanitizeUnitScore(streaksScore),
            total: sanitizeUnitScore(cyberScore * 0.3 + sanitizeUnitScore(streaksScore) * 0.25),
            weight: 1,
            referenceWeekEndDateKey: todayDateKey,
          },
        ];
  const totalWeight = sumWeights(scoresForAverage.length);
  const weightedAverage = (key: keyof BlissTrendSummary) =>
    sanitizeUnitScore(scoresForAverage.reduce((sum, score) => sum + score[key] * score.weight, 0) / totalWeight);

  return {
    total: weightedAverage('total'),
    cyber: weightedAverage('cyber'),
    health: weightedAverage('health'),
    hobbies: weightedAverage('hobbies'),
    streaks: weightedAverage('streaks'),
  };
}

export function buildSuggestedActions({
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
}: BuildSuggestedActionsArgs) {
  const candidates: SuggestedAction[] = [];

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
      urgency: baseGoalProgressPct + 8 < baseGoalPacePct ? 0.88 : 0.74,
    });
  }

  if (!runefestOnPace) {
    candidates.push({
      label: '2250 total by RuneFest is behind pace. Put some focused OSRS time into the total-level path.',
      urgency: runefestProgressPct + 8 < runefestPacePct ? 0.84 : 0.69,
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
}
