import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { Check, Copy } from 'lucide-react-native';

import { COLORS, RADIUS, SPACING, STRINGS } from '@/shared/constants';
import {
  SuccessShimmer,
  ThemedText,
  TypewriterText,
} from '@/shared/components';
import { StatusUpdateResult, TaskState } from '@/shared/types';
import { triggerHaptic } from '@/shared/utils';

interface Props {
  result: StatusUpdateResult;
}

const STATE_COLOR: Record<TaskState, string> = {
  'on-track': COLORS.success,
  blocked: COLORS.danger,
  completed: COLORS.info,
  'needs-review': COLORS.warning,
};

const STATE_LABEL: Record<TaskState, string> = {
  'on-track': 'On track',
  blocked: 'Blocked',
  completed: 'Completed',
  'needs-review': 'Needs review',
};

/** Slack-style update with a typewriter reveal and copy-to-clipboard + haptic. */
export function StatusUpdateResultView({ result }: Props) {
  const [copied, setCopied] = useState(false);
  const [shimmer, setShimmer] = useState(0);
  const color = STATE_COLOR[result.state];

  const handleCopy = useCallback(() => {
    Clipboard.setString(result.message);
    triggerHaptic('notificationSuccess');
    setCopied(true);
    setShimmer(s => s + 1);
    setTimeout(() => setCopied(false), 1800);
  }, [result.message]);

  return (
    <View style={styles.container}>
      <View style={[styles.statePill, { backgroundColor: `${color}22`, borderColor: `${color}55` }]}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <ThemedText variant="caption" color={color}>
          {STATE_LABEL[result.state]}
        </ThemedText>
      </View>

      <View style={styles.messageBox}>
        <SuccessShimmer trigger={shimmer} />
        <TypewriterText text={result.message} variant="body" style={styles.message} />
      </View>

      <Pressable onPress={handleCopy} style={styles.copyButton}>
        {copied ? (
          <Check color={COLORS.success} size={16} />
        ) : (
          <Copy color={COLORS.textSecondary} size={16} />
        )}
        <ThemedText variant="caption" color={copied ? COLORS.success : COLORS.textSecondary}>
          {copied ? STRINGS.ai.copied : STRINGS.ai.copy}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
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
  messageBox: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  message: {
    lineHeight: 22,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
  },
});
