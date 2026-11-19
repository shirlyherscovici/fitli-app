import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { createRepository, STORAGE_KEY, StorageAdapter } from '../src/data/repository';
import { emptyData } from '../src/domain/types';
import { measurement, profile } from './fixtures';
function memoryStorage() {
  const entries = new Map<string, string>();
  let failWrite = false;
  const adapter: StorageAdapter = {
    getItem: async key => entries.get(key) ?? null,
    setItem: async (key, value) => { if (failWrite) throw new Error('disk full'); entries.set(key, value); },
  };
  return { adapter, entries, setFail: (value: boolean) => { failWrite = value; } };
}
test('profile and partial measurements survive a new repository reading an actual disk file', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'fitli-test-'));
  const path = join(directory, 'snapshot.json');
  const adapter: StorageAdapter = {
    getItem: async () => { try { return await readFile(path, 'utf8'); } catch (err) { if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null; throw err; } },
    setItem: async (_, value) => { await writeFile(path, value, 'utf8'); },
  };
  try {
    const firstSession = createRepository(adapter); await firstSession.load();
    await firstSession.saveProfile(profile);
    await firstSession.saveMeasurement(measurement('a', '2026-10-01', { waist: 80 }), false);
    await firstSession.saveSettings({ showBodyChanges: false, reduceMotion: true });
    const secondSession = createRepository(adapter); const loaded = await secondSession.load();
    assert.deepEqual(loaded.profile, profile); assert.equal(loaded.measurements[0].values.waist, 80);
    assert.equal(loaded.measurements[0].values.weight, null); assert.equal(loaded.settings.reduceMotion, true);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
test('rapid serialized saves preserve all entries and profile edits never delete baseline history', async () => {
  const store = memoryStorage(); const repository = createRepository(store.adapter); await repository.load();
  await repository.saveProfile(profile, measurement('base', '2026-10-01', { weight: 70 }));
  await Promise.all([
    repository.saveMeasurement(measurement('a', '2026-10-03', { weight: 69 }), false),
    repository.saveMeasurement(measurement('b', '2026-10-06', { waist: 80 }), false),
    repository.saveProfile({ ...profile, primaryGoal: 'strength', secondaryGoals: [] }),
  ]);
  const loaded = await createRepository(store.adapter).load();
  assert.deepEqual(loaded.measurements.map(m => m.id), ['base', 'a', 'b']); assert.equal(loaded.profile!.primaryGoal, 'strength');
});
test('explicit correction replaces only its own record and clearing an optional field persists null', async () => {
  const store = memoryStorage(); const repository = createRepository(store.adapter); await repository.load();
  const original = measurement('a', '2026-10-01', { weight: 70, waist: 80 });
  await repository.saveMeasurement(original, false);
  await repository.saveMeasurement(measurement('b', '2026-10-06', { weight: 69 }), false);
  await repository.saveMeasurement({ ...original, values: { ...original.values, weight: 70.5, waist: null }, createdAt: '2026-10-06T12:00:00.000Z', updatedAt: '2026-10-06T12:00:00.000Z' }, true);
  const loaded = await repository.load();
  assert.equal(loaded.measurements.length, 2); assert.equal(loaded.measurements[0].values.weight, 70.5);
  assert.equal(loaded.measurements[0].values.waist, null); assert.equal(loaded.measurements[0].createdAt, original.createdAt);
  assert.equal(loaded.measurements[1].values.weight, 69);
  await assert.rejects(repository.saveMeasurement(original, false), /already exists/);
  await assert.rejects(repository.saveMeasurement(measurement('missing', '2026-10-06', { weight: 69 }), true), /no longer exists/);
});
test('write failure does not report success or destroy saved data, and the queue recovers', async () => {
  const store = memoryStorage(); const repository = createRepository(store.adapter); await repository.load(); await repository.saveProfile(profile);
  const snapshot = store.entries.get(STORAGE_KEY); store.setFail(true);
  await assert.rejects(repository.saveMeasurement(measurement('a', '2026-10-06', { weight: 70 }), false), /disk full/);
  assert.equal(store.entries.get(STORAGE_KEY), snapshot);
  store.setFail(false); await repository.saveMeasurement(measurement('b', '2026-10-06', { weight: 69 }), false);
  assert.deepEqual((await repository.load()).measurements.map(m => m.id), ['b']);
});
test('read failure or corruption blocks mutation instead of overwriting an existing snapshot', async () => {
  const store = memoryStorage(); store.entries.set(STORAGE_KEY, '{corrupt');
  const repository = createRepository(store.adapter); await assert.rejects(repository.load()); await assert.rejects(repository.saveProfile(profile));
  assert.equal(store.entries.get(STORAGE_KEY), '{corrupt');
  const blocked = createRepository({ getItem: async () => { throw new Error('read blocked'); }, setItem: async () => { assert.fail('must not write'); } });
  await assert.rejects(blocked.load()); await assert.rejects(blocked.saveProfile(profile));
});
test('delete removes only the requested measurement; clear resets all user data', async () => {
  const store = memoryStorage(); const repository = createRepository(store.adapter); await repository.load(); await repository.saveProfile(profile);
  await repository.saveMeasurement(measurement('a', '2026-10-01', { weight: 70 }), false);
  await repository.saveMeasurement(measurement('b', '2026-10-06', { waist: 80 }), false);
  const after = await repository.deleteMeasurement('a'); assert.deepEqual(after.measurements.map(m => m.id), ['b']); assert.deepEqual(after.profile, profile);
  await repository.clear(); assert.deepEqual(await createRepository(store.adapter).load(), emptyData());
});
