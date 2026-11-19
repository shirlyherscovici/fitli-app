import React, { useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Companion } from '../components/Companion';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { Badge, Body, Button, Card, Chip, Chips, ErrorNotice, Field, Page, Title, Txt } from '../components/ui';
import { useAppData } from '../data/AppProvider';
import { currentDayIndex, latestPlan } from '../domain/planning';
import { localTimezone, makeId, WorkoutEntry } from '../domain/types';
import { displayDate, displayPace, optionalNumber, validDate } from '../domain/validation';
import { colors } from '../theme';
import { legacyText } from '../domain/legacyText';
import { goBackOrHome } from '../navigation';

export default function WorkoutScreen() {
  const { date: requestedDate,id } = useLocalSearchParams<{ date?:string;id?:string }>();
  const { data,today,saveWorkout,deleteWorkout } = useAppData();
  const date = requestedDate && validDate(requestedDate) ? requestedDate : today;
  const latest = latestPlan(data!.plans), selected = id ? data!.workouts.find(w => w.id === id) : undefined;
  const kind = selected?.kind ?? latest?.weekly.find(s => s.day === currentDayIndex(date))?.kind ?? 'strength';
  const actualDate = selected?.date ?? date;
  const existing = selected ?? data!.workouts.find(w => w.date === actualDate && w.kind === kind);
  const plan = data!.plans.find(p => p.id === existing?.planId) ?? latest;
  const session = plan?.weekly.find(s => s.day === currentDayIndex(actualDate));
  const trainingProfile = plan?.profileSnapshot ?? data!.profile!;
  const [duration,setDuration] = useState(existing?.duration?.toString() ?? '');
  const [distance,setDistance] = useState(existing?.distanceKm?.toString() ?? '');
  const [effort,setEffort] = useState<WorkoutEntry['effort']>(existing?.effort ?? null);
  const [notes,setNotes] = useState(existing?.notes ?? '');
  const [recording,setRecording] = useState(!!existing), [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return; setError('');
    let entry:WorkoutEntry;
    try {
      if (actualDate > today) throw new Error('Future workouts stay planned. You can only log today or earlier.');
      const minutes = kind === 'rest' ? null : optionalNumber(duration,1,1000);
      if (kind !== 'rest' && minutes === null) throw new Error('Enter the minutes you actually trained.');
      const now = new Date().toISOString();
      entry = { id:existing?.id ?? makeId('workout'),profileId:data!.profile!.profileId,date:actualDate,timezone:existing?.timezone ?? localTimezone(),planId:existing ? existing.planId : plan?.id ?? null,
        kind,duration:minutes,distanceKm:kind === 'running' ? optionalNumber(distance,0.1,100) : null,effort:kind === 'rest' ? null : effort,notes:notes.trim(),createdAt:existing?.createdAt ?? now,updatedAt:now };
    } catch(err) { setError((err as Error).message); return; }
    lock.current = true; setBusy(true);
    try { await saveWorkout(entry,!!existing); AccessibilityInfo.announceForAccessibility(kind === 'rest' ? 'Rest logged. Recovery is part of the journey. +20 XP' : 'Workout logged! Great job making time for yourself. +50 XP'); goBackOrHome(); }
    catch { setError('Couldn’t save. Your entry is still in the form; try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove() {
    if (!existing || lock.current) return; lock.current = true; setBusy(true);
    try { await deleteWorkout(existing.id); goBackOrHome(); } catch { setError('Delete didn’t save. The entry is still in your log.'); } finally { lock.current=false; setBusy(false); }
  }
  if (id && !selected) return <Page title="Workout not found" onClose={goBackOrHome}><Body>This entry is no longer in your log.</Body></Page>;
  if (!plan && !existing) return <Page title="Build a plan first" onClose={goBackOrHome}><Body>Complete your profile to build a weekly schedule.</Body><Button label="Back to Today" onPress={goBackOrHome} /></Page>;
  return <Page title={kind === 'rest' ? 'Rest day' : kind === 'running' ? 'Your workout · Run' : 'Your workout · Strength'} subtitle={displayDate(actualDate)} onClose={goBackOrHome} footer={recording ? <>{!!error && <ErrorNotice text={error} />}<Button label={existing ? 'Save changes' : kind === 'rest' ? 'Log rest day' : 'Log what I did'} icon="check" onPress={save} busy={busy} /></> : undefined}>
    <Companion message={kind === 'rest' ? 'Give your body time to recover. This rest is already in your plan.' : 'Opening this screen is just prep. Only what you log counts as done.'} />
    <Card style={{ backgroundColor:kind === 'rest' ? colors.mint : colors.peach }}><Badge text={kind === 'rest' ? 'Planned rest' : 'Plan · sample content'} kind={kind === 'rest' ? 'green' : 'example'} /><Title small>{kind === 'rest' ? 'Room to recover' : (session?.title ? legacyText(session.title) : 'Entry from your log')}</Title><Body>{kind === 'rest' ? 'No workout required. Logging rest isn’t a completed workout and adds no load.' : `Planned: ${session?.duration ?? 'None set'} min. The content below shows a structure; it isn’t a professionally reviewed personal prescription.`}</Body></Card>
    {kind === 'strength' && <Card><Title small>Sample strength structure</Title><Txt>Warm-up · move within your ability</Txt><Txt>Sample moves: sit-to-stand, wall push-up, row</Txt><Txt>Finish · rest between sets and recover</Txt><Body>Your equipment, experience and focus are saved. Sets, reps and loads aren’t prescribed here without a reviewed template; log the workout you did.</Body></Card>}
    {kind === 'running' && <Card><Title small>Sample run structure</Title><Txt>Warm-up · easy main block · cool-down</Txt><Body>{trainingProfile.runningExperience === 'new' ? 'Saved: starting with no experience. A personal walk-run plan still needs a professional template.' : 'Your current ability is saved. We don’t automatically convert target pace to training pace.'}</Body><Txt>Distance goal: {trainingProfile.running.targetDistanceKm ?? 'Not set'} · Target pace: {displayPace(trainingProfile.running.targetPaceSeconds)} min/km</Txt><Body>Surface: {trainingProfile.running.surface === 'treadmill' ? 'Treadmill' : 'Outdoors'}</Body></Card>}
    {!recording && <Button label={actualDate > today ? 'This workout is planned for later this week' : kind === 'rest' ? 'Log rest for today' : 'Log what I did'} icon="check" disabled={actualDate > today} onPress={() => setRecording(true)} />}
    {recording && <>
      <Title small>{existing ? 'Logged · editable' : 'What you did'}</Title>
      {kind !== 'rest' && <><Field label="Minutes trained" numeric value={duration} onChangeText={setDuration} maxLength={6} placeholder="e.g. 30" />{kind === 'running' && <Field label="Distance in km · optional" numeric value={distance} onChangeText={setDistance} maxLength={6} placeholder="e.g. 3" />}<Txt>How did it feel?</Txt><Chips>{([['easy','Easy'],['moderate','Moderate'],['hard','Hard']] as const).map(([value,label]) => <Chip key={value} label={label} selected={effort === value} onPress={() => setEffort(value)} />)}</Chips></>}
      <Field label="Notes, exercises, weights or pain · optional" multiline value={notes} onChangeText={setNotes} maxLength={1000} placeholder="Your log, your words" />
      <Body>Workouts don’t change your calorie target automatically. Editing replaces this entry without duplicating it.</Body>
      {existing && <ConfirmDelete label="Delete workout entry" message="Delete this entry? The planned session stays in your week." onConfirm={remove} busy={busy} />}
    </>}
  </Page>;
}
