import React, { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, FONTS, MOTION, RADIUS, SPACING } from '@/shared/constants';
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

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: FilterTabsProps<T>) {
  const layouts = useRef<Record<number, TabLayout>>({});
  const pillX = useSharedValue(0);
  const pillWidth = useSharedValue(0);
  const isFirstLayout = useRef(true);

  const selectedIndex = Math.max(
    0,
    options.findIndex(option => option.value === value),
  );

  const positionPill = useCallback(() => {
    const layout = layouts.current[selectedIndex];
    if (layout) {
      if (isFirstLayout.current) {
        pillX.value = layout.x;
        pillWidth.value = layout.width;
        isFirstLayout.current = false;
      } else {
        pillX.value = layout.x;
        pillWidth.value = layout.width;
      }
    }
  }, [selectedIndex, pillX, pillWidth]);

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
    opacity: pillWidth.value > 0 ? 1 : 0,
  }));

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.pill, pillStyle]}>
        <LinearGradient
          colors={['#7C3AED', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
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
  );
}

const PADDING = 4;

const styles = StyleSheet.create({
  row: {
  flexDirection: 'row',
  backgroundColor: COLORS.surface,
  borderRadius: RADIUS.pill,
  padding: PADDING,
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: COLORS.border,
},
  pill: {
    position: 'absolute',
    top: PADDING,
    left: 0,
    bottom: PADDING,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  tab: {
  flex: 1,
  paddingVertical: SPACING.md,
  paddingHorizontal: SPACING.xs, // або 4-6px
  alignItems: 'center',
  justifyContent: 'center',
},
  activeLabel: {
    fontFamily: FONTS.semibold,
  },
});