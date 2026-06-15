import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { ArrowDown, Clock, Link2 } from 'lucide-react-native';

import { COLORS, RADIUS, SPACING } from '@/shared/constants';
import { ThemedText, TypewriterText } from '@/shared/components';
import { BlockerDetectionResult } from '@/shared/types';

interface Props {
  result: BlockerDetectionResult;
}

/** Dependency links (blocker → blocked) plus a stale-work list. */
export function BlockerResultView({ result }: Props) {
  const nothingFound = result.links.length === 0 && result.stale.length === 0;

  return (
    <View>
      <TypewriterText
        text={result.summary}
        variant="bodyMedium"
        style={styles.summary}
      />

      {result.links.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Link2 color={COLORS.info} size={16} />
            <ThemedText variant="caption" color={COLORS.textSecondary}>
              DEPENDENCIES
            </ThemedText>
          </View>
          {result.links.map((link, index) => (
            <MotiView
              key={`${link.blockerTaskId}-${link.blockedTaskId}-${index}`}
              from={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', delay: index * 100, damping: 16, stiffness: 150 }}
              style={styles.linkCard}>
              <View style={styles.node}>
                <ThemedText variant="bodyMedium" numberOfLines={1}>
                  {link.blockerTitle}
                </ThemedText>
                <ThemedText variant="caption" color={COLORS.warning}>
                  blocks
                </ThemedText>
              </View>
              <ArrowDown color={COLORS.textTertiary} size={16} style={styles.arrow} />
              <View style={styles.node}>
                <ThemedText variant="bodyMedium" numberOfLines={1}>
                  {link.blockedTitle}
                </ThemedText>
              </View>
              <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.reason}>
                {link.reason}
              </ThemedText>
            </MotiView>
          ))}
        </View>
      ) : null}

      {result.stale.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock color={COLORS.warning} size={16} />
            <ThemedText variant="caption" color={COLORS.textSecondary}>
              STALE WORK
            </ThemedText>
          </View>
          {result.stale.map((item, index) => (
            <MotiView
              key={item.taskId}
              from={{ opacity: 0, translateX: 12 }}
              animate={{ opacity: 1, translateX: 0 }}
              transition={{ type: 'spring', delay: index * 90, damping: 16, stiffness: 150 }}
              style={styles.staleCard}>
              <View style={styles.staleHeader}>
                <ThemedText variant="bodyMedium" numberOfLines={1} style={styles.staleTitle}>
                  {item.title}
                </ThemedText>
                <ThemedText variant="caption" color={COLORS.warning}>
                  {item.daysInProgress}d
                </ThemedText>
              </View>
              <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.reason}>
                {item.recommendation}
              </ThemedText>
            </MotiView>
          ))}
        </View>
      ) : null}

      {nothingFound ? (
        <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.clear}>
          No hidden blockers or stale tasks detected. 🎉
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginBottom: SPACING.lg,
    lineHeight: 21,
  },
  section: {
    marginBottom: SPACING.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.md,
  },
  linkCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  node: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  arrow: {
    alignSelf: 'center',
    marginVertical: 2,
  },
  reason: {
    marginTop: SPACING.sm,
    lineHeight: 18,
  },
  staleCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
    marginBottom: SPACING.md,
  },
  staleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  staleTitle: {
    flex: 1,
  },
  clear: {
    lineHeight: 21,
  },
});
