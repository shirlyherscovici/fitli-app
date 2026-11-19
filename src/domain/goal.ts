import { BodyShape, neutralShape, sortMeasurements } from './progress';
import { Measurement, Profile } from './types';

export interface GoalProjection {
  start: Measurement | null;
  shape: BodyShape;
  comparable: boolean;
  reason: string;
  startWeight: number | null;
  targetWeight: number | null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Estimates the goal silhouette from the starting measurement and the target weight in the profile.
// Circumference is approximated to scale with the square root of the weight ratio (cross-section
// area roughly tracks weight at constant height and body density). Limbs are dampened relative to
// the trunk, since typical weight change affects the waist/hips/chest more than arms/thighs.
// This is a stylized illustration input, not a measured or medically validated projection.
export function projectGoalShape(profile: Profile, measurements: Measurement[]): GoalProjection {
  const start = sortMeasurements(measurements.filter(m => m.values.weight !== null))[0] ?? null;
  if (!start) {
    return { start: null, shape: neutralShape, comparable: false, startWeight: null, targetWeight: profile.targetWeight,
      reason: 'To see where the journey leads, log at least one weight.' };
  }
  const startWeight = start.values.weight!;
  if (profile.targetWeight === null) {
    return { start, shape: neutralShape, comparable: false, startWeight, targetWeight: null,
      reason: 'To see where the journey leads, set a goal weight in your profile.' };
  }
  if (Math.abs(startWeight - profile.targetWeight) < 0.1) {
    return { start, shape: neutralShape, comparable: false, startWeight, targetWeight: profile.targetWeight,
      reason: 'Your starting weight already matches your goal.' };
  }
  const ratio = clamp(Math.sqrt(profile.targetWeight / startWeight), 0.8, 1.25);
  const limbRatio = clamp(1 + (ratio - 1) * 0.6, 0.85, 1.18);
  const shape: BodyShape = { chest: ratio, waist: ratio, hips: ratio, armLeft: limbRatio, armRight: limbRatio, thighLeft: limbRatio, thighRight: limbRatio };
  return { start, shape, comparable: true, startWeight, targetWeight: profile.targetWeight, reason: '' };
}
