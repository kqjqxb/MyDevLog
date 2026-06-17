import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Check } from 'lucide-react-native';

import { COLORS, GRADIENTS, MOTION, RADIUS, SPACING } from '@/shared/constants';
import { GlowRing, GradientText, ThemedText } from '@/shared/components';

interface SplashScreenProps {
  /** Becomes true once persisted state has hydrated. */
  ready: boolean;
  /** Called after the exit fade completes. */
  onFinish: () => void;
}

const LOGO_SIZE = 96;
// Hold the fully-revealed splash before fading, so total time lands near ~2s.
const HOLD_MS = 1300;

/**
 * Branded launch screen. Logo springs from 0.3→1 with a fade, a glow ring
 * pulses behind it, and the wordmark + subtitle slide up 300ms later. Once the
 * app is `ready`, the whole screen fades out (Reanimated callback, no timers).
 */
export function SplashScreen({ ready, onFinish }: SplashScreenProps) {
  const root = useSharedValue(1);
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const textY = useSharedValue(20);
  const textOpacity = useSharedValue(0);

  // Entrance choreography.
  useEffect(() => {
    logoScale.value = withSpring(1, MOTION.springSnappy);
    logoOpacity.value = withTiming(1, { duration: 400 });
    textOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    textY.value = withDelay(300, withSpring(0, MOTION.springSnappy));
  }, [logoScale, logoOpacity, textOpacity, textY]);

  // Exit once hydration is done.
  useEffect(() => {
    if (!ready) {
      return;
    }
    root.value = withDelay(
      HOLD_MS,
      withTiming(0, { duration: 500 }, finished => {
        if (finished) {
          runOnJS(onFinish)();
        }
      }),
    );
  }, [ready, root, onFinish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: root.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  return (
    <Animated.View style={[styles.container, rootStyle]}>
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <GlowRing size={LOGO_SIZE + 28} gradient="accent" borderRadius={RADIUS.xxl} />
        <View style={styles.logo}>
          <LinearGradient
            colors={GRADIENTS.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            style={styles.fill}
          />
          <Check color={COLORS.white} size={44} strokeWidth={3} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textWrap, textStyle, {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
      }]}>
        <GradientText text="DevLog" gradient="accent" fontSize={34} width={160} />
        <ThemedText variant="secondary" color={COLORS.textSecondary}>
          AI-powered task tracker
        </ThemedText>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  textWrap: {
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.xs,
  },
});
