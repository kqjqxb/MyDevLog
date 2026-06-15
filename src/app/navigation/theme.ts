import { Theme } from '@react-navigation/native';

import { COLORS, FONTS } from '@/shared/constants';

/** Dark navigation theme matching the DevLog design system. */
export const navigationTheme: Theme = {
  dark: true,
  colors: {
    primary: '#7C3AED',
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: '#EC4899',
  },
  fonts: {
    regular: { fontFamily: FONTS.regular, fontWeight: '400' },
    medium: { fontFamily: FONTS.medium, fontWeight: '500' },
    bold: { fontFamily: FONTS.bold, fontWeight: '700' },
    heavy: { fontFamily: FONTS.heavy, fontWeight: '800' },
  },
};
