import React, { useState } from 'react';
import { AccessibilityInfo, Share, Switch, View } from 'react-native';
import { router } from 'expo-router';
import { AvatarPicker } from '../components/AvatarPicker';
import { ConfirmDelete } from '../components/ConfirmDelete';
import { Body, Button, Card, Chip, Chips, ErrorNotice, Page, Row, Title, Txt } from '../components/ui';
import { useAppData } from '../data/AppProvider';
import { AvatarStyle, Settings } from '../domain/types';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { colors, fonts } from '../theme';
import { goBackOrHome } from '../navigation';

export default function SettingsScreen() {
  const { data, saveSettings, saveProfile, clear } = useAppData();
  const reducedMotion = useReducedMotion();
  const [avatar, setAvatar] = useState<AvatarStyle>(data!.profile!.avatar);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [savedMessage,setSavedMessage] = useState('');
  async function updateSettings(patch: Partial<Settings>) {
    setBusy(true); setError('');
    try { await saveSettings({ ...data!.settings, ...patch }); }
    catch { setError('Couldn’t save this setting on the device. Try again.'); }
    finally { setBusy(false); }
  }
  async function updateAvatar() {
    setBusy(true); setError(''); setSavedMessage('');
    try { await saveProfile({ ...data!.profile!, avatar }); AccessibilityInfo.announceForAccessibility('Avatar saved'); setSavedMessage('Avatar saved. Calculations and history stay linked to the same profile.'); }
    catch { setError('Couldn’t save the avatar. Your choice is still here; try again.'); }
    finally { setBusy(false); }
  }
  async function deleteAll() {
    setBusy(true); setError('');
    try { await clear(); router.replace('/onboarding'); }
    catch { setError('Reset didn’t complete. Your data is still on this device.'); }
    finally { setBusy(false); }
  }
  async function exportData() {
    try { await Share.share({ title: 'My Fitli data', message: JSON.stringify(data, null, 2) }); }
    catch { setError('Couldn’t open sharing. Try again.'); }
  }
  return <Page title="Your space" subtitle="Profile, look and preferences." onClose={goBackOrHome}>
    <Card><Title small>Profile: {data!.profile!.name}</Title><Body>One local profile on this device. A permanent ID links your profile, plans and all entries; changing your name or goal keeps your history. Family profiles and sync are coming later.</Body><Txt style={{ fontSize:12,writingDirection:'ltr' }}>{data!.profile!.profileId}</Txt><Button label="Edit profile and goals" variant="secondary" icon="edit" disabled={busy} onPress={() => router.push('/profile')} /></Card>
    <Card><Title small>Comfort & accessibility</Title>
      <Txt style={{ fontFamily:fonts.medium }}>In-app text size</Txt><Chips>{([1,1.25,1.5] as const).map(textScale => <Chip key={textScale} label={`${textScale*100}%`} selected={(data!.settings.textScale ?? 1) === textScale} onPress={() => { if (!busy) void updateSettings({ textScale }); }} />)}</Chips><Body>Applied on top of your system text size. Forms and buttons scale with it.</Body>
      <Row style={{ alignItems: 'flex-start' }}><View style={{ flex: 1, gap: 6 }}><Txt style={{ fontFamily: fonts.medium }}>Show body illustration</Txt><Body>Hide the illustration and keep the numbers and chart.</Body></View><Switch accessibilityLabel="Show body illustration in comparison" accessibilityLanguage="en" value={data!.settings.showBodyChanges} disabled={busy} onValueChange={value => updateSettings({ showBodyChanges: value })} trackColor={{ false: colors.line, true: colors.green }} thumbColor={colors.ink} /></Row>
      <Row style={{ alignItems: 'flex-start' }}><View style={{ flex: 1, gap: 6 }}><Txt style={{ fontFamily: fonts.medium }}>Reduce motion in app</Txt><Body>Turns off animated transitions. Your device’s reduce-motion setting is always respected.</Body></View><Switch accessibilityLabel="Reduce motion in app" accessibilityLanguage="en" value={data!.settings.reduceMotion} disabled={busy} onValueChange={value => updateSettings({ reduceMotion: value })} trackColor={{ false: colors.line, true: colors.green }} thumbColor={colors.ink} /></Row>
      <Body>Now: {reducedMotion ? 'reduced motion' : 'gentle transitions'}. Text follows your device size setting.</Body>
    </Card>
    <Card><Title small>Make it more you</Title><AvatarPicker value={avatar} onChange={setAvatar} /><Button label="Save avatar" icon="check" onPress={updateAvatar} busy={busy} />{!!savedMessage && <Body>{savedMessage}</Body>}</Card>
    <Card><Title small>My data</Title><Body>Your profile, plans, measurements and meal/workout logs are stored locally — no cloud account and nothing sent to an AI. Storage isn’t encrypted by the app. Uninstalling or clearing app data can erase your history; you can share a JSON copy for safekeeping.</Body><Button label="Export a copy of my data" variant="secondary" disabled={busy} onPress={exportData} /><ConfirmDelete label="Reset all data on this device" message="Your profile, plans and all entries will be deleted. Export a copy first if you like. The upgrade backup of the previous version, if any, stays on the device. This can’t be undone in the app." busy={busy} onConfirm={deleteAll} /></Card>
    {!!error && <ErrorNotice text={error} />}
  </Page>;
}
