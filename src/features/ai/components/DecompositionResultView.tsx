import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { Check, CheckCircle2, Plus } from 'lucide-react-native';

import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { GradientButton, ThemedText } from '@/shared/components';
import { DecompositionResult } from '@/shared/types';

interface Props {
  result: DecompositionResult;
  applied: boolean;
  onApply: () => void;
}

/** Generated subtasks revealed one-by-one, with an "add to task" action. */
export function DecompositionResultView({ result, applied, onApply }: Props) {
  const hasNewSubtasks = result.subtasks.length > 0;

  return (
    <View>
      <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.rationale}>
        {result.rationale}
      </ThemedText>

      {hasNewSubtasks ? (
        <>
          {result.subtasks.map((subtask, index) => (
            <MotiView
              key={`${index}-${subtask}`}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: index * 80, damping: 15, stiffness: 150 }}
              style={styles.row}>
              <View style={styles.bullet}>
                <ThemedText variant="caption" color={COLORS.textSecondary}>
                  {index + 1}
                </ThemedText>
              </View>
              <ThemedText variant="body" style={styles.subtaskText}>
                {subtask}
              </ThemedText>
            </MotiView>
          ))}

          <GradientButton
            label={applied ? 'Added to task' : STRINGS.ai.applySubtasks}
            gradient={applied ? 'success' : 'primary'}
            compact
            disabled={applied}
            onPress={onApply}
            icon={
              applied ? (
                <Check color={COLORS.white} size={16} />
              ) : (
                <Plus color={COLORS.white} size={16} />
              )
            }
            style={styles.button}
          />
        </>
      ) : (
        <View style={styles.completeRow}>
          <CheckCircle2 color={COLORS.success} size={18} />
          <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.completeText}>
            Your existing subtasks already cover this — nothing new to add.
          </ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  rationale: {
    marginBottom: SPACING.lg,
    lineHeight: 21,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  bullet: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskText: {
    flex: 1,
  },
  button: {
    marginTop: SPACING.lg,
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  completeText: {
    flex: 1,
    lineHeight: 20,
  },
});
