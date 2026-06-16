import React, { useCallback, useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Layers,
  MessageSquare,
  Sparkles,
  X,
} from 'lucide-react-native';
import Clipboard from '@react-native-clipboard/clipboard';

import { COLORS, RADIUS, SPACING } from '@/shared/constants';
import { GlassCard, GradientButton, ThemedText } from '@/shared/components';
import { AgentHistoryEntry } from '@/shared/types';
import { relativeTime } from '@/shared/utils';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const SPRING = { damping: 22, stiffness: 200, mass: 1 } as const;

const AGENT_META: Record<
  AgentHistoryEntry['agent'],
  { Icon: React.ComponentType<{ color: string; size: number }>; iconColor: string; description: string }
> = {
  prioritization: {
    Icon: Sparkles,
    iconColor: '#7C5CFC',
    description: 'AI-ranked task list',
  },
  blocker: {
    Icon: AlertTriangle,
    iconColor: '#EF4444',
    description: 'Dependencies & stale work',
  },
  decomposition: {
    Icon: Layers,
    iconColor: '#38BDF8',
    description: 'Subtask breakdown',
  },
  'status-update': {
    Icon: MessageSquare,
    iconColor: '#F59E0B',
    description: 'Progress summary',
  },
};

type ParsedBlock =
  | { kind: 'text'; content: string }
  | { kind: 'numbered'; rank: number; title: string; description: string };

function parseFullResult(
  text: string,
  agent: AgentHistoryEntry['agent'],
): ParsedBlock[] {
  if (agent !== 'prioritization') {
    return [{ kind: 'text', content: text }];
  }

  const blocks: ParsedBlock[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    const match = trimmed.match(/^(\d+)\.\s+(.+?)(?:\n([\s\S]*))?$/);
    if (match) {
      blocks.push({
        kind: 'numbered',
        rank: parseInt(match[1]!, 10),
        title: match[2]!.trim(),
        description: match[3]?.trim() ?? '',
      });
    } else {
      blocks.push({ kind: 'text', content: trimmed });
    }
  }

  return blocks;
}

interface Props {
  entry: AgentHistoryEntry | null;
  onClose: () => void;
}

export function AgentHistoryModal({ entry, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const animateIn = useCallback(() => {
    backdropOpacity.value = withTiming(1, { duration: 300 });
    translateY.value = withSpring(0, SPRING);
  }, [backdropOpacity, translateY]);

  const animateOut = useCallback(
    (done: () => void) => {
      backdropOpacity.value = withTiming(0, { duration: 280 });
      translateY.value = withSpring(SCREEN_HEIGHT, SPRING);
      setTimeout(done, 380);
    },
    [backdropOpacity, translateY],
  );

  useEffect(() => {
    if (entry) {
      setCopied(false);
      setVisible(true);
      // defer one frame so the Modal has mounted before animating
      requestAnimationFrame(animateIn);
    }
  }, [entry, animateIn]);

  const handleClose = useCallback(() => {
    animateOut(() => {
      setVisible(false);
      onClose();
    });
  }, [animateOut, onClose]);

  const handleCopy = useCallback(() => {
    const text = entry?.fullResult ?? entry?.summary ?? '';
    if (!text) return;
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [entry]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || !entry) return null;

  const meta = AGENT_META[entry.agent];
  const blocks = parseFullResult(entry.fullResult ?? entry.summary, entry.agent);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent>
      {/* backdrop */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        pointerEvents="none"
      />

      {/* full-screen sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* gradient header */}
        <LinearGradient
          colors={['#7C5CFC', '#5B3FD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
          <View style={styles.headerTop}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <meta.Icon color={COLORS.white} size={22} />
            </View>
            <View style={styles.headerText}>
              <ThemedText variant="subheading" color={COLORS.white}>
                {entry.label}
              </ThemedText>
              <ThemedText variant="secondary" color="rgba(255,255,255,0.7)">
                {meta.description}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X color={COLORS.white} size={22} />
            </Pressable>
          </View>
          <ThemedText variant="caption" color="rgba(255,255,255,0.5)" style={styles.timestamp}>
            {relativeTime(entry.createdAt)}
          </ThemedText>
        </LinearGradient>

        {/* scrollable content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {blocks.map((block, i) =>
            block.kind === 'numbered' ? (
              <NumberedCard key={i} block={block} />
            ) : (
              <ThemedText
                key={i}
                variant="bodyMedium"
                color={COLORS.textPrimary}
                style={styles.textBlock}>
                {block.content}
              </ThemedText>
            ),
          )}
        </ScrollView>

        {/* bottom actions */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, SPACING.lg) + SPACING.lg },
          ]}>
          <GradientButton
            label={copied ? 'Copied!' : 'Copy Result'}
            gradient="primary"
            onPress={handleCopy}
            style={styles.footerPrimary}
          />
          <Pressable onPress={handleClose} style={styles.rerunButton}>
            <ThemedText variant="bodyMedium" color="#7C5CFC">
              Re-run Agent
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

interface NumberedCardProps {
  block: Extract<ParsedBlock, { kind: 'numbered' }>;
}

function NumberedCard({ block }: NumberedCardProps) {
  return (
    <GlassCard flat style={styles.numberedCard}>
      <View style={styles.numberedCardInner}>
        <LinearGradient
          colors={['#7C5CFC', '#5B3FD4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.rankBadge}>
          <ThemedText variant="caption" color={COLORS.white}>
            {block.rank}
          </ThemedText>
        </LinearGradient>
        <View style={styles.numberedCardText}>
          <ThemedText variant="bodyMedium">{block.title}</ThemedText>
          {block.description ? (
            <ThemedText
              variant="secondary"
              color={COLORS.textSecondary}
              style={styles.cardDesc}>
              {block.description}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#1C1C2E',
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.sm,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
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
  closeBtn: {
    padding: SPACING.xs,
  },
  timestamp: {
    marginLeft: 44 + SPACING.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    gap: SPACING.md,
    paddingBottom: SPACING.xxxl,
  },
  textBlock: {
    lineHeight: 22,
  },
  numberedCard: {
    marginBottom: SPACING.xs,
  },
  numberedCardInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  rankBadge: {
    width: 26,
    height: 26,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  numberedCardText: {
    flex: 1,
    gap: 4,
  },
  cardDesc: {
    lineHeight: 19,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: '#1C1C2E',
  },
  footerPrimary: {
    width: '100%',
  },
  rerunButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(124,92,252,0.4)',
  },
});
