import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { X } from 'lucide-react-native';

import { COLORS, SPACING } from '@/shared/constants';
import { AnimatedCheckbox, ThemedText } from '@/shared/components';
import { Subtask } from '@/shared/types';

interface SubtaskRowProps {
  subtask: Subtask;
  index: number;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

/** A single subtask line: animated checkbox, strike-through, remove button. */
export function SubtaskRow({ subtask, index, onToggle, onRemove }: SubtaskRowProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateX: -16 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'spring', delay: index * 60, damping: 16, stiffness: 160 }}
      style={styles.row}>
      <AnimatedCheckbox checked={subtask.completed} onToggle={() => onToggle(subtask.id)} />
      <ThemedText
        variant="body"
        color={subtask.completed ? COLORS.textTertiary : COLORS.textPrimary}
        style={[styles.title, subtask.completed && styles.completed]}>
        {subtask.title}
      </ThemedText>
      <Pressable onPress={() => onRemove(subtask.id)} hitSlop={8}>
        <X color={COLORS.textTertiary} size={18} />
      </Pressable>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    flex: 1,
  },
  completed: {
    textDecorationLine: 'line-through',
  },
});
