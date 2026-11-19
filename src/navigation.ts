import { router } from 'expo-router';
// Reloads and direct links can start on a modal without a previous screen.
export function goBackOrHome() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
