import React from 'react';
import { StyleSheet, View } from 'react-native';
import { History } from 'lucide-react-native';

import { COLORS, SPACING } from '@/shared/constants';
import { GlassCard, ThemedText } from '@/shared/components';
import { AgentHistoryEntry } from '@/shared/types';
import { relativeTime } from '@/shared/utils';

interface Props {
  history: AgentHistoryEntry[];
}

/** Compact log of recent AI agent runs (persisted across app restarts). */
export function AgentHistoryList({ history }: Props) {
  if (history.length === 0) {
    return null;
  }
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <History color={COLORS.textSecondary} size={16} />
        <ThemedText variant="caption" color={COLORS.textSecondary}>
          ACTION HISTORY
        </ThemedText>
      </View>
      <GlassCard flat>
        {history.map((entry, index) => (
          <View
            key={entry.id}
            style={[styles.row, index < history.length - 1 && styles.divider]}>
            <View style={styles.rowText}>
              <ThemedText variant="bodyMedium">{entry.label}</ThemedText>
              <ThemedText
                variant="secondary"
                color={COLORS.textSecondary}
                numberOfLines={1}>
                {entry.summary}
              </ThemedText>
            </View>
            <ThemedText variant="caption" color={COLORS.textTertiary}>
              {relativeTime(entry.createdAt)}
            </ThemedText>
          </View>
        ))}
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
    marginLeft: SPACING.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
});
