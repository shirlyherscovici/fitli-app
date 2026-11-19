import { Measurement, Profile, Sex } from './types';
export interface RfmEstimate { method: 'RFM-2018'; date: string; percent: number; inputs: { sex: Sex; age: number; heightCm: number; waistCm: number; waistMethod: 'nhanes-iliac' } }
export function estimateRfm(profile: Profile, measurement?: Measurement): { estimate: RfmEstimate | null; reason: string } {
  if (profile.healthContext !== 'general' || !profile.sex || profile.age === null || profile.age < 20 || profile.height === null ||
    !measurement || measurement.values.waist === null || measurement.waistMethod !== 'nhanes-iliac') {
    return { estimate: null, reason: 'Not enough data for an estimate. Requires age 20+, male/female for the formula, height, and a waist measured with the NHANES method, and fit with the healthy-adult model.' };
  }
  const percent = 64 - 20 * (profile.height / measurement.values.waist) + (profile.sex === 'female' ? 12 : 0);
  if (!Number.isFinite(percent) || percent <= 0 || percent >= 100) return { estimate: null, reason: 'These inputs give an invalid result. Check height and waist method; we won’t show an artificially corrected percentage.' };
  return { estimate: { method: 'RFM-2018', date: measurement.date, percent,
    inputs: { sex: profile.sex, age: profile.age, heightCm: profile.height, waistCm: measurement.values.waist, waistMethod: 'nhanes-iliac' } }, reason: '' };
}
