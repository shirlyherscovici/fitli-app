import React, { useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { useAppData } from '../data/AppProvider';
import { macroLabels, summarizeMeals } from '../domain/nutrition';
import { colors, fonts, rtlStart } from '../theme';
import { Badge, Body, Button, Card, ErrorNotice, Row, Title, Txt } from './ui';

const number = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(v);
const calories = (v: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits:0 }).format(v);
export function NutritionSummary({ compact = false, date, logAction = false }: { compact?: boolean; date?: string; logAction?: boolean }) {
  const [details,setDetails] = useState(false);
  const { data, today, dayError, retryDay } = useAppData();
  const { width,fontScale } = useWindowDimensions();
  const numericSize = compact ? 30 : width < 360 || fontScale * (data?.settings.textScale ?? 1) > 1.2 ? 34 : 46;
  const selected = date ?? today;
  const target = data!.dailyTargets.find(t => t.date === selected)?.nutrition ?? null;
  const updatedTarget = data!.plans.at(-1)?.nutrition;
  const summary = summarizeMeals(data!.meals.filter(m => m.date === selected), target);
  return <Card style={{ backgroundColor: compact ? colors.surface : colors.lavender, borderColor: colors.line, gap: compact ? 10 : 16 }}>
    <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}><Badge text="FUEL TODAY" /><Txt style={{ fontSize: 12, color: colors.muted }}>What you actually ate</Txt></Row>
    {summary.remaining !== null ? <>
      <Txt style={{ fontSize:numericSize,lineHeight:numericSize*1.2, color: summary.remaining < 0 ? colors.coral : colors.lime, fontFamily: fonts.displayBold }}>{calories(Math.abs(summary.remaining))}</Txt>
      <Txt style={{ fontFamily: fonts.bold, fontSize: 18 }}>{summary.remaining < 0 ? "kcal over today's target" : 'kcal left today'}</Txt>
    </> : <Title small>{target ? 'Partial calorie total' : "Let's set your target"}</Title>}
    <Row style={{ flexWrap: 'wrap', justifyContent: 'space-between' }}><Txt>Eaten: {summary.missing.calories ? 'at least ' : ''}{calories(summary.totals.calories)} kcal</Txt><Txt>Target: {target ? `${calories(target.calories)} kcal` : 'not set yet'}</Txt></Row>
    {!!target && !!updatedTarget && (target.calories !== updatedTarget.calories || target.protein !== updatedTarget.protein) && <Body>This is the target saved for this day. Your updated plan starts on a new day, and history is kept.</Body>}
    {!target && <><Body>No made-up target. You can log food right now and finish your calculation details in your profile.</Body><Button label="Complete profile & nutrition target" variant="secondary" onPress={() => router.push('/profile')} /></>}
    {logAction && <Button label="Log a meal" icon="plus" onPress={() => router.push('/meal')} />}
    {summary.macros.map((macro, index) => {
      const color = [colors.purple, colors.coral, colors.teal][index];
      return <View key={macro.key} style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 5 }}><Txt style={{ color, fontFamily: fonts.display }}>{macroLabels[macro.key]}</Txt><Txt style={{ fontFamily: fonts.medium, fontSize: 14 }}>{macro.partial ? 'at least ' : ''}{number(macro.grams)} / {macro.target === null ? '—' : number(macro.target)} g</Txt></Row>
        <View accessible accessibilityLabel={`${macroLabels[macro.key]}: ${macro.progressPercent === null ? 'no full target to measure progress' : `${number(macro.progressPercent)} percent of gram target`}`} style={{ height: 10, backgroundColor: colors.track, borderRadius: 8, overflow: 'hidden' }}><View style={{ alignSelf: rtlStart, height: '100%', width: `${Math.min(100, Math.max(0, macro.progressPercent ?? 0))}%`, backgroundColor: color, borderRadius: 8 }} /></View>
        {!compact && details && <Txt style={{ fontSize: 12, lineHeight: 20, color: colors.muted }}>{macro.progressPercent === null ? 'Progress: —' : `${number(macro.progressPercent)}% of gram target`} · of eaten kcal: {macro.eatenEnergyPercent === null ? '—' : `${number(macro.eatenEnergyPercent)}%`} · planned: {macro.plannedEnergyPercent === null ? '—' : `${number(macro.plannedEnergyPercent)}%`}</Txt>}
      </View>;
    })}
    {summary.partial && <ErrorNotice text="Some meals are missing values. Known totals are marked 'at least'; missing remainders and percentages are never shown as zero." />}
    {!compact && <><Button label={details ? 'Hide the math' : 'How are targets calculated?'} variant="quiet" onPress={() => setDetails(!details)} />{details && <Body>Energy split uses 4/9/4 kcal per gram. Label rounding, fibre and alcohol can make totals differ from 100%. The target is a planning estimate; workouts don’t add calories back.</Body>}</>}
    {dayError && <><ErrorNotice text="We couldn't save today's target. Try again — previous targets are safe." /><Button label="Retry saving today's target" variant="secondary" onPress={retryDay} /></>}
  </Card>;
}
