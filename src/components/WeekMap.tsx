import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { PlannedSession } from '../domain/types';
import { legacyText } from '../domain/legacyText';
import { colors, fonts, hardShadow, radius, textOutline } from '../theme';
import { Icon, IconName } from './Icon';
import { Badge, Button, Card, Row, Txt } from './ui';

const short = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const long = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const icon = (kind: PlannedSession['kind']): IconName => kind === 'rest' ? 'leaf' : kind === 'running' ? 'heart' : 'dumbbell';

// The week as a strip of mission tiles; tap one to open its briefing below.
export function WeekMap({ weekly, todayIndex, done, dateForDay }: {
  weekly: PlannedSession[]; todayIndex: number; done: (s: PlannedSession) => boolean; dateForDay: (day: number) => string;
}) {
  const [selected, setSelected] = useState(todayIndex);
  const days = [...weekly].sort((a, b) => a.day - b.day);
  const s = days.find(d => d.day === selected) ?? days[0];
  const cleared = days.filter(d => d.kind !== 'rest' && done(d)).length, total = days.filter(d => d.kind !== 'rest').length;
  const isDone = done(s), past = s.day < todayIndex, future = s.day > todayIndex;

  return <View style={{ gap: 12 }}>
    <Row style={{ justifyContent: 'space-between' }}>
      <Txt accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 34, letterSpacing: 1.5, ...textOutline }}>THIS WEEK’S MAP</Txt>
      <Txt style={{ fontFamily: fonts.display, fontSize: 20, letterSpacing: 1.5, color: colors.lime }}>{cleared}/{total} CLEARED</Txt>
    </Row>
    <Row style={{ gap: 5, alignItems: 'stretch' }}>
      {days.map(d => {
        const isToday = d.day === todayIndex, active = d.day === selected, ok = done(d), rest = d.kind === 'rest';
        const tint = ok ? colors.lime : rest ? colors.muted : isToday ? colors.green : colors.yellow;
        return <Pressable key={d.day} accessibilityRole="tab" accessibilityState={{ selected: active }}
          accessibilityLabel={`${long[d.day]}${isToday ? ', today' : ''}: ${legacyText(d.title)}${ok ? ', done' : rest ? ', rest' : ''}`}
          onPress={() => setSelected(d.day)}
          style={({ pressed }) => [{ flex: 1, minHeight: 72, paddingVertical: 8, alignItems: 'center', justifyContent: 'space-between', gap: 4,
            backgroundColor: active ? colors.sage : ok ? colors.mint : colors.surface, borderRadius: radius.control, borderWidth: 2,
            borderColor: active ? colors.green : colors.shadow, ...(active ? hardShadow : {}) }, pressed && { opacity: 0.75 }]}>
          <Txt style={{ fontFamily: fonts.display, fontSize: 15, lineHeight: 16, letterSpacing: 1, color: isToday ? colors.green : colors.muted }}>{short[d.day]}</Txt>
          {ok ? <Icon name="check" size={22} color={colors.lime} /> : <Icon name={icon(d.kind)} size={20} color={tint} />}
          <View style={{ height: 4, width: '70%', backgroundColor: isToday ? colors.green : 'transparent' }} />
        </Pressable>;
      })}
    </Row>
    <Card style={{ backgroundColor: s.kind === 'rest' ? colors.mint : colors.peach, borderLeftWidth: 6, borderLeftColor: isDone || s.kind === 'rest' ? colors.lime : colors.purple }}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Badge text={`${long[s.day]}${s.day === todayIndex ? ' · today' : ''} · ${s.kind === 'rest' ? 'side mission' : 'main mission'}`} />
        {s.example && <Badge text="Sample content" kind="example" />}
      </Row>
      <Txt style={{ fontFamily: fonts.display, fontSize: 34, lineHeight: 36, letterSpacing: 1, textTransform: 'uppercase', ...textOutline }}>{legacyText(s.title)}</Txt>
      <Txt style={{ color: isDone ? colors.lime : colors.yellow, fontFamily: fonts.medium }}>
        {isDone ? 'Cleared ✓' : s.kind === 'rest' ? 'Objective: recover and recharge.' : `Objective: train ${s.duration} min${future ? ' · coming up' : past ? ' · missed? You can still log it' : ' · +50 XP'}`}
      </Txt>
      <Button label={s.kind === 'rest' ? 'Open rest day' : isDone ? 'View workout' : future ? 'Preview workout' : 'Start workout'} icon={s.kind === 'rest' ? 'leaf' : 'dumbbell'} variant={s.day === todayIndex && !isDone ? 'primary' : 'secondary'}
        onPress={() => router.push({ pathname: '/workout', params: { date: dateForDay(s.day) } })} />
    </Card>
  </View>;
}
