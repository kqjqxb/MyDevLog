import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { AlertTriangle } from 'lucide-react-native';

import { COLORS, RADIUS, SPACING } from '@/shared/constants';
import { ThemedText } from '@/shared/components';
import { ContentQualityWarning } from '@/shared/types';

interface Props {
  warnings: ContentQualityWarning[];
}

/**
 * Non-blocking advisory strip rendered at the top of aggregate agent results
 * when one or more tasks were genuinely skipped (all context fields are
 * placeholder/gibberish). Tasks flagged with skipped=false are ranked normally
 * and shown as soft inline notes — not here.
 */
export function ContentWarningBanner({ warnings }: Props) {
  const skipped = warnings.filter(w => w.skipped);
  if (skipped.length === 0) {
    return null;
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -4 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 240 }}
      style={styles.container}>
      <View style={styles.header}>
        <AlertTriangle color={COLORS.warning} size={14} />
        <ThemedText variant="caption" color={COLORS.warning} style={styles.headerText}>
          {skipped.length === 1
            ? '1 task skipped — looks like placeholder content'
            : `${skipped.length} tasks skipped — look like placeholder content`}
        </ThemedText>
      </View>
      {skipped.map(w => (
        <View key={w.taskId} style={styles.row}>
          <ThemedText variant="secondary" color={COLORS.textSecondary} numberOfLines={1} style={styles.title}>
            {w.taskTitle}
          </ThemedText>
          <ThemedText variant="secondary" color={COLORS.textTertiary} style={styles.reason}>
            {w.reason}
          </ThemedText>
        </View>
      ))}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: `${COLORS.warning}14`,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${COLORS.warning}44`,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  headerText: {
    flex: 1,
  },
  row: {
    paddingLeft: SPACING.sm,
    gap: 2,
  },
  title: {
    fontWeight: '500',
  },
  reason: {
    lineHeight: 17,
  },
});
