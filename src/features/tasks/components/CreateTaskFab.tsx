import React, { useCallback } from 'react';
import { Dimensions, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Plus } from 'lucide-react-native';

import { COLORS, GRADIENTS, MOTION, SHADOWS, SPACING } from '@/shared/constants';
import { GlowRing } from '@/shared/components';
import { triggerHaptic } from '@/shared/utils';

interface CreateTaskFabProps {
  onPress: () => void;
}

const SIZE = 60;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Floating action button with an infinite pulsing gradient glow ring. */
export function CreateTaskFab({ onPress }: CreateTaskFabProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotation.value}deg` }],
  }));

  const handlePress = useCallback(() => {
    triggerHaptic('impactMedium');
    rotation.value = withSpring(rotation.value + 90, MOTION.spring);
    onPress();
  }, [onPress, rotation]);

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.fabWrap}>
        <GlowRing size={SIZE + 18} gradient="accent" />
        <AnimatedPressable
          onPress={handlePress}
          onPressIn={() => {
            scale.value = withSpring(0.9, MOTION.spring);
          }}
          onPressOut={() => {
            scale.value = withSpring(1, MOTION.spring);
          }}
          style={[styles.fab, SHADOWS.glow, animatedStyle]}>
          <LinearGradient
            colors={GRADIENTS.accent}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Plus color={COLORS.white} size={28} strokeWidth={2.5} />
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: Dimensions.get('window').height * 0.14,
  },
  fabWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: SIZE,
    height: SIZE,
  },
  fab: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
