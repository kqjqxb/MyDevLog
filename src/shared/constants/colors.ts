/**
 * DevLog design system — color palette.
 * Dark premium aesthetic inspired by Holywater / MyDrama.
 */

export const COLORS = {
  background: '#0A0A0F',
  surface: '#12121A',
  card: '#1A1A26',
  cardElevated: '#22222F',

  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#38BDF8',

  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.16)',

  overlay: 'rgba(0,0,0,0.6)',
  glass: 'rgba(26,26,38,0.72)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

/**
 * Gradient stop arrays consumed by `react-native-linear-gradient`. Typed as
 * mutable `string[]` to satisfy the library's `colors` prop directly (its
 * typings reject `readonly` tuples).
 */
export const GRADIENTS: Record<GradientName, string[]> = {
  primary: ['#7C3AED', '#4F46E5'],
  accent: ['#EC4899', '#8B5CF6'],
  success: ['#10B981', '#059669'],
  warning: ['#F59E0B', '#D97706'],
  danger: ['#EF4444', '#DC2626'],
  surface: ['#1A1A26', '#12121A'],
  ai: ['#7C3AED', '#EC4899', '#4F46E5'],
};

export type GradientName =
  | 'primary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'surface'
  | 'ai';

export type ColorName = keyof typeof COLORS;
