import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { Badge, Body, Button, Card, Chip, Chips, EmptyState, Page, Row, Title, Txt } from '../../components/ui';
import { Companion } from '../../components/Companion';
import { NutritionSummary } from '../../components/NutritionSummary';
import { useAppData } from '../../data/AppProvider';
import { currentDayIndex, latestPlan, weekDays } from '../../domain/planning';
import { displayDate, displayPace } from '../../domain/validation';
import { goals, trainings } from '../../domain/types';
import { legacyText } from '../../domain/legacyText';
import { colors, fonts } from '../../theme';

export default function MyPlan() {
  const { section: initial } = useLocalSearchParams<{ section?: string }>();
  const [section,setSection] = useState<'training'|'nutrition'>(initial === 'nutrition' ? 'nutrition' : 'training');
  const { data,today } = useAppData();
  const profile = data!.profile!, plan = latestPlan(data!.plans);
  function dateForDay(day: number) { const [y,m,d] = today.split('-').map(Number); const date = new Date(y,m-1,d-currentDayIndex(today)+day,12); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; }
  return <Page title="My plan" subtitle="Plan the week. Log what actually happened.">
    <Chips><Chip label="Workouts" selected={section === 'training'} onPress={() => setSection('training')} /><Chip label="Nutrition" selected={section === 'nutrition'} onPress={() => setSection('nutrition')} /></Chips>
    <NutritionSummary compact />
    {!plan ? <EmptyState title="No plan yet" text="Your existing info is saved. Finish the questionnaire and we’ll build a schedule around the days you chose, plus a nutrition target when the inputs allow it." action={<Button label="Build my plan" icon="arrow" onPress={() => router.push('/profile')} />} /> : <>
      <Card style={{ backgroundColor:colors.sage }}><Badge text={`Plan version ${data!.plans.length}`} /><Title small>{trainings[plan.training]} · {goals[plan.goal]}</Title><Body>Saved on {displayDate(plan.effectiveDate)}. Goals and your activity log belong to your profile.</Body><Button label="Update profile and goals" icon="edit" variant="secondary" onPress={() => router.push('/profile')} /></Card>
      {section === 'training' ? <>
        <Title small>Your week</Title><Body>Available days and session length follow your choices. Workout content is sample content; weights, paces and load progression aren’t set automatically.</Body>
        {profile.training !== 'strength' && <Card style={{ backgroundColor:colors.peach }}><Title small>Running goal</Title><Txt>{profile.running.targetDistanceKm ?? 'No distance set'}{profile.running.targetDistanceKm !== null ? ' km' : ''} · Target pace {displayPace(profile.running.targetPaceSeconds)} min/km</Txt><Body>Target date: {profile.running.targetDate ? displayDate(profile.running.targetDate) : 'Not set'} · {profile.running.surface === 'treadmill' ? 'Treadmill' : 'Outdoors'}</Body><Body>Current ability: {profile.running.currentDistanceKm === null ? 'distance not logged' : `${profile.running.currentDistanceKm} km`} · {profile.running.currentDurationMinutes === null ? 'time not logged' : `${profile.running.currentDurationMinutes} min`}</Body>{profile.running.currentDistanceKm && profile.running.currentDurationMinutes ? <Txt style={{ writingDirection:'ltr' }}>Current pace: {displayPace(Math.round(profile.running.currentDurationMinutes*60/profile.running.currentDistanceKm))} min/km{profile.running.surface === 'treadmill' ? ` · ${(profile.running.currentDistanceKm/profile.running.currentDurationMinutes*60).toFixed(1)} km/h · incline ${profile.running.incline ?? 'Not set'}%` : ''}</Txt> : null}</Card>}
        {plan.weekly.map(s => {
          const date = dateForDay(s.day), done = data!.workouts.some(w => w.date === date && w.kind === s.kind);
          return <Card key={s.day} style={{ backgroundColor:s.day === currentDayIndex(today) ? colors.peach : s.kind === 'rest' ? colors.mint : colors.surface }}>
            <Row style={{ justifyContent:'space-between',flexWrap:'wrap' }}><Title small>{weekDays[s.day]}{s.day === currentDayIndex(today) ? ' · Today' : ''}</Title><Badge text={done ? 'Logged' : s.kind === 'rest' ? 'Planned rest' : 'Planned'} /></Row>
            <Txt style={{ fontFamily:fonts.bold }}>{legacyText(s.title)}{s.duration ? ` · ${s.duration} min` : ''}</Txt>
            {s.example && <Badge text="Sample content" kind="example" />}
            <Button label={s.kind === 'rest' ? `Open rest day · ${weekDays[s.day]}` : `Open workout · ${weekDays[s.day]}`} variant="secondary" onPress={() => router.push({ pathname:'/workout',params:{ date } })} />
          </Card>;
        })}
        {!!profile.limitations && <Card><Title small>Things you asked us to remember</Title><Body>{profile.limitations}</Body><Body>Saved. Sample content isn’t automatically adapted to this limitation.</Body></Card>}
        <Companion message="Planned rest is a step in the plan, just like a workout." />
      </> : <>
        <Title small>Nutrition plan</Title>
        <Card style={{ backgroundColor:colors.mint }}>{plan.nutrition ? <><Badge text="Personal target · planning estimate" /><Txt style={{ fontSize:30,lineHeight:43,fontFamily:fonts.heavy }}>{Math.round(plan.nutrition.calories)} kcal</Txt><Txt>Protein {Math.round(plan.nutrition.protein)} g · Fat {Math.round(plan.nutrition.fat)} g · Carbs {Math.round(plan.nutrition.carbs)} g</Txt><Body>Inputs: {plan.nutrition.inputs.sex === 'male' ? 'Male' : 'Female'}, age {plan.nutrition.inputs.age}, height {plan.nutrition.inputs.height} cm, weight {plan.nutrition.inputs.weight} kg from {displayDate(plan.nutrition.inputs.weightDate)}.</Body><Body>{plan.nutrition.method === 'mifflin-pal-v1' ? 'Maintenance estimate using Mifflin–St Jeor and daily activity. Your goal doesn’t create an automatic calorie deficit.' : 'Personal target entered in your profile.'} Starting macro split within the AMDR ranges for adults.</Body><Body>Targets saved for today and earlier stay fixed. An updated plan applies from a new day; if today had no target yet, it can be filled in.</Body></> : <><Title small>Not enough data for a personal target</Title><Body>{plan.nutritionMissing.map(legacyText).join(' · ')}</Body><Button label="Complete calculation details" onPress={() => router.push('/profile')} /></>}</Card>
        <Title small>Meal ideas</Title><Body>Inspiration only. Portions, allergies and food database values aren’t connected yet; this isn’t a verified personal menu.</Body>
        {plan.meals.map(meal => <Card key={meal.id}><Badge text="Sample" kind="example" /><Title small>{legacyText(meal.title)}</Title><Body>{legacyText(meal.description)}</Body><Button label={`Log food · ${legacyText(meal.title)}`} variant="secondary" onPress={() => router.push('/meal')} /></Card>)}
        <View style={{ gap:8 }}><Title small>Saved preferences</Title><Body>{profile.nutritionPreferences || 'No preferences set'} · Allergies: {profile.allergies || 'None set'}</Body></View>
      </>}
    </>}
  </Page>;
}
