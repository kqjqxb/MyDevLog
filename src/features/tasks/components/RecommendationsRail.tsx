import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { Clock, Flame, ListChecks, Moon, Sparkles } from 'lucide-react-native';

import { COLORS, GRADIENTS, RADIUS, SPACING } from '@/shared/constants';
import { STRINGS } from '@/shared/constants';
import { PRIORITY_GRADIENT } from '@/shared/utils';
import { EnrichedRecommendation, RecommendationContext, RecommendationKind } from '@/shared/types/recommendation';
import { triggerHaptic } from '@/shared/utils';

import { ThemedText } from '@/shared/components';

interface RecommendationsRailProps {
  context: RecommendationContext;
  recommendations: EnrichedRecommendation[];
  onPress: (taskId: string) => void;
}

const KIND_ICON: Record<RecommendationKind, React.ComponentType<{ size?: number; color?: string }>> = {
  'stale-in-progress': Clock,
  'high-priority-todo': Flame,
  'unfinished-subtasks': ListChecks,
  'dormant-todo': Moon,
};

/**
 * "Recommended for you" rail for the home screen.
 *
 * Production-ready: the component, styling, and analytics events below.
 * NOT production-ready: the recommendations it renders come from a local
 * heuristic (`src/services/recommendations/recommendationEngine.ts`), not a
 * real recommendation model — see the TODO in that file.
 *
 * There is no analytics wrapper elsewhere in this codebase yet, so impression
 * and tap events are only logged to the console for now. Swap
 * `logRecommendationEvent` for the real analytics call once one exists —
 * the event names/params (`recommendation_shown` / `recommendation_tap`,
 * `context`, `kind`, `reason`) are chosen to be ready for that.
 */
function logRecommendationEvent(
  event: 'recommendation_shown' | 'recommendation_tap',
  rec: EnrichedRecommendation,
  context: RecommendationContext,
): void {
  // TODO: replace with the app's real analytics wrapper once one exists.
  console.log(`[analytics] ${event}`, {
    taskId: rec.taskId,
    kind: rec.kind,
    reason: rec.reason,
    score: rec.score,
    context,
  });
}

export function RecommendationsRail({ context, recommendations, onPress }: RecommendationsRailProps) {
  const shownIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    recommendations.forEach(rec => {
      if (!shownIds.current.has(rec.taskId)) {
        shownIds.current.add(rec.taskId);
        logRecommendationEvent('recommendation_shown', rec, context);
      }
    });
  }, [recommendations, context]);

  if (recommendations.length === 0) {
    return null;
  }

  const handlePress = (rec: EnrichedRecommendation) => {
    triggerHaptic('impactLight');
    logRecommendationEvent('recommendation_tap', rec, context);
    onPress(rec.taskId);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles color={COLORS.info} size={16} />
        <ThemedText variant="subheading">{STRINGS.recommendations.title}</ThemedText>
      </View>
      <ThemedText variant="caption" color={COLORS.textTertiary} style={styles.subtitle}>
        {STRINGS.recommendations.subtitle}
      </ThemedText>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {recommendations.map(rec => {
          const Icon = KIND_ICON[rec.kind];
          const gradient = GRADIENTS[PRIORITY_GRADIENT[rec.task.priority]];
          return (
            <View key={rec.taskId} style={styles.cardWrap}>
              <Pressable
                onPress={() => handlePress(rec)}
                accessibilityRole="button"
                accessibilityLabel={rec.task.title}
                style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
                <View style={styles.borderWrap}>
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    pointerEvents="none"
                    style={styles.fill}
                  />
                  <View style={styles.cardInner}>
                    <View style={styles.iconRow}>
                      <Icon size={14} color={COLORS.textTertiary} />
                    </View>
                    <ThemedText variant="bodyMedium" numberOfLines={2} style={styles.title}>
                      {rec.task.title}
                    </ThemedText>
                    <ThemedText
                      variant="caption"
                      color={COLORS.textSecondary}
                      numberOfLines={2}
                      style={styles.reason}>
                      {rec.reason}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 180;

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.xl,
  },
  subtitle: {
    paddingHorizontal: SPACING.xl,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    gap: SPACING.md,
  },
  cardWrap: {
    width: CARD_WIDTH,
  },
  pressable: {
    borderRadius: RADIUS.lg,
  },
  pressed: {
    opacity: 0.85,
  },
  borderWrap: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    padding: 1,
  },
  fill: {
    ...StyleSheet.absoluteFillObject,
  },
  cardInner: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg - 1,
    padding: SPACING.md,
    minHeight: 108,
  },
  iconRow: {
    marginBottom: SPACING.xs,
  },
  title: {
    lineHeight: 19,
  },
  reason: {
    marginTop: SPACING.xs,
    lineHeight: 16,
  },
});
