import React, { useState } from 'react';
import { AccessibilityInfo, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { BodyComposition } from '../../components/BodyComposition';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { GoalProgress } from '../../components/GoalProgress';
import { Journal } from '../../components/Journal';
import { NutritionSummary } from '../../components/NutritionSummary';
import { ComparisonChart } from '../../components/ComparisonChart';
import { WeightTrend } from '../../components/WeightTrend';
import { InfoNote, Badge, Body, Button, Card, Chip, Chips, EmptyState, ErrorNotice, Page, Row, Title, Txt } from '../../components/ui';
import { useAppData } from '../../data/AppProvider';
import { avatarComparison, compareMeasurements, formatDelta, formatNumber, sortMeasurements } from '../../domain/progress';
import { metricKeys, metrics } from '../../domain/types';
import { displayDate, localDate } from '../../domain/validation';
import { colors, fonts, rtlRow } from '../../theme';

export default function Progress() {
  const { data, deleteMeasurement } = useAppData();
  const { width, fontScale } = useWindowDimensions();
  const [beforeId, setBeforeId] = useState<string | null>(null);
  const [afterId, setAfterId] = useState<string | null>(null);
  const [picker, setPicker] = useState<'before' | 'after' | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const list = sortMeasurements(data!.measurements);
  const weightPoints = list.filter(m => m.values.weight !== null);
  const chosenBefore = list.find(m => m.id === beforeId) ?? list[0];
  const chosenAfter = list.find(m => m.id === afterId) ?? list.at(-1);
  const before = chosenBefore && chosenAfter && list.indexOf(chosenBefore) > list.indexOf(chosenAfter) ? chosenAfter : chosenBefore;
  const after = chosenBefore && chosenAfter && list.indexOf(chosenBefore) > list.indexOf(chosenAfter) ? chosenBefore : chosenAfter;
  const distinct = before && after && before.id !== after.id;
  const pairs = distinct ? compareMeasurements(before, after) : [];
  const avatarInfo = avatarComparison(before, after);
  const stacked = width < 380 || fontScale * (data!.settings.textScale ?? 1) > 1.3;
  function remove(id: string) {
    void (async () => {
      setDeleting(id); setError('');
      try { await deleteMeasurement(id); AccessibilityInfo.announceForAccessibility('Measurement deleted'); }
      catch { setError('Couldn’t delete. The measurement is still saved; try again.'); }
      finally { setDeleting(null); }
    })();
  }
  return <Page title="Your progress" subtitle="Every data point tells part of the story.">
    <NutritionSummary compact />
    <Journal />
    <GoalProgress />
    <BodyComposition />
    <Title small>Weight, measurements and comparison</Title>
    <Button label="Add measurement" icon="plus" onPress={() => router.push('/measurement')} />
    {list.length === 0 ? <EmptyState title="Your journey starts here" text="No measurements yet. Start with your weight or a single circumference, and add more whenever it suits you." /> : <>
      {list.length === 1 && <EmptyState title="First data point — great start" text="To compare, you need one more entry. Your avatar stays as chosen until there are measurements from two points in time." />}
      {weightPoints.length >= 2 && <Card><WeightTrend measurements={data!.measurements} profile={data!.profile!} /></Card>}
      {list.length >= 2 && <>
        <Card><Title small>Two points, one journey</Title><InfoNote text="Pick two entries. They’re shown oldest to newest; two entries from the same day are kept separately." />
          <Button label={`A · ${displayDate(before!.date)} · Entry ${list.indexOf(before!) + 1}`} variant="secondary" onPress={() => setPicker(picker === 'before' ? null : 'before')} />
          <Button label={`B · ${displayDate(after!.date)} · Entry ${list.indexOf(after!) + 1}`} variant="secondary" onPress={() => setPicker(picker === 'after' ? null : 'after')} />
          {picker && <View style={{ gap: 10 }}><Txt>Choose {picker === 'before' ? 'point A' : 'point B'}</Txt><Chips>{list.map((m, i) => <Chip key={m.id} label={`${displayDate(m.date)} · Entry ${i + 1}`} selected={m.id === (picker === 'before' ? before?.id : after?.id)} onPress={() => {
            if (picker === 'before') { setBeforeId(m.id); setAfterId(after!.id); } else { setAfterId(m.id); setBeforeId(before!.id); } setPicker(null);
          }} />)}</Chips></View>}
          {!distinct && <Body>The same entry is selected twice. Pick a different one to compare.</Body>}
        </Card>
        {distinct && <>
          <Card><Title small>Change in numbers</Title>{pairs.map(pair => <View key={pair.key} style={{ borderBottomWidth: 1, borderColor: colors.line, paddingBottom: 15, gap: 6 }}>
            <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><Txt style={{ fontFamily: fonts.bold }}>{metrics[pair.key].label} · {metrics[pair.key].unit}</Txt><Txt style={{ color: pair.delta === null ? colors.muted : colors.greenDark, fontFamily: fonts.medium, writingDirection: pair.delta && pair.delta !== 0 ? 'ltr' : 'auto' }}>{formatDelta(pair.delta)}{pair.delta !== null && pair.delta !== 0 ? ` ${metrics[pair.key].unit}` : ''}</Txt></Row>
            <Txt style={{ fontSize: 14, color: colors.muted }}>A: {formatNumber(pair.before)} · B: {formatNumber(pair.after)}</Txt>
            {pair.reason === 'side' && <Body>Different sides were measured. Compare the same side.</Body>}
            {pair.reason === 'method' && <Body>Waist measuring methods differ, so they can’t be compared or visualised.</Body>}
          </View>)}</Card>
          <Card style={{ backgroundColor: colors.mint }}><Title small>Data overview</Title><ComparisonChart comparisons={pairs} /></Card>
          {data!.settings.showBodyChanges ? <Card style={{ backgroundColor: colors.sage, borderWidth: 0 }}><Title small>Your avatar on the journey</Title>
            <Row style={{ justifyContent: 'space-around', flexDirection: stacked ? 'column' : rtlRow, gap: 16 }}>
              <View><Avatar appearance={data!.profile!.avatar} size={135} label="Stylised avatar for point A, in the base pose" /><Txt style={{ textAlign: 'center', fontFamily: fonts.bold }}>A · {displayDate(before.date)}</Txt></View>
              <View><Avatar appearance={data!.profile!.avatar} shape={avatarInfo.shape} size={135} label={`Stylised avatar for point B. ${avatarInfo.comparable ? avatarInfo.changedMetrics.length ? `Changed by ${avatarInfo.changedMetrics.map(k => metrics[k].label).join(', ')}` : 'no change in measured circumferences' : 'no shared circumferences; body shape unchanged in the illustration'}`} /><Txt style={{ textAlign: 'center', fontFamily: fonts.bold }}>B · {displayDate(after.date)}</Txt></View>
            </Row>
            <Txt style={{ fontFamily: fonts.medium }}>Stylised illustration based on your data</Txt>
            <Body>{avatarInfo.comparable ? 'Only circumferences measured in both entries, on the same side, affect the illustration. Changes are subtle; a circumference can grow or shrink.' : 'To visualise change, you need the same circumference in both entries (same side for arm or thigh). Weight alone doesn’t change the avatar’s shape.'}</Body>
            <InfoNote text="This is an illustration — not a body scan, reconstruction or prediction. You can hide it in settings." />
          </Card> : <Card><Body>The body illustration is hidden per your preference. The numbers are still available.</Body><Button label="Illustration settings" variant="quiet" onPress={() => router.push('/settings')} /></Card>}
        </>}
      </>}
      <Title small>Your history · {list.length} {list.length === 1 ? 'entry' : 'entries'}</Title>
      {!!error && <ErrorNotice text={error} />}
      {[...list].reverse().map(m => <Card key={m.id}>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><Txt style={{ fontFamily: fonts.bold, fontSize: 19, writingDirection: 'ltr' }}>{displayDate(m.date)}</Txt><Badge text={m.id === list[0].id ? 'First measurement' : 'Your measurement'} /></Row>
        {metricKeys.map(k => <Txt key={k} style={{ fontSize: 14, color: m.values[k] === null ? colors.muted : colors.ink }}>{metrics[k].label}{(k === 'arm' || k === 'thigh') && m.values[k] !== null ? ` · ${m.sides[k] === 'right' ? 'right' : 'left'}` : ''}: {formatNumber(m.values[k])}{m.values[k] !== null ? ` ${metrics[k].unit}` : ''}</Txt>)}
        {m.updatedAt !== m.createdAt && <Body>Entry edited on {displayDate(localDate(new Date(m.updatedAt)))}</Body>}
        <Button label={`Edit measurement from ${displayDate(m.date)}`} icon="edit" variant="secondary" onPress={() => router.push({ pathname: '/measurement', params: { id: m.id } })} />
        <ConfirmDelete label="Delete entry" message="Delete this measurement? The rest of your history is kept." busy={deleting !== null} onConfirm={() => remove(m.id)} />
      </Card>)}
    </>}
  </Page>;
}
