import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from '../../components/Avatar';
import { Companion } from '../../components/Companion';
import { GameHud, QuestList } from '../../components/GameHud';
import { NutritionSummary } from '../../components/NutritionSummary';
import { Badge, Body, Button, Card, IconButton, Page, Row, Title, Txt } from '../../components/ui';
import { useAppData } from '../../data/AppProvider';
import { activityByDay, dailyQuests, gameState } from '../../domain/gamification';
import { currentDayIndex, latestPlan } from '../../domain/planning';
import { legacyText } from '../../domain/legacyText';
import { colors, fonts } from '../../theme';

const weekDaysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const prettyDate = (date: string) => { const [, m, d] = date.split('-'); return `${months[Number(m) - 1]} ${Number(d)}`; };

export default function Today() {
  const { data, today } = useAppData();
  const profile = data!.profile!, plan = latestPlan(data!.plans);
  const { width, fontScale } = useWindowDimensions();
  const compactHeader = width < 380 || fontScale * (data!.settings.textScale ?? 1) > 1.2;
  const session = plan?.weekly.find(s => s.day === currentDayIndex(today));
  const game = useMemo(() => gameState(data!.meals, data!.workouts, data!.measurements, today), [data, today]);
  const quests = useMemo(() => dailyQuests(activityByDay(data!.meals, data!.workouts, data!.measurements).get(today), session?.kind), [data, today, session?.kind]);
  const trainedToday = data!.workouts.some(w => w.date === today && w.kind === session?.kind);
  const isRest = session?.kind === 'rest';
  const companion = game.todayCounted ? 'Nice — today counts! Every log feeds your streak and your avatar.'
    : isRest ? 'Recovery is part of the plan. Log your rest day to keep the streak.'
    : 'One step at a time. A meal or a workout — start with whatever fits right now.';

  return <Page>
    <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: compactHeader ? 'column' : 'row' }}>
      <View style={{ flex: compactHeader ? undefined : 1 }}>
        <Txt style={{ color: colors.purple, fontFamily: fonts.displayBold, fontSize: 18, letterSpacing: 1 }}>FITLI</Txt>
        <Title small>Hey {profile.name} 👋</Title>
        <Body>{weekDaysEn[currentDayIndex(today)]} · {prettyDate(today)}</Body>
      </View>
      <Row>
        <IconButton name="edit" label="Edit profile and goals" onPress={() => router.push('/profile')} />
        <IconButton name="settings" label="Settings and data" onPress={() => router.push('/settings')} />
      </Row>
    </Row>

    <GameHud state={game} />

    {!plan ? <Card style={{ backgroundColor: colors.peach, borderColor: colors.peachEdge }}>
      <Title small>Let’s build your plan</Title>
      <Body>Your profile and measurements are saved. Fill in the new details and we’ll build a weekly schedule and nutrition targets.</Body>
      <Button label="Build my plan" icon="arrow" onPress={() => router.push('/profile')} />
    </Card> : <Card style={{ backgroundColor: isRest ? colors.mint : colors.peach, borderColor: isRest ? colors.mintEdge : colors.peachEdge }}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Badge text={isRest ? 'RECOVERY DAY' : 'TODAY\'S MISSION'} />
        {session?.example && <Badge text="SAMPLE CONTENT" kind="example" />}
      </Row>
      <Txt style={{ fontFamily: fonts.displayBold, fontSize: 24, lineHeight: 30 }}>{legacyText(session?.title ?? '')}</Txt>
      <Body>{isRest ? 'Recovery is part of training. No extra workout needed today.' : `${session?.duration} min planned · ${trainedToday ? '✅ done today' : 'not logged yet'}`}</Body>
      <Button label={isRest ? 'Open rest day' : trainedToday ? 'Log another session' : 'Start workout'} icon={isRest ? 'leaf' : 'dumbbell'} onPress={() => router.push('/workout')} />
      <Button label="See my week" variant="quiet" onPress={() => router.navigate('/plan')} />
    </Card>}

    <QuestList quests={quests} />

    <NutritionSummary logAction />

    <Card>
      <Row style={{ gap: 16 }}>
        <Avatar appearance={profile.avatar} size={70} decorative />
        <View style={{ flex: 1, gap: 8 }}>
          <Txt style={{ fontFamily: fonts.displayBold, fontSize: 20, lineHeight: 26 }}>Your avatar</Txt>
          <Body>New measurements reshape your avatar. Measure every 2–4 weeks to watch it change.</Body>
          <Button label="Add measurement (+30 XP)" variant="secondary" icon="ruler" onPress={() => router.push('/measurement')} />
        </View>
      </Row>
    </Card>

    <Companion message={companion} />
    <Body>One local profile · your data stays on this device.</Body>
  </Page>;
}
