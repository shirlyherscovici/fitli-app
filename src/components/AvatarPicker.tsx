import React from 'react';
import { View } from 'react-native';
import { AvatarStyle } from '../domain/types';
import { Body, Chip, Chips, Txt } from './ui';
import { Avatar } from './Avatar';

export function AvatarPicker({ value, onChange }: { value: AvatarStyle; onChange: (style: AvatarStyle) => void }) {
  return <View style={{ gap: 16 }}>
    <Avatar appearance={value} size={150} />
    <Body>The avatar is based on a real photo so the start-vs-goal comparison is clear.</Body>
    <Txt>Avatar style</Txt><Chips><Chip label="Feminine" selected={value.silhouette === 'feminine'} onPress={() => onChange({ ...value, silhouette: 'feminine' })} /><Chip label="Masculine" selected={value.silhouette === 'masculine'} onPress={() => onChange({ ...value, silhouette: 'masculine' })} /></Chips>
  </View>;
}
