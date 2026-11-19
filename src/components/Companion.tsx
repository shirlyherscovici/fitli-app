import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import { colors, fonts, hardShadow, radius } from '../theme';
import { Row, Txt } from './ui';

// "Coach" — Fitli's original street-style guide: cap, hoodie, headphones.
export function CoachFace({ size = 64 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
    <Rect width="64" height="64" fill="#2B1708" />
    <Path d="M8 64c2-14 12-20 24-20s22 6 24 20Z" fill="#1F1F28" />
    <Path d="M26 46l6 8 6-8" stroke={colors.green} strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <Rect x="27" y="38" width="10" height="9" fill="#B9785A" />
    <Ellipse cx="32" cy="29" rx="13" ry="14" fill="#C98A69" />
    <Path d="M18 25c0-10 6-15 14-15s14 5 14 15Z" fill={colors.green} />
    <Path d="M30 22h24c2 0 2 4 0 4H30Z" fill="#9C3F00" />
    <Path d="M15 30a17 17 0 0 1 34 0" stroke={colors.purple} strokeWidth="3" fill="none" />
    <Rect x="12" y="27" width="7" height="11" rx="2" fill={colors.purple} stroke="#000" strokeWidth="1.5" />
    <Rect x="45" y="27" width="7" height="11" rx="2" fill={colors.purple} stroke="#000" strokeWidth="1.5" />
    <Circle cx="27" cy="30" r="1.8" fill="#0A0A0D" /><Circle cx="37" cy="30" r="1.8" fill="#0A0A0D" />
    <Path d="M24 26.5l5-1M35 25.5l5 1" stroke="#0A0A0D" strokeWidth="1.6" strokeLinecap="round" />
    <Path d="M27 36q5 3.5 10 0" stroke="#0A0A0D" strokeWidth="1.8" fill="none" strokeLinecap="round" />
  </Svg>;
}

// Game-style dialogue box: portrait + name tag + line.
export function Companion({ message = 'Every log is a small step forward.' }: { message?: string }) {
  return <Row style={{ gap: 12, alignItems: 'stretch', backgroundColor: colors.lavender, padding: 10, borderRadius: radius.card, borderWidth: 2, borderColor: colors.shadow, ...hardShadow }}>
    <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ borderWidth: 2, borderColor: colors.green, borderRadius: 2, overflow: 'hidden', alignSelf: 'flex-start' }}>
      <CoachFace />
    </View>
    <View style={{ flex: 1, gap: 4, justifyContent: 'center' }}>
      <Txt style={{ fontFamily: fonts.display, fontSize: 16, lineHeight: 18, letterSpacing: 1.5, color: colors.green }}>COACH</Txt>
      <Txt style={{ fontFamily: fonts.medium, fontSize: 15, lineHeight: 22 }}>{message}</Txt>
    </View>
  </Row>;
}
