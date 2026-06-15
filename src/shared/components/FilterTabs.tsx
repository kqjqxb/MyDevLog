import React, { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, FONTS, GRADIENTS, MOTION, RADIUS, SPACING } from '@/shared/constants';
import { triggerHaptic } from '@/shared/utils';

import { ThemedText } from './ThemedText';

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface FilterTabsProps<T extends string> {
  options: ReadonlyArray<TabOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

interface TabLayout {
  x: number;
  width: number;
}

/**
 * Horizontal filter tabs with a gradient pill that physically slides (and
 * resizes) to the selected tab using Reanimated springs. Each tab measures its
 * own position via `onLayout`, so labels stay on a single line at their natural
 * width and the row scrolls horizontally if it overflows.
 */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: FilterTabsProps<T>) {
  const layouts = useRef<Record<number, TabLayout>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex(option => option.value === value),
  );

  const positionPill = useCallback(() => {
    const layout = layouts.current[selectedIndex];
    if (layout) {
      pillX.value = layout.x;
      pillWidth.value = layout.width;
    }
  }, [selectedIndex, pillX, pillWidth]);

  // Slide the pill whenever the selection changes.
  useEffect(positionPill, [positionPill]);

  const handleTabLayout = useCallback(
    (index: number, event: LayoutChangeEvent) => {
      const { x, width } = event.nativeEvent.layout;
      layouts.current[index] = { x, width };
      if (index === selectedIndex) {
        positionPill();
      }
    },
    [positionPill, selectedIndex],
  );

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(pillX.value, MOTION.springSnappy) }],
    width: withSpring(pillWidth.value, MOTION.springSnappy),
  }));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}>
      <View style={styles.row}>
        <Animated.View style={[styles.pill, pillStyle]}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            style={styles.fill}
          />
        </Animated.View>

        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <Pressable
              key={option.value}
              style={styles.tab}
              onLayout={event => handleTabLayout(index, event)}
              onPress={() => {
                triggerHaptic('selection');
                onChange(option.value);
              }}>
              <ThemedText
                variant="caption"
                numberOfLines={1}
                color={active ? COLORS.white : COLORS.textSecondary}
                style={active ? styles.activeLabel : undefined}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const PADDING = 4;

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  content: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: PADDING,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  pill: {
    position: 'absolute',
    top: PADDING,
    // left stays 0: measured tab x already includes the row's left padding,
    // and absolute children are positioned from the row's border-box origin.
    left: 0,
    bottom: PADDING,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  tab: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    fontFamily: FONTS.semibold,
  },
});
