import React from 'react';
import { ProfileForm } from '../components/ProfileForm';
import { goBackOrHome } from '../navigation';
export default function ProfileScreen() { return <ProfileForm editing onDone={goBackOrHome} onClose={goBackOrHome} />; }
