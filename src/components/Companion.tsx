import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import { colors, fonts } from '../theme';
import { Row, Txt } from './ui';

// Original Fitli sprout: a purple seed with a coral leaf.
export function Companion({ message = 'Every log is a small step forward.' }: { message?: string }) {
  return <Row style={{ gap: 12, backgroundColor: colors.lavender, padding: 14, borderRadius: 22 }}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 58, height: 65 }}>
      <Svg width="58" height="65" viewBox="0 0 80 90" aria-hidden>
        <Ellipse cx="40" cy="83" rx="25" ry="4" fill={colors.line} />
        <Path d="M37 24Q33 4 51 5Q61 17 37 24" fill={colors.coral} />
        <Path d="M20 31Q40 15 60 31Q76 57 60 76Q40 85 20 76Q4 58 20 31" fill={colors.purple} />
        <Path d="M19 57Q7 50 5 58M60 56Q70 46 72 37" stroke={colors.purple} strokeWidth="9" strokeLinecap="round" fill="none" />
        <Ellipse cx="29" cy="45" rx="6" ry="9" fill="white" /><Ellipse cx="51" cy="45" rx="6" ry="9" fill="white" />
        <Circle cx="31" cy="46" r="3" fill={colors.ink} /><Circle cx="49" cy="46" r="3" fill={colors.ink} />
        <Path d="M32 62Q40 69 48 62" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
        <Ellipse cx="24" cy="59" rx="5" ry="3" fill="#F99FA5" /><Ellipse cx="56" cy="59" rx="5" ry="3" fill="#F99FA5" />
      </Svg>
    </View>
    <Txt style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 25 }}>{message}</Txt>
  </Row>;
}
