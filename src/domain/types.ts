export const metricKeys = ['weight', 'waist', 'hips', 'chest', 'arm', 'thigh'] as const;
export type MetricKey = (typeof metricKeys)[number];
export type Side = 'right' | 'left';
export type Goal = 'fatLoss' | 'recomposition' | 'muscle' | 'strength' | 'running';
export type Training = 'strength' | 'running' | 'combined';
export type Experience = 'new' | 'beginner' | 'experienced';
export type Hair = 'short' | 'bob' | 'curly';
export interface AvatarStyle { skin: string; hair: Hair; shirt: string; silhouette: 'feminine' | 'masculine' }
export type Sex = 'male' | 'female';
export interface RunningGoal {
  targetDistanceKm: number | null; targetPaceSeconds: number | null; targetDate: string | null;
  currentDistanceKm: number | null; currentDurationMinutes: number | null;
  surface: 'outdoor' | 'treadmill'; incline: number | null;
}
export interface Profile {
  profileId: string;
  sex: Sex | null;
  name: string;
  age: number | null;
  height: number | null;
  primaryGoal: Goal;
  secondaryGoals: Goal[];
  training: Training;
  strengthExperience: Experience;
  runningExperience: Experience;
  days: number[];
  duration: number;
  equipment: string[];
  limitations: string;
  performance: string;
  targetWeight: number | null;
  targetDate: string | null;
  avatar: AvatarStyle;
  running: RunningGoal;
  activity: 'low' | 'moderate' | 'active' | null;
  healthContext: 'general' | 'special' | null;
  nutritionPreferences: string;
  allergies: string;
  trainingFocus: 'balanced' | 'lower' | 'upper';
  calorieOverride: number | null;
}
export interface Measurement {
  profileId: string | null;
  timezone: string;
  waistMethod: 'unknown' | 'nhanes-iliac';
  bodyEstimate?: { method: 'RFM-2018'; date: string; percent: number; inputs: { sex: Sex; age: number; heightCm: number; waistCm: number; waistMethod: 'nhanes-iliac' } } | null;
  id: string;
  date: string; // Local calendar date: YYYY-MM-DD, never a UTC timestamp.
  values: Record<MetricKey, number | null>;
  units: { weight: 'kg'; circumference: 'cm' };
  sides: { arm: Side; thigh: Side };
  createdAt: string;
  updatedAt: string;
}
export interface Settings { showBodyChanges: boolean; reduceMotion: boolean; profileId?: string | null; textScale?: 1 | 1.25 | 1.5 }
export interface NutritionTarget {
  calories: number; protein: number; fat: number; carbs: number;
  method: 'mifflin-pal-v1' | 'personal-target-v1';
  inputs: { sex: Sex; age: number; height: number; weight: number; weightDate: string; activity: 'low' | 'moderate' | 'active'; goal: Goal };
}
export interface PlannedSession { day: number; kind: 'strength' | 'running' | 'rest'; duration: number; title: string; example: boolean }
export interface PersonalPlan {
  id: string; profileId: string; createdAt: string; effectiveDate: string; rulesVersion: 'fitli-plan-v1';
  training: Training; goal: Goal; weekly: PlannedSession[];
  profileSnapshot: Profile;
  nutrition: NutritionTarget | null; nutritionMissing: string[];
  meals: { id: string; title: string; description: string; example: true }[];
}
export interface DailyTarget { date: string; timezone: string; profileId: string; planId: string | null; nutrition: NutritionTarget | null }
export interface MealEntry {
  id: string; profileId: string; date: string; timezone: string; name: string;
  calories: number | null; protein: number | null; fat: number | null; carbs: number | null;
  source: 'manual-label'; createdAt: string; updatedAt: string;
}
export interface WorkoutEntry {
  id: string; profileId: string; date: string; timezone: string; planId: string | null;
  kind: 'strength' | 'running' | 'rest'; duration: number | null; distanceKm: number | null;
  effort: 'easy' | 'moderate' | 'hard' | null; notes: string; createdAt: string; updatedAt: string;
}
export interface ProfileDraft { profileId: string | null; step: number; fields: Record<string, string>; profile: Profile }
export interface AppData {
  version: 2;
  schemaVersion: 2;
  profile: Profile | null;
  measurements: Measurement[];
  settings: Settings;
  plans: PersonalPlan[];
  dailyTargets: DailyTarget[];
  meals: MealEntry[];
  workouts: WorkoutEntry[];
  draft: ProfileDraft | null;
}
export const goals: Record<Goal, string> = {
  fatLoss: 'Fat loss', recomposition: 'Body recomposition', muscle: 'Build muscle',
  strength: 'Get stronger', running: 'Running goal',
};
export const trainings: Record<Training, string> = {
  strength: 'Strength training', running: 'Running', combined: 'Both',
};
export const experiences: Record<Experience, string> = {
  new: 'No experience', beginner: 'Beginner', experienced: 'Experienced',
};
export const metrics: Record<MetricKey, { label: string; unit: string; min: number; max: number }> = {
  weight: { label: 'Weight', unit: 'kg', min: 20, max: 500 },
  waist: { label: 'Waist', unit: 'cm', min: 5, max: 300 },
  hips: { label: 'Hips', unit: 'cm', min: 5, max: 300 },
  chest: { label: 'Chest', unit: 'cm', min: 5, max: 300 },
  arm: { label: 'Arm', unit: 'cm', min: 5, max: 300 },
  thigh: { label: 'Thigh', unit: 'cm', min: 5, max: 300 },
};
export const skins = ['#F4C5A5', '#DAA077', '#AF7354', '#77503E'];
export const shirts = ['#397A68', '#91638F', '#B85F49', '#466B94'];
export const defaultAvatar: AvatarStyle = { skin: skins[0], hair: 'bob', shirt: shirts[1], silhouette: 'feminine' };
export function emptyRunning(): RunningGoal {
  return { targetDistanceKm: null, targetPaceSeconds: null, targetDate: null, currentDistanceKm: null, currentDurationMinutes: null, surface: 'outdoor', incline: null };
}
export function newProfile(): Profile {
  return { profileId: makeId('profile'), name: '', sex: null, age: null, height: null,
    primaryGoal: 'recomposition', secondaryGoals: [], training: 'strength', strengthExperience: 'new', runningExperience: 'new',
    days: [0, 2, 4], duration: 30, equipment: ['Bodyweight'], limitations: '', performance: '', targetWeight: null, targetDate: null,
    avatar: { ...defaultAvatar }, running: emptyRunning(), activity: null, healthContext: null, nutritionPreferences: '', allergies: '', trainingFocus: 'balanced', calorieOverride: null };
}
export function makeId(prefix: string): string { return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`; }
export function localTimezone(): string { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'local'; }
export function emptyValues(): Measurement['values'] {
  return { weight: null, waist: null, hips: null, chest: null, arm: null, thigh: null };
}
export function emptyData(): AppData {
  return { version: 2, schemaVersion: 2, profile: null, measurements: [], settings: { showBodyChanges: true, reduceMotion: false, profileId:null }, plans: [], dailyTargets: [], meals: [], workouts: [], draft: null };
}
