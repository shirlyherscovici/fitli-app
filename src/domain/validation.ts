import { AppData, AvatarStyle, emptyData, emptyRunning, experiences, goals, Hair, makeId, Measurement, metricKeys, metrics, Profile, skins, shirts, trainings } from './types';

export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function displayDate(date: string): string {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}
export function parseDate(input: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(input.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day), 12);
  if (date.getFullYear() !== Number(year) || date.getMonth() + 1 !== Number(month) || date.getDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}
export function optionalNumber(input: string, min: number, max: number, integer = false): number | null {
  const normalized = input.trim().replace(',', '.');
  if (!normalized) return null;
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) throw new Error('Enter a valid number with up to two decimal places.');
  const value = Number(normalized);
  if (value < min || value > max || (integer && !Number.isInteger(value))) {
    throw new Error(`Enter ${integer ? 'a whole number ' : 'a value '}between ${min} and ${max}.`);
  }
  return value;
}
export function object(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
export function finiteOrNull(value: unknown, min: number, max: number): boolean {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max);
}
export function validAvatar(value: unknown): value is AvatarStyle {
  return object(value) && skins.includes(value.skin as string) && shirts.includes(value.shirt as string) &&
    (['short', 'bob', 'curly'] as Hair[]).includes(value.hair as Hair) && ['feminine', 'masculine'].includes(value.silhouette as string);
}
export function validProfile(value: unknown, draft = false): value is Profile {
  if (!object(value)) return false;
  return typeof value.profileId === 'string' && value.profileId.length > 0 &&
    (value.sex === null || ['male', 'female'].includes(value.sex as string)) &&
    typeof value.name === 'string' && (draft || value.name.trim().length > 0) && value.name.length <= 40 &&
    finiteOrNull(value.age, 18, 120) && (value.age === null || Number.isInteger(value.age)) &&
    finiteOrNull(value.height, 100, 250) &&
    typeof value.primaryGoal === 'string' && Object.hasOwn(goals, value.primaryGoal) &&
    Array.isArray(value.secondaryGoals) && value.secondaryGoals.every(g => typeof g === 'string' && Object.hasOwn(goals, g) && g !== value.primaryGoal) &&
    new Set(value.secondaryGoals).size === value.secondaryGoals.length &&
    typeof value.training === 'string' && Object.hasOwn(trainings, value.training) &&
    typeof value.strengthExperience === 'string' && Object.hasOwn(experiences, value.strengthExperience) &&
    typeof value.runningExperience === 'string' && Object.hasOwn(experiences, value.runningExperience) &&
    Array.isArray(value.days) && (draft || value.days.length > 0) && value.days.every(d => Number.isInteger(d) && d >= 0 && d <= 6) &&
    new Set(value.days).size === value.days.length &&
    typeof value.duration === 'number' && [20, 30, 45, 60].includes(value.duration) &&
    Array.isArray(value.equipment) && value.equipment.every(e => typeof e === 'string' && e.length <= 100) &&
    typeof value.limitations === 'string' && value.limitations.length <= 500 &&
    typeof value.performance === 'string' && value.performance.length <= 500 &&
    finiteOrNull(value.targetWeight, 20, 500) &&
    (value.targetDate === null || (typeof value.targetDate === 'string' && parseDate(displayDate(value.targetDate)) === value.targetDate)) &&
    validAvatar(value.avatar) && object(value.running) &&
    finiteOrNull(value.running.targetDistanceKm, 0.1, 100) && finiteOrNull(value.running.targetPaceSeconds, 120, 1800) &&
    (value.running.targetPaceSeconds === null || Number.isInteger(value.running.targetPaceSeconds)) &&
    (value.running.targetDate === null || validDate(value.running.targetDate)) &&
    finiteOrNull(value.running.currentDistanceKm, 0.1, 100) && finiteOrNull(value.running.currentDurationMinutes, 1, 1000) &&
    ['outdoor', 'treadmill'].includes(value.running.surface as string) && finiteOrNull(value.running.incline, 0, 30) &&
    (value.activity === null || ['low', 'moderate', 'active'].includes(value.activity as string)) &&
    (value.healthContext === null || ['general', 'special'].includes(value.healthContext as string)) &&
    typeof value.nutritionPreferences === 'string' && value.nutritionPreferences.length <= 500 &&
    typeof value.allergies === 'string' && value.allergies.length <= 500 &&
    ['balanced', 'lower', 'upper'].includes(value.trainingFocus as string) && finiteOrNull(value.calorieOverride, 1200, 6000);
}
export function validDate(value: unknown): value is string { return typeof value === 'string' && parseDate(displayDate(value)) === value; }
export function validMeasurement(value: unknown): value is Measurement {
  if (!object(value) || !object(value.values) || !object(value.units) || !object(value.sides)) return false;
  const values = value.values;
  return (value.profileId === null || typeof value.profileId === 'string') && typeof value.timezone === 'string' &&
    ['unknown', 'nhanes-iliac'].includes(value.waistMethod as string) && typeof value.id === 'string' && value.id.length > 0 &&
    typeof value.date === 'string' && parseDate(displayDate(value.date)) === value.date &&
    typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) &&
    typeof value.updatedAt === 'string' && Number.isFinite(Date.parse(value.updatedAt)) &&
    metricKeys.every(k => finiteOrNull(values[k], metrics[k].min, metrics[k].max)) &&
    metricKeys.some(k => values[k] !== null) &&
    value.units.weight === 'kg' && value.units.circumference === 'cm' && validBodyEstimate(value) &&
    ['left', 'right'].includes(value.sides.arm as string) && ['left', 'right'].includes(value.sides.thigh as string);
}
function validBodyEstimate(measurement: Record<string, unknown>): boolean {
  const estimate = measurement.bodyEstimate;
  if (estimate === undefined || estimate === null) return true;
  if (!object(estimate) || !object(estimate.inputs) || !object(measurement.values)) return false;
  const inputs = estimate.inputs;
  if (estimate.method !== 'RFM-2018' || estimate.date !== measurement.date ||
    !['male', 'female'].includes(inputs.sex as string) || !Number.isInteger(inputs.age) ||
    !finiteOrNull(inputs.age, 20, 120) || inputs.age === null ||
    !finiteOrNull(inputs.heightCm, 100, 250) || inputs.heightCm === null ||
    inputs.waistCm !== measurement.values.waist || typeof inputs.waistCm !== 'number' ||
    inputs.waistMethod !== 'nhanes-iliac' || measurement.waistMethod !== 'nhanes-iliac' ||
    typeof estimate.percent !== 'number' || !Number.isFinite(estimate.percent) || estimate.percent <= 0 || estimate.percent >= 100) return false;
  const expected = 64 - 20 * ((inputs.heightCm as number) / inputs.waistCm) + (inputs.sex === 'female' ? 12 : 0);
  return Math.abs(estimate.percent - expected) < 1e-8;
}
export function parseAppData(raw: string): AppData {
  let value: unknown = JSON.parse(raw);
  // Upgrade the complete snapshot. Never fill missing physiological inputs from the avatar.
  if (object(value) && value.version === 1) {
    const legacy = value;
    if ((legacy.profile !== null && !object(legacy.profile)) || !Array.isArray(legacy.measurements)) throw new Error('The previous version’s save is invalid.');
    const profileId = makeId('profile');
    const old = legacy.profile as Record<string, unknown> | null;
    const profile = old === null ? null : { ...old, profileId, sex: null,
      avatar: object(old.avatar) ? { ...old.avatar, silhouette: 'feminine' } : old.avatar,
      running: emptyRunning(), activity: null, healthContext: null, nutritionPreferences: '', allergies: '', trainingFocus: 'balanced', calorieOverride: null };
    value = { ...emptyData(), profile, settings:object(legacy.settings) ? { ...legacy.settings,profileId:profile ? profileId : null } : legacy.settings,
      measurements: legacy.measurements.map(m => object(m) ? { ...m, profileId: profile ? profileId : null, timezone: 'unknown', waistMethod: 'unknown' } : m) };
  }
  if (!object(value) || value.version !== 2 || value.schemaVersion !== 2 || (value.profile !== null && !validProfile(value.profile)) ||
    !Array.isArray(value.measurements) || !value.measurements.every(validMeasurement) ||
    new Set(value.measurements.map(m => m.id)).size !== value.measurements.length ||
    !object(value.settings) || typeof value.settings.showBodyChanges !== 'boolean' || typeof value.settings.reduceMotion !== 'boolean' || (value.settings.textScale !== undefined && ![1,1.25,1.5].includes(value.settings.textScale as number))) {
    throw new Error('Saved data is in an unsupported format.');
  }
  const owner = value.profile === null ? null : (value.profile as Profile).profileId;
  // The local-only settings from early snapshots did not carry an owner.
  // This is safe in the one-profile model and does not alter any preferences.
  if (value.settings.profileId === undefined) value.settings.profileId = owner;
  const plans = Array.isArray(value.plans) ? value.plans : [];
  if (value.settings.profileId !== owner || value.measurements.some(m => m.profileId !== owner) ||
    !Array.isArray(value.plans) || !value.plans.every(p => validPlan(p, owner)) || !uniqueIds(value.plans) ||
    !Array.isArray(value.dailyTargets) || !value.dailyTargets.every(t => object(t) && t.profileId === owner && validDate(t.date) && typeof t.timezone === 'string' && (t.planId === null || plans.some((p: unknown) => object(p) && p.id === t.planId)) && validTarget(t.nutrition)) ||
    new Set(value.dailyTargets.map(t => t.date)).size !== value.dailyTargets.length ||
    !Array.isArray(value.meals) || !value.meals.every(m => validEntry(m, owner) && typeof m.name === 'string' && m.name.trim().length > 0 && m.name.length <= 100 && m.source === 'manual-label' && ['calories', 'protein', 'fat', 'carbs'].every(k => finiteOrNull(m[k], 0, k === 'calories' ? 20000 : 3000)) && ['calories', 'protein', 'fat', 'carbs'].some(k => m[k] !== null)) || !uniqueIds(value.meals) ||
    !Array.isArray(value.workouts) || !value.workouts.every(w => validEntry(w, owner) && ['strength', 'running', 'rest'].includes(w.kind as string) && finiteOrNull(w.duration, 1, 1000) && finiteOrNull(w.distanceKm, 0.1, 100) && (w.effort === null || ['easy', 'moderate', 'hard'].includes(w.effort as string)) && typeof w.notes === 'string' && w.notes.length <= 1000 && (w.planId === null || plans.some((p: unknown) => object(p) && p.id === w.planId))) || !uniqueIds(value.workouts) ||
    (value.draft !== null && (!object(value.draft) || value.draft.profileId !== owner || !Number.isInteger(value.draft.step) || (value.draft.step as number) < 0 || (value.draft.step as number) > 4 || !object(value.draft.fields) || !Object.values(value.draft.fields).every(v => typeof v === 'string') || !validProfile(value.draft.profile, true)))) {
    throw new Error('The plan or log is in an unsupported format. Your existing save won’t be reset.');
  }
  return value as unknown as AppData;
}
function uniqueIds(entries: { id: string }[]) { return new Set(entries.map(e => e.id)).size === entries.length; }
function validEntry(v: unknown, owner: string | null): v is Record<string, unknown> & { id: string } {
  return object(v) && owner !== null && v.profileId === owner && typeof v.id === 'string' && !!v.id && validDate(v.date) && typeof v.timezone === 'string' &&
    typeof v.createdAt === 'string' && Number.isFinite(Date.parse(v.createdAt)) && typeof v.updatedAt === 'string' && Number.isFinite(Date.parse(v.updatedAt));
}
export function validTarget(t: unknown): boolean {
  if (t === null) return true;
  return object(t) && ['calories', 'protein', 'fat', 'carbs'].every(k => typeof t[k] === 'number' && Number.isFinite(t[k]) && (t[k] as number) > 0) &&
    Math.abs((t.protein as number) * 4 + (t.fat as number) * 9 + (t.carbs as number) * 4 - (t.calories as number)) < 0.001 &&
    ['mifflin-pal-v1', 'personal-target-v1'].includes(t.method as string) && object(t.inputs) && ['male', 'female'].includes(t.inputs.sex as string) &&
    finiteOrNull(t.inputs.age, 19, 78) && t.inputs.age !== null && finiteOrNull(t.inputs.height, 100, 250) && t.inputs.height !== null &&
    finiteOrNull(t.inputs.weight, 20, 500) && t.inputs.weight !== null && validDate(t.inputs.weightDate) &&
    ['low', 'moderate', 'active'].includes(t.inputs.activity as string) && typeof t.inputs.goal === 'string' && Object.hasOwn(goals, t.inputs.goal);
}
function validPlan(p: unknown, owner: string | null): p is Record<string, unknown> & { id: string } {
  return object(p) && owner !== null && p.profileId === owner && typeof p.id === 'string' && !!p.id && typeof p.createdAt === 'string' && Number.isFinite(Date.parse(p.createdAt)) && validDate(p.effectiveDate) && p.rulesVersion === 'fitli-plan-v1' && typeof p.training === 'string' && Object.hasOwn(trainings, p.training) && typeof p.goal === 'string' && Object.hasOwn(goals, p.goal) &&
    validProfile(p.profileSnapshot) && p.profileSnapshot.profileId === owner && validTarget(p.nutrition) && Array.isArray(p.nutritionMissing) && p.nutritionMissing.every(v => typeof v === 'string') &&
    Array.isArray(p.weekly) && p.weekly.length === 7 && new Set(p.weekly.map(v => object(v) ? v.day : null)).size === 7 && p.weekly.every(s => object(s) && Number.isInteger(s.day) && (s.day as number) >= 0 && (s.day as number) <= 6 && ['strength', 'running', 'rest'].includes(s.kind as string) && typeof s.duration === 'number' && s.duration >= 0 && typeof s.title === 'string' && typeof s.example === 'boolean') &&
    Array.isArray(p.meals) && p.meals.every(m => object(m) && typeof m.id === 'string' && typeof m.title === 'string' && typeof m.description === 'string' && m.example === true);
}
export function parsePace(input: string): number | null {
  if (!input.trim()) return null;
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(input.trim());
  if (!m) throw new Error('Write pace as min:sec per km, e.g. 6:30.');
  const seconds = Number(m[1]) * 60 + Number(m[2]);
  if (seconds < 120 || seconds > 1800) throw new Error('Target pace must be between 2:00 and 30:00 min/km.');
  return seconds;
}
export function displayPace(seconds: number | null): string { return seconds === null ? 'Not set' : `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`; }
