import { Measurement, MealEntry, WorkoutEntry } from './types';

// Game layer. Everything here is DERIVED from the real logs, never stored, so it
// needs no migration and can't drift from what the user actually recorded.
// Rewards favour consistency (showing up) over intensity, in line with habit
// research: repetition in a stable context is what builds automaticity
// (Lally et al., Eur J Soc Psychol 2010 — median ~66 days, missing one day did
// not derail habit formation). So: a missed day costs nothing but the streak,
// and one "shield" per week protects the streak from a single missed day.

export const XP = {
  meal: 10, mealsPerDayCap: 5, // logging food matters; spamming it doesn't
  workout: 50, restDay: 20, measurement: 30,
  dailyBonus: 25, // logged both food and movement on the same day
} as const;

export interface DayActivity { date: string; meals: number; workouts: number; rest: boolean; measurements: number }
export interface Quest { id: string; title: string; xp: number; done: boolean }
export interface GameState {
  xp: number; level: number; levelXp: number; levelSize: number; progress: number;
  title: string; streak: number; bestStreak: number; shieldUsed: boolean; todayCounted: boolean;
  activeDays: number;
}

const DAY = 86_400_000;
const toTime = (date: string) => { const [y, m, d] = date.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const fromTime = (t: number) => new Date(t).toISOString().slice(0, 10);
export const shiftDate = (date: string, days: number) => fromTime(toTime(date) + days * DAY);

export function activityByDay(meals: MealEntry[], workouts: WorkoutEntry[], measurements: Measurement[]): Map<string, DayActivity> {
  const days = new Map<string, DayActivity>();
  const get = (date: string) => {
    let day = days.get(date);
    if (!day) { day = { date, meals: 0, workouts: 0, rest: false, measurements: 0 }; days.set(date, day); }
    return day;
  };
  meals.forEach(m => { get(m.date).meals++; });
  workouts.forEach(w => { if (w.kind === 'rest') get(w.date).rest = true; else get(w.date).workouts++; });
  measurements.forEach(m => { get(m.date).measurements++; });
  return days;
}

export function dayXp(day: DayActivity): number {
  const meals = Math.min(day.meals, XP.mealsPerDayCap) * XP.meal;
  const moves = day.workouts * XP.workout + (day.rest ? XP.restDay : 0);
  const bonus = day.meals > 0 && (day.workouts > 0 || day.rest) ? XP.dailyBonus : 0;
  return meals + moves + day.measurements * XP.measurement + bonus;
}

// Level n -> n+1 costs 100 + 50·(n-1) XP: quick early wins, then a steady climb.
export const levelCost = (level: number) => 100 + 50 * (level - 1);
const titles = ['Rookie', 'Mover', 'Regular', 'Grinder', 'Athlete', 'Machine', 'Legend'];
export const levelTitle = (level: number) => titles[Math.min(titles.length - 1, Math.floor((level - 1) / 3))];

export function levelFor(xp: number) {
  let level = 1, rest = Math.max(0, xp);
  while (rest >= levelCost(level)) { rest -= levelCost(level); level++; }
  return { level, levelXp: rest, levelSize: levelCost(level) };
}

// A day is "active" if anything was logged. The streak counts back from today
// (or yesterday, if today has no log yet — the day isn't over). One missed day
// inside any rolling 7-day window is forgiven by a shield.
export function streakFor(activeDates: Set<string>, today: string) {
  const todayCounted = activeDates.has(today);
  let cursor = todayCounted ? today : shiftDate(today, -1);
  let streak = 0, lastShield: string | null = null, shieldUsed = false;
  for (;;) {
    if (activeDates.has(cursor)) { streak++; cursor = shiftDate(cursor, -1); continue; }
    const shieldReady = lastShield === null || toTime(lastShield) - toTime(cursor) >= 7 * DAY;
    if (streak > 0 && shieldReady && activeDates.has(shiftDate(cursor, -1))) {
      lastShield = cursor; if (toTime(today) - toTime(cursor) < 7 * DAY) shieldUsed = true;
      cursor = shiftDate(cursor, -1); continue;
    }
    break;
  }
  return { streak, todayCounted, shieldUsed };
}

function bestStreak(dates: string[]) {
  let best = 0, run = 0, prev: string | null = null;
  for (const d of [...dates].sort()) { run = prev && shiftDate(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return best;
}

export function gameState(meals: MealEntry[], workouts: WorkoutEntry[], measurements: Measurement[], today: string): GameState {
  const days = activityByDay(meals, workouts, measurements);
  const xp = [...days.values()].reduce((sum, d) => sum + dayXp(d), 0);
  const { level, levelXp, levelSize } = levelFor(xp);
  const dates = new Set(days.keys());
  const { streak, todayCounted, shieldUsed } = streakFor(dates, today);
  return {
    xp, level, levelXp, levelSize, progress: levelXp / levelSize, title: levelTitle(level),
    streak, bestStreak: Math.max(streak, bestStreak([...dates])), shieldUsed, todayCounted, activeDays: dates.size,
  };
}

export function dailyQuests(day: DayActivity | undefined, sessionKind: 'strength' | 'running' | 'rest' | undefined): Quest[] {
  const d = day ?? { date: '', meals: 0, workouts: 0, rest: false, measurements: 0 };
  const move: Quest = sessionKind === 'rest'
    ? { id: 'rest', title: 'Take your recovery day', xp: XP.restDay, done: d.rest || d.workouts > 0 }
    : { id: 'train', title: sessionKind === 'running' ? 'Complete today\'s run' : 'Complete today\'s workout', xp: XP.workout, done: d.workouts > 0 };
  return [
    { id: 'meal1', title: 'Log your first meal', xp: XP.meal, done: d.meals >= 1 },
    move,
    { id: 'meal3', title: 'Log 3 meals', xp: XP.meal * 2, done: d.meals >= 3 },
    { id: 'combo', title: 'Food + movement combo', xp: XP.dailyBonus, done: d.meals > 0 && (d.workouts > 0 || d.rest) },
  ];
}
