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
  prioritization: { Icon: Sparkles,       iconColor: '#7C5CFC', description: 'AI-ranked task list'      },
  blocker:        { Icon: AlertTriangle,   iconColor: '#EF4444', description: 'Dependencies & stale work' },
  decomposition:  { Icon: Layers,          iconColor: '#38BDF8', description: 'Subtask breakdown'         },
  'status-update':{ Icon: MessageSquare,   iconColor: '#F59E0B', description: 'Progress summary'          },
};

// ---------------------------------------------------------------------------
// Result parser — detects "1. Title\nDesc" or "(1) Title\nDesc" in any text
// ---------------------------------------------------------------------------

type ParsedBlock =
  | { kind: 'text'; content: string }
  | { kind: 'numbered'; rank: number; title: string; description: string };

function parseFullResult(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const paragraphs = text.split(/\n\n+/);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    // Match "1. Title" or "(1) Title", then optional newline + description
    const m = trimmed.match(/^(?:(\d+)\.\s+|\((\d+)\)\s+)(.+?)(?:\n([\s\S]*))?$/);
    if (m) {
      blocks.push({
        kind: 'numbered',
        rank: parseInt((m[1] ?? m[2])!, 10),
        title: m[3]!.trim(),
        description: m[4]?.trim() ?? '',
      });
    } else {
      blocks.push({ kind: 'text', content: trimmed });
    }
  }

  return blocks;
}

// ---------------------------------------------------------------------------

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
    backdropOpacity.value = withTiming(1, { duration: 280 });
    translateY.value = withSpring(0, SPRING);
  }, [backdropOpacity, translateY]);

  const animateOut = useCallback(
    (done: () => void) => {
      backdropOpacity.value = withTiming(0, { duration: 240 });
      translateY.value = withSpring(SCREEN_HEIGHT, SPRING);
      setTimeout(done, 360);
    },
    [backdropOpacity, translateY],
  );

  useEffect(() => {
    if (entry) {
      setCopied(false);
      setVisible(true);
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

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible || !entry) return null;

  const meta = AGENT_META[entry.agent];
  const blocks = parseFullResult(entry.fullResult ?? entry.summary);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent>

      <Animated.View
        style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + SPACING.lg }]}>
          {/* gradient rendered as bg layer so layout stays on the View */}
          <LinearGradient
            colors={['#7C5CFC', '#5B3FD4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.headerTop}>
            <View style={styles.iconCircle}>
              <meta.Icon color={COLORS.white} size={22} />
            </View>
            <View style={styles.headerText}>
              <ThemedText variant="subheading" color={COLORS.white}>
                {entry.label}
              </ThemedText>
              <ThemedText variant="secondary" color="rgba(255,255,255,0.65)">
                {meta.description}
              </ThemedText>
            </View>
            <Pressable
              onPress={handleClose}
              style={styles.closeIconBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <X color="rgba(255,255,255,0.85)" size={20} />
            </Pressable>
          </View>

          <ThemedText
            variant="caption"
            color="rgba(255,255,255,0.45)"
            style={styles.timestamp}>
            {relativeTime(entry.createdAt)}
          </ThemedText>
        </View>

        {/* ── Scrollable content ─────────────────────────────────────── */}
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
                variant="body"
                color={COLORS.textPrimary}
                style={styles.textBlock}>
                {block.content}
              </ThemedText>
            ),
          )}
        </ScrollView>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <View
          style={[
            styles.footer,
            { paddingBottom: Math.max(insets.bottom, SPACING.lg) + SPACING.md },
          ]}>
          <GradientButton
            label={copied ? 'Copied!' : 'Copy Result'}
            gradient="primary"
            onPress={handleCopy}
            style={styles.footerPrimary}
          />
          <Pressable onPress={handleClose} style={styles.closeTextBtn}>
            <ThemedText variant="bodyMedium" color={COLORS.textSecondary}>
              Close
            </ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  sheet: {
    flex: 1,
    backgroundColor: '#1C1C2E',
  },

  // Header
  header: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl,
    gap: SPACING.xs,
    overflow: 'hidden',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  closeIconBtn: {
    padding: SPACING.xs,
  },
  timestamp: {
    marginLeft: 42 + SPACING.md,
    marginTop: 2,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.sm,
  },
  textBlock: {
    lineHeight: 22,
  },

  // Numbered card
  numberedCard: {
    marginBottom: 2,
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

  // Footer
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    gap: SPACING.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: '#1C1C2E',
  },
  footerPrimary: {
    width: '100%',
  },
  closeTextBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
});
