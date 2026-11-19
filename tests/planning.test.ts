import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRepository, LEGACY_BACKUP_KEY, STORAGE_KEY, StorageAdapter } from '../src/data/repository';
import { estimateRfm } from '../src/domain/bodyComposition';
import { summarizeMeals } from '../src/domain/nutrition';
import { buildPlan, nutritionTarget } from '../src/domain/planning';
import { avatarComparison, compareMeasurements } from '../src/domain/progress';
import { MealEntry, WorkoutEntry } from '../src/domain/types';
import { displayPace, parsePace, validMeasurement } from '../src/domain/validation';
import { measurement, profile } from './fixtures';
function store(raw?: string) {
  const entries = new Map<string,string>(); if (raw) entries.set(STORAGE_KEY,raw);
  const adapter:StorageAdapter = { getItem:async key => entries.get(key) ?? null,setItem:async (key,value) => { entries.set(key,value); } };
  return { entries,adapter };
}
const date = '2026-10-06', now = new Date(2026,9,6,12);
function meal(id='meal', overrides:Partial<MealEntry>={}):MealEntry {
  return { id,profileId:profile.profileId,date,timezone:'Asia/Jerusalem',name:'Yogurt · 200 g',calories:200,protein:20,fat:5,carbs:18,source:'manual-label',createdAt:now.toISOString(),updatedAt:now.toISOString(),...overrides };
}
function legacy() {
  const { profileId,sex,running,activity,healthContext,nutritionPreferences,allergies,trainingFocus,calorieOverride,...old } = profile;
  void [profileId,sex,running,activity,healthContext,nutritionPreferences,allergies,trainingFocus,calorieOverride];
  const { silhouette,...avatar } = old.avatar; void silhouette;
  const { profileId:owner,timezone,waistMethod,...m } = measurement('legacy','2026-10-01',{ weight:70,waist:80 }); void [owner,timezone,waistMethod];
  return { version:1,profile:{ ...old,avatar },measurements:[m],settings:{ showBodyChanges:false,reduceMotion:true } };
}
test('v1 migration backs up the exact old snapshot, retains IDs/history/preferences and never guesses sex or waist method',async () => {
  const raw = JSON.stringify(legacy()), disk = store(raw), repo = createRepository(disk.adapter);
  const migrated = await repo.load(); assert.equal(migrated.schemaVersion,2); assert.equal(migrated.profile!.name,profile.name);
  assert.equal(migrated.profile!.sex,null); assert.equal(migrated.measurements[0].waistMethod,'unknown');
  assert.equal(migrated.measurements[0].id,'legacy'); assert.equal(migrated.measurements[0].values.waist,80);
  assert.equal(migrated.settings.reduceMotion,true); assert.equal(migrated.measurements[0].profileId,migrated.profile!.profileId);
  assert.equal(disk.entries.get(LEGACY_BACKUP_KEY),raw);
  const reopened = await createRepository(disk.adapter).load(); assert.deepEqual(reopened,migrated);
  await repo.saveProfile({ ...migrated.profile!,profileId:'replacement-id',name:'Updated name',sex:'male',primaryGoal:'strength',secondaryGoals:[] });
  const updated = await repo.load(); assert.equal(updated.profile!.profileId,migrated.profile!.profileId); assert.deepEqual(updated.measurements,migrated.measurements);
});
test('failed migration backup/write blocks mutation and leaves v1 untouched',async () => {
  const raw = JSON.stringify(legacy()); let writes = 0;
  const repo = createRepository({ getItem:async key => key === STORAGE_KEY ? raw : null,setItem:async () => { writes++; throw new Error('disk failure'); } });
  await assert.rejects(repo.load(),/disk failure/); await assert.rejects(repo.saveProfile(profile)); assert.equal(writes,1);
});
test('each training route has seven days, personal availability and rest, with no cardio in strength',() => {
  for (const training of ['strength','running','combined'] as const) {
    const plan = buildPlan({ ...profile,training },[measurement('a',date,{ weight:70 })],now);
    assert.equal(plan.weekly.length,7); assert.equal(plan.weekly.filter(s => s.kind === 'rest').length,4);
    assert.deepEqual(plan.weekly.filter(s => s.kind !== 'rest').map(s => s.day),profile.days);
    assert.ok(plan.weekly.filter(s => s.kind !== 'rest').every(s => s.duration === profile.duration && s.example));
    if (training === 'combined') assert.deepEqual(new Set(plan.weekly.map(s => s.kind)),new Set(['strength','running','rest']));
    else assert.ok(plan.weekly.every(s => s.kind === 'rest' || s.kind === training));
  }
});
test('personal targets use sex/age/height/actual weight/PAL, independent of avatar; no invented target for missing inputs',() => {
  const measurements = [measurement('a',date,{ weight:70 })];
  const female = nutritionTarget(profile,measurements,date).target!, male = nutritionTarget({ ...profile,sex:'male' },measurements,date).target!;
  assert.equal(female.calories,(700+6.25*165-5*35-161)*1.4); assert.ok(Math.abs(male.calories-female.calories-166*1.4)<1e-9);
  assert.deepEqual(nutritionTarget({ ...profile,avatar:{ ...profile.avatar,silhouette:'masculine',hair:'short' } },measurements,date).target,female);
  assert.equal(nutritionTarget({ ...profile,sex:null },measurements,date).target,null);
  assert.equal(nutritionTarget(profile,[],date).target,null);
  assert.equal(nutritionTarget({ ...profile,healthContext:'special' },measurements,date).target,null);
  assert.equal(nutritionTarget({ ...profile,age:18 },measurements,date).target,null);
  assert.equal(nutritionTarget({ ...profile,calorieOverride:2000 },measurements,date).target!.calories,2000);
  assert.ok(Math.abs(female.protein*4+female.fat*9+female.carbs*4-female.calories)<1e-9);
});
test('meal totals distinguish gram progress, eaten energy share and target allocation without normalization or early rounding',() => {
  const target = { ...nutritionTarget(profile,[measurement('a',date,{ weight:70 })],date).target!,calories:2000,protein:125,fat:600/9,carbs:225 };
  const summary = summarizeMeals([meal()],target);
  assert.equal(summary.remaining,1800); assert.equal(summary.macros[0].progressPercent,16);
  assert.equal(summary.macros[0].eatenEnergyPercent,40); assert.equal(summary.macros[0].plannedEnergyPercent,25);
  assert.equal(summary.macros.reduce((n,m) => n+m.eatenEnergyPercent!,0),98.5);
  const empty = summarizeMeals([],target); assert.equal(empty.remaining,2000); assert.equal(empty.macros[0].eatenEnergyPercent,null);
  const partial = summarizeMeals([meal('missing',{ calories:null,protein:null })],target); assert.equal(partial.partial,true); assert.equal(partial.remaining,null); assert.equal(partial.macros[0].progressPercent,null);
  assert.equal(summarizeMeals([meal('over',{ calories:2500 })],target).remaining,-500);
  assert.equal(summarizeMeals([meal('zero',{ calories:0,protein:0,fat:0,carbs:0 })],target).macros[0].eatenEnergyPercent,null);
});
test('meal add/edit/delete and duplicate rejection preserve one record and all other logs across reopen',async () => {
  const disk = store(),repo = createRepository(disk.adapter); await repo.load(); await repo.saveProfile(profile,measurement('a',date,{ weight:70 }),true); await repo.ensureDay(date);
  await Promise.all([repo.saveMeal(meal('a'),false),repo.saveMeal(meal('b',{ calories:300,protein:10 }),false)]);
  await assert.rejects(repo.saveMeal(meal('a'),false),/already logged/);
  await repo.saveMeal(meal('a',{ calories:150,protein:15 }),true);
  let reopened = await createRepository(disk.adapter).load(); assert.equal(reopened.meals.length,2); assert.equal(summarizeMeals(reopened.meals,null).totals.calories,450);
  await repo.deleteMeal('b'); reopened = await repo.load(); assert.equal(reopened.meals.length,1); assert.equal(summarizeMeals(reopened.meals,null).totals.protein,15);
  await assert.rejects(repo.saveMeal(meal('foreign',{ profileId:'other' }),false),/different profile/);
});
test('profile/goal/training changes retain profile ID, old plan, meal/workout history and historical daily target',async () => {
  const disk = store(),repo = createRepository(disk.adapter); await repo.load();
  await repo.saveProfile(profile,measurement('a',date,{ weight:70 }),true); const first = await repo.ensureDay(date);
  const oldTarget = first.dailyTargets[0], planId = first.plans[0].id;
  await repo.saveMeal(meal(),false);
  const workout:WorkoutEntry = { id:'workout',profileId:profile.profileId,date,timezone:'Asia/Jerusalem',planId,kind:'strength',duration:30,distanceKm:null,effort:'moderate',notes:'Real log',createdAt:now.toISOString(),updatedAt:now.toISOString() };
  await repo.saveWorkout(workout,false);
  await repo.saveProfile({ ...profile,name:'New name',sex:'male',training:'combined',primaryGoal:'running',secondaryGoals:[],calorieOverride:2000 },undefined,true);
  await repo.ensureDay(date); await repo.ensureDay('2026-10-07');
  const reopened = await createRepository(disk.adapter).load(); assert.equal(reopened.profile!.profileId,profile.profileId);
  assert.deepEqual(reopened.dailyTargets[0],oldTarget); assert.equal(reopened.dailyTargets[1].nutrition!.calories,2000);
  assert.equal(reopened.plans.length,2); assert.equal(reopened.plans[0].id,planId); assert.equal(reopened.plans[0].profileSnapshot.sex,'female');
  assert.equal(reopened.meals.length,1); assert.equal(reopened.workouts.length,1); assert.equal(reopened.measurements.length,1);
  assert.equal(reopened.workouts[0].kind,'strength');
});
test('two separate installations have isolated female and male profiles/targets/journals',async () => {
  const a=createRepository(store().adapter),b=createRepository(store().adapter); await a.load(); await b.load();
  await a.saveProfile(profile); await b.saveProfile({ ...profile,profileId:'male-profile',sex:'male',name:'Male' });
  await a.saveMeal(meal(),false); assert.equal((await b.load()).meals.length,0); assert.equal((await a.load()).profile!.sex,'female');
});
test('paces round trip in integer seconds and reject malformed/zero pace',() => {
  assert.equal(parsePace('6:30'),390); assert.equal(displayPace(390),'6:30'); assert.equal(parsePace(''),null);
  for (const bad of ['6.5','6:60','0:00','1:59','NaN']) assert.throws(() => parsePace(bad));
});
test('RFM requires known protocol and appropriate inputs; preserves sex coding and never clamps impossible results',() => {
  const m = { ...measurement('a',date,{ waist:80 }),waistMethod:'nhanes-iliac' as const };
  assert.equal(estimateRfm(profile,m).estimate!.percent,34.75);
  assert.equal(estimateRfm({ ...profile,sex:'male' },m).estimate!.percent,22.75);
  assert.equal(estimateRfm(profile,{ ...m,waistMethod:'unknown' }).estimate,null);
  assert.equal(estimateRfm({ ...profile,age:19 },m).estimate,null);
  assert.equal(estimateRfm({ ...profile,sex:null },m).estimate,null);
  assert.equal(estimateRfm({ ...profile,healthContext:'special' },m).estimate,null);
  assert.equal(estimateRfm(profile,{ ...m,values:{ ...m.values,waist:10 } }).estimate,null);
  assert.equal(compareMeasurements(m,{ ...m,id:'b',waistMethod:'unknown',values:{ ...m.values,waist:75 } })[1].reason,'method');
  assert.equal(avatarComparison(m,{ ...m,id:'b',waistMethod:'unknown',values:{ ...m.values,waist:75 } }).shape.waist,1);
});
test('persisted RFM snapshots retain their original inputs and reject invented or mismatched results',async () => {
  const repo = createRepository(store().adapter); await repo.load(); await repo.saveProfile(profile);
  const m = { ...measurement('rfm',date,{ waist:80 }),waistMethod:'nhanes-iliac' as const };
  const saved = (await repo.saveMeasurement(m,false)).measurements[0];
  assert.equal(saved.bodyEstimate!.percent,34.75); assert.ok(validMeasurement(saved));
  assert.equal(validMeasurement({ ...saved,bodyEstimate:{ ...saved.bodyEstimate,percent:15 } }),false);
  assert.equal(validMeasurement({ ...saved,date:'2026-10-05' }),false);
  assert.equal(validMeasurement({ ...saved,waistMethod:'unknown' }),false);
  await repo.saveProfile({ ...profile,sex:'male',height:175 });
  assert.deepEqual((await repo.load()).measurements[0].bodyEstimate,saved.bodyEstimate);
});
