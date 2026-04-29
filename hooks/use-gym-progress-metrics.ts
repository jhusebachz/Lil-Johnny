import { useMemo } from 'react';

import {
  ExerciseProgressPoint,
  GymDay,
  GymExerciseHistory,
  getLoggedGymDateKeys,
} from '../data/gymData';
import {
  GOAL_WEIGHT_LB,
  LifeTrackerData,
  TRACKER_BASELINE_DATE,
  WEIGHT_GOAL_TARGET_DATE,
  getDateRangePacePct,
  getScheduledGymPacePct,
  getUniqueWeekCount,
  getWeightLossProgressPct,
} from '../data/lifeTrackerData';

type BestLoggedSet = {
  reps: number;
  weight: number;
};

type ExerciseProgressSummary = {
  point: ExerciseProgressPoint;
  setCount: number;
  bestSet: BestLoggedSet | null;
  qualifyingSet: BestLoggedSet | null;
};

function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function estimateOneRepMax(weight: number, reps: number) {
  return weight * (1 + reps / 30);
}

function getBestSet(
  setEntries: ExerciseProgressPoint['setEntries'],
  minimumReps = 0
): BestLoggedSet | null {
  const qualifyingSets = setEntries.filter((setEntry) => setEntry.reps >= minimumReps);

  if (qualifyingSets.length === 0) {
    return null;
  }

  const topWeight = Math.max(...qualifyingSets.map((setEntry) => setEntry.weight));
  const topWeightSets = qualifyingSets.filter((setEntry) => setEntry.weight === topWeight);
  const bestReps = Math.max(...topWeightSets.map((setEntry) => setEntry.reps));

  return { reps: bestReps, weight: topWeight };
}

function summarizeProgressPoint(point: ExerciseProgressPoint): ExerciseProgressSummary {
  return {
    point,
    setCount: point.setEntries.length,
    bestSet: getBestSet(point.setEntries, 0),
    qualifyingSet: getBestSet(point.setEntries, 6),
  };
}

function getBestAtTopWeight(points: ExerciseProgressSummary[]) {
  const qualifyingPoints = points
    .map((point) => point.qualifyingSet)
    .filter((point): point is BestLoggedSet => point !== null);

  if (qualifyingPoints.length === 0) {
    return null;
  }

  const topWeight = Math.max(...qualifyingPoints.map((point) => point.weight));
  const topWeightPoints = qualifyingPoints.filter((point) => point.weight === topWeight);
  const bestReps = Math.max(...topWeightPoints.map((point) => point.reps));

  return { bestReps, topWeight };
}

type UseGymProgressMetricsArgs = {
  exerciseHistory: GymExerciseHistory;
  lifeData: LifeTrackerData;
  progressExerciseName: string;
  selectedDay: GymDay;
};

export function useGymProgressMetrics({
  exerciseHistory,
  lifeData,
  progressExerciseName,
  selectedDay,
}: UseGymProgressMetricsArgs) {
  const progressMetrics = useMemo(() => {
    const rawProgressPoints = exerciseHistory[selectedDay][progressExerciseName] ?? [];
    const progressPoints = [...rawProgressPoints]
      .sort((left, right) => left.dateKey.localeCompare(right.dateKey))
      .slice(-10);
    const progressPointSummaries = progressPoints
      .map(summarizeProgressPoint)
      .filter((point) => point.bestSet !== null);
    const qualifyingProgressPoints = progressPointSummaries.filter((point) => point.qualifyingSet !== null);
    const maxReps = Math.max(...progressPointSummaries.map((point) => point.bestSet?.reps ?? 0), 1);
    const bestAtTopWeight = progressPointSummaries.length > 0 ? getBestAtTopWeight(progressPointSummaries) : null;
    const estimatedOneRepMax =
      bestAtTopWeight && bestAtTopWeight.bestReps >= 1
        ? estimateOneRepMax(bestAtTopWeight.topWeight, bestAtTopWeight.bestReps)
        : null;
    const oneRepMaxTrend =
      qualifyingProgressPoints.length >= 2
        ? estimateOneRepMax(
            qualifyingProgressPoints.at(-1)?.qualifyingSet?.weight ?? 0,
            qualifyingProgressPoints.at(-1)?.qualifyingSet?.reps ?? 0
          ) -
          estimateOneRepMax(
            qualifyingProgressPoints.at(-2)?.qualifyingSet?.weight ?? 0,
            qualifyingProgressPoints.at(-2)?.qualifyingSet?.reps ?? 0
          )
        : null;

    return {
      bestAtTopWeight,
      estimatedOneRepMax,
      maxReps,
      oneRepMaxTrend,
      progressPointSummaries,
      qualifyingProgressPoints,
    };
  }, [exerciseHistory, progressExerciseName, selectedDay]);

  const healthMetrics = useMemo(() => {
    const weeklyGymVisits = getUniqueWeekCount(getLoggedGymDateKeys(exerciseHistory));
    const allWeights = [...lifeData.weightEntries].sort((left, right) => left.dateKey.localeCompare(right.dateKey));
    const latestWeight = allWeights.at(-1);
    const weightMin = allWeights.length > 0 ? Math.min(...allWeights.map((entry) => entry.weight)) : 0;
    const weightMax = allWeights.length > 0 ? Math.max(...allWeights.map((entry) => entry.weight)) : 1;
    const recentLoopRuns = [...lifeData.loopRuns]
      .sort((left, right) => right.dateKey.localeCompare(left.dateKey))
      .slice(0, 10);
    const bestLoopRun = lifeData.loopRuns.reduce(
      (best, run) => (!best || run.timeSeconds < best.timeSeconds ? run : best),
      lifeData.loopRuns[0]
    );
    const weeklyGymPct = clampPct((weeklyGymVisits / 3) * 100);
    const weeklyGymPacePct = getScheduledGymPacePct();
    const loopRunGoalPct = bestLoopRun
      ? clampPct(((12 * 60 - bestLoopRun.timeSeconds) / (12 * 60 - 9 * 60)) * 100)
      : 0;
    const weightGoalPct = latestWeight ? getWeightLossProgressPct(latestWeight.weight) : 0;
    const weightGoalPacePct = getDateRangePacePct(TRACKER_BASELINE_DATE, WEIGHT_GOAL_TARGET_DATE);
    const weightGoalDelta = latestWeight ? latestWeight.weight - GOAL_WEIGHT_LB : null;

    return {
      allWeights,
      bestLoopRun,
      latestWeight,
      loopRunGoalPct,
      recentLoopRuns,
      weeklyGymPacePct,
      weeklyGymPct,
      weeklyGymVisits,
      weightGoalDelta,
      weightGoalPacePct,
      weightGoalPct,
      weightMax,
      weightMin,
    };
  }, [exerciseHistory, lifeData.loopRuns, lifeData.weightEntries]);

  return {
    ...progressMetrics,
    ...healthMetrics,
  };
}
