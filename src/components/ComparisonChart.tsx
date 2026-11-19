import React from 'react';
import { View } from 'react-native';
import { Comparison, formatNumber } from '../domain/progress';
import { metrics } from '../domain/types';
import { colors, rtlStart } from '../theme';
import { InfoNote, Body, Row, Txt } from './ui';
export function ComparisonChart({ comparisons }: { comparisons: Comparison[] }) {
  return <View style={{ gap: 22 }}>
    <Row style={{ flexWrap: 'wrap' }}><View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: colors.muted }} /><Body>A · earlier measurement</Body><View style={{ width: 12, height: 12, borderRadius: 4, backgroundColor: colors.green }} /><Body>B · later measurement</Body></Row>
    {comparisons.map(pair => {
      const metric = metrics[pair.key];
      const maximum = Math.max(pair.before ?? 0, pair.after ?? 0, 1) * 1.1;
      return <View key={pair.key} style={{ gap: 6 }} accessible accessibilityLabel={`${metric.label}: A ${formatNumber(pair.before)}${pair.before !== null ? ` ${metric.unit}` : ''}, B ${formatNumber(pair.after)}${pair.after !== null ? ` ${metric.unit}` : ''}${pair.reason === 'side' ? '. Different sides, no comparison' : ''}`}>
        <Txt>{metric.label}{pair.reason === 'side' ? ' · Different sides' : ''}</Txt>
        {([['A', pair.before, colors.muted], ['B', pair.after, colors.green]] as const).map(([label, value, color]) => <View key={label} style={{ gap: 4 }}>
          <Txt style={{ fontSize: 13, color: colors.muted }}>{label} · {formatNumber(value)}{value !== null ? ` ${metric.unit}` : ''}</Txt>
          <View style={{ height: 9, borderRadius: 5, backgroundColor: colors.mint, alignItems: rtlStart, overflow: 'hidden' }}>
            {value !== null && pair.reason !== 'side' && pair.reason !== 'method' && <View style={{ height: 9, width: `${value / maximum * 100}%`, backgroundColor: color, borderRadius: 5 }} />}
          </View>
        </View>)}
      </View>;
    })}
    <InfoNote text="Bars are scaled per metric from zero. Missing values, different sides or methods aren’t shown as a valid comparison." />
  </View>;
}
