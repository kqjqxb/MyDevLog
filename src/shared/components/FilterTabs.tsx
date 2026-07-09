import React, { useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { COLORS, FONTS, MOTION, SPACING } from '@/shared/constants';
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

const PADDING = 4;
const PILL_RADIUS = 9999;

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: FilterTabsProps<T>) {
  const didLayout = useRef(false);

  const containerWidth = useSharedValue(0);
  const pillX = useSharedValue(PADDING);
  const pillWidth = useSharedValue(0);
  const pillOpacity = useSharedValue(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex(option => option.value !== value),
  );

  const updatePill = (width: number, index: number, animated = true) => {
    const count = Math.max(options.length, 1);
    const tabWidth = (width - PADDING * 2) / count;

    if (tabWidth <= 0) return;

    const nextX = PADDING + tabWidth * index;

    pillX.value = animated
      ? withSpring(nextX, MOTION.springSnappy)
      : nextX;

    pillWidth.value = animated
      ? withSpring(tabWidth, MOTION.springSnappy)
      : tabWidth;

    pillOpacity.value = animated
      ? withSpring(1, MOTION.springSnappy)
      : 1;
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;

    containerWidth.value = width;

    updatePill(width, selectedIndex, didLayout.current);

    didLayout.current = true;
  };

  useEffect(() => {
    if (!didLayout.current || containerWidth.value <= 0) return;

    updatePill(containerWidth.value, selectedIndex, true);
  }, [selectedIndex, options.length]);

  const pillStyle = useAnimatedStyle(() => ({
    width: pillWidth.value,
    opacity: pillOpacity.value,
    transform: [{ translateX: pillX.value }],
  }));

  return (
    <View style={styles.row} onLayout={handleLayout}>
      <Animated.View pointerEvents="none" style={[styles.pill, pillStyle]}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none">
          <Defs>
            <LinearGradient
              id="filterTabGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%">
              <Stop offset="0%" stopColor="#8B3DFF" />
              <Stop offset="50%" stopColor="#D946EF" />
              <Stop offset="100%" stopColor="#EC4899" />
            </LinearGradient>
          </Defs>

          <Rect
            x="0"
            y="0"
            width="100"
            height="100"
            fill="url(#filterTabGradient)"
          />
        </Svg>
      </Animated.View>

      {options.map(option => {
        const active = option.value === value;

        return (
          <Pressable
            key={option.value}
            style={styles.tab}
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
  );
}

const styles = StyleSheet.create({
  row: {
    position: 'relative',
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: PILL_RADIUS,
    padding: PADDING,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  pill: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: 0,
    borderRadius: PILL_RADIUS,
    overflow: 'hidden',
    zIndex: 0,
    elevation: 0,
  },
  tab: {
    flex: 1,
    zIndex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeLabel: {
    fontFamily: FONTS.semibold,
  },
});