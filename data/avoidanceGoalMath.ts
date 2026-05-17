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

export type AvoidanceGoalDerivedState = {
  bestStreakDays: number;
  failureDates: string[];
  lastFailureDate: string | null;
};

type SanitizedAvoidanceGoal = {
  bestStreakDays: number;
  failureDates: string[];
  lastFailureDate: string | null;
  startedAt: string;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const warnedInvalidGoalInputs = new Set<string>();

function toLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalNoonDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function warnInvalidGoalInput(reason: string, detail: string) {
  const warningKey = `${reason}:${detail}`;

  if (warnedInvalidGoalInputs.has(warningKey)) {
    return;
  }

  warnedInvalidGoalInputs.add(warningKey);
  console.warn(`[avoidanceGoalMath] ${reason}: ${detail}`);
}

function isValidDateKey(dateKey: unknown): dateKey is string {
  if (typeof dateKey !== 'string' || !DATE_KEY_PATTERN.test(dateKey)) {
    return false;
  }

  const date = toLocalNoonDate(dateKey);
  return Number.isFinite(date.getTime()) && toLocalDateKey(date) === dateKey;
}

function sanitizeFailureDates(failureDates: AvoidanceGoalLike['failureDates']) {
  if (failureDates == null) {
    return [];
  }

  if (!Array.isArray(failureDates)) {
    warnInvalidGoalInput('Ignoring invalid failureDates payload', typeof failureDates);
    return [];
  }

  return failureDates.reduce<string[]>((dates, value) => {
    if (isValidDateKey(value)) {
      dates.push(value);
    } else if (value != null) {
      warnInvalidGoalInput('Ignoring invalid failure date key', String(value));
    }

    return dates;
  }, []);
}

function sanitizeBestStreakDays(bestStreakDays: number | undefined) {
  if (typeof bestStreakDays !== 'number' || !Number.isFinite(bestStreakDays) || bestStreakDays < 0) {
    return 0;
  }

  return Math.floor(bestStreakDays);
}

function sanitizeAvoidanceGoal(goal: AvoidanceGoalLike, now = new Date()): SanitizedAvoidanceGoal {
  const safeTodayDateKey = getTodayDateKey(now);
  const startedAt = isValidDateKey(goal.startedAt) ? goal.startedAt : safeTodayDateKey;

  if (startedAt !== goal.startedAt) {
    warnInvalidGoalInput('Falling back from invalid startedAt', String(goal.startedAt));
  }

  const failureDates = new Set<string>(sanitizeFailureDates(goal.failureDates));

  if (isValidDateKey(goal.lastFailureDate)) {
    failureDates.add(goal.lastFailureDate);
  } else if (goal.lastFailureDate != null) {
    warnInvalidGoalInput('Ignoring invalid lastFailureDate', String(goal.lastFailureDate));
  }

  return {
    startedAt,
    lastFailureDate: [...failureDates].sort().at(-1) ?? null,
    bestStreakDays: sanitizeBestStreakDays(goal.bestStreakDays),
    failureDates: [...failureDates].sort(),
  };
}

function getDaysBetween(dateKeyA: string, dateKeyB: string) {
  const dateA = toLocalNoonDate(dateKeyA).getTime();
  const dateB = toLocalNoonDate(dateKeyB).getTime();

  if (!Number.isFinite(dateA) || !Number.isFinite(dateB)) {
    warnInvalidGoalInput('Unable to calculate day delta for invalid date keys', `${dateKeyA} -> ${dateKeyB}`);
    return 0;
  }

  return Math.round((dateA - dateB) / (1000 * 60 * 60 * 24));
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
  return sanitizeAvoidanceGoal(goal).failureDates;
}

export function appendAvoidanceFailureDate(goal: AvoidanceGoalLike, failureDate: string) {
  const failureDates = new Set(normalizeAvoidanceFailureDates(goal));
  failureDates.add(failureDate);
  return [...failureDates].sort();
}

export function getLatestAvoidanceFailureDate(goal: AvoidanceGoalLike) {
  return normalizeAvoidanceFailureDates(goal).at(-1) ?? null;
}

function getStreakDaysSinceAnchor(endDateKey: string, anchorDateKey: string, anchorWasFailure: boolean) {
  const diffDays = Math.max(getDaysBetween(endDateKey, anchorDateKey), 0);

  return anchorWasFailure ? Math.max(diffDays - 1, 0) : diffDays;
}

export function getAvoidanceStreak(goal: AvoidanceGoalLike, now = new Date()) {
  const normalizedGoal = sanitizeAvoidanceGoal(goal, now);
  const latestFailureDate = getLatestAvoidanceFailureDate(normalizedGoal);
  const anchorDateKey = latestFailureDate ?? normalizedGoal.startedAt;
  const todayDateKey = getTodayDateKey(now);

  return getStreakDaysSinceAnchor(todayDateKey, anchorDateKey, Boolean(latestFailureDate));
}

export function getAvoidanceStreakBeforeFailure(goal: AvoidanceGoalLike, failureDate: string) {
  const normalizedGoal = sanitizeAvoidanceGoal(goal);
  const previousFailureDate =
    normalizeAvoidanceFailureDates(normalizedGoal)
      .filter((dateKey) => dateKey < failureDate)
      .at(-1) ?? null;
  const anchorDateKey = previousFailureDate ?? normalizedGoal.startedAt;

  return getStreakDaysSinceAnchor(failureDate, anchorDateKey, Boolean(previousFailureDate));
}

function getDerivedAvoidanceBestStreak(goal: AvoidanceGoalLike, now = new Date()) {
  const normalizedGoal = sanitizeAvoidanceGoal(goal, now);
  const failureDates = normalizeAvoidanceFailureDates(normalizedGoal);
  const bestBrokenStreak = failureDates.reduce(
    (best, failureDate) => Math.max(best, getAvoidanceStreakBeforeFailure(normalizedGoal, failureDate)),
    0
  );

  return Math.max(bestBrokenStreak, getAvoidanceStreak(normalizedGoal, now));
}

export function deriveAvoidanceGoalState(goal: AvoidanceGoalLike, now = new Date()): AvoidanceGoalDerivedState {
  const normalizedGoal = sanitizeAvoidanceGoal(goal, now);
  const failureDates = normalizeAvoidanceFailureDates(normalizedGoal);
  const derivedBestStreak = getDerivedAvoidanceBestStreak(
    {
      ...normalizedGoal,
      failureDates,
      lastFailureDate: failureDates.at(-1) ?? null,
    },
    now
  );

  return {
    failureDates,
    lastFailureDate: failureDates.at(-1) ?? null,
    bestStreakDays:
      failureDates.length > 0 ? derivedBestStreak : Math.max(normalizedGoal.bestStreakDays, derivedBestStreak),
  };
}

export function recordAvoidanceFailure(goal: AvoidanceGoalLike, failureDate: string, now = new Date()) {
  const normalizedGoal = sanitizeAvoidanceGoal(goal, now);
  return deriveAvoidanceGoalState(
    {
      ...normalizedGoal,
      failureDates: appendAvoidanceFailureDate(normalizedGoal, failureDate),
      lastFailureDate: failureDate,
    },
    now
  );
}

export function getAvoidanceBestStreak(goal: AvoidanceGoalLike, now = new Date()) {
  return deriveAvoidanceGoalState(goal, now).bestStreakDays;
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
  const normalizedGoal = sanitizeAvoidanceGoal(goal, now);
  const todayDateKey = getTodayDateKey(now);
  const startWindowDateKey = getDateKeyDaysAgo(windowDays, now);
  const trackedDays = Math.max(Math.min(getDaysBetween(todayDateKey, normalizedGoal.startedAt), windowDays), 0);
  const actualWindowStartDateKey =
    getDaysBetween(normalizedGoal.startedAt, startWindowDateKey) > 0 ? normalizedGoal.startedAt : startWindowDateKey;
  const failureDates = normalizeAvoidanceFailureDates(normalizedGoal).filter(
    (dateKey) => dateKey >= actualWindowStartDateKey && dateKey < todayDateKey
  );
  const badDays = new Set(failureDates).size;
  const actualGoodDays = Math.max(trackedDays - badDays, 0);
  const projectedGoodDays = trackedDays > 0 ? Math.round((actualGoodDays / trackedDays) * windowDays) : windowDays;
  const consistencyRate = trackedDays > 0 ? actualGoodDays / trackedDays : 1;
  const multiplier = getConsistencyMultiplier(projectedGoodDays);
  const label = trackedDays === 0 ? 'Fresh Start' : getConsistencyLabel(projectedGoodDays);

  return {
    actualGoodDays,
    badDays,
    blissPenaltyPct: Math.round((1 - multiplier) * 100),
    consistencyRate,
    currentStreak: getAvoidanceStreak(normalizedGoal, now),
    goodDays: actualGoodDays,
    label,
    longestStreak: getAvoidanceBestStreak(normalizedGoal, now),
    multiplier,
    trackedDays,
    windowDays,
  };
}
