import React from 'react';
import { router } from 'expo-router';
import { ProfileForm } from '../components/ProfileForm';
export default function Onboarding() { return <ProfileForm onDone={() => router.replace('/')} />; }
