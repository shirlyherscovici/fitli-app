import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Rect, Stop } from 'react-native-svg';
import { colors } from '../theme';

// Original night-city backdrop: sunset sky, striped sun, skyline with lit
// windows, fading into the asphalt background. Drawn procedurally (seeded) so
// it's identical on every render and costs no image download.
const W = 400, H = 240, HORIZON = 170;
function seeded(seed: number) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
type Building = { x: number; w: number; h: number; windows: { x: number; y: number }[] };
const buildings: Building[] = (() => {
  const rnd = seeded(7), out: Building[] = [];
  for (let x = -6; x < W;) {
    const w = 18 + Math.floor(rnd() * 34), h = 22 + Math.floor(rnd() * (rnd() > 0.85 ? 80 : 44));
    const windows: Building['windows'] = [];
    for (let wy = HORIZON - h + 8; wy < HORIZON - 6; wy += 9)
      for (let wx = x + 4; wx < x + w - 5; wx += 7) if (rnd() > 0.72) windows.push({ x: wx, y: wy });
    out.push({ x, w, h, windows }); x += w + (rnd() > 0.7 ? 3 : 0);
  }
  return out;
})();
const far = (() => { const rnd = seeded(31), out: { x: number; w: number; h: number }[] = []; for (let x = 0; x < W;) { const w = 14 + rnd() * 26; out.push({ x, w, h: 16 + rnd() * 56 }); x += w; } return out; })();

export function CityBackdrop({ height = 260, sun = true }: { height?: number; sun?: boolean }) {
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, left: 0, right: 0, height }}>
    <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#120A24" /><Stop offset="0.45" stopColor="#4A1450" /><Stop offset="0.75" stopColor="#C8285E" /><Stop offset="1" stopColor="#FF7A1A" />
        </LinearGradient>
        <LinearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#FFD400" /><Stop offset="1" stopColor="#FF2E88" /></LinearGradient>
        <LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.background} stopOpacity="0" /><Stop offset="1" stopColor={colors.background} stopOpacity="1" /></LinearGradient>
      </Defs>
      <Rect width={W} height={HORIZON} fill="url(#sky)" />
      {sun && <>
      <Circle cx={215} cy={HORIZON - 52} r={44} fill="url(#sun)" />
      {[0, 1, 2, 3, 4].map(i => <Rect key={i} x={165} y={HORIZON - 66 + i * 7} width={100} height={1.5 + i * 0.8} fill="#C8285E" />)}
      </>}
      <G opacity={0.55}>{far.map((b, i) => <Rect key={i} x={b.x} y={HORIZON - b.h} width={b.w + 1} height={b.h} fill="#2A0F33" />)}</G>
      {buildings.map((b, i) => <G key={i}>
        <Rect x={b.x} y={HORIZON - b.h} width={b.w} height={b.h} fill="#07070A" />
        {b.windows.map((w, j) => <Rect key={j} x={w.x} y={w.y} width={3} height={4} fill={j % 5 === 0 ? '#FF7A1A' : '#FFD400'} opacity={0.85} />)}
      </G>)}
      <Rect y={HORIZON} width={W} height={H - HORIZON} fill={colors.background} />
      <Rect y={HORIZON - 70} width={W} height={70} fill="url(#fade)" opacity={0.35} />
      <Rect y={HORIZON - 1} width={W} height={2} fill="#FF2E88" opacity={0.7} />
    </Svg>
  </View>;
}
