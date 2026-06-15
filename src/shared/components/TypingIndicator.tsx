import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { COLORS, SPACING } from '@/shared/constants';

import { ThemedText } from './ThemedText';

interface TypingIndicatorProps {
  label?: string;
}

const DOTS = [0, 1, 2];

function Dot({ index }: { index: number }) {
  const value = useSharedValue(0);

  useEffect(() => {
    value.value = withDelay(
      index * 160,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 320, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 320, easing: Easing.in(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [index, value]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + value.value * 0.6,
    transform: [{ translateY: -value.value * 5 }],
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

/** Three-dot bounce shown while an AI agent is working. */
export function TypingIndicator({ label }: TypingIndicatorProps) {
  return (
    <View style={styles.row}>
      <View style={styles.dots}>
        {DOTS.map(i => (
          <Dot key={i} index={i} />
        ))}
      </View>
      {label ? (
        <ThemedText variant="secondary" color={COLORS.textSecondary}>
          {label}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  dots: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'flex-end',
    height: 14,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.textSecondary,
  },
});
