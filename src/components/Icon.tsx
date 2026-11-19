import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';
export type IconName = 'home' | 'food' | 'dumbbell' | 'chart' | 'plus' | 'check' | 'arrow' | 'settings' | 'ruler' | 'leaf' | 'close' | 'edit' | 'lock' | 'heart' | 'coffee';
const paths: Record<IconName, string> = {
  home: 'M3 10L12 3l9 7v10H3V10M9 20v-7h6v7',
  food: 'M5 3v7m3-7v7M2 3v7c0 3 6 3 6 0m-3 3v8M17 3c-4 3-4 10 0 10h3V3h-3m1 10v8',
  dumbbell: 'M8 12h8M3 8v8m3-11v14m12-14v14m3-11v8M3 12h3m12 0h3',
  chart: 'M4 3v17h17M8 15l4-5 4 2 5-7',
  plus: 'M12 5v14M5 12h14', check: 'M5 12l4 4L19 6', arrow: 'M8 5l7 7-7 7',
  settings: 'M9 3h6l1 3 3 1 2 5-2 4-3 1-1 4H9l-1-4-3-1-2-4 2-5 3-1 1-3Z',
  ruler: 'M4 4h16v16H4V4m4 0v5m4-5v3m4-3v5',
  leaf: 'M5 19C-1 8 9 2 21 3c1 12-5 19-16 16M5 19L16 8',
  close: 'M6 6l12 12M18 6 6 18', edit: 'M4 16l-1 5 5-1L21 7l-4-4L4 16m10-10 4 4',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10m7 5v2',
  heart: 'M12 20L3 11C-1 4 8 0 12 7c4-7 13-3 9 4l-9 9',
  coffee: 'M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8m13 1h2a2.5 2.5 0 0 1 0 5h-2M8 2c-1 1.5 1 2-0.3 3.5M12 2c-1 1.5 1 2-0.3 3.5',
};
export function Icon({ name, size = 24, color = colors.green }: { name: IconName; size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <Path d={paths[name]} stroke={color} strokeWidth={1.7} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    {name === 'settings' && <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth={1.7} fill="none" />}
    {name === 'ruler' && <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth={1.7} fill="none" />}
  </Svg>;
}
