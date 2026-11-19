import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';
import { Measurement, Profile } from '../domain/types';
import { formatNumber, sortMeasurements } from '../domain/progress';
import { displayDate } from '../domain/validation';
import { Body, Title, Txt } from './ui';
import { colors } from '../theme';

const W = 320, H = 150, M = 14;

export function WeightTrend({ measurements, profile }: { measurements: Measurement[]; profile: Profile }) {
  const points = sortMeasurements(measurements.filter(m => m.values.weight !== null));
  if (points.length < 2) return null;
  const weights = points.map(p => p.values.weight!);
  const values = profile.targetWeight !== null ? [...weights, profile.targetWeight] : weights;
  const min = Math.min(...values), max = Math.max(...values);
  const pad = Math.max((max - min) * 0.2, 1);
  const lo = min - pad, hi = max + pad;
  const x = (i: number) => M + (i / (points.length - 1)) * (W - 2 * M);
  const y = (w: number) => H - M - ((w - lo) / (hi - lo)) * (H - 2 * M);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.values.weight!)}`).join(' ');
  const goalY = profile.targetWeight !== null ? y(profile.targetWeight) : null;
  const label = `Weight trend chart across ${points.length} measurements: ${points.map(p => `${displayDate(p.date)} · ${formatNumber(p.values.weight)} kg`).join(', ')}.${profile.targetWeight !== null ? ` Goal line: ${formatNumber(profile.targetWeight)} kg.` : ''}`;
  return <View style={{ gap: 10 }}>
    <Title small>Your weight trend</Title>
    <View accessible accessibilityLabel={label} accessibilityLanguage="en">
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
        {goalY !== null && <Line x1={M} y1={goalY} x2={W - M} y2={goalY} stroke={colors.terracotta} strokeDasharray="4 5" strokeWidth={1.5} />}
        <Path d={path} stroke={colors.green} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => <Circle key={p.id} cx={x(i)} cy={y(p.values.weight!)} r={4.5} fill={colors.greenDark} />)}
      </Svg>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Txt style={{ fontSize: 12, color: colors.muted }}>{displayDate(points[0].date)} · {formatNumber(points[0].values.weight)} kg</Txt>
      <Txt style={{ fontSize: 12, color: colors.muted }}>{displayDate(points.at(-1)!.date)} · {formatNumber(points.at(-1)!.values.weight)} kg</Txt>
    </View>
    {profile.targetWeight !== null && <Body>The dashed line marks the goal weight from your profile, {formatNumber(profile.targetWeight)} kg.</Body>}
  </View>;
}
