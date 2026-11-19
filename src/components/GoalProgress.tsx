import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Avatar } from './Avatar';
import { InfoNote, Body, Button, Card, Row, Title, Txt } from './ui';
import { useAppData } from '../data/AppProvider';
import { formatNumber } from '../domain/progress';
import { projectGoalShape } from '../domain/goal';
import { displayDate } from '../domain/validation';
import { colors, fonts, rtlRow } from '../theme';

export function GoalProgress() {
  const { data } = useAppData();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < 380 || fontScale * (data!.settings.textScale ?? 1) > 1.3;
  const goal = projectGoalShape(data!.profile!, data!.measurements);
  if (!data!.settings.showBodyChanges) return null;
  return <Card style={{ backgroundColor: colors.sage, borderWidth: 0 }}>
    <Title small>From start to goal</Title>
    {goal.comparable ? <>
      <Row style={{ justifyContent: 'space-around', flexDirection: stacked ? 'column' : rtlRow, gap: 16 }}>
        <View><Avatar appearance={data!.profile!.avatar} size={135} label="Stylised avatar at your starting point" />
          <Txt style={{ textAlign: 'center', fontFamily: fonts.bold }}>Start · {displayDate(goal.start!.date)}</Txt>
          <Txt style={{ textAlign: 'center', color: colors.muted }}>{formatNumber(goal.startWeight)} kg</Txt>
        </View>
        <View><Avatar appearance={data!.profile!.avatar} shape={goal.shape} size={135} label="Stylised avatar at your goal" />
          <Txt style={{ textAlign: 'center', fontFamily: fonts.bold }}>Your goal</Txt>
          <Txt style={{ textAlign: 'center', color: colors.muted }}>{formatNumber(goal.targetWeight)} kg</Txt>
        </View>
      </Row>
      <InfoNote text="Stylised illustration only: body size change is roughly estimated from the square root of goal-to-start weight ratio, assuming constant height and density. It’s not a medical prediction and isn’t based on measured circumferences at the goal — only the weight you set." />
    </> : <><Body>{goal.reason}</Body>
      {goal.targetWeight === null && <Button label="Set a goal weight in your profile" variant="secondary" onPress={() => router.push('/profile')} />}
    </>}
  </Card>;
}
