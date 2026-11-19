import assert from 'node:assert/strict';
import { test } from 'node:test';
import { dailyQuests, dayXp, gameState, levelFor, shiftDate, streakFor, XP } from '../src/domain/gamification';
import { MealEntry, WorkoutEntry } from '../src/domain/types';

const today = '2026-11-19';
const meal = (date: string, i = 0) => ({ id: `${date}-${i}`, date } as MealEntry);
const run = (date: string, kind: WorkoutEntry['kind'] = 'running') => ({ id: `w-${date}`, date, kind } as WorkoutEntry);

test('shiftDate crosses month and year boundaries', () => {
  assert.equal(shiftDate('2026-03-01', -1), '2026-02-28');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
});

test('meal XP is capped per day and combo bonus needs food + movement', () => {
  assert.equal(dayXp({ date: today, meals: 9, workouts: 0, rest: false, measurements: 0 }), XP.meal * XP.mealsPerDayCap);
  assert.equal(dayXp({ date: today, meals: 1, workouts: 1, rest: false, measurements: 0 }), XP.meal + XP.workout + XP.dailyBonus);
  assert.equal(dayXp({ date: today, meals: 0, workouts: 0, rest: true, measurements: 1 }), XP.restDay + XP.measurement);
});

test('levels: 100 XP for level 2, then +50 per level', () => {
  assert.deepEqual(levelFor(0), { level: 1, levelXp: 0, levelSize: 100 });
  assert.deepEqual(levelFor(100), { level: 2, levelXp: 0, levelSize: 150 });
  assert.deepEqual(levelFor(260), { level: 3, levelXp: 10, levelSize: 200 });
});

test('streak counts from yesterday when today has no log yet', () => {
  const dates = new Set([shiftDate(today, -1), shiftDate(today, -2)]);
  assert.deepEqual(streakFor(dates, today), { streak: 2, todayCounted: false, shieldUsed: false });
});

test('one missed day is shielded, two in a row break the streak', () => {
  const shielded = new Set([today, shiftDate(today, -1), shiftDate(today, -3), shiftDate(today, -4)]);
  assert.equal(streakFor(shielded, today).streak, 4);
  assert.equal(streakFor(shielded, today).shieldUsed, true);
  const broken = new Set([today, shiftDate(today, -3)]);
  assert.equal(streakFor(broken, today).streak, 1);
});

test('only one shield per 7 days', () => {
  const dates = new Set([today, shiftDate(today, -2), shiftDate(today, -4)]);
  assert.equal(streakFor(dates, today).streak, 2);
});

test('empty history is level 1 with no streak', () => {
  const s = gameState([], [], [], today);
  assert.equal(s.level, 1); assert.equal(s.xp, 0); assert.equal(s.streak, 0); assert.equal(s.title, 'Rookie');
});

test('game state adds up real logs', () => {
  const s = gameState([meal(today), meal(today, 1)], [run(today), run(shiftDate(today, -1), 'rest')], [], today);
  assert.equal(s.xp, 2 * XP.meal + XP.workout + XP.dailyBonus + XP.restDay);
  assert.equal(s.streak, 2); assert.equal(s.todayCounted, true);
});

test('quests reflect today and the planned session', () => {
  const q = dailyQuests({ date: today, meals: 1, workouts: 0, rest: false, measurements: 0 }, 'running');
  assert.deepEqual(q.map(x => [x.id, x.done]), [['meal1', true], ['train', false], ['meal3', false], ['combo', false]]);
  assert.equal(dailyQuests(undefined, 'rest')[1].id, 'rest');
});
