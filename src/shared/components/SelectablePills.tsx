import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import LinearGradient from 'react-native-linear-gradient';

import {
  COLORS,
  GRADIENTS,
  GradientName,
  RADIUS,
  SPACING,
} from '@/shared/constants';
import { triggerHaptic } from '@/shared/utils';

import { ThemedText } from './ThemedText';

export interface PillOption<T extends string> {
  value: T;
  label: string;
  gradient?: GradientName;
}

interface SelectablePillsProps<T extends string> {
  options: ReadonlyArray<PillOption<T>>;
  value: T;
  onChange: (value: T) => void;
}

/**
 * Row of mutually-exclusive pills. The selected pill animates a gradient fill
 * in/out; unselected pills show a flat outlined surface.
 */
export function SelectablePills<T extends string>({
  options,
  value,
  onChange,
}: SelectablePillsProps<T>) {
  return (
    <View style={styles.row}>
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => {
              triggerHaptic('selection');
              onChange(option.value);
            }}
            style={styles.pillWrap}>
            <MotiView
              animate={{ opacity: selected ? 1 : 0 }}
              transition={{ type: 'timing', duration: 220 }}
              style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={GRADIENTS[option.gradient ?? 'primary']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, styles.fill]}
              />
            </MotiView>
            <View style={[styles.pill, !selected && styles.pillIdle]}>
              <ThemedText
                variant="caption"
                color={selected ? COLORS.white : COLORS.textSecondary}>
                {option.label}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  pillWrap: {
    flex: 1,
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: RADIUS.pill,
  },
  pill: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.pill,
  },
  pillIdle: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
