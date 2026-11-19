import assert from 'node:assert/strict';
import { test } from 'node:test';
import { avatarComparison, compareMeasurements, formatDelta, neutralShape, sortMeasurements } from '../src/domain/progress';
import { buildMeasurement, MeasurementDraft } from '../src/domain/measurementForm';
import { displayDate, localDate, optionalNumber, parseAppData, parseDate, validProfile } from '../src/domain/validation';
import { emptyData, metricKeys } from '../src/domain/types';
import { measurement, profile } from './fixtures';

const now = new Date(2026, 9, 6, 12);
function draft(values: Partial<MeasurementDraft['values']> = {}, date = '06/10/2026'): MeasurementDraft {
  return { date, values: { weight: '', waist: '', hips: '', chest: '', arm: '', thigh: '', ...values }, sides: { arm: 'right', thigh: 'left' } };
}
test('blank values remain null; Hebrew decimal commas and zero validation', () => {
  assert.equal(optionalNumber('  ', 20, 500), null);
  assert.equal(optionalNumber('65,25', 20, 500), 65.25);
  for (const bad of ['0', '-5', 'NaN', 'Infinity', '1e2', '65..2', '65.123']) assert.throws(() => optionalNumber(bad, 20, 500));
});
test('calendar dates round trip without UTC conversion and reject impossible dates', () => {
  assert.equal(localDate(now), '2026-10-06');
  assert.equal(parseDate('06/10/2026'), '2026-10-06');
  assert.equal(displayDate('2026-10-06'), '06/10/2026');
  assert.equal(parseDate('31/02/2026'), null); assert.equal(parseDate('29/02/2024'), '2024-02-29');
  assert.equal(parseDate('29/02/2026'), null); assert.equal(parseDate('2026-10-06'), null);
});
test('measurement form saves partial values, date, units and limb side', () => {
  const value = buildMeasurement(draft({ arm: '31,5' }), undefined, now);
  assert.equal(value.values.arm, 31.5); assert.equal(value.values.weight, null); assert.equal(value.values.waist, null);
  assert.deepEqual(value.units, { weight: 'kg', circumference: 'cm' }); assert.equal(value.sides.thigh, 'left');
  assert.equal(value.date, '2026-10-06');
});
test('empty, zero and future measurement forms cannot be saved', () => {
  assert.throws(() => buildMeasurement(draft(), undefined, now), /at least one measurement/);
  assert.throws(() => buildMeasurement(draft({ weight: '0' }), undefined, now), /weight/i);
  assert.throws(() => buildMeasurement(draft({ weight: '70' }, '07/10/2026'), undefined, now), /future/);
});
test('explicit edit preserves ID/creation date and can clear a previously recorded field', () => {
  const previous = measurement('one', '2026-10-01', { weight: 70, waist: 80 });
  const edited = buildMeasurement(draft({ weight: '69' }, '01/10/2026'), previous, now);
  assert.equal(edited.id, previous.id); assert.equal(edited.createdAt, previous.createdAt);
  assert.notEqual(edited.updatedAt, previous.updatedAt); assert.equal(edited.values.waist, null);
});
test('fat loss and recomposition are valid with strength only and independent experience', () => {
  assert.equal(validProfile(profile), true);
  assert.equal(validProfile({ ...profile, primaryGoal: 'recomposition', secondaryGoals: ['fatLoss'] }), true);
  assert.equal(validProfile({ ...profile, days: [] }), false);
  assert.equal(validProfile({ ...profile, secondaryGoals: ['fatLoss'] }), false);
  assert.equal(validProfile({ ...profile, age: 17 }), false);
});
test('comparison computes signed decimal changes, zero changes and missing values separately', () => {
  const a = measurement('a', '2026-10-01', { weight: 70.3, waist: 80, chest: 90 });
  const b = measurement('b', '2026-10-06', { weight: 70.1, waist: 80, hips: 100 });
  const rows = compareMeasurements(a, b);
  assert.equal(rows[0].delta, -0.2); assert.equal(rows[1].delta, 0); assert.equal(rows[2].delta, null);
  assert.equal(rows[3].delta, null); assert.equal(formatDelta(0), 'No change'); assert.equal(formatDelta(null), 'No data to compare');
});
test('opposite limb sides cannot be compared or used to morph', () => {
  const a = measurement('a', '2026-10-01', { arm: 30, thigh: 55 });
  const b = { ...measurement('b', '2026-10-06', { arm: 32, thigh: 50 }), sides: { arm: 'left' as const, thigh: 'left' as const } };
  assert.equal(compareMeasurements(a, b)[4].reason, 'side');
  assert.deepEqual(avatarComparison(a, b).shape, neutralShape); assert.equal(avatarComparison(a, b).comparable, false);
});
test('avatar never invents body change from weight, missing values or elapsed time', () => {
  const a = measurement('a', '2026-10-01', { weight: 70, waist: 80 });
  const b = measurement('b', '2026-10-06', { weight: 60, hips: 90 });
  assert.deepEqual(avatarComparison(a, b).shape, neutralShape);
  assert.deepEqual(avatarComparison(a, a).shape, neutralShape);
  assert.deepEqual(avatarComparison().shape, neutralShape);
});
test('avatar reflects both increases and decreases only in measured regions, with bounds', () => {
  const a = measurement('a', '2026-10-01', { waist: 80, chest: 90, arm: 30 });
  const b = measurement('b', '2026-10-06', { waist: 72, chest: 150, arm: 33 });
  const result = avatarComparison(a, b);
  assert.equal(result.shape.waist, 0.9); assert.equal(result.shape.chest, 1.12);
  assert.equal(result.shape.armRight, 1.1); assert.equal(result.shape.armLeft, 1);
  assert.equal(result.shape.hips, 1); assert.equal(result.shape.thighRight, 1);
});
test('history orders calendar dates then creation order without mutating original', () => {
  const a = measurement('a', '2026-10-06', { weight: 70 });
  const b = measurement('b', '2026-10-01', { weight: 71 });
  const c = { ...measurement('c', '2026-10-06', { weight: 69 }), createdAt: '2026-10-06T11:00:00.000Z' };
  const original = [c, a, b]; assert.deepEqual(sortMeasurements(original).map(m => m.id), ['b', 'a', 'c']); assert.equal(original[0].id, 'c');
});
test('snapshot rejects corrupt, duplicate, zero-valued, wrong-unit and unknown-version records', () => {
  const data = { ...emptyData(), profile, settings:{ ...emptyData().settings,profileId:profile.profileId }, measurements: [measurement('a', '2026-10-06', { weight: 70 })] };
  assert.deepEqual(parseAppData(JSON.stringify(data)), data);
  assert.throws(() => parseAppData('{'));
  assert.throws(() => parseAppData(JSON.stringify({ ...data, version: 99 })));
  assert.throws(() => parseAppData(JSON.stringify({ ...data, measurements: [...data.measurements, ...data.measurements] })));
  for (const key of metricKeys) assert.throws(() => parseAppData(JSON.stringify({ ...data, measurements: [{ ...data.measurements[0], values: { ...data.measurements[0].values, [key]: 0 } }] })));
  assert.throws(() => parseAppData(JSON.stringify({ ...data, measurements: [{ ...data.measurements[0], units: { weight: 'lb', circumference: 'cm' } }] })));
});
