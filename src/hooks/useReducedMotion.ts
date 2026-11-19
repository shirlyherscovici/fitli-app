import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useAppData } from '../data/AppProvider';
export function useReducedMotion() {
  // Conservative default prevents animation before the OS preference resolves.
  const [systemReduced, setSystemReduced] = useState(true);
  const { data } = useAppData();
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setSystemReduced).catch(() => setSystemReduced(true));
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setSystemReduced);
    return () => subscription.remove();
  }, []);
  return systemReduced || data?.settings.reduceMotion === true;
}
