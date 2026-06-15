import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

interface SuccessShimmerProps {
  /** Toggle to re-trigger the sweep. */
  trigger: number;
  onDone?: () => void;
}

const SWEEP_COLORS: string[] = [
  'rgba(124,58,237,0)',
  'rgba(236,72,153,0.35)',
  'rgba(124,58,237,0)',
];

/**
 * One-shot diagonal light sweep across the parent, used to celebrate a
 * completed AI action. Parent must be `position: relative` with overflow hidden.
 */
export function SuccessShimmer({ trigger, onDone }: SuccessShimmerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) {
      return;
    }
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration: 850, easing: Easing.inOut(Easing.ease) },
      finished => {
        if (finished && onDone) {
          runOnJS(onDone)();
        }
      },
    );
  }, [trigger, progress, onDone]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value > 0 && progress.value < 1 ? 1 : 0,
    transform: [{ translateX: -300 + progress.value * 600 }],
  }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      <LinearGradient
        colors={SWEEP_COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}
