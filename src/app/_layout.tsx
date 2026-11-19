import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Heebo_400Regular } from '@expo-google-fonts/heebo/400Regular';
import { Heebo_500Medium } from '@expo-google-fonts/heebo/500Medium';
import { Heebo_700Bold } from '@expo-google-fonts/heebo/700Bold';
import { Heebo_800ExtraBold } from '@expo-google-fonts/heebo/800ExtraBold';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka/600SemiBold';
import { Fredoka_700Bold } from '@expo-google-fonts/fredoka/700Bold';
import { AppProvider, useAppData } from '../data/AppProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { Body, Button, Card, Page, Title } from '../components/ui';
import { colors } from '../theme';

function Routes() {
  const { data, loading, loadError, retry } = useAppData();
  const reducedMotion = useReducedMotion();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', gap: 16 }}><ActivityIndicator accessibilityLabel="Loading your saved data" color={colors.green} /><Body>Loading your world…</Body></View>;
  if (loadError) return <Page><Card><Title small>Your data didn’t load</Title><Body>We couldn’t read the local save. We will never replace it with empty data. Try again; if it keeps failing, back up the app data before removing it.</Body><Button label="Try again" onPress={retry} /></Card></Page>;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: reducedMotion ? 'none' : 'fade', gestureEnabled: !reducedMotion }}>
    <Stack.Protected guard={!!data?.profile}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="measurement" options={{ presentation: reducedMotion ? 'card' : 'modal' }} />
      <Stack.Screen name="profile" options={{ presentation: reducedMotion ? 'card' : 'modal' }} />
      <Stack.Screen name="settings" options={{ presentation: reducedMotion ? 'card' : 'modal' }} />
      <Stack.Screen name="meal" options={{ presentation: reducedMotion ? 'card' : 'modal' }} />
      <Stack.Screen name="workout" options={{ presentation: reducedMotion ? 'card' : 'modal' }} />
    </Stack.Protected>
    <Stack.Protected guard={!data?.profile}><Stack.Screen name="onboarding" /></Stack.Protected>
  </Stack>;
}
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Heebo_400Regular, Heebo_500Medium, Heebo_700Bold, Heebo_800ExtraBold, Fredoka_600SemiBold, Fredoka_700Bold });
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}><ActivityIndicator color={colors.green} /></View>;
  return <SafeAreaProvider><AppProvider><StatusBar style="light" /><Routes /></AppProvider></SafeAreaProvider>;
}
