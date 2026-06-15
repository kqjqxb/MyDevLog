import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, GRADIENTS, RADIUS, SPACING } from '@/shared/constants';
import { PRIORITY_LABEL } from '@/shared/utils';
import { TaskPriority } from '@/shared/types';

import { ThemedText } from './ThemedText';

interface PriorityBadgeProps {
  priority: TaskPriority;
  /** High priority gently pulses to draw the eye. */
  pulse?: boolean;
}

const GRADIENT_BY_PRIORITY: Record<TaskPriority, keyof typeof GRADIENTS> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

/** Gradient-filled priority pill with an optional pulse for high priority. */
export function PriorityBadge({ priority, pulse = false }: PriorityBadgeProps) {
  const glow = useSharedValue(0);

  useEffect(() => {
    if (pulse && priority === 'high') {
      glow.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      glow.value = 0;
    }
  }, [pulse, priority, glow]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.6 + glow.value * 0.4,
    transform: [{ scale: 1 + glow.value * 0.04 }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <LinearGradient
        colors={GRADIENTS[GRADIENT_BY_PRIORITY[priority]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}>
        <View style={styles.dot} />
        <ThemedText variant="caption" color={COLORS.white}>
          {PRIORITY_LABEL[priority]}
        </ThemedText>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.white,
  },
});
