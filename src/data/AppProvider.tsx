import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AppData } from '../domain/types';
import { localDate } from '../domain/validation';
import { createRepository } from './repository';

const repository = createRepository(AsyncStorage);
type Repository = typeof repository;
interface ContextValue {
  data: AppData | null; loading: boolean; loadError: boolean; retry: () => void;
  saveProfile: Repository['saveProfile']; saveMeasurement: Repository['saveMeasurement'];
  deleteMeasurement: Repository['deleteMeasurement']; saveSettings: Repository['saveSettings']; clear: Repository['clear'];
  saveDraft: Repository['saveDraft']; rebuildPlan: Repository['rebuildPlan']; ensureDay: Repository['ensureDay'];
  saveMeal: Repository['saveMeal']; deleteMeal: Repository['deleteMeal'];
  saveWorkout: Repository['saveWorkout']; deleteWorkout: Repository['deleteWorkout'];
  today: string;
  dayError: boolean; retryDay: () => void;
}
const AppContext = createContext<ContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [today, setToday] = useState(localDate());
  const [dayError, setDayError] = useState(false);
  const hydrate = useCallback(() => {
    return repository.load().then(setData).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, []);
  const retry = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    void hydrate();
  }, [hydrate]);
  useEffect(() => { void hydrate(); }, [hydrate]);
  useEffect(() => { const timer = setInterval(() => setToday(localDate()), 15000); return () => clearInterval(timer); }, []);
  const planId = data?.plans.at(-1)?.id, profileId = data?.profile?.profileId;
  const retryDay = useCallback(() => { setDayError(false); void repository.ensureDay(today).then(setData).catch(() => setDayError(true)); }, [today]);
  useEffect(() => {
    if (profileId) void repository.ensureDay(today).then(next => { setData(next); setDayError(false); }).catch(() => setDayError(true));
  }, [profileId, planId, today]);
  const commit = async (job: Promise<AppData>) => { const next = await job; setData(next); return next; };
  return <AppContext.Provider value={{ data, loading, loadError, retry, today, dayError, retryDay,
    saveProfile: (...args) => commit(repository.saveProfile(...args)),
    saveMeasurement: (...args) => commit(repository.saveMeasurement(...args)),
    deleteMeasurement: (...args) => commit(repository.deleteMeasurement(...args)),
    saveSettings: (...args) => commit(repository.saveSettings(...args)), clear: () => commit(repository.clear()),
    saveDraft: (...args) => commit(repository.saveDraft(...args)), rebuildPlan: () => commit(repository.rebuildPlan()),
    ensureDay: (...args) => commit(repository.ensureDay(...args)),
    saveMeal: (...args) => commit(repository.saveMeal(...args)), deleteMeal: (...args) => commit(repository.deleteMeal(...args)),
    saveWorkout: (...args) => commit(repository.saveWorkout(...args)), deleteWorkout: (...args) => commit(repository.deleteWorkout(...args)),
  }}>{children}</AppContext.Provider>;
}
export function useAppData() {
  const value = useContext(AppContext);
  if (!value) throw new Error('AppProvider is missing');
  return value;
}
