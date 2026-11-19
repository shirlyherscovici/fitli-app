import React from 'react';
import { Image, View } from 'react-native';
import { AvatarStyle, defaultAvatar } from '../domain/types';
import { BodyShape, neutralShape } from '../domain/progress';
import { avatarImages } from './avatarImages';

// Below this average shape ratio, the leaner "goal" photo is shown instead of the "start" photo.
// Two real photos can't be cross-faded without a double-exposure ghost, so the avatar always
// shows exactly one of them, undegraded; this picks whichever is the closer match.
const GOAL_PHOTO_THRESHOLD = 0.94;

function closerToGoal(shape: BodyShape): boolean {
  const avg = (shape.chest + shape.waist + shape.hips + shape.armLeft + shape.armRight + shape.thighLeft + shape.thighRight) / 7;
  return avg < GOAL_PHOTO_THRESHOLD;
}

export function Avatar({ appearance = defaultAvatar, shape = neutralShape, size = 150, label = 'Your personal avatar', decorative = false }: {
  appearance?: AvatarStyle; shape?: BodyShape; size?: number; label?: string; decorative?: boolean;
}) {
  const images = appearance.silhouette === 'masculine' ? avatarImages.masculine : avatarImages.feminine;
  const source = closerToGoal(shape) ? images.goal : images.start;
  const width = size, height = size * 1.9;
  return <View accessible={!decorative} accessibilityRole={decorative ? undefined : 'image'} accessibilityLabel={decorative ? undefined : label} accessibilityLanguage="en" accessibilityElementsHidden={decorative} importantForAccessibility={decorative ? 'no-hide-descendants' : 'yes'} style={{ width, height, alignSelf: 'center' }}>
    <Image source={source} resizeMode="contain" style={{ width: '100%', height: '100%' }} />
  </View>;
}
