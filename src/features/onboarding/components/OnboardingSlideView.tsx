import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, GRADIENTS, MOTION, RADIUS, SPACING } from '@/shared/constants';
import { GlowRing, ThemedText } from '@/shared/components';

import { OnboardingSlide } from '../slides';

interface OnboardingSlideViewProps {
  slide: OnboardingSlide;
  index: number;
  active: boolean;
  scrollX: SharedValue<number>;
  width: number;
}

const ICON_BOX = 120;

/**
 * A single onboarding page. The icon parallaxes at 0.3× the swipe speed; its
 * content (icon → title → subtitle) springs in with a 100ms stagger whenever
 * the slide becomes active.
 */
export function OnboardingSlideView({
  slide,
  index,
  active,
  scrollX,
  width,
}: OnboardingSlideViewProps) {
  const Icon = slide.icon;
  const spin = useSharedValue(0);

  useEffect(() => {
    // Subtle continuous rotation on the glow ring behind the icon.
    spin.value = withRepeat(
      withTiming(360, { duration: 6000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [spin]);

  const range = [(index - 1) * width, index * width, (index + 1) * width];

  // Parallax: icon drifts opposite to the page as you swipe.
  const iconParallax = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(scrollX.value, range, [width * 0.3, 0, -width * 0.3]),
      },
      { rotate: `${spin.value}deg` },
    ],
  }));

  const iconReveal = useAnimatedStyle(() => ({
    opacity: withSpring(active ? 1 : 0, MOTION.springSnappy),
    transform: [{ scale: withSpring(active ? 1 : 0.6, MOTION.springSnappy) }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: withDelay(active ? 100 : 0, withTiming(active ? 1 : 0, { duration: 300 })),
    transform: [
      { translateY: withDelay(active ? 100 : 0, withSpring(active ? 0 : 20, MOTION.springSnappy)) },
    ],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: withDelay(active ? 200 : 0, withTiming(active ? 1 : 0, { duration: 300 })),
    transform: [
      { translateY: withDelay(active ? 200 : 0, withSpring(active ? 0 : 20, MOTION.springSnappy)) },
    ],
  }));

  return (
    <View style={[styles.slide, { width }]}>
      <Animated.View style={[styles.ringWrap, iconReveal]}>
        <Animated.View style={[styles.ring, iconParallax]}>
          <GlowRing size={ICON_BOX + 36} gradient={slide.gradient} borderRadius={RADIUS.xxl} />
        </Animated.View>
        <View style={styles.iconBox}>
          <LinearGradient
            colors={GRADIENTS[slide.gradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            style={styles.fill}
          />
          <Icon color={COLORS.white} size={52} strokeWidth={2} />
        </View>
      </Animated.View>

      <Animated.View style={titleStyle}>
        <ThemedText variant="heading" style={styles.title}>
          {slide.title}
        </ThemedText>
      </Animated.View>
      <Animated.View style={subtitleStyle}>
        <ThemedText variant="body" color={COLORS.textSecondary} style={styles.subtitle}>
          {slide.subtitle}
        </ThemedText>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.huge,
  },
  ring: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: ICON_BOX,
    height: ICON_BOX,
    borderRadius: RADIUS.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
  },
});
