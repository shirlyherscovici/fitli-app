// Fitli "Night Hustle" theme: an original open-world street-game look.
// Asphalt black, sunset orange + neon pink, cash-green XP, sharp corners and
// hard black shadows. Token names are kept from the first prototype so every
// screen follows: `green` is the primary (sunset orange), `sage` the selected
// fill, `mint`/`peach` the success/mission tints.
export const colors = {
  background: '#0A0A0D', surface: '#15151B', raised: '#1F1F28', ink: '#FFFFFF', muted: '#A3A3B2',
  green: '#FF7A1A', greenDark: '#FFB066', primaryEdge: '#9C3F00', onPrimary: '#0A0A0D',
  sage: '#2B1708', mint: '#0D2213', mintEdge: '#2E8B45', peach: '#1E0F14', peachEdge: '#FF2E88',
  line: '#2C2C38', lavender: '#121218', terracotta: '#FFB066',
  purple: '#FF2E88', coral: '#FF4D4D', lime: '#5CE65C', yellow: '#FFD400', teal: '#5CE65C', cyan: '#2EE6FF',
  error: '#FF4D4D', errorLight: '#2A0E10', track: '#26262F', shadow: '#000000',
};
export const sunset = ['#FFB000', '#FF7A1A', '#FF2E88', '#7B2CFF'] as const;
export const radius = { card: 6, control: 4 };
// Hard offset shadow, like a sticker on a city wall. Works on web and iOS;
// Android uses `elevation` as a soft fallback.
export const hardShadow = { shadowColor: '#000', shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 };
export const textOutline = { textShadowColor: '#000', textShadowOffset: { width: 2, height: 2 }, textShadowRadius: 0 };
// The UI is English and left-to-right. The old rtl* helpers now resolve to LTR
// values so existing screens follow the new direction without per-file edits.
export const rtlRow = 'row';
export const rtlTextAlign = 'left';
export const rtlStart = 'flex-start';
export const fonts = {
  regular: 'Heebo_400Regular', medium: 'Heebo_500Medium', bold: 'Heebo_700Bold', heavy: 'Heebo_800ExtraBold',
  // Condensed street display face for titles, numbers and HUD (Latin only; Hebrew
  // user text always renders in Heebo).
  display: 'BebasNeue_400Regular', displayBold: 'BebasNeue_400Regular',
};
