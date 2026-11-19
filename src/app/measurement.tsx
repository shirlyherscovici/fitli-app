import React, { useRef, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Badge, Body, Button, Card, Chip, Chips, ErrorNotice, Field, Page, Txt } from '../components/ui';
import { MeasurementGuide } from '../components/MeasurementGuide';
import { useAppData } from '../data/AppProvider';
import { buildMeasurement, MeasurementDraft } from '../domain/measurementForm';
import { formatNumber, sortMeasurements } from '../domain/progress';
import { metricKeys, metrics, Side } from '../domain/types';
import { displayDate, localDate } from '../domain/validation';
import { colors, fonts } from '../theme';
import { goBackOrHome } from '../navigation';

export default function MeasurementScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data, saveMeasurement } = useAppData();
  const existing = id ? data!.measurements.find(m => m.id === id) : undefined;
  const latest = sortMeasurements(data!.measurements.filter(m => m.id !== id)).at(-1);
  const [date, setDate] = useState(displayDate(existing?.date ?? localDate()));
  const [values, setValues] = useState<MeasurementDraft['values']>(() => Object.fromEntries(metricKeys.map(k => [k, existing?.values[k]?.toString() ?? ''])) as MeasurementDraft['values']);
  const [sides, setSides] = useState(existing?.sides ?? { arm: 'right' as Side, thigh: 'right' as Side });
  const [guide, setGuide] = useState(false);
  const [waistMethod,setWaistMethod] = useState(existing?.waistMethod ?? 'unknown');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDiscard,setConfirmDiscard] = useState(false);
  const saving = useRef(false);
  const dirty = date !== displayDate(existing?.date ?? localDate()) || metricKeys.some(k => values[k] !== (existing?.values[k]?.toString() ?? '')) || waistMethod !== (existing?.waistMethod ?? 'unknown') || (sides.arm !== (existing?.sides.arm ?? 'right') || sides.thigh !== (existing?.sides.thigh ?? 'right'));
  function close() {
    if (busy) return;
    if (!dirty) { goBackOrHome(); return; }
    setConfirmDiscard(true);
  }
  async function save() {
    if (saving.current) return;
    setError('');
    let measurement;
    try { measurement = buildMeasurement({ date, values, sides, waistMethod }, existing); }
    catch (err) { setError((err as Error).message); AccessibilityInfo.announceForAccessibility((err as Error).message); return; }
    saving.current = true; setBusy(true);
    try {
      await saveMeasurement(measurement, !!existing);
      AccessibilityInfo.announceForAccessibility(existing ? 'Measurement updated' : 'Measurement saved. Every log is a step forward. +30 XP');
      goBackOrHome();
    } catch { const message = 'Couldn’t save on this device. Your values are still in the form; try again.'; setError(message); AccessibilityInfo.announceForAccessibility(message); }
    finally { saving.current = false; setBusy(false); }
  }
  if (id && !existing) return <Page title="Measurement not found" onClose={goBackOrHome}><Body>This entry is no longer in your history.</Body></Page>;
  return <Page title={existing ? 'Edit measurement' : 'Quick check-in'} subtitle={existing ? 'You’re editing this specific entry.' : 'Fill in only what you measured.'} onClose={close}
    footer={<>{!!error && <ErrorNotice text={error} />}{confirmDiscard ? <><Body>This measurement isn’t saved yet.</Body><Button label="Keep editing" onPress={() => setConfirmDiscard(false)} /><Button label="Leave without saving" variant="quiet" onPress={goBackOrHome} /></> : <Button label={existing ? 'Save changes' : 'Save measurement'} icon="check" onPress={save} busy={busy} />}</>}>
    <Card style={{ backgroundColor: colors.sage, borderWidth: 0 }}><Badge text={existing ? 'Editing an existing entry' : 'Your data only'} /><Body>{existing ? 'Previous values in this entry will be replaced. The rest of your history is kept.' : 'Each new measurement is added to your history. Empty fields are saved as ‘not measured’, and any field can be skipped.'}</Body></Card>
    <Field label="Measurement date" hint="DD/MM/YYYY · past measurements are fine too" value={date} onChangeText={setDate} keyboardType="numbers-and-punctuation" maxLength={10} style={{ writingDirection: 'ltr' }} />
    <Button label={guide ? 'Hide guide' : 'How to measure consistently?'} variant="secondary" icon="ruler" onPress={() => setGuide(!guide)} />
    {guide && <MeasurementGuide />}
    {metricKeys.map(key => {
      const metric = metrics[key];
      const limb = key === 'arm' || key === 'thigh';
      const previous = latest?.values[key] ?? null;
      const sideLabel = limb && latest ? latest.sides[key] === 'right' ? ' · Right side' : ' · Left side' : '';
      return <View key={key} style={{ gap: 10 }}>
        <Field label={`${metric.label} (${metric.unit}) · optional`} hint={previous === null ? 'No value in your previous entry' : `Last entry: ${formatNumber(previous)} ${metric.unit}${sideLabel}`} numeric maxLength={6} placeholder="Not measured" value={values[key]} onChangeText={text => setValues({ ...values, [key]: text })} />
        {limb && <Chips>{(['right', 'left'] as Side[]).map(side => <Chip key={side} label={`${metric.label} · ${side === 'right' ? 'right' : 'left'}`} selected={sides[key] === side} onPress={() => setSides({ ...sides, [key]: side })} />)}</Chips>}
        {key === 'waist' && <><Txt>Waist measuring method</Txt><Chips><Chip label="Other or unknown method" selected={waistMethod === 'unknown'} onPress={() => setWaistMethod('unknown')} /><Chip label="NHANES · Top of hip bone" selected={waistMethod === 'nhanes-iliac'} onPress={() => setWaistMethod('nhanes-iliac')} /></Chips><Body>To choose NHANES: standing, tape horizontal at the top of the right hip bone, without squeezing, at the end of a normal breath out. This isn’t necessarily the narrowest point or navel height. Choose it only if you measured this way; older measurements aren’t tagged automatically.</Body></>}
      </View>;
    })}
    <Txt style={{ fontSize: 13, color: colors.muted, fontFamily: fonts.medium }}>One value is enough to save. No need to fill everything.</Txt>
  </Page>;
}
