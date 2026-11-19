import { emptyValues, localTimezone, Measurement, metricKeys, metrics, Side } from './types';
import { localDate, optionalNumber, parseDate } from './validation';
export interface MeasurementDraft { date: string; values: Record<(typeof metricKeys)[number], string>; sides: { arm: Side; thigh: Side }; waistMethod?: Measurement['waistMethod'] }
export function buildMeasurement(draft: MeasurementDraft, existing?: Measurement, now = new Date()): Measurement {
  const date = parseDate(draft.date);
  if (!date) throw new Error('Enter a valid date as DD/MM/YYYY.');
  if (date > localDate(now)) throw new Error('You can log a measurement for today or earlier, not a future date.');
  const values = emptyValues();
  for (const key of metricKeys) {
    try { values[key] = optionalNumber(draft.values[key], metrics[key].min, metrics[key].max); }
    catch (err) { throw new Error(`${metrics[key].label}: ${(err as Error).message}`); }
  }
  if (metricKeys.every(k => values[k] === null)) throw new Error('Fill in at least one measurement. Other fields can stay empty.');
  const timestamp = now.toISOString();
  return {
    profileId: existing?.profileId ?? null, timezone: existing?.timezone ?? localTimezone(), waistMethod: draft.waistMethod ?? existing?.waistMethod ?? 'unknown',
    id: existing?.id ?? `measurement-${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`,
    date, values, sides: draft.sides, units: { weight: 'kg', circumference: 'cm' },
    createdAt: existing?.createdAt ?? timestamp, updatedAt: timestamp,
  };
}
