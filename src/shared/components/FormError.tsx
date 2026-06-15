import React from 'react';
import { StyleSheet } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';

import { COLORS, SPACING } from '@/shared/constants';

import { ThemedText } from './ThemedText';

interface FormErrorProps {
  message?: string;
}

/** Validation error that animates in from the top and out on resolve. */
export function FormError({ message }: FormErrorProps) {
  return (
    <AnimatePresence>
      {message ? (
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: -8 }}
          transition={{ type: 'timing', duration: 200 }}
          style={styles.container}>
          <ThemedText variant="caption" color={COLORS.danger}>
            {message}
          </ThemedText>
        </MotiView>
      ) : null}
    </AnimatePresence>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xs,
  },
});
