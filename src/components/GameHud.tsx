import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { GameState, Quest } from '../domain/gamification';
import { colors, fonts, hardShadow, radius, sunset, textOutline } from '../theme';
import { Icon } from './Icon';
import { Row, Txt } from './ui';

const hud = { fontFamily: fonts.display, letterSpacing: 1.5, textTransform: 'uppercase' as const, ...textOutline };

// Sunset stripe across the top of HUD panels.
export function SunsetStripe({ height = 4 }: { height?: number }) {
  return <Svg width="100%" height={height} aria-hidden>
    <Defs><LinearGradient id="sunset" x1="0" y1="0" x2="1" y2="0">{sunset.map((c, i) => <Stop key={c} offset={i / (sunset.length - 1)} stopColor={c} />)}</LinearGradient></Defs>
    <Rect width="100%" height={height} fill="url(#sunset)" />
  </Svg>;
}

function Star({ on, size = 22 }: { on: boolean; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <Path d="M12 2.5l2.9 6.2 6.7.7-5 4.6 1.4 6.6L12 17.3l-5.9 3.3 1.4-6.6-5-4.6 6.7-.7Z" fill={on ? colors.yellow : 'transparent'} stroke={on ? colors.shadow : colors.muted} strokeWidth={1.6} strokeLinejoin="round" />
  </Svg>;
}

export function StreakStars({ streak }: { streak: number }) {
  const lit = Math.min(5, streak);
  return <Row style={{ gap: 2 }}>{[0, 1, 2, 3, 4].map(i => <Star key={i} on={i < lit} />)}</Row>;
}

export function XpBar({ progress, height = 10 }: { progress: number; height?: number }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return <View style={{ height, backgroundColor: colors.track, borderWidth: 2, borderColor: colors.shadow, borderRadius: 1, overflow: 'hidden' }}>
    <View style={{ width: `${pct}%`, height: '100%', backgroundColor: colors.lime }} />
  </View>;
}

export function GameHud({ state }: { state: GameState }) {
  return <View accessible accessibilityLabel={`Level ${state.level} ${state.title}. ${state.xp} XP total, ${state.levelXp} of ${state.levelSize} to next level. ${state.streak} day streak.`}
    style={{ backgroundColor: colors.lavender, borderRadius: radius.card, borderWidth: 2, borderColor: colors.shadow, overflow: 'hidden', ...hardShadow }}>
    <SunsetStripe />
    <View style={{ padding: 14, gap: 10 }}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ gap: 2 }}>
          <Txt style={{ ...hud, fontSize: 16, lineHeight: 18, color: colors.muted }}>LVL {state.level} · {state.title}</Txt>
          <Txt style={{ ...hud, fontSize: 46, lineHeight: 48, color: colors.lime, letterSpacing: 1 }}>{state.xp.toLocaleString('en-US')} XP</Txt>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <StreakStars streak={state.streak} />
          <Txt style={{ ...hud, fontSize: 16, lineHeight: 18, color: state.streak > 0 ? colors.yellow : colors.muted }}>{state.streak}-day streak</Txt>
        </View>
      </Row>
      <XpBar progress={state.progress} />
      <Txt style={{ ...hud, fontSize: 14, lineHeight: 16, color: colors.muted, textShadowRadius: 0 }}>{state.levelSize - state.levelXp} XP to level {state.level + 1} · {state.activeDays} active days</Txt>
      {state.streak > 0 && !state.todayCounted && <Txt style={{ fontSize: 13, lineHeight: 20, color: colors.yellow }}>Log anything today to keep your {state.streak}-day streak alive.</Txt>}
      {state.shieldUsed && <Txt style={{ fontSize: 13, lineHeight: 20, color: colors.cyan }}>🛡 A streak shield covered a missed day this week. Life happens — you’re still on track.</Txt>}
    </View>
  </View>;
}

export function QuestList({ quests }: { quests: Quest[] }) {
  const done = quests.filter(q => q.done).length;
  return <View style={{ gap: 8 }}>
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt accessibilityRole="header" style={{ ...hud, fontSize: 30, lineHeight: 34 }}>Today’s objectives</Txt>
      <Txt style={{ ...hud, fontSize: 22, color: colors.lime }}>{done}/{quests.length}</Txt>
    </Row>
    {quests.map(q => <Row key={q.id} style={{ gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.control, backgroundColor: q.done ? colors.mint : colors.surface, borderWidth: 2, borderColor: colors.shadow, borderLeftWidth: 5, borderLeftColor: q.done ? colors.lime : colors.yellow }}>
      <View style={{ width: 26, height: 26, borderRadius: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: q.done ? colors.lime : 'transparent', borderWidth: 2, borderColor: q.done ? colors.shadow : colors.yellow }}>
        {q.done && <Icon name="check" size={16} color={colors.shadow} />}
      </View>
      <Txt accessibilityState={{ checked: q.done }} style={{ flex: 1, fontFamily: fonts.medium, color: q.done ? colors.muted : colors.yellow, textDecorationLine: q.done ? 'line-through' : 'none' }}>{q.title}</Txt>
      <Txt style={{ ...hud, fontSize: 20, color: q.done ? colors.muted : colors.lime }}>+{q.xp}</Txt>
    </Row>)}
  </View>;
}
