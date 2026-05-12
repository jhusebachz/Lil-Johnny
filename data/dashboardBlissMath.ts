export const DIY_RECENT_WINDOW_DAYS = 28;

export type DiyTaskLike = {
  completedAt?: string | null;
};

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function isDateKeyWithinTrailingDays(dateKey: string, referenceDate: Date, trailingDays: number) {
  const referenceDateKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth() + 1).padStart(2, '0')}-${String(referenceDate.getDate()).padStart(2, '0')}`;
  const diffDays = Math.round(
    (new Date(`${referenceDateKey}T12:00:00`).getTime() - new Date(`${dateKey}T12:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return diffDays >= 0 && diffDays < trailingDays;
}

export function hasRecentCompletedDiyTask(
  diyTasks: DiyTaskLike[],
  referenceDate: Date,
  trailingDays = DIY_RECENT_WINDOW_DAYS
) {
  return diyTasks.some(
    (task) => task.completedAt && isDateKeyWithinTrailingDays(task.completedAt, referenceDate, trailingDays)
  );
}

export function getHobbiesBlissScore({
  baseGoalOnPace,
  diyTasks,
  referenceDate,
  runefestOnPace,
}: {
  baseGoalOnPace: boolean;
  diyTasks: DiyTaskLike[];
  referenceDate: Date;
  runefestOnPace: boolean;
}) {
  const diyRecentlyActive = hasRecentCompletedDiyTask(diyTasks, referenceDate);

  return clamp01(
    [baseGoalOnPace ? 1 : 0, runefestOnPace ? 1 : 0, diyRecentlyActive ? 1 : 0].reduce((total, value) => total + value, 0) /
      3
  );
}
