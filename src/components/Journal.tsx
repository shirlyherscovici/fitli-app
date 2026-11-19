import React, { useState } from 'react';
import { router } from 'expo-router';
import { Badge, Body, Button, Card, Chip, Chips, Title, Txt } from './ui';
import { useAppData } from '../data/AppProvider';
import { displayDate, displayPace } from '../domain/validation';
import { colors, fonts } from '../theme';
import { NutritionSummary } from './NutritionSummary';

export function Journal() {
  const { data,today } = useAppData();
  const [selectedDate,setSelectedDate] = useState<string | null>(null);
  const date = selectedDate ?? today;
  const dates = [...new Set([today,...data!.meals.map(m => m.date),...data!.workouts.map(w => w.date)])].sort().reverse();
  const meals = data!.meals.filter(m => m.date === date), workouts = data!.workouts.filter(w => w.date === date);
  return <>
    <Title small>Your activity log</Title><Chips>{dates.map(d => <Chip key={d} label={d === today ? 'Today' : displayDate(d)} selected={d === date} onPress={() => setSelectedDate(d)} />)}</Chips>
    {date !== today && <NutritionSummary compact date={date} />}
    <Card style={{ backgroundColor:colors.peach }}><Title small>Meals · {displayDate(date)}</Title>{!meals.length && <Body>No food logged for this day. Planned meals don’t count here.</Body>}
      {meals.map(m => <Card key={m.id} style={{ padding:16 }}><Txt style={{ fontFamily:fonts.bold }}>{m.name}</Txt><Txt>{m.calories === null ? 'calories unknown' : `${m.calories} kcal`} · Protein {m.protein ?? '—'} g · Fat {m.fat ?? '—'} g · Carbs {m.carbs ?? '—'} g</Txt><Button label={`Edit meal · ${m.name}`} variant="secondary" icon="edit" onPress={() => router.push({ pathname:'/meal',params:{ id:m.id } })} /></Card>)}
      <Button label="Log new meal" icon="plus" onPress={() => router.push('/meal')} />
    </Card>
    <Card style={{ backgroundColor:colors.mint }}><Title small>Workouts & rest · {displayDate(date)}</Title>{!workouts.length && <Body>Nothing logged yet. Opening a workout doesn’t mark it as done.</Body>}
      {workouts.map(w => <Card key={w.id} style={{ padding:16 }}><Badge text={w.kind === 'rest' ? 'Rest logged' : 'Done & logged'} /><Txt>{w.kind === 'rest' ? 'Rest' : w.kind === 'strength' ? 'Strength workout' : 'Run'}{w.duration ? ` · ${w.duration} min` : ''}{w.distanceKm ? ` · ${w.distanceKm} km` : ''}</Txt>{w.kind === 'running' && w.duration && w.distanceKm && <Body>Actual pace: {displayPace(Math.round(w.duration*60/w.distanceKm))} min/km</Body>}{!!w.notes && <Body>{w.notes}</Body>}<Button label={`Edit entry · ${w.kind === 'rest' ? 'Rest' : w.kind === 'strength' ? 'Strength' : 'Run'}`} variant="secondary" icon="edit" onPress={() => router.push({ pathname:'/workout',params:{ id:w.id } })} /></Card>)}
    </Card>
  </>;
}
