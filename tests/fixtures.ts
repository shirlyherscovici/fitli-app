import { defaultAvatar, emptyValues, Measurement, newProfile, Profile } from '../src/domain/types';
export const profile: Profile = {
  ...newProfile(), profileId: 'profile-test', sex: 'female', activity: 'low', healthContext: 'general',
  name: 'Alex', age: 35, height: 165, primaryGoal: 'fatLoss', secondaryGoals: ['recomposition', 'muscle'],
  training: 'strength', strengthExperience: 'experienced', runningExperience: 'new', days: [0, 2, 4], duration: 30,
  equipment: ['Dumbbells'], limitations: '', performance: '', targetWeight: null, targetDate: null, avatar: defaultAvatar,
};
export function measurement(id: string, date: string, values: Partial<Measurement['values']> = {}): Measurement {
  return { id, date, profileId:'profile-test',timezone:'Asia/Jerusalem',waistMethod:'unknown', values: { ...emptyValues(), ...values }, units: { weight: 'kg', circumference: 'cm' },
    sides: { arm: 'right', thigh: 'right' }, createdAt: `${date}T10:00:00.000Z`, updatedAt: `${date}T10:00:00.000Z` };
}
