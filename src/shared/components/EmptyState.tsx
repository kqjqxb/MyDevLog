import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';

import { COLORS, GRADIENTS, SPACING } from '@/shared/constants';
import LinearGradient from 'react-native-linear-gradient';

import { ThemedText } from './ThemedText';

interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

/** Empty-state illustration with a gently breathing gradient orb. */
export function EmptyState({ title, subtitle, icon }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <MotiView
        from={{ scale: 0.9, opacity: 0.7 }}
        animate={{ scale: 1.05, opacity: 1 }}
        transition={{
          type: 'timing',
          duration: 2200,
          loop: true,
          repeatReverse: true,
          easing: Easing.inOut(Easing.ease),
        }}>
        <LinearGradient
          colors={GRADIENTS.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.orb}>
          {icon}
        </LinearGradient>
      </MotiView>
      <MotiView
        from={{ opacity: 0, translateY: 12 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400, delay: 150 }}
        style={styles.text}>
        <ThemedText variant="title" style={styles.title}>
          {title}
        </ThemedText>
        <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.subtitle}>
          {subtitle}
        </ThemedText>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
    paddingBottom: SPACING.huge,
  },
  orb: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});
