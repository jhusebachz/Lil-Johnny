function clampPct(value: number) {
  return Math.max(0, Math.min(100, value));
}

function toLocalNoonDate(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

export function daysUntilGoalDate(targetDateKey: string, now = new Date()) {
  const currentDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentDate = toLocalNoonDate(currentDateKey);
  const goalDate = toLocalNoonDate(targetDateKey);
  const diffDays = Math.round((goalDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));

  return Math.max(diffDays, 1);
}

export function getGoalPacePct(
  startDateKey: string,
  targetDateKey: string,
  now = new Date()
) {
  const currentDateKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const startDate = toLocalNoonDate(startDateKey);
  const currentDate = toLocalNoonDate(currentDateKey);
  const targetDate = toLocalNoonDate(targetDateKey);
  const totalDays = Math.max(Math.round((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 1);
  const elapsedDays = Math.round((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  return clampPct((elapsedDays / totalDays) * 100);
}
