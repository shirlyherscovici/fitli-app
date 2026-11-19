import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { InfoNote, Card, Title } from './ui';
import { colors } from '../theme';
export function MeasurementGuide() {
  return <Card style={{ backgroundColor: colors.mint }}>
    <View accessibilityRole="image" accessible accessibilityLabel="Illustration of a measuring tape around the midsection" style={{ alignSelf: 'center' }}>
      <Svg width="110" height="128" viewBox="0 0 110 128" aria-hidden>
        <Circle cx="55" cy="24" r="17" fill="#E5B895" /><Path d="M26 51Q55 39 84 51l-6 27 9 37H23l9-37Z" fill="#95B89D" />
        <Rect x="21" y="74" width="68" height="12" rx="5" fill="#F5D58D" />
        <Path d="M30 74v6m10-6v4m10-4v6m10-6v4m10-4v6m10-6v4" stroke="#755831" strokeWidth="1.5" />
      </Svg>
    </View>
    <Title small>Consistent, no pressure</Title>
    <InfoNote text="Use the same tape, method and spot each time. For arm and thigh, stick to one side. The tape should rest on the skin without squeezing." />
    <InfoNote text="This is a general illustration. A detailed placement guide will follow after professional review; circumferences don’t measure body fat %." />
  </Card>;
}
