import React from 'react';
import { View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { GameState, Quest } from '../domain/gamification';
import { colors, fonts } from '../theme';
import { Icon } from './Icon';
import { Row, Txt } from './ui';

function Flame({ size = 30, lit }: { size?: number; lit: boolean }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <Defs><LinearGradient id="flame" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={colors.yellow} /><Stop offset="1" stopColor={colors.coral} /></LinearGradient></Defs>
    <Path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9Z" fill={lit ? 'url(#flame)' : colors.line} />
    <Path d="M12 13c1 1.5 2.5 2.5 2.5 4.5a2.5 2.5 0 0 1-5 0c0-1.5 1-2.5 2.5-4.5Z" fill={lit ? '#FFF4C2' : colors.raised} />
  </Svg>;
}

function LevelGem({ level }: { level: number }) {
  return <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
    <Svg width={64} height={64} viewBox="0 0 64 64" style={{ position: 'absolute' }} aria-hidden>
      <Defs><LinearGradient id="gem" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="#B794FF" /><Stop offset="1" stopColor="#5B32C9" /></LinearGradient></Defs>
      <Path d="M32 3 58 18v28L32 61 6 46V18Z" fill="url(#gem)" stroke="#D9C8FF" strokeWidth="2" />
    </Svg>
    <Txt style={{ fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 28, color: colors.onPrimary, textAlign: 'center' }}>{level}</Txt>
  </View>;
}

export function XpBar({ progress, height = 14 }: { progress: number; height?: number }) {
  const pct = Math.max(0, Math.min(1, progress)) * 100;
  return <View style={{ height, borderRadius: height, backgroundColor: colors.track, overflow: 'hidden' }}>
    <Svg width={`${pct}%`} height={height} aria-hidden>
      <Defs><LinearGradient id="xp" x1="0" y1="0" x2="1" y2="0"><Stop offset="0" stopColor={colors.lime} /><Stop offset="1" stopColor={colors.teal} /></LinearGradient></Defs>
      <Rect width="100%" height={height} rx={height / 2} fill="url(#xp)" />
    </Svg>
  </View>;
}

export function GameHud({ state }: { state: GameState }) {
  return <View accessible accessibilityLabel={`Level ${state.level} ${state.title}. ${state.levelXp} of ${state.levelSize} XP to next level. ${state.streak} day streak.`}
    style={{ backgroundColor: colors.surface, borderRadius: 24, padding: 16, gap: 12, borderWidth: 1.5, borderBottomWidth: 5, borderColor: colors.line }}>
    <Row style={{ gap: 14 }}>
      <LevelGem level={state.level} />
      <View style={{ flex: 1, gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24 }}>{state.title}</Txt>
          <Txt style={{ fontFamily: fonts.display, fontSize: 13, color: colors.lime }}>{state.levelXp} / {state.levelSize} XP</Txt>
        </Row>
        <XpBar progress={state.progress} />
        <Txt style={{ fontSize: 12, lineHeight: 18, color: colors.muted }}>{state.xp} XP total · {state.activeDays} active days</Txt>
      </View>
      <View style={{ alignItems: 'center', minWidth: 56 }}>
        <Flame lit={state.streak > 0} />
        <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 24, color: state.streak > 0 ? colors.yellow : colors.muted }}>{state.streak}</Txt>
        <Txt style={{ fontSize: 11, lineHeight: 14, color: colors.muted }}>day streak</Txt>
      </View>
    </Row>
    {state.streak > 0 && !state.todayCounted && <Txt style={{ fontSize: 13, lineHeight: 20, color: colors.yellow }}>Log anything today to keep your {state.streak}-day streak alive 🔥</Txt>}
    {state.shieldUsed && <Txt style={{ fontSize: 13, lineHeight: 20, color: colors.cyan }}>🛡 A streak shield covered a missed day this week. Life happens — you’re still on track.</Txt>}
  </View>;
}

export function QuestList({ quests }: { quests: Quest[] }) {
  const done = quests.filter(q => q.done).length;
  return <View style={{ gap: 10 }}>
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt accessibilityRole="header" style={{ fontFamily: fonts.displayBold, fontSize: 22, lineHeight: 28 }}>Daily quests</Txt>
      <Txt style={{ fontFamily: fonts.display, color: colors.lime }}>{done}/{quests.length}</Txt>
    </Row>
    {quests.map(q => <Row key={q.id} style={{ gap: 12, padding: 14, borderRadius: 18, backgroundColor: q.done ? colors.mint : colors.surface, borderWidth: 1.5, borderColor: q.done ? colors.mintEdge : colors.line }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: q.done ? colors.teal : colors.raised }}>
        {q.done ? <Icon name="check" size={18} color={colors.background} /> : <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.line }} />}
      </View>
      <Txt accessibilityState={{ checked: q.done }} style={{ flex: 1, fontFamily: fonts.medium, color: q.done ? colors.muted : colors.ink, textDecorationLine: q.done ? 'line-through' : 'none' }}>{q.title}</Txt>
      <Txt style={{ fontFamily: fonts.display, color: q.done ? colors.teal : colors.lime }}>+{q.xp} XP</Txt>
    </Row>)}
  </View>;
}
