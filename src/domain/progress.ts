import { Measurement, MetricKey, metricKeys, Side } from './types';

export function sortMeasurements(measurements: Measurement[]): Measurement[] {
  return [...measurements].sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
export interface Comparison {
  key: MetricKey;
  before: number | null;
  after: number | null;
  delta: number | null;
  reason: 'missing' | 'side' | 'method' | null;
}
export function compareMeasurements(before: Measurement, after: Measurement): Comparison[] {
  return metricKeys.map(key => {
    const a = before.values[key];
    const b = after.values[key];
    const reason = a === null || b === null ? 'missing' :
      (key === 'arm' || key === 'thigh') && before.sides[key] !== after.sides[key] ? 'side' : key === 'waist' && before.waistMethod !== after.waistMethod ? 'method' : null;
    return { key, before: a, after: b, delta: reason === null ? Math.round((b! - a!) * 100) / 100 : null, reason };
  });
}
export interface BodyShape {
  chest: number; waist: number; hips: number;
  armLeft: number; armRight: number; thighLeft: number; thighRight: number;
}
export const neutralShape: BodyShape = { chest: 1, waist: 1, hips: 1, armLeft: 1, armRight: 1, thighLeft: 1, thighRight: 1 };
export function avatarComparison(before?: Measurement, after?: Measurement): { shape: BodyShape; changedMetrics: MetricKey[]; comparable: boolean } {
  const shape = { ...neutralShape };
  if (!before || !after || before.id === after.id) return { shape, changedMetrics: [], comparable: false };
  const pairs = compareMeasurements(before, after).filter(c => c.key !== 'weight' && c.delta !== null);
  pairs.forEach(pair => {
    const ratio = Math.min(1.12, Math.max(0.88, pair.after! / pair.before!));
    if (pair.key === 'chest' || pair.key === 'waist' || pair.key === 'hips') shape[pair.key] = ratio;
    if (pair.key === 'arm' || pair.key === 'thigh') {
      const side: Side = after.sides[pair.key];
      shape[`${pair.key}${side === 'left' ? 'Left' : 'Right'}`] = ratio;
    }
  });
  return { shape, changedMetrics: pairs.filter(c => c.delta !== 0).map(c => c.key), comparable: pairs.length > 0 };
}
export function formatNumber(value: number | null): string {
  return value === null ? 'Not measured' : new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value);
}
export function formatDelta(delta: number | null): string {
  if (delta === null) return 'No data to compare';
  if (delta === 0) return 'No change';
  return `${delta > 0 ? '+' : '−'}${formatNumber(Math.abs(delta))}`;
}
