// Fitli "Night Arcade" theme: dark, vivid, game-like. English UI, left-to-right.
// Token names are kept from the first prototype so every screen switches at once:
// `green` is the primary (violet), `sage` the selected fill, `mint`/`peach` the
// calm/energy card tints.
export const colors = {
  background: '#0E0B1A', surface: '#1A1530', raised: '#241D42', ink: '#F4F0FF', muted: '#A99FC6',
  green: '#8B5CF6', greenDark: '#C9B5FF', primaryEdge: '#5B32C9', onPrimary: '#FFFFFF',
  sage: '#2C2254', mint: '#11291F', mintEdge: '#1F5A42', peach: '#2E1922', peachEdge: '#6B2E3B',
  line: '#2F2852', lavender: '#221B3E', terracotta: '#FF9B7A',
  purple: '#B794FF', coral: '#FF7A5C', lime: '#C6FF4A', yellow: '#FFD23F', teal: '#3DD9A7', cyan: '#4CC9FF',
  error: '#FF6B78', errorLight: '#3A1720', track: '#2F2852',
};
export const xpGradient = ['#C6FF4A', '#3DD9A7'] as const;
// The UI is English and left-to-right. The old rtl* helpers now resolve to LTR
// values so existing screens follow the new direction without per-file edits.
export const rtlRow = 'row';
export const rtlTextAlign = 'left';
export const rtlStart = 'flex-start';
export const fonts = {
  regular: 'Heebo_400Regular', medium: 'Heebo_500Medium', bold: 'Heebo_700Bold', heavy: 'Heebo_800ExtraBold',
  // Rounded display face for titles, numbers and game UI. Fredoka also covers Hebrew.
  display: 'Fredoka_600SemiBold', displayBold: 'Fredoka_700Bold',
};
