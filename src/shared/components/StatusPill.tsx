import React from 'react';
import { StyleSheet, View } from 'react-native';

import { RADIUS, SPACING } from '@/shared/constants';
import { STATUS_COLOR, STATUS_LABEL } from '@/shared/utils';
import { TaskStatus } from '@/shared/types';

import { ThemedText } from './ThemedText';

interface StatusPillProps {
  status: TaskStatus;
}

/** Colored status pill with a translucent tinted background. */
export function StatusPill({ status }: StatusPillProps) {
  const color = STATUS_COLOR[status];
  return (
    <View style={[styles.pill, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <ThemedText variant="caption" color={color}>
        {STATUS_LABEL[status]}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
