import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';

import { COLORS, GRADIENTS } from '@/shared/constants';
import { GradientText } from '@/shared/components';

/** Brief branded splash shown while persisted state hydrates. */
export function SplashScreen() {
  return (
    <View style={styles.container}>
      <MotiView
        from={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1.05, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 1200,
          loop: true,
          repeatReverse: true,
          easing: Easing.inOut(Easing.ease),
        }}
        style={styles.orbWrap}>
        <LinearGradient
          colors={GRADIENTS.accent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orb}
        />
      </MotiView>
      <GradientText text="DevLog" gradient="accent" fontSize={34} width={160} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 24,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
});
