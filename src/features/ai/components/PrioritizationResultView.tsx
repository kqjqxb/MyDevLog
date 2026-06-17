import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';

import { COLORS, GRADIENTS, RADIUS, SPACING } from '@/shared/constants';
import { ThemedText, TypewriterText } from '@/shared/components';
import { PrioritizationResult } from '@/shared/types';
import LinearGradient from 'react-native-linear-gradient';

import { ContentWarningBanner } from './ContentWarningBanner';

interface Props {
  result: PrioritizationResult;
}

/** Ranked plan: a summary line then each task with its rank and reasoning. */
export function PrioritizationResultView({ result }: Props) {
  return (
    <View>
      <ContentWarningBanner warnings={result.contentWarnings} />
      <TypewriterText
        text={result.summary}
        variant="bodyMedium"
        color={COLORS.textPrimary}
        style={styles.summary}
      />
      {result.ranked.map((item, index) => (
        <MotiView
          key={item.taskId}
          from={{ opacity: 0, translateX: 16 }}
          animate={{ opacity: 1, translateX: 0 }}
          transition={{ type: 'spring', delay: index * 90, damping: 16, stiffness: 160 }}
          style={styles.row}>
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.rankBadge}>
            <ThemedText variant="caption" color={COLORS.white}>
              {item.rank}
            </ThemedText>
          </LinearGradient>
          <View style={styles.rowText}>
            <ThemedText variant="bodyMedium" numberOfLines={1}>
              {item.title}
            </ThemedText>
            <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.reason}>
              {item.reasoning}
            </ThemedText>
          </View>
        </MotiView>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    marginBottom: SPACING.lg,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  reason: {
    lineHeight: 19,
  },
});
