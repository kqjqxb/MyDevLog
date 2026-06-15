import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, GRADIENTS, RADIUS, SPACING } from '@/shared/constants';

interface PaginationDotsProps {
  count: number;
  scrollX: SharedValue<number>;
  width: number;
}

function Dot({ index, scrollX, width }: { index: number; scrollX: SharedValue<number>; width: number }) {
  const range = [(index - 1) * width, index * width, (index + 1) * width];

  const style = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, range, [8, 24, 8], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, range, [0.4, 1, 0.4], Extrapolation.CLAMP),
  }));

  return (
    <Animated.View style={[styles.dot, style]}>
      <LinearGradient
        colors={GRADIENTS.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        pointerEvents="none"
        style={styles.fill}
      />
    </Animated.View>
  );
}

/** Pill-style page indicator; the active dot expands to 24px as you swipe. */
export function PaginationDots({ count, scrollX, width }: PaginationDotsProps) {
  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, index) => (
        <Dot key={index} index={index} scrollX={scrollX} width={width} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  dot: {
    height: 8,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    backgroundColor: COLORS.textTertiary,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
});
