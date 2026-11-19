import React from 'react';
import { Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '../../components/Icon';
import { Row, Txt } from '../../components/ui';
import { colors, fonts } from '../../theme';
const tabInfo: Record<string, { label: string; icon: IconName }> = {
  index: { label: 'Today', icon: 'home' }, plan: { label: 'Plan', icon: 'dumbbell' }, routes: { label: 'Routes', icon: 'coffee' }, progress: { label: 'Progress', icon: 'chart' },
};
export default function TabLayout() {
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{ headerShown: false, animation: 'none' }} tabBar={({ state, navigation }) =>
    <View style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 8, paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: 12, backgroundColor: colors.surface }}>
      <Row style={{ gap: 4, alignItems: 'stretch', maxWidth: 620, width: '100%', alignSelf: 'center' }}>
        {state.routes.map((route, index) => {
          const info = tabInfo[route.name];
          if (!info) return null;
          const selected = state.index === index;
          return <Pressable key={route.key} accessibilityRole="tab" accessibilityLanguage="en" accessibilityLabel={info.label} accessibilityState={{ selected }} aria-selected={selected} onPress={() => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!selected && !event.defaultPrevented) navigation.navigate(route.name);
          }} style={({ pressed }) => [{ flex: 1, minHeight: 60, paddingVertical: 8, paddingHorizontal: 2, gap: 4, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: selected ? colors.sage : 'transparent', borderWidth: selected ? 1.5 : 0, borderColor: colors.green }, pressed && { opacity: 0.7 }]}>
            <Icon name={info.icon} color={selected ? colors.lime : colors.muted} size={23} />
            <Txt style={{ fontSize: 12, lineHeight: 20, textAlign: 'center', fontFamily: fonts.display, letterSpacing: 0.3, color: selected ? colors.greenDark : colors.muted }}>{info.label}</Txt>
          </Pressable>;
        })}
      </Row>
    </View>}
  >
    <Tabs.Screen name="index" options={{ title: 'Today' }} />
    <Tabs.Screen name="plan" options={{ title: 'Plan' }} />
    <Tabs.Screen name="nutrition" options={{ href: null }} />
    <Tabs.Screen name="workouts" options={{ href: null }} />
    <Tabs.Screen name="routes" options={{ title: 'Routes' }} />
    <Tabs.Screen name="progress" options={{ title: 'Progress' }} />
  </Tabs>;
}
