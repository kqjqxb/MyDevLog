import React, { ReactNode, useCallback } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
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
 * Primary CTA: spring press-feedback (scale to 0.97) + haptic.
 *
 * Layout pattern: the Pressable is the outer interactive wrapper; a plain View
 * sizes the button from its padding + content; the LinearGradient is an
 * absolutely-positioned, non-interactive background layer clipped to the
 * container radius. This keeps the gradient out of layout/measurement (it does
 * not reliably grow to fit children on Fabric), so the label is never clipped.
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
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      accessibilityLabel={label}
      style={[animatedStyle, styles.pressable, disabled && styles.disabled, style]}>
      <View style={[styles.container, compact && styles.compact]}>
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          pointerEvents="none"
          style={styles.fill}
        />
        <View style={styles.content}>
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
        </View>
      </View>
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
  container: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },
  compact: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
});
