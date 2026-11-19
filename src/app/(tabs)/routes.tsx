import React, { useCallback, useState } from 'react';
import { Linking, Pressable } from 'react-native';
import * as Location from 'expo-location';
import { Badge, Body, Button, Card, EmptyState, ErrorNotice, Page, Row, Title, Txt } from '../../components/ui';
import { fetchCafesNear } from '../../data/cafes';
import { CafeStop, cafeKindLabels } from '../../domain/cafes';
import { runnerNutritionFacts } from '../../domain/runnerNutritionFacts';
import { colors, fonts } from '../../theme';

const SEARCH_RADIUS_METERS = 1500;
type SearchState = 'idle' | 'locating' | 'searching' | 'done' | 'error';

export default function Routes() {
  const [state, setState] = useState<SearchState>('idle');
  const [cafes, setCafes] = useState<CafeStop[]>([]);
  const [error, setError] = useState('');

  const search = useCallback(async () => {
    setError(''); setState('locating');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setError('Location permission is needed to find coffee carts along your running route.'); setState('error'); return; }
      const position = await Location.getCurrentPositionAsync({});
      setState('searching');
      const results = await fetchCafesNear({ lat: position.coords.latitude, lon: position.coords.longitude }, SEARCH_RADIUS_METERS);
      setCafes(results); setState('done');
    } catch { setError('Couldn’t load coffee spots. Check your internet connection and try again.'); setState('error'); }
  }, []);

  const busy = state === 'locating' || state === 'searching';
  return <Page title="Routes & coffee stops" subtitle="Find coffee along your run with open data — no paid API key needed.">
    <Card>
      <Title small>Coffee near you</Title>
      <Body>Searches cafés, coffee shops and coffee carts/machines within {SEARCH_RADIUS_METERS} meters of your current location, using open OpenStreetMap data (Overpass API).</Body>
      <Button label={busy ? 'Searching...' : 'Find coffee near me'} icon="leaf" onPress={search} busy={busy} />
      {!!error && <ErrorNotice text={error} />}
    </Card>
    {state === 'done' && cafes.length === 0 && <EmptyState title="No coffee spots found" text="No coffee spots in this radius according to the map data. Try again later or from another spot." />}
    {cafes.map(cafe => <Card key={cafe.id}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <Txt style={{ fontFamily: fonts.bold, flexShrink: 1 }}>{cafe.name}</Txt>
        <Badge text={`${cafe.distanceMeters} m`} />
      </Row>
      <Body>{cafeKindLabels[cafe.kind]}</Body>
    </Card>)}
    <Title small>Runner nutrition · research-based</Title>
    {runnerNutritionFacts.map(fact => <Card key={fact.id} style={{ backgroundColor: colors.peach }}>
      <Title small>{fact.title}</Title>
      <Body>{fact.body}</Body>
      <Pressable accessibilityRole="link" accessibilityLabel={`Source: ${fact.sourceLabel}`} onPress={() => Linking.openURL(fact.sourceUrl)}>
        <Txt style={{ fontSize: 13, color: colors.terracotta, fontFamily: fonts.medium, textDecorationLine: 'underline' }}>Source: {fact.sourceLabel}</Txt>
      </Pressable>
    </Card>)}
  </Page>;
}
