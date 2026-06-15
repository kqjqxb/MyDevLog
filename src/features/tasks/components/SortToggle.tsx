import React, { useCallback } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { ArrowUpDown } from 'lucide-react-native';

import { COLORS, MOTION, RADIUS, SPACING } from '@/shared/constants';
import { ThemedText } from '@/shared/components';
import { SortMode, triggerHaptic } from '@/shared/utils';

interface SortToggleProps {
  mode: SortMode;
  onToggle: (next: SortMode) => void;
}

/** Toggles between priority/date sorting; the icon spins on each change. */
export function SortToggle({ mode, onToggle }: SortToggleProps) {
  const rotation = useSharedValue(0);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handlePress = useCallback(() => {
    triggerHaptic('selection');
    rotation.value = withSpring(rotation.value + 180, MOTION.spring);
    onToggle(mode === 'priority' ? 'date' : 'priority');
  }, [mode, onToggle, rotation]);

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      <Animated.View style={iconStyle}>
        <ArrowUpDown color={COLORS.textSecondary} size={16} />
      </Animated.View>
      <ThemedText variant="caption" color={COLORS.textSecondary}>
        {mode === 'priority' ? 'Priority' : 'Date'}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
});
