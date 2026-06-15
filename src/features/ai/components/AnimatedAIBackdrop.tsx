import React from 'react';
import { StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { GRADIENTS } from '@/shared/constants';

/**
 * Subtle living gradient behind the AI panel: two gradient layers slowly
 * cross-fade to give the surface a sense of motion without being distracting.
 */
export function AnimatedAIBackdrop() {
  return (
    <MotiView
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      from={{ opacity: 0.18 }}
      animate={{ opacity: 0.4 }}
      transition={{
        type: 'timing',
        duration: 4000,
        loop: true,
        repeatReverse: true,
        easing: Easing.inOut(Easing.ease),
      }}>
      <LinearGradient
        colors={GRADIENTS.ai}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </MotiView>
  );
}
