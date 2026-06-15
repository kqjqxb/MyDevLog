import React, { ReactNode, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import {
  COLORS,
  GRADIENTS,
  GradientName,
  MOTION,
  RADIUS,
  SPACING,
} from '@/shared/constants';
import { triggerHaptic } from '@/shared/utils';

import { ThemedText } from './ThemedText';

interface GradientButtonProps {
  label?: string;
  onPress: () => void;
  gradient?: GradientName;
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Primary CTA: gradient fill + spring press-feedback (scale to 0.97) + haptic.
 */
export function GradientButton({
  label,
  onPress,
  gradient = 'primary',
  disabled = false,
  loading = false,
  icon,
  style,
  compact = false,
}: GradientButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(MOTION.pressScale, MOTION.spring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, MOTION.spring);
  }, [scale]);

  const handlePress = useCallback(() => {
    if (disabled || loading) {
      return;
    }
    triggerHaptic('impactMedium');
    onPress();
  }, [disabled, loading, onPress]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      style={[animatedStyle, styles.pressable, disabled && styles.disabled, style]}>
      <LinearGradient
        colors={GRADIENTS[gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, compact && styles.compact]}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <>
            {icon}
            {label ? (
              <ThemedText variant="bodyMedium" color={COLORS.white}>
                {label}
              </ThemedText>
            ) : null}
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: RADIUS.md,
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
  },
  compact: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
});
