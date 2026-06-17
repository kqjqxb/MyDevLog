import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { BlurView } from '@react-native-community/blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertCircle, Clock, KeyRound, WifiOff, X } from 'lucide-react-native';

import { COLORS, FONTS, FONT_SIZE, MOTION, RADIUS, SPACING } from '@/shared/constants';
import { BannerVariant, BannerNotification, useNotificationStore } from '@/store/notificationStore';
import { triggerHaptic } from '@/shared/utils';

import { ThemedText } from './ThemedText';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKeyErrorBannerProps {
  /** Called when the user taps the banner body (navigate to Settings). */
  onPress?: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BANNER_OFFSET = 160;
const ACCENT_WIDTH = 4;
const AUTO_DISMISS_MS = 3600;
const EXIT_DURATION_MS = 220;

const ACCENT_COLOR: Record<BannerVariant, string> = {
  invalid_key: COLORS.danger,
  rate_limit: COLORS.warning,
  network: COLORS.info,
};

// ─── Icon ─────────────────────────────────────────────────────────────────────

function BannerIcon({ variant }: { variant: BannerVariant }) {
  const color = ACCENT_COLOR[variant];
  const size = 22;
  switch (variant) {
    case 'invalid_key':
      return <KeyRound color={color} size={size} />;
    case 'rate_limit':
      return <Clock color={color} size={size} />;
    case 'network':
      return <WifiOff color={color} size={size} />;
    default:
      return <AlertCircle color={color} size={size} />;
  }
}

// ─── Banner content row ────────────────────────────────────────────────────────

interface BannerContentProps {
  notification: BannerNotification;
  topInset: number;
  onPress?: () => void;
  onDismiss: () => void;
}

function BannerContent({ notification, topInset, onPress, onDismiss }: BannerContentProps) {
  const accentColor = ACCENT_COLOR[notification.variant];

  return (
    <View style={[styles.contentOuter, { paddingTop: topInset + SPACING.md }]}>
      {/* Left accent stripe */}
      <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />

      {/* Tappable body */}
      <Pressable
        style={styles.body}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${notification.title}. ${notification.subtitle}`}>
        <View style={styles.iconWrap}>
          <BannerIcon variant={notification.variant} />
        </View>
        <View style={styles.textStack}>
          <ThemedText style={styles.title} numberOfLines={1}>
            {notification.title}
          </ThemedText>
          <ThemedText style={styles.subtitle} numberOfLines={1}>
            {notification.subtitle}
          </ThemedText>
        </View>
      </Pressable>

      {/* Dismiss button */}
      <Pressable
        style={styles.dismissBtn}
        onPress={onDismiss}
        hitSlop={{ top: SPACING.sm, bottom: SPACING.sm, left: SPACING.sm, right: SPACING.sm }}
        accessibilityRole="button"
        accessibilityLabel="Dismiss notification">
        <X color={COLORS.textTertiary} size={16} />
      </Pressable>
    </View>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ApiKeyErrorBanner({ onPress }: ApiKeyErrorBannerProps) {
  const banner = useNotificationStore(s => s.banner);
  const dismissBanner = useNotificationStore(s => s.dismissBanner);
  const insets = useSafeAreaInsets();

  const [isShowing, setIsShowing] = useState(false);
  const isDismissing = useRef(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const translateY = useSharedValue(-BANNER_OFFSET);
  const opacity = useSharedValue(0);

  const clearAutoTimer = useCallback(() => {
    if (autoTimer.current !== null) {
      clearTimeout(autoTimer.current);
      autoTimer.current = null;
    }
  }, []);

  const handleDismissDone = useCallback(() => {
    setIsShowing(false);
    dismissBanner();
  }, [dismissBanner]);

  const triggerDismiss = useCallback(() => {
    if (isDismissing.current) return;
    isDismissing.current = true;
    clearAutoTimer();
    cancelAnimation(translateY);
    cancelAnimation(opacity);
    translateY.value = withTiming(-BANNER_OFFSET, { duration: EXIT_DURATION_MS });
    opacity.value = withTiming(0, { duration: EXIT_DURATION_MS - 20 }, finished => {
      if (finished) runOnJS(handleDismissDone)();
    });
  }, [clearAutoTimer, handleDismissDone, opacity, translateY]);

  // Animate in when a new banner arrives.
  useEffect(() => {
    if (!banner) return;

    isDismissing.current = false;
    setIsShowing(true);

    cancelAnimation(translateY);
    cancelAnimation(opacity);
    translateY.value = -BANNER_OFFSET;
    opacity.value = 0;

    translateY.value = withSpring(0, {
      damping: MOTION.springSnappy.damping,
      stiffness: MOTION.springSnappy.stiffness,
      mass: MOTION.springSnappy.mass,
    });
    opacity.value = withSpring(1, {
      damping: MOTION.springSnappy.damping,
      stiffness: MOTION.springSnappy.stiffness,
      mass: MOTION.springSnappy.mass,
      overshootClamping: true,
    });

    triggerHaptic('notificationWarning');

    clearAutoTimer();
    autoTimer.current = setTimeout(triggerDismiss, AUTO_DISMISS_MS);

    return clearAutoTimer;
  // Re-run on each unique banner id so replacing one banner with another animates correctly.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [banner?.id]);

  const panGesture = Gesture.Pan()
    .activeOffsetY([-8, 8])
    .failOffsetX([-25, 25])
    .onUpdate(e => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
        opacity.value = Math.max(0, 1 + e.translationY / BANNER_OFFSET);
      }
    })
    .onEnd(e => {
      if (e.translationY < -50 || e.velocityY < -600) {
        runOnJS(triggerDismiss)();
      } else {
        cancelAnimation(translateY);
        cancelAnimation(opacity);
        translateY.value = withSpring(0, {
          damping: MOTION.springSnappy.damping,
          stiffness: MOTION.springSnappy.stiffness,
          mass: MOTION.springSnappy.mass,
        });
        opacity.value = withSpring(1, {
          damping: MOTION.springSnappy.damping,
          stiffness: MOTION.springSnappy.stiffness,
          mass: MOTION.springSnappy.mass,
          overshootClamping: true,
        });
      }
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const handlePress = useCallback(() => {
    onPress?.();
    triggerDismiss();
  }, [onPress, triggerDismiss]);

  if (!isShowing && !banner) return null;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[styles.container, animatedContainerStyle]}
        pointerEvents={isShowing ? 'box-none' : 'none'}>
        {/* Glassmorphism background */}
        {Platform.OS === 'ios' ? (
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType="dark"
            blurAmount={24}
            reducedTransparencyFallbackColor={COLORS.card}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.androidBg]} />
        )}

        {/* Bottom separator */}
        <View style={styles.bottomBorder} />

        {/* Tinted overlay to darken the blur slightly */}
        <View style={[StyleSheet.absoluteFill, styles.tintOverlay]} />

        {banner ? (
          <BannerContent
            notification={banner}
            topInset={insets.top}
            onPress={handlePress}
            onDismiss={triggerDismiss}
          />
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 24,
    overflow: 'hidden',
    // Shadow to lift it above the screen
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  androidBg: {
    backgroundColor: COLORS.cardElevated,
  },
  tintOverlay: {
    backgroundColor: 'rgba(10, 10, 15, 0.45)',
  },
  bottomBorder: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.borderStrong,
  },
  contentOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.lg,
    paddingRight: SPACING.lg,
  },
  accentStripe: {
    width: ACCENT_WIDTH,
    alignSelf: 'stretch',
    borderRadius: RADIUS.sm,
    marginLeft: SPACING.md,
    marginRight: SPACING.md,
    marginVertical: SPACING.sm,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconWrap: {
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    flex: 1,
    gap: SPACING.xxs,
  },
  title: {
    fontFamily: FONTS.semibold,
    fontSize: FONT_SIZE.small,
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.caption,
    color: COLORS.textSecondary,
  },
  dismissBtn: {
    paddingLeft: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
