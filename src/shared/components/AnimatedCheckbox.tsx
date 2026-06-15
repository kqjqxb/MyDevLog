import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { COLORS, GRADIENTS, MOTION } from '@/shared/constants';
import LinearGradient from 'react-native-linear-gradient';
import { triggerHaptic } from '@/shared/utils';

interface AnimatedCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
const CHECK_PATH = 'M5 13 L10 18 L19 7';
const PATH_LENGTH = 26;

/**
 * Checkbox whose checkmark "draws" itself via an animated stroke-dashoffset,
 * with a gradient fill that springs in when checked.
 */
export function AnimatedCheckbox({ checked, onToggle, size = 26 }: AnimatedCheckboxProps) {
  const progress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    progress.value = checked
      ? withSpring(1, MOTION.springSoft)
      : withTiming(0, MOTION.timingFast);
  }, [checked, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: progress.value }],
  }));

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: PATH_LENGTH * (1 - progress.value),
  }));

  const handlePress = useCallback(() => {
    triggerHaptic('impactLight');
    onToggle();
  }, [onToggle]);

  return (
    <Pressable onPress={handlePress} hitSlop={8}>
      <Animated.View style={[styles.box, { width: size, height: size }]}>
        <Animated.View style={[StyleSheet.absoluteFill, fillStyle]}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Svg width={size} height={size} viewBox="0 0 24 24">
          <AnimatedPath
            d={CHECK_PATH}
            stroke={COLORS.white}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray={PATH_LENGTH}
            animatedProps={pathProps}
          />
        </Svg>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
