import { AppData, emptyData, localTimezone, MealEntry, Measurement, Profile, ProfileDraft, Settings, WorkoutEntry } from '../domain/types';
import { localDate, parseAppData, validMeasurement, validProfile } from '../domain/validation';
import { buildPlan, latestPlan } from '../domain/planning';
import { estimateRfm } from '../domain/bodyComposition';

export const STORAGE_KEY = 'fitli.local.v1';
export const LEGACY_BACKUP_KEY = 'fitli.backup.before-v2';
export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}
// A single atomic snapshot. Commit to memory only AFTER disk write succeeds.
// Serialize mutations so rapid saves cannot overwrite one another.
export function createRepository(storage: StorageAdapter) {
  let current: AppData | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  function load(): Promise<AppData> {
    const job = queue.then(async () => {
    current = null;
    const raw = await storage.getItem(STORAGE_KEY);
    const loaded = raw === null ? emptyData() : parseAppData(raw);
    if (raw !== null && JSON.parse(raw).version === 1) {
      // Back up the untouched old snapshot before committing the migration.
      if (await storage.getItem(LEGACY_BACKUP_KEY) === null) await storage.setItem(LEGACY_BACKUP_KEY, raw);
      await storage.setItem(STORAGE_KEY, JSON.stringify(loaded));
    }
    current = loaded;
    return current;
    });
    queue = job.catch(() => undefined);
    return job;
  }
  function update(transform: (data: AppData) => AppData): Promise<AppData> {
    const job = queue.then(async () => {
      if (!current) throw new Error('Data must load before saving.');
      const transformed = transform(current);
      if (transformed === current) return current;
      const next = parseAppData(JSON.stringify(transformed));
      await storage.setItem(STORAGE_KEY, JSON.stringify(next));
      current = next;
      return next;
    });
    queue = job.catch(() => undefined);
    return job;
  }
  return {
    load,
    saveProfile(profile: Profile, baseline?: Measurement, createPlan = false) {
      if (!validProfile(profile)) return Promise.reject(new Error('The profile is invalid.'));
      if (baseline && !validMeasurement(baseline)) return Promise.reject(new Error('The baseline measurement is invalid.'));
      return update(data => {
        const saved = { ...profile, profileId: data.profile?.profileId ?? profile.profileId };
        const measurements = baseline ? [...data.measurements, { ...baseline, profileId: saved.profileId }] : data.measurements;
        return { ...data, profile: saved, measurements, draft: createPlan ? null : data.draft, settings:{ ...data.settings,profileId:saved.profileId },
          plans: createPlan ? [...data.plans, buildPlan(saved, measurements)] : data.plans };
      });
    },
    saveMeasurement(measurement: Measurement, editing: boolean) {
      if (!validMeasurement(measurement)) return Promise.reject(new Error('The measurement is invalid.'));
      return update(data => {
        const existing = data.measurements.find(m => m.id === measurement.id);
        const owned = { ...measurement, profileId: data.profile?.profileId ?? null, bodyEstimate:data.profile ? estimateRfm(data.profile,measurement).estimate : null };
        if (editing && !existing) throw new Error('The measurement to edit no longer exists.');
        if (!editing && existing) throw new Error('This measurement already exists.');
        return { ...data, measurements: editing ? data.measurements.map(m => m.id === measurement.id ? { ...owned, createdAt: m.createdAt } : m) : [...data.measurements, owned] };
      });
    },
    deleteMeasurement(id: string) { return update(data => ({ ...data, measurements: data.measurements.filter(m => m.id !== id) })); },
    saveSettings(settings: Settings) { return update(data => ({ ...data, settings:{ ...settings,profileId:data.profile?.profileId ?? null } })); },
    saveDraft(draft: ProfileDraft) { return update(data => ({ ...data, draft })); },
    rebuildPlan() { return update(data => {
      if (!data.profile) throw new Error('A profile is needed to build a plan.');
      return { ...data, plans: [...data.plans, buildPlan(data.profile, data.measurements)] };
    }); },
    ensureDay(date = localDate(), timezone = localTimezone()) {
      return update(data => {
        if (!data.profile) return data;
        const plan = latestPlan(data.plans);
        const existing = data.dailyTargets.find(t => t.date === date);
        if (existing && (existing.nutrition !== null || !plan?.nutrition)) return data;
        const target = { date, timezone, profileId: data.profile.profileId, planId: plan?.id ?? null, nutrition: plan?.nutrition ?? null };
        return { ...data, dailyTargets: existing ? data.dailyTargets.map(t => t.date === date ? target : t) : [...data.dailyTargets, target] };
      });
    },
    saveMeal(meal: MealEntry, editing: boolean) { return update(data => {
      if (!data.profile || meal.profileId !== data.profile.profileId) throw new Error('This entry belongs to a different profile.');
      const existing = data.meals.find(m => m.id === meal.id);
      if (editing && !existing) throw new Error('The meal to edit no longer exists.');
      if (!editing && existing) throw new Error('This meal is already logged.');
      return { ...data, meals: editing ? data.meals.map(m => m.id === meal.id ? { ...meal, createdAt: m.createdAt } : m) : [...data.meals, meal] };
    }); },
    deleteMeal(id: string) { return update(data => ({ ...data, meals: data.meals.filter(m => m.id !== id) })); },
    saveWorkout(workout: WorkoutEntry, editing: boolean) { return update(data => {
      if (!data.profile || workout.profileId !== data.profile.profileId) throw new Error('This entry belongs to a different profile.');
      const existing = data.workouts.find(w => w.id === workout.id);
      if (editing && !existing) throw new Error('The workout to edit no longer exists.');
      if (!editing && existing) throw new Error('This workout is already logged.');
      return { ...data, workouts: editing ? data.workouts.map(w => w.id === workout.id ? { ...workout, createdAt: w.createdAt } : w) : [...data.workouts, workout] };
    }); },
    deleteWorkout(id: string) { return update(data => ({ ...data, workouts: data.workouts.filter(w => w.id !== id) })); },
    clear() { return update(() => emptyData()); },
  };
}
