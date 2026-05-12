export const AVOIDANCE_CONSISTENCY_WINDOW_DAYS = 120;

export type AvoidanceGoalLike = {
  startedAt: string;
  lastFailureDate?: string | null;
  bestStreakDays?: number;
  failureDates?: string[] | null;
};

export type AvoidanceConsistencySummary = {
  actualGoodDays: number;
  badDays: number;
  blissPenaltyPct: number;
  consistencyRate: number;
  currentStreak: number;
  goodDays: number;
  label: string;
  longestStreak: number;
  multiplier: number;
  trackedDays: number;
  windowDays: number;
};

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalNoonDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function getDaysBetween(dateKeyA: string, dateKeyB: string) {
  return Math.round((toLocalNoonDate(dateKeyA).getTime() - toLocalNoonDate(dateKeyB).getTime()) / (1000 * 60 * 60 * 24));
}

function getDateKeyDaysAgo(daysAgo: number, now = new Date()) {
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return toLocalDateKey(date);
}

export function getTodayDateKey(date = new Date()) {
  return toLocalDateKey(date);
}

export function normalizeAvoidanceFailureDates(goal: AvoidanceGoalLike) {
  const failureDates = new Set<string>();

  (goal.failureDates ?? []).forEach((dateKey) => {
    if (dateKey) {
      failureDates.add(dateKey);
    }
  });

  if (goal.lastFailureDate) {
    failureDates.add(goal.lastFailureDate);
  }

  return [...failureDates].sort();
}

export function appendAvoidanceFailureDate(goal: AvoidanceGoalLike, failureDate: string) {
  const failureDates = new Set(normalizeAvoidanceFailureDates(goal));
  failureDates.add(failureDate);
  return [...failureDates].sort();
}

export function getAvoidanceStreak(goal: AvoidanceGoalLike, now = new Date()) {
  const anchorDateKey = goal.lastFailureDate ?? goal.startedAt;
  const todayDateKey = getTodayDateKey(now);
  const diffDays = Math.max(getDaysBetween(todayDateKey, anchorDateKey), 0);

  return goal.lastFailureDate ? Math.max(diffDays - 1, 0) : diffDays;
}

export function getAvoidanceStreakBeforeFailure(goal: AvoidanceGoalLike, failureDate: string) {
  const anchorDateKey = goal.lastFailureDate ?? goal.startedAt;
  const diffDays = Math.max(getDaysBetween(failureDate, anchorDateKey), 0);

  return goal.lastFailureDate ? Math.max(diffDays - 1, 0) : diffDays;
}

export function getAvoidanceBestStreak(goal: AvoidanceGoalLike, now = new Date()) {
  return Math.max(goal.bestStreakDays ?? 0, getAvoidanceStreak(goal, now));
}

export function getConsistencyMultiplier(goodDays: number) {
  if (goodDays >= 115) return 1.0;
  if (goodDays >= 105) return 0.95;
  if (goodDays >= 95) return 0.85;
  if (goodDays >= 85) return 0.7;
  return 0.5;
}

export function getConsistencyLabel(goodDays: number) {
  if (goodDays >= 115) return 'Locked In';
  if (goodDays >= 105) return 'Very Consistent';
  if (goodDays >= 95) return 'Solid, but slipping';
  if (goodDays >= 85) return 'Inconsistent';
  return 'Needs a Reset';
}

export function getAvoidanceConsistencySummary(
  goal: AvoidanceGoalLike,
  now = new Date(),
  windowDays = AVOIDANCE_CONSISTENCY_WINDOW_DAYS
): AvoidanceConsistencySummary {
  const todayDateKey = getTodayDateKey(now);
  const startWindowDateKey = getDateKeyDaysAgo(windowDays - 1, now);
  const trackedDays = Math.max(Math.min(getDaysBetween(todayDateKey, goal.startedAt) + 1, windowDays), 1);
  const actualWindowStartDateKey =
    getDaysBetween(goal.startedAt, startWindowDateKey) > 0 ? goal.startedAt : startWindowDateKey;
  const failureDates = normalizeAvoidanceFailureDates(goal).filter(
    (dateKey) => dateKey >= actualWindowStartDateKey && dateKey <= todayDateKey
  );
  const badDays = new Set(failureDates).size;
  const actualGoodDays = Math.max(trackedDays - badDays, 0);
  const goodDays =
    trackedDays >= windowDays ? actualGoodDays : Math.round((actualGoodDays / trackedDays) * windowDays);
  const consistencyRate = goodDays / windowDays;
  const multiplier = getConsistencyMultiplier(goodDays);

  return {
    actualGoodDays,
    badDays,
    blissPenaltyPct: Math.round((1 - multiplier) * 100),
    consistencyRate,
    currentStreak: getAvoidanceStreak(goal, now),
    goodDays,
    label: getConsistencyLabel(goodDays),
    longestStreak: getAvoidanceBestStreak(goal, now),
    multiplier,
    trackedDays,
    windowDays,
  };
}
