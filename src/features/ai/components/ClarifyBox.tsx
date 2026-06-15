import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MotiView } from 'moti';
import { MessageCircleQuestion } from 'lucide-react-native';

import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import {
  AnimatedTextInput,
  GradientButton,
  ThemedText,
} from '@/shared/components';

interface ClarifyBoxProps {
  question: string;
  onAnswer: (text: string) => void;
}

/**
 * Rendered when an agent needs more information mid-run. Captures the user's
 * answer and feeds it back into the conversation (the multi-step hand-off).
 */
export function ClarifyBox({ question, onAnswer }: ClarifyBoxProps) {
  const [text, setText] = useState('');

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 260 }}
      style={styles.container}>
      <View style={styles.questionRow}>
        <MessageCircleQuestion color={COLORS.warning} size={18} />
        <ThemedText variant="bodyMedium" style={styles.question}>
          {question}
        </ThemedText>
      </View>
      <AnimatedTextInput
        value={text}
        onChangeText={setText}
        placeholder="Type your answer…"
        multiline
        containerStyle={styles.input}
      />
      <GradientButton
        label={STRINGS.ai.answerFollowUp}
        gradient="accent"
        compact
        disabled={text.trim().length === 0}
        onPress={() => onAnswer(text.trim())}
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  questionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'flex-start',
  },
  question: {
    flex: 1,
    lineHeight: 21,
  },
  input: {
    marginTop: SPACING.xs,
  },
});
