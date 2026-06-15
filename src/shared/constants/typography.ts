import { TextStyle } from 'react-native';

import { COLORS } from './colors';

/**
 * SF Pro Text font family names. These map to the .ttf files bundled in
 * /fonts and registered through react-native.config.js.
 */
export const FONTS = {
  regular: 'SFProText-Regular',
  medium: 'SFProText-Medium',
  semibold: 'SFProText-Semibold',
  bold: 'SFProText-Bold',
  heavy: 'SFProText-Heavy',
} as const;

export const FONT_SIZE = {
  caption: 12,
  small: 13,
  body: 15,
  subheading: 18,
  title: 22,
  heading: 28,
  display: 34,
} as const;

/**
 * Reusable text styles enforcing a clear hierarchy. Components reference these
 * instead of declaring ad-hoc font sizes/weights inline.
 */
export const TYPOGRAPHY = {
  display: {
    fontFamily: FONTS.heavy,
    fontSize: FONT_SIZE.display,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.heading,
    color: COLORS.textPrimary,
    letterSpacing: -0.4,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.title,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subheading: {
    fontFamily: FONTS.semibold,
    fontSize: FONT_SIZE.subheading,
    color: COLORS.textPrimary,
  },
  body: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.body,
    color: COLORS.textPrimary,
  },
  bodyMedium: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.body,
    color: COLORS.textPrimary,
  },
  secondary: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.small,
    color: COLORS.textSecondary,
  },
  caption: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
    letterSpacing: 0.2,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof TYPOGRAPHY;
