import React, { useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { InfoNote, Badge, Body, Button, Card, ErrorNotice, Field, Page } from '../components/ui';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { Companion } from '../components/Companion';
import { useAppData } from '../data/AppProvider';
import { localTimezone, makeId, MealEntry } from '../domain/types';
import { displayDate, optionalNumber, parseDate } from '../domain/validation';
import { goBackOrHome } from '../navigation';

export default function MealScreen() {
  const { id } = useLocalSearchParams<{ id?:string }>();
  const { data,today,saveMeal,deleteMeal } = useAppData();
  const existing = id ? data!.meals.find(m => m.id === id) : undefined;
  const [name,setName] = useState(existing?.name ?? '');
  const [date,setDate] = useState(displayDate(existing?.date ?? today));
  const [fields,setFields] = useState(() => ({ calories:existing?.calories?.toString() ?? '', protein:existing?.protein?.toString() ?? '', fat:existing?.fat?.toString() ?? '', carbs:existing?.carbs?.toString() ?? '' }));
  const [error,setError] = useState(''), [busy,setBusy] = useState(false);
  const lock = useRef(false);
  async function save() {
    if (lock.current) return;
    setError('');
    let meal:MealEntry;
    try {
      const savedDate = parseDate(date);
      if (!savedDate || savedDate > today) throw new Error('Enter a valid date (today or earlier) as DD/MM/YYYY.');
      if (!name.trim()) throw new Error('Fill in the meal name and the amount eaten.');
      const values = { calories:optionalNumber(fields.calories,0,20000),protein:optionalNumber(fields.protein,0,3000),fat:optionalNumber(fields.fat,0,3000),carbs:optionalNumber(fields.carbs,0,3000) };
      if (Object.values(values).every(v => v === null)) throw new Error('Enter at least one nutrition value. The rest are saved as missing.');
      const now = new Date().toISOString();
      meal = { id:existing?.id ?? makeId('meal'),profileId:data!.profile!.profileId,date:savedDate,timezone:existing?.timezone ?? localTimezone(),name:name.trim(),...values,source:'manual-label',createdAt:existing?.createdAt ?? now,updatedAt:now };
    } catch(err) { setError((err as Error).message); return; }
    lock.current = true; setBusy(true);
    try { await saveMeal(meal,!!existing); goBackOrHome(); }
    catch { setError('Couldn’t save. The meal is still in the form and your log is safe. Try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function remove() {
    if (!existing || lock.current) return; lock.current = true; setBusy(true);
    try { await deleteMeal(existing.id); AccessibilityInfo.announceForAccessibility('Meal deleted and totals updated'); goBackOrHome(); }
    catch { setError('Delete didn’t save; the meal is still in your log. Try again.'); }
    finally { lock.current = false; setBusy(false); }
  }
  if (id && !existing) return <Page title="Meal not found" onClose={goBackOrHome}><Body>It may already have been deleted. The rest of your log is safe.</Body></Page>;
  return <Page title={existing ? 'Edit meal' : 'Log a meal'} subtitle="Log what you actually ate." onClose={goBackOrHome} footer={<>{!!error && <ErrorNotice text={error} />}<Button label={existing ? 'Save meal changes' : 'Save meal'} icon="check" busy={busy} onPress={save} /></>}>
    <Companion message="No need to be perfect. Start with what you know." />
    <Card><Badge text="Manual entry · your data" /><InfoNote text="Enter values for the amount you ate, from a label or a source you checked. Food databases aren’t connected yet. An empty field means missing; use zero only when the value is known to be zero." /></Card>
    <Field label="Meal name and amount eaten (Hebrew or English)" value={name} onChangeText={setName} maxLength={100} placeholder="e.g. Greek yogurt, 200 g" />
    <Field label="Date eaten" value={date} onChangeText={setDate} maxLength={10} keyboardType="numbers-and-punctuation" style={{ writingDirection:'ltr' }} />
    {([['calories','kcal'],['protein','Protein (g)'],['fat','Fat (g)'],['carbs','Carbs (g)']] as const).map(([key,label]) => <Field key={key} label={`${label} · for the amount eaten`} hint="Leave empty if unknown." numeric value={fields[key]} onChangeText={v => setFields({ ...fields,[key]:v })} maxLength={8} placeholder="Unknown" />)}
    <Body>Editing replaces only this entry. It doesn’t add another meal or change today’s target.</Body>
    {existing && <ConfirmDelete label="Delete meal" message="The meal will be removed from your log and its calories and macros subtracted from the totals. Delete?" onConfirm={remove} busy={busy} />}
  </Page>;
}
