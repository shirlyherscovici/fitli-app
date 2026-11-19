import React, { ReactNode } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, TextProps, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, rtlRow, rtlStart, rtlTextAlign } from '../theme';
import { Icon, IconName } from './Icon';
import { useAppData } from '../data/AppProvider';

export function Txt({ style, ...props }: TextProps) {
  const { data } = useAppData();
  const scale = data?.settings.textScale ?? 1;
  const textStyle = StyleSheet.flatten([styles.text,style]);
  return <Text accessibilityLanguage="en" allowFontScaling {...props} style={[textStyle,{ fontSize:(textStyle.fontSize ?? 16)*scale,lineHeight:(textStyle.lineHeight ?? 26)*scale }]} />;
}
export function Title({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return <Txt accessibilityRole="header" style={[styles.title, small && { fontSize: 22, lineHeight: 32 }]}>{children}</Txt>;
}
export function Body({ children }: { children: ReactNode }) { return <Txt style={styles.body}>{children}</Txt>; }
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}
export function Button({ label, onPress, icon, variant = 'primary', disabled = false, busy = false }: {
  label: string; onPress: () => void; icon?: IconName; variant?: 'primary' | 'secondary' | 'quiet' | 'danger'; disabled?: boolean; busy?: boolean;
}) {
  const light = variant === 'primary';
  const color = light ? colors.onPrimary : variant === 'danger' ? colors.error : colors.greenDark;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityLanguage="en"
    accessibilityState={{ disabled: disabled || busy, busy }} aria-disabled={disabled || busy} aria-busy={busy} disabled={disabled || busy} onPress={onPress}
    style={({ pressed }) => [styles.button, variant === 'secondary' && styles.secondary, variant === 'quiet' && styles.quiet, variant === 'danger' && styles.danger, (disabled || busy) && { opacity: 0.6 }, pressed && { opacity: 0.8 }]}>
    {busy ? <ActivityIndicator color={color} /> : icon ? <Icon name={icon} color={color} size={21} /> : null}
    <Txt style={[styles.buttonLabel, { color }]}>{label}</Txt>
  </Pressable>;
}
export function IconButton({ label, name, onPress }: { label: string; name: IconName; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityLanguage="en" onPress={onPress}
    style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.sage }]}><Icon name={name} /></Pressable>;
}
export function Field({ label, hint, error, numeric = false, ...props }: TextInputProps & { label: string; hint?: string; error?: string; numeric?: boolean }) {
  const { data } = useAppData();
  const scale = data?.settings.textScale ?? 1;
  return <View style={{ gap: 6 }}>
    <Txt style={styles.label}>{label}</Txt>
    {!!hint && <Txt style={styles.hint}>{hint}</Txt>}
    <TextInput accessibilityLabel={label} accessibilityHint={hint} accessibilityLanguage="en" allowFontScaling
      keyboardType={numeric ? 'decimal-pad' : 'default'} placeholderTextColor={colors.muted} selectionColor={colors.green}
      inputMode={numeric ? 'decimal' : undefined}
      {...props} style={[styles.input, { fontSize:18*scale }, numeric && { writingDirection: 'ltr' }, props.multiline && { minHeight: 108, textAlignVertical: 'top' }, error && { borderColor: colors.error }, props.style]} />
    {!!error && <ErrorNotice text={error} />}
  </View>;
}
export function ErrorNotice({ text }: { text: string }) {
  return <View style={styles.error}><Txt accessibilityRole="alert" accessibilityLiveRegion="assertive" style={{ color: colors.error }}>{text}</Txt></View>;
}
export function Chip({ label, selected, onPress, multiple = false }: { label: string; selected: boolean; onPress: () => void; multiple?: boolean }) {
  return <Pressable accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityState={multiple ? { checked: selected } : { selected, checked: selected }}
    aria-checked={selected} accessibilityLanguage="en" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && { opacity: 0.75 }]}>
    {selected && <Icon name="check" size={17} color={colors.greenDark} />}
    <Txt style={[{ fontFamily: fonts.medium }, selected && { color: colors.greenDark }]}>{label}</Txt>
  </Pressable>;
}
export function Chips({ children }: { children: ReactNode }) { return <Row style={{ flexWrap: 'wrap', justifyContent: 'flex-start' }}>{children}</Row>; }
export function Badge({ text, kind = 'green' }: { text: string; kind?: 'green' | 'example' }) {
  return <View style={[styles.badge, kind === 'example' && { backgroundColor: colors.peach }]}><Txt style={{ fontSize: 12, lineHeight: 20, fontFamily: fonts.display, letterSpacing: 0.4, color: kind === 'example' ? colors.terracotta : colors.greenDark }}>{text}</Txt></View>;
}
export function Page({ children, title, subtitle, onClose, footer, scrollKey }: { children: ReactNode; title?: string; subtitle?: string; onClose?: () => void; footer?: ReactNode; scrollKey?: number | string }) {
  const insets = useSafeAreaInsets();
  return <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.background }}>
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {!!title && <Row style={styles.pageHeader}><View style={{ flex: 1 }}><Title small>{title}</Title>{!!subtitle && <Body>{subtitle}</Body>}</View>{onClose && <IconButton name="close" label="Close" onPress={onClose} />}</Row>}
      <ScrollView key={scrollKey} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets
        contentContainerStyle={[styles.pageContent, { paddingBottom: footer ? 24 : 32 }]}>{children}</ScrollView>
      {footer && <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>{footer}</View>}
    </View>
  </KeyboardAvoidingView>;
}
export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <Card style={{ alignItems: 'stretch', gap: 14, backgroundColor: colors.mint }}><View style={styles.emptyIcon}><Icon name="leaf" size={30} /></View><Title small>{title}</Title><Body>{text}</Body>{action}</Card>;
}
export const styles = StyleSheet.create({
  text: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 26, color: colors.ink, textAlign: rtlTextAlign },
  title: { fontFamily: fonts.displayBold, fontSize: 32, lineHeight: 40, letterSpacing: -0.2 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 25 },
  card: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 14, borderWidth: 1.5, borderBottomWidth: 5, borderColor: colors.line },
  row: { flexDirection: rtlRow, alignItems: 'center', gap: 10 },
  button: { flexDirection: rtlRow, gap: 10, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20, minHeight: 56, borderRadius: 18, backgroundColor: colors.green, borderBottomWidth: 5, borderColor: colors.primaryEdge },
  buttonLabel: { fontFamily: fonts.display, fontSize: 17, letterSpacing: 0.3, textAlign: 'center', flexShrink: 1 },
  secondary: { backgroundColor: colors.raised, borderWidth: 1.5, borderBottomWidth: 5, borderColor: colors.line },
  quiet: { backgroundColor: 'transparent', borderBottomWidth: 0 }, danger: { backgroundColor: colors.errorLight, borderColor: '#6B2330' },
  iconButton: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  label: { fontFamily: fonts.medium }, hint: { fontSize: 13, lineHeight: 22, color: colors.muted },
  input: { minHeight: 56, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, borderWidth: 1.5, borderColor: colors.line, backgroundColor: colors.background, color: colors.ink, fontFamily: fonts.regular, fontSize: 18, textAlign: rtlTextAlign },
  error: { backgroundColor: colors.errorLight, padding: 12, borderRadius: 12 },
  chip: { flexDirection: rtlRow, alignItems: 'center', justifyContent: 'center', flexShrink: 1, gap: 6, minHeight: 48, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 15, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
  chipSelected: { backgroundColor: colors.sage, borderColor: colors.green },
  badge: { alignSelf: rtlStart, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9, backgroundColor: colors.sage },
  pageHeader: { paddingHorizontal: 24, paddingVertical: 16, alignItems: 'flex-start', width: '100%', maxWidth: 620, alignSelf: 'center' },
  pageContent: { padding: 24, gap: 22, width: '100%', maxWidth: 620, alignSelf: 'center' },
  footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderColor: colors.line, backgroundColor: colors.background, gap: 8, width: '100%', maxWidth: 620, alignSelf: 'center' },
  emptyIcon: { alignSelf: rtlStart, padding: 15, borderRadius: 20, backgroundColor: colors.sage },
});
