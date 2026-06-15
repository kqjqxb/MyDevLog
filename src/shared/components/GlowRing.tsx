import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { GRADIENTS, GradientName } from '@/shared/constants';

interface GlowRingProps {
  size: number;
  gradient?: GradientName;
  borderRadius?: number;
}

/**
 * Infinite pulsing gradient halo, rendered behind FABs/active elements. It
 * scales up and fades out on a loop to read as a soft, breathing glow.
 */
export function GlowRing({ size, gradient = 'primary', borderRadius }: GlowRingProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - progress.value),
    transform: [{ scale: 1 + progress.value * 0.4 }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: borderRadius ?? size / 2,
        },
        animatedStyle,
      ]}>
      <LinearGradient
        colors={GRADIENTS[gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: borderRadius ?? size / 2 },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
  },
});
