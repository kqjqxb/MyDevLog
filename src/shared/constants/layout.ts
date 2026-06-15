import { ViewStyle } from 'react-native';

import { COLORS } from './colors';

/** 4-point spacing scale. */
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

/**
 * Animation timing/spring presets so motion feels consistent across screens.
 */
export const MOTION = {
  spring: {
    damping: 18,
    stiffness: 180,
    mass: 1,
  },
  springSoft: {
    damping: 14,
    stiffness: 120,
    mass: 0.9,
  },
  /** Consistent snappy spring used by the newer UI (tabs, onboarding, press). */
  springSnappy: {
    damping: 20,
    stiffness: 250,
    mass: 0.8,
  },
  timingFast: { duration: 180 },
  timingMed: { duration: 320 },
  timingSlow: { duration: 600 },
  /** Per-item delay used by staggered list entrances. */
  staggerStep: 50,
  pressScale: 0.97,
} as const;

export const SHADOWS = {
  card: {
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 18,
    elevation: 12,
  },
} as const satisfies Record<string, ViewStyle>;

export const HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 } as const;
