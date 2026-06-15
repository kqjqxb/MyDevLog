import React from 'react';
import { StyleSheet, View } from 'react-native';

import { RADIUS, SPACING } from '@/shared/constants';

import { GlassCard } from './GlassCard';
import { Shimmer } from './Shimmer';

/** Shimmer placeholder shaped like a task card, shown during initial load. */
export function SkeletonCard() {
  return (
    <GlassCard style={styles.card} flat>
      <View style={styles.row}>
        <Shimmer width="55%" height={18} />
        <Shimmer width={60} height={18} radius={RADIUS.pill} />
      </View>
      <Shimmer width="90%" height={12} style={styles.line} />
      <Shimmer width="70%" height={12} style={styles.line} />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  line: {
    marginTop: SPACING.sm,
  },
});
