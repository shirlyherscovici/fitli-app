import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Pressable, View } from 'react-native';
import { Celebration, useAppData } from '../data/AppProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, fonts, textOutline } from '../theme';
import { SunsetStripe, StreakStars } from './GameHud';
import { Txt } from './ui';

const SHOW_MS = 3200;
const big = { fontFamily: fonts.display, textTransform: 'uppercase' as const, textAlign: 'center' as const, ...textOutline };

// Full-screen reward moment after any save that earned XP. Tap to dismiss.
export function MissionComplete() {
  const { celebration, dismissCelebration } = useAppData();
  const reduced = useReducedMotion();
  if (!celebration) return null;
  return <Banner key={celebration.id} c={celebration} reduced={reduced} onDone={dismissCelebration} />;
}

function Banner({ c, reduced, onDone }: { c: Celebration; reduced: boolean; onDone: () => void }) {
  const [slide] = useState(() => new Animated.Value(reduced ? 1 : 0));
  const [bandX] = useState(() => slide.interpolate({ inputRange: [0, 1], outputRange: [-500, 0] }));
  const [shownXp, setShownXp] = useState(reduced ? c.xp : 0);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`${c.subtitle}. ${c.title}. Plus ${c.xp} XP.${c.levelUp ? ` Level up! Level ${c.levelUp}.` : ''}`);
    const done = setTimeout(onDone, SHOW_MS);
    if (reduced) return () => clearTimeout(done);
    Animated.spring(slide, { toValue: 1, useNativeDriver: false, friction: 7, tension: 60 }).start();
    const started = Date.now();
    const tick = setInterval(() => {
      const t = Math.min(1, (Date.now() - started) / 700);
      setShownXp(Math.round(c.xp * t));
      if (t === 1) clearInterval(tick);
    }, 30);
    return () => { clearInterval(tick); clearTimeout(done); };
  }, [c, reduced, slide, onDone]);

  return <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={onDone}
    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(5,5,8,0.82)', justifyContent: 'center', zIndex: 100 }}>
    <Animated.View style={{ transform: [{ translateX: bandX }], opacity: slide }}>
      <SunsetStripe height={6} />
      <View style={{ backgroundColor: '#000', paddingVertical: 22, paddingHorizontal: 16, gap: 6, alignItems: 'center' }}>
        <Txt style={{ ...big, fontSize: 22, lineHeight: 24, letterSpacing: 4, color: colors.yellow }}>{c.subtitle}</Txt>
        <Txt style={{ ...big, fontSize: 52, lineHeight: 54, letterSpacing: 2, color: colors.ink }}>{c.title}</Txt>
        <Txt style={{ ...big, fontSize: 44, lineHeight: 46, letterSpacing: 2, color: colors.lime }}>+{shownXp} XP</Txt>
        {c.levelUp && <Txt style={{ ...big, fontSize: 30, lineHeight: 32, letterSpacing: 3, color: colors.purple }}>Level up · LVL {c.levelUp}</Txt>}
        <View style={{ marginTop: 6, alignItems: 'center', gap: 4 }}>
          <StreakStars streak={c.streak} />
          <Txt style={{ ...big, fontSize: 16, lineHeight: 18, letterSpacing: 1.5, color: colors.yellow }}>{c.streak}-day streak</Txt>
        </View>
      </View>
      <SunsetStripe height={6} />
    </Animated.View>
    <Txt style={{ ...big, marginTop: 18, fontSize: 14, color: colors.muted, letterSpacing: 2 }}>Tap to continue</Txt>
  </Pressable>;
}
