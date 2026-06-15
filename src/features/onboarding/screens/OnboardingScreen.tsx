import React, { useCallback, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { AnimatePresence, MotiView } from 'moti';

import { GradientButton, ScreenContainer, ThemedText } from '@/shared/components';
import { COLORS, SPACING } from '@/shared/constants';
import { useSettingsStore } from '@/store';

import { OnboardingSlideView } from '../components/OnboardingSlideView';
import { PaginationDots } from '../components/PaginationDots';
import { OnboardingSlide, SLIDES } from '../slides';

const AnimatedFlatList = Animated.FlatList<OnboardingSlide>;

/**
 * First-launch onboarding: 3 swipeable slides with parallax icons and a
 * scroll-driven pill indicator. "Skip" (slides 1–2) or "Get Started" fades the
 * screen out and marks onboarding complete.
 */
export function OnboardingScreen() {
  const { width } = useWindowDimensions();
  const completeOnboarding = useSettingsStore(state => state.completeOnboarding);

  const scrollX = useSharedValue(0);
  const rootOpacity = useSharedValue(1);
  const [index, setIndex] = useState(0);
  const listRef = React.useRef<Animated.FlatList<OnboardingSlide>>(null);

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollX.value = event.contentOffset.x;
  });

  const handleMomentumEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setIndex(Math.round(event.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  const finish = useCallback(() => {
    rootOpacity.value = withTiming(0, { duration: 400 }, finished => {
      if (finished) {
        runOnJS(completeOnboarding)();
      }
    });
  }, [completeOnboarding, rootOpacity]);

  const goNext = useCallback(() => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToOffset({ offset: (index + 1) * width, animated: true });
    } else {
      finish();
    }
  }, [index, width, finish]);

  const rootStyle = useAnimatedStyle(() => ({ opacity: rootOpacity.value }));
  const isLast = index === SLIDES.length - 1;

  return (
    <Animated.View style={[styles.root, rootStyle]}>
      <ScreenContainer edges={['top', 'bottom']}>
        <View style={styles.skipRow}>
          <AnimatePresence>
            {!isLast ? (
              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                <Pressable onPress={finish} hitSlop={12}>
                  <ThemedText variant="bodyMedium" color={COLORS.textSecondary}>
                    Skip
                  </ThemedText>
                </Pressable>
              </MotiView>
            ) : null}
          </AnimatePresence>
        </View>

        <AnimatedFlatList
          ref={listRef}
          data={SLIDES}
          keyExtractor={item => item.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumEnd}
          renderItem={({ item, index: slideIndex }) => (
            <OnboardingSlideView
              slide={item}
              index={slideIndex}
              active={slideIndex === index}
              scrollX={scrollX}
              width={width}
            />
          )}
        />

        <View style={styles.footer}>
          <PaginationDots count={SLIDES.length} scrollX={scrollX} width={width} />
          <GradientButton
            label={isLast ? 'Get Started' : 'Next'}
            gradient="primary"
            onPress={goNext}
            style={styles.cta}
          />
        </View>
      </ScreenContainer>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  skipRow: {
    height: 32,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.xl,
  },
  cta: {
    width: '100%',
  },
});
