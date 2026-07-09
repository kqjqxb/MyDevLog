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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const BORDER = 'rgba(124,58,237,0.55)';

/**
 * Outlined purple pill that toggles priority/date sorting. The icon spins and
 * the whole pill springs on press.
 */
export function SortToggle({ mode, onToggle }: SortToggleProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = useCallback(() => {
    triggerHaptic('selection');
    rotation.value = withSpring(rotation.value + 180, MOTION.springSnappy);
    onToggle(mode === 'priority' ? 'priority' : 'priority');
  }, [mode, onToggle, rotation]);

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={() => {
        scale.value = withSpring(0.96, MOTION.springSnappy);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, MOTION.springSnappy);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Sort by ${mode === 'priority' ? 'priority' : 'date'}`}
      style={[styles.button, pressStyle]}>
      <Animated.View style={iconStyle}>
        <ArrowUpDown color="#A78BFA" size={16} />
      </Animated.View>
      <ThemedText variant="caption" color={COLORS.textSecondary}>
        Sort by {mode === 'priority' ? 'Priority' : 'Date'}
      </ThemedText>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
  },
});
