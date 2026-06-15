import React, { ReactNode } from 'react';
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from '@react-native-community/blur';

import { COLORS, RADIUS } from '@/shared/constants';

interface GlassCardProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Disable the blur layer (e.g. for nested cards) and use a flat surface. */
  flat?: boolean;
}

/**
 * Glassmorphism card: semi-transparent surface + blur + subtle border.
 * On Android the BlurView support is uneven, so we fall back to a translucent
 * surface there.
 */
export function GlassCard({ children, style, flat = false }: GlassCardProps) {
  const useBlur = !flat && Platform.OS === 'ios';

  return (
    <View style={[styles.container, style]}>
      {useBlur ? (
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="dark"
          blurAmount={18}
          reducedTransparencyFallbackColor={COLORS.card}
        />
      ) : null}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.glass,
    overflow: 'hidden',
  },
  content: {
    padding: 16,
  },
});
