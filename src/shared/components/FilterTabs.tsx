import React, { useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, GRADIENTS, MOTION, RADIUS, SPACING } from '@/shared/constants';
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

/**
 * Horizontal filter tabs with a gradient pill indicator that springs between
 * the selected tab positions.
 */
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: FilterTabsProps<T>) {
  const [width, setWidth] = useState(0);
  const count = options.length;
  const selectedIndex = Math.max(
    0,
    options.findIndex(option => option.value === value),
  );
  const tabWidth = width > 0 ? (width - PADDING * 2) / count : 0;

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(selectedIndex * tabWidth, MOTION.spring) }],
    width: tabWidth,
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      {width > 0 ? (
        <Animated.View style={[styles.indicator, indicatorStyle]}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
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
              color={active ? COLORS.white : COLORS.textSecondary}>
              {option.label}
              {typeof option.count === 'number' ? `  ${option.count}` : ''}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const PADDING = 4;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.pill,
    padding: PADDING,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    bottom: PADDING,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
