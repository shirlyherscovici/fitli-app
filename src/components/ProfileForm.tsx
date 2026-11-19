import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useAppData } from '../data/AppProvider';
import { emptyValues, experiences, Experience, Goal, goals, localTimezone, makeId, Measurement, newProfile, Profile, ProfileDraft, Training, trainings } from '../domain/types';
import { displayDate, displayPace, localDate, optionalNumber, parseDate, parsePace } from '../domain/validation';
import { activityLabels, buildPlan, weekDays } from '../domain/planning';
import { formatNumber, sortMeasurements } from '../domain/progress';
import { colors, fonts } from '../theme';
import { AvatarPicker } from './AvatarPicker';
import { Companion } from './Companion';
import { legacyText } from '../domain/legacyText';
import { Badge, Body, Button, Card, Chip, Chips, ErrorNotice, Field, Page, Row, Title, Txt } from './ui';

const steps = ['Your profile', 'Training type', 'Your goals', 'Life & preferences', 'Your plan'];
const descriptions = ['Calculation data and avatar look are separate choices.', 'Pick the kind of movement that suits you.', 'Body, weight and running goals — each on its own.', 'Leave room for rest too.', 'Review, build and save.'];
function initialDraft(profile: Profile | null): ProfileDraft {
  const p = profile ?? newProfile();
  return { profileId: profile?.profileId ?? null, step: 0, profile: p, fields: {
    age: p.age?.toString() ?? '', height: p.height?.toString() ?? '', weight: '', targetWeight: p.targetWeight?.toString() ?? '',
    targetDate: p.targetDate ? displayDate(p.targetDate) : '', runDistance: p.running.targetDistanceKm?.toString() ?? '',
    runPace: p.running.targetPaceSeconds === null ? '' : displayPace(p.running.targetPaceSeconds), runDate: p.running.targetDate ? displayDate(p.running.targetDate) : '',
    currentDistance: p.running.currentDistanceKm?.toString() ?? '', currentDuration: p.running.currentDurationMinutes?.toString() ?? '',
    incline: p.running.incline?.toString() ?? '', calories: p.calorieOverride?.toString() ?? '',
  } };
}
export function ProfileForm({ editing = false, onDone, onClose }: { editing?: boolean; onDone: () => void; onClose?: () => void }) {
  const { data, saveProfile, saveDraft } = useAppData();
  const owner = data?.profile?.profileId ?? null;
  const [draft, setDraft] = useState<ProfileDraft>(() => data?.draft?.profileId === owner ? data.draft : initialDraft(editing ? data?.profile ?? null : null));
  const [started, setStarted] = useState(editing || !!data?.draft);
  const [showAppearance, setShowAppearance] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [draftStatus, setDraftStatus] = useState('');
  const saving = useRef(false), complete = useRef(false);
  const persist = useRef(saveDraft);
  useEffect(() => { persist.current = saveDraft; }, [saveDraft]);
  const p = draft.profile, f = draft.fields, step = draft.step;
  const latestWeight = sortMeasurements(data!.measurements.filter(m => m.values.weight !== null)).at(-1);
  const running = p.training !== 'strength', strength = p.training !== 'running';
  function patch(value: Partial<Profile>) { setDraft(d => ({ ...d, profile: { ...d.profile, ...value } })); }
  function field(key: string, value: string) { setDraft(d => ({ ...d, fields: { ...d.fields, [key]: value } })); }
  const toggle = <T,>(list: T[], item: T): T[] => list.includes(item) ? list.filter(v => v !== item) : [...list, item];
  useEffect(() => {
    if (!started || complete.current) return;
    const timer = setTimeout(() => {
      if (complete.current) return;
      void persist.current(draft).then(() => setDraftStatus('Draft saved on device')).catch(() => setDraftStatus('Draft not saved. Your details are still in the form; try again.'));
    }, 650);
    return () => clearTimeout(timer);
  }, [draft, started]);
  function normalized(): Profile {
    const date = (key: string): string | null => { if (!f[key].trim()) return null; const v = parseDate(f[key]); if (!v) throw new Error('Enter the date as DD/MM/YYYY.'); return v; };
    return { ...p, name: p.name.trim(), age: optionalNumber(f.age, 18, 120, true), height: optionalNumber(f.height, 100, 250),
      targetWeight: optionalNumber(f.targetWeight, 20, 500), targetDate: date('targetDate'), calorieOverride: optionalNumber(f.calories, 1200, 6000),
      running: !running ? p.running : { ...p.running, targetDistanceKm: optionalNumber(f.runDistance, 0.1, 100), targetPaceSeconds: parsePace(f.runPace), targetDate: date('runDate'),
        currentDistanceKm: optionalNumber(f.currentDistance, 0.1, 100), currentDurationMinutes: optionalNumber(f.currentDuration, 1, 1000), incline: optionalNumber(f.incline, 0, 30) },
      days: [...p.days].sort((a,b) => a-b) };
  }
  function validateStep() {
    if (step === 0) {
      if (!p.name.trim()) throw new Error('Enter a name or nickname.');
      if (!p.sex) throw new Error('Choose male or female for the calculations. Avatar style is chosen separately.');
      optionalNumber(f.age, 18, 120, true); optionalNumber(f.height, 100, 250); optionalNumber(f.weight, 20, 500);
    }
    if (step === 2) { optionalNumber(f.targetWeight, 20, 500); if (f.targetDate.trim() && !parseDate(f.targetDate)) throw new Error('Goal weight date is invalid.');
      if (running) { optionalNumber(f.runDistance, 0.1, 100); parsePace(f.runPace); if (f.runDate.trim() && !parseDate(f.runDate)) throw new Error('Running goal date is invalid.'); } }
    if (step === 3) {
      if (!p.days.length) throw new Error('Pick at least one available day. The others become rest days.');
      if (running && p.training === 'combined' && p.days.length < 2) throw new Error('Planning both strength and running needs at least two available days.');
      if (running) { optionalNumber(f.currentDistance, 0.1, 100); optionalNumber(f.currentDuration, 1, 1000); optionalNumber(f.incline, 0, 30); }
      optionalNumber(f.calories, 1200, 6000);
    }
  }
  function baseline(): Measurement | undefined {
    const weight = optionalNumber(f.weight, 20, 500);
    if (weight === null) return;
    const timestamp = new Date().toISOString();
    return { id: makeId('measurement'), profileId: p.profileId, timezone: localTimezone(), waistMethod: 'unknown', date: localDate(),
      values: { ...emptyValues(), weight }, units: { weight: 'kg', circumference: 'cm' }, sides: { arm: 'right', thigh: 'right' }, createdAt: timestamp, updatedAt: timestamp };
  }
  async function advance() {
    if (saving.current) return;
    setError('');
    try {
      validateStep();
      if (step < 4) {
        const next = { ...draft, step: step + 1 };
        await saveDraft(next); setDraft(next); AccessibilityInfo.announceForAccessibility(steps[step + 1]); return;
      }
      saving.current = true; complete.current = true; setBusy(true);
      await saveProfile(normalized(), baseline(), true);
      AccessibilityInfo.announceForAccessibility('Plan and profile saved. Let’s start small.'); onDone();
    } catch (err) {
      complete.current = false;
      setError(saving.current ? 'Couldn’t save. Your details are still in the form; try again.' : (err as Error).message);
    } finally { saving.current = false; setBusy(false); }
  }
  async function back() { const next = { ...draft, step: Math.max(0, step - 1) }; setDraft(next); setError(''); try { await saveDraft(next); } catch { setDraftStatus('Draft not saved; try again.'); } }
  async function close() { if (busy || !onClose) return; setBusy(true); try { await saveDraft(draft); onClose(); } catch { setError('Couldn’t save the draft. Your details are still in the form; try again.'); } finally { setBusy(false); } }
  let preview: ReturnType<typeof buildPlan> | null = null;
  if (step === 4) { try { const b = baseline(); preview = buildPlan(normalized(), b ? [...data!.measurements, b] : data!.measurements); } catch { /* validation remains visible on save */ } }
  if (!started) return <Page footer={<Button label="Build my plan" icon="arrow" onPress={() => setStarted(true)} />}>
    <Txt style={{ fontFamily: fonts.heavy, color: colors.purple, fontSize: 22 }}>FITLI</Txt>
    <Card style={{ backgroundColor: colors.lavender, paddingVertical: 32 }}><Badge text="Start at your pace" /><Title>A plan made for you.{ '\n' }Habits for life.</Title><Body>We’ll build a training and nutrition plan that fits you, level up together and track your progress.</Body><Companion message="Nice to meet you! I’m here for every small step." /></Card>
    <Title small>Five steps, one journey</Title><Body>Tell us about you, pick training and goals, and plan your week. Your draft is saved so you can come back anytime.</Body>
    <Body>One local profile on this device. No sign-up; browser and phone data are stored separately.</Body>
  </Page>;
  return <Page title={editing ? 'Update profile and plan' : 'Build my plan'} onClose={onClose ? close : undefined} scrollKey={step} footer={<>
    {!!error && <ErrorNotice text={error} />}<Button label={step === 4 ? editing ? 'Save and rebuild plan' : 'Start my plan' : 'Continue'} icon={step === 4 ? 'check' : 'arrow'} onPress={advance} busy={busy} />
    {step > 0 && <Button label="Back" variant="quiet" disabled={busy} onPress={back} />}
  </>}>
    <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><Badge text={`Step ${step + 1} of 5`} /><Txt style={{ fontSize: 12, color: colors.muted }}>{draftStatus || 'You can go back and edit'}</Txt></Row>
    <Row style={{ gap: 6 }}>{steps.map((_, i) => <View key={i} style={{ flex: 1, height: 7, borderRadius: 6, backgroundColor: i <= step ? colors.purple : colors.line }} />)}</Row>
    <View><Title>{steps[step]}</Title><Body>{descriptions[step]}</Body></View>
    {step === 0 && <>
      <Field label="Name or nickname" value={p.name} onChangeText={name => patch({ name })} maxLength={40} placeholder="What should we call you?" />
      <Title small>Male or female</Title><Body>Used in nutrition and body composition formulas. Avatar style doesn’t affect the math.</Body>
      <Chips><Chip label="Male" selected={p.sex === 'male'} onPress={() => patch({ sex: 'male' })} /><Chip label="Female" selected={p.sex === 'female'} onPress={() => patch({ sex: 'female' })} /></Chips>
      <Field label="age" hint="You can add this later. Needed for the energy estimate." numeric value={f.age} onChangeText={v => field('age', v)} maxLength={3} placeholder="e.g. 35" />
      <Field label="Height (cm)" hint="Needed for energy and body composition estimates." numeric value={f.height} onChangeText={v => field('height', v)} maxLength={6} placeholder="e.g. 165" />
      <Field label={editing ? 'New weight in kg · optional' : 'Weight in kg · can add later'} hint={latestWeight ? `Saved: ${formatNumber(latestWeight.values.weight)} kg. Entering a value adds a new measurement; leaving it empty keeps the current one.` : 'Saved as today’s measurement. Needed for the nutrition estimate.'} numeric value={f.weight} onChangeText={v => field('weight', v)} maxLength={6} placeholder="optional" />
      <Button label={showAppearance ? 'Close avatar picker' : 'Choose avatar look'} variant="secondary" onPress={() => setShowAppearance(!showAppearance)} />
      {showAppearance && <Card><AvatarPicker value={p.avatar} onChange={avatar => patch({ avatar })} /></Card>}
      {editing && <Body>Your profile ID stays the same. Name, goals and avatar can change without deleting history.</Body>}
    </>}
    {step === 1 && <>
      {(Object.keys(trainings) as Training[]).map(type => <Card key={type} style={{ backgroundColor: p.training === type ? colors.sage : colors.surface }}><Chip label={trainings[type]} selected={p.training === type} onPress={() => patch({ training: type })} /><Body>{type === 'strength' ? 'Focus on strength. Fat loss or recomposition work without cardio too.' : type === 'running' ? 'A running goal, progressing from where you are now.' : 'One schedule combining strength and running, with recovery time.'}</Body></Card>)}
      <Companion message="The goal is yours. The path can change with you." />
    </>}
    {step === 2 && <>
      <Title small>Main body goal</Title><Chips>{(Object.keys(goals) as Goal[]).map(goal => <Chip key={goal} label={goal === 'running' ? 'No body goal · running goal' : goals[goal]} selected={p.primaryGoal === goal} onPress={() => patch({ primaryGoal: goal, secondaryGoals: p.secondaryGoals.filter(g => g !== goal) })} />)}</Chips>
      <Txt style={{ fontFamily: fonts.bold }}>Extra goals · optional</Txt><Chips>{(Object.keys(goals) as Goal[]).filter(g => g !== p.primaryGoal).map(g => <Chip key={g} label={goals[g]} selected={p.secondaryGoals.includes(g)} multiple onPress={() => patch({ secondaryGoals: toggle(p.secondaryGoals, g) })} />)}</Chips>
      <Field label="Goal weight in kg · optional" hint="Separate from your body goal. You can change body composition without a weight goal." numeric value={f.targetWeight} onChangeText={v => field('targetWeight',v)} maxLength={6} placeholder="No weight goal" />
      <Field label="Goal weight date · optional" value={f.targetDate} onChangeText={v => field('targetDate',v)} placeholder="31/12/2026" maxLength={10} keyboardType="numbers-and-punctuation" style={{ writingDirection: 'ltr' }} />
      {running && <Card style={{ backgroundColor: colors.peach }}><Title small>Your running goal</Title>
        <Field label="Target distance (km)" numeric value={f.runDistance} onChangeText={v => field('runDistance',v)} placeholder="e.g. 5" maxLength={6} />
        <Field label="Target pace · min:sec per km" hint="This isn’t the pace for every session. Stored as seconds per km." value={f.runPace} onChangeText={v => field('runPace',v)} placeholder="6:30" maxLength={5} keyboardType="numbers-and-punctuation" style={{ writingDirection: 'ltr' }} />
        <Field label="Running goal date" value={f.runDate} onChangeText={v => field('runDate',v)} placeholder="31/12/2026" maxLength={10} keyboardType="numbers-and-punctuation" style={{ writingDirection: 'ltr' }} />
      </Card>}
      {!running && <Body>No running goal needed on the strength track. Previous running goals are kept if you switch.</Body>}
    </>}
    {step === 3 && <>
      <Title small>Available days</Title><Chips>{weekDays.map((label,d) => <Chip key={d} label={label} selected={p.days.includes(d)} multiple onPress={() => patch({ days: toggle(p.days,d) })} />)}</Chips>
      <Txt>Comfortable session length</Txt><Chips>{[20,30,45,60].map(duration => <Chip key={duration} label={`${duration} min`} selected={p.duration === duration} onPress={() => patch({ duration })} />)}</Chips>
      {strength && <><Txt>Strength training experience</Txt><Chips>{(Object.keys(experiences) as Experience[]).map(e => <Chip key={e} label={experiences[e]} selected={p.strengthExperience === e} onPress={() => patch({ strengthExperience:e })} />)}</Chips>
        <Txt>Available equipment</Txt><Chips>{['Bodyweight','Dumbbells','Bands','Gym'].map(e => <Chip key={e} label={e} selected={p.equipment.includes(e)} multiple onPress={() => patch({ equipment:toggle(p.equipment,e) })} />)}</Chips>
        <Txt>Training focus · every option is open to everyone</Txt><Chips>{([['balanced','Balanced'],['lower','Lower body & glutes'],['upper','Upper body']] as const).map(([trainingFocus,label]) => <Chip key={trainingFocus} label={label} selected={p.trainingFocus === trainingFocus} onPress={() => patch({ trainingFocus })} />)}</Chips>
        <Field label="Known strength numbers · optional" value={p.performance} onChangeText={performance => patch({ performance })} multiline maxLength={500} placeholder="Exercises and weights you know. No load is set automatically." />
      </>}
      {running && <Card style={{ backgroundColor: colors.peach }}><Title small>Where are you starting with running?</Title><Chips>{(Object.keys(experiences) as Experience[]).map(e => <Chip key={e} label={experiences[e]} selected={p.runningExperience === e} onPress={() => patch({ runningExperience:e })} />)}</Chips>
        <Field label="Current run distance (km) · optional" numeric value={f.currentDistance} onChangeText={v => field('currentDistance',v)} placeholder="Not known yet" maxLength={6} />
        <Field label="Time for that distance (min) · optional" numeric value={f.currentDuration} onChangeText={v => field('currentDuration',v)} placeholder="e.g. 30" maxLength={6} />
        <Txt>Where do you like to run?</Txt><Chips><Chip label="Outdoors" selected={p.running.surface === 'outdoor'} onPress={() => patch({ running:{ ...p.running,surface:'outdoor' } })} /><Chip label="Treadmill" selected={p.running.surface === 'treadmill'} onPress={() => patch({ running:{ ...p.running,surface:'treadmill' } })} /></Chips>
        {p.running.surface === 'treadmill' && <Field label="Current incline % · optional" numeric value={f.incline} onChangeText={v => field('incline',v)} maxLength={5} placeholder="e.g. 1" />}
      </Card>}
      <Field label="Limitations and things to remember" value={p.limitations} onChangeText={limitations => patch({ limitations })} multiline maxLength={500} placeholder="Can be left empty" />
      <Title small>Your nutrition</Title><Txt>Activity across the whole day · including workouts</Txt><Chips>{(Object.keys(activityLabels) as (keyof typeof activityLabels)[]).map(activity => <Chip key={activity} label={activityLabels[activity]} selected={p.activity === activity} onPress={() => patch({ activity })} />)}</Chips>
      <Txt>Fit for nutrition and body composition estimates</Txt><Body>These formulas are for healthy adults; they don’t suit pregnancy, breastfeeding or conditions needing clinical planning.</Body><Chips><Chip label="Healthy adult · fits me" selected={p.healthContext === 'general'} onPress={() => patch({ healthContext:'general' })} /><Chip label="Needs professional guidance" selected={p.healthContext === 'special'} onPress={() => patch({ healthContext:'special' })} /></Chips>
      <Field label="Food preferences & kashrut" value={p.nutritionPreferences} onChangeText={nutritionPreferences => patch({ nutritionPreferences })} multiline maxLength={500} placeholder="Eating style, meal times, cooking time" />
      <Field label="Allergies & food restrictions" hint="Saved to your profile; sample meals aren’t filtered by allergies yet." value={p.allergies} onChangeText={allergies => patch({ allergies })} maxLength={500} placeholder="Can be left empty" />
      <Field label="Personal calorie target you were given · optional" hint="If empty: maintenance estimate. A weight-loss goal doesn’t cut calories automatically; you can enter a target set with a dietitian." numeric value={f.calories} onChangeText={v => field('calories',v)} placeholder="e.g. 2000" maxLength={7} />
    </>}
    {step === 4 && <>
      <Companion message="Almost there! The plan gives direction; your logs tell what really happened." />
      <Card><Title small>{p.name}, This is your path</Title><Txt>{trainings[p.training]} · {goals[p.primaryGoal]}</Txt><Body>Goal weight: {f.targetWeight ? `${f.targetWeight} kg` : 'Not set'}{running ? ` · Running goal: ${f.runDistance || 'Not set'} km · ${f.runPace || 'no pace set'}` : ''}</Body><Button label="Edit goals" variant="quiet" onPress={() => setDraft({ ...draft,step:2 })} /></Card>
      {preview && <><Card><Title small>Your planned week</Title>{preview.weekly.map(s => <Row key={s.day} style={{ justifyContent:'space-between',flexWrap:'wrap' }}><Txt>{weekDays[s.day]}</Txt><Txt style={{ fontFamily:fonts.medium }}>{legacyText(s.title)}{s.duration ? ` · ${s.duration} min` : ''}</Txt></Row>)}<Badge text="Workout content is sample content" kind="example" /><Body>Schedule follows the days you picked. Exercises, intensity and personal paces still need professionally reviewed templates.</Body></Card>
        <Card style={{ backgroundColor:colors.mint }}><Title small>Nutrition targets</Title>{preview.nutrition ? <><Txt style={{ fontSize:28,lineHeight:40,fontFamily:fonts.heavy }}>{Math.round(preview.nutrition.calories)} kcal</Txt><Body>Protein {Math.round(preview.nutrition.protein)} g · Fat {Math.round(preview.nutrition.fat)} g · Carbs {Math.round(preview.nutrition.carbs)} g</Body><Badge text="Personal planning estimate" /><Body>{preview.nutrition.method === 'mifflin-pal-v1' ? 'Mifflin–St Jeor × daily activity. Maintenance estimate, with no automatic deficit or surplus for your goal.' : 'Personal target you entered. The macro split is a starting point within AMDR.'} No verified personal menu yet.</Body></> : <><Body>To calculate a target, complete:: {preview.nutritionMissing.map(legacyText).join(' · ')}.</Body><Button label="Complete profile details" variant="secondary" onPress={() => setDraft({ ...draft,step:0 })} /></>}</Card>
      </>}
      <Body>Saving stores your profile, goals and plan. Existing logs stay; targets already set for today and earlier don’t change.</Body>
    </>}
  </Page>;
}
