import React, { ReactNode, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AnimatePresence, MotiView } from 'moti';
import LinearGradient from 'react-native-linear-gradient';
import { RotateCw, TriangleAlert } from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import {
  COLORS,
  GRADIENTS,
  GradientName,
  RADIUS,
  SPACING,
} from '@/shared/constants';
import {
  GlassCard,
  GradientButton,
  ThemedText,
  TypingIndicator,
} from '@/shared/components';
import { AgentPhase } from '@/shared/types';
import { STRINGS } from '@/shared/constants';

import { ClarifyBox } from './ClarifyBox';

interface AgentCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  gradient: GradientName;
  phase: AgentPhase;
  error: string | null;
  clarifyingQuestion: string | null;
  runLabel: string;
  disabled?: boolean;
  onRun: () => void;
  onAnswer?: (text: string) => void;
  onClose?: () => void;
  resultText?: string;
  children?: ReactNode;
}

/**
 * Uniform shell for every AI agent: gradient icon + header, a run button whose
 * label tracks the phase, and inline loading / error / clarify / result states.
 */
export function AgentCard({
  title,
  description,
  icon,
  gradient,
  phase,
  error,
  clarifyingQuestion,
  runLabel,
  disabled = false,
  onRun,
  onAnswer,
  onClose,
  resultText,
  children,
}: AgentCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    if (!resultText) return;
    Clipboard.setString(resultText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [resultText]);

  const loading = phase === 'loading';
  const showResult = phase === 'success';
  const showClarify = phase === 'clarifying' && clarifyingQuestion && onAnswer;

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <LinearGradient
          colors={GRADIENTS[gradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconCircle}>
          {icon}
        </LinearGradient>
        <View style={styles.headerText}>
          <ThemedText variant="subheading">{title}</ThemedText>
          <ThemedText variant="secondary" color={COLORS.textSecondary}>
            {description}
          </ThemedText>
        </View>
      </View>

      <GradientButton
        label={loading ? '' : phase === 'success' ? `Re-run · ${runLabel}` : runLabel}
        gradient={gradient}
        onPress={onRun}
        loading={loading}
        disabled={disabled}
        compact
        icon={
          !loading && phase === 'success' ? (
            <RotateCw color={COLORS.white} size={16} />
          ) : undefined
        }
        style={styles.runButton}
      />

      <AnimatePresence>
        {loading ? (
          <MotiView
            key="loading"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={styles.statusRow}>
            <TypingIndicator label={STRINGS.ai.thinking} />
          </MotiView>
        ) : null}
      </AnimatePresence>

      {error ? (
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.errorRow}>
          <TriangleAlert color={COLORS.danger} size={16} />
          <ThemedText variant="secondary" color={COLORS.danger} style={styles.errorText}>
            {error}
          </ThemedText>
        </MotiView>
      ) : null}

      {showClarify ? <ClarifyBox question={clarifyingQuestion} onAnswer={onAnswer} /> : null}

      {showResult ? (
        <View style={styles.result}>
          {children}
          <View style={styles.resultActions}>
            {resultText ? (
              <Pressable
                onPress={handleCopy}
                style={[styles.copyButton, copied && styles.copyButtonActive]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <ThemedText
                  variant="secondary"
                  color={copied ? COLORS.success : '#7C5CFC'}>
                  {copied ? 'Copied!' : 'Copy'}
                </ThemedText>
              </Pressable>
            ) : null}
            {onClose ? (
              <Pressable
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <ThemedText variant="secondary" color={COLORS.textTertiary}>
                  Close
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  runButton: {
    marginTop: SPACING.xs,
  },
  statusRow: {
    marginTop: SPACING.lg,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  errorText: {
    flex: 1,
  },
  result: {
    marginTop: SPACING.lg,
  },
  resultActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: SPACING.md,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  copyButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(124,92,252,0.4)',
  },
  copyButtonActive: {
    borderColor: COLORS.success,
  },
});
