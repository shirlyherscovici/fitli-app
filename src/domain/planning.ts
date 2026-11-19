import { Measurement, NutritionTarget, PersonalPlan, Profile, makeId } from './types';
import { localDate } from './validation';
import { sortMeasurements } from './progress';

export const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const activityLabels = { low: 'Mostly sitting', moderate: 'Moderately active', active: 'Very active' };
export const pal = { low: 1.4, moderate: 1.6, active: 1.8 };
export function nutritionTarget(profile: Profile, measurements: Measurement[], date = localDate()): { target: NutritionTarget | null; missing: string[] } {
  const weight = sortMeasurements(measurements.filter(m => m.date <= date && m.values.weight !== null)).at(-1);
  const missing: string[] = [];
  if (!profile.sex) missing.push('male/female for the formula');
  if (profile.age === null) missing.push('age');
  if (profile.height === null) missing.push('height');
  if (!weight) missing.push('a weight measurement');
  if (!profile.activity) missing.push('daily activity');
  if (profile.healthContext !== 'general') missing.push('healthy-adult fit');
  if (profile.age !== null && (profile.age < 19 || profile.age > 78)) missing.push('The estimate is limited to ages 19–78, the study range of Mifflin');
  if (missing.length) return { target: null, missing };
  const inputs: NutritionTarget['inputs'] = { sex: profile.sex!, age: profile.age!, height: profile.height!, weight: weight!.values.weight!, weightDate: weight!.date, activity: profile.activity!, goal: profile.primaryGoal };
  const resting = 10 * inputs.weight + 6.25 * inputs.height - 5 * inputs.age + (inputs.sex === 'male' ? 5 : -161);
  const calories = profile.calorieOverride ?? resting * pal[inputs.activity];
  if (!Number.isFinite(calories) || calories < 1200 || calories > 6000) return { target: null, missing: ['The estimate is outside the supported range; check the inputs with a professional'] };
  // A documented initial allocation within adult AMDR ranges. Gram targets scale with the personal energy estimate.
  // This is a planning estimate, not a professionally validated meal prescription.
  const proteinShare = profile.training === 'running' ? 0.20 : 0.25;
  const fatShare = profile.training === 'strength' ? 0.30 : 0.25;
  const target: NutritionTarget = { calories, protein: calories * proteinShare / 4, fat: calories * fatShare / 9,
    carbs: calories * (1 - proteinShare - fatShare) / 4,
    method: profile.calorieOverride === null ? 'mifflin-pal-v1' : 'personal-target-v1', inputs };
  return { target, missing: [] };
}
export function buildPlan(profile: Profile, measurements: Measurement[], now = new Date()): PersonalPlan {
  if (profile.training === 'combined' && profile.days.length < 2) throw new Error('The combined track needs at least two available days.');
  const { target, missing } = nutritionTarget(profile, measurements, localDate(now));
  let activeIndex = 0;
  const weekly: PersonalPlan['weekly'] = weekDays.map((_, day) => {
    if (!profile.days.includes(day)) return { day, kind: 'rest', duration: 0, title: 'Rest & recover', example: false };
    const kind = profile.training === 'combined' ? (activeIndex++ % 2 === 0 ? 'strength' : 'running') : profile.training;
    return { day, kind, duration: profile.duration, title: kind === 'strength' ? 'Full-body strength' : profile.runningExperience === 'new' ? 'Intro walk-run' : 'Easy run', example: true };
  });
  return { id: makeId('plan'), profileId: profile.profileId, createdAt: now.toISOString(), effectiveDate: localDate(now),
    rulesVersion: 'fitli-plan-v1', training: profile.training, goal: profile.primaryGoal, profileSnapshot:JSON.parse(JSON.stringify(profile)) as Profile, weekly, nutrition: target, nutritionMissing: missing,
    meals: [
      { id: 'breakfast', title: 'Breakfast', description: 'Yogurt bowl with fruit and oats', example: true },
      { id: 'lunch', title: 'Lunch', description: 'Plate with protein, grains and vegetables', example: true },
      { id: 'dinner', title: 'Dinner', description: 'Sandwich, spread and fresh vegetables', example: true },
    ] };
}
export function latestPlan(plans: PersonalPlan[]): PersonalPlan | undefined { return plans.at(-1); }
export function currentDayIndex(date = localDate()): number { const [y, m, d] = date.split('-').map(Number); return new Date(y, m - 1, d, 12).getDay(); }
