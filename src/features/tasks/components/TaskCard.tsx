import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { Trash2 } from 'lucide-react-native';

import {
  COLORS,
  GRADIENTS,
  MOTION,
  RADIUS,
  SHADOWS,
  SPACING,
} from '@/shared/constants';
import {
  PriorityBadge,
  StatusPill,
  ThemedText,
} from '@/shared/components';
import { relativeTime, subtaskProgress, triggerHaptic } from '@/shared/utils';
import { Task } from '@/shared/types';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const DELETE_THRESHOLD = -96;
const SWIPE_OUT = -500;

function TaskCardComponent({ task, onPress, onDelete }: TaskCardProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const itemHeight = useSharedValue<number | undefined>(undefined);

  const { done, total } = subtaskProgress(task);
  const highlight = task.priority === 'high' || task.status === 'in-progress';

  const requestDelete = useCallback(() => {
    triggerHaptic('notificationWarning');
    onDelete(task);
  }, [onDelete, task]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .onUpdate(event => {
      translateX.value = Math.min(0, event.translationX);
    })
    .onEnd(() => {
      if (translateX.value < DELETE_THRESHOLD) {
        translateX.value = withTiming(SWIPE_OUT, MOTION.timingFast);
        itemHeight.value = withTiming(0, MOTION.timingMed, finished => {
          if (finished) {
            runOnJS(requestDelete)();
          }
        });
      } else {
        translateX.value = withSpring(0, MOTION.spring);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
  }));

  const deleteBgStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [DELETE_THRESHOLD, 0], [1, 0]),
  }));

  const containerStyle = useAnimatedStyle(() =>
    itemHeight.value === undefined ? {} : { height: itemHeight.value, opacity: itemHeight.value === 0 ? 0 : 1 },
  );

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(MOTION.pressScale, MOTION.spring);
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, MOTION.spring);
  }, [scale]);

  return (
    <Animated.View style={[styles.outer, containerStyle]}>
      <Animated.View style={[styles.deleteBg, deleteBgStyle]}>
        <Trash2 color={COLORS.white} size={22} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          <LinearGradient
            colors={highlight ? GRADIENTS.primary : [COLORS.border, COLORS.border]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.borderGradient}>
            <Pressable
              onPress={() => onPress(task)}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              style={[styles.card, highlight && SHADOWS.glow]}>
              <View style={styles.headerRow}>
                <ThemedText variant="subheading" numberOfLines={1} style={styles.title}>
                  {task.title}
                </ThemedText>
                <PriorityBadge priority={task.priority} pulse />
              </View>

              {task.description ? (
                <ThemedText
                  variant="secondary"
                  color={COLORS.textSecondary}
                  numberOfLines={2}
                  style={styles.description}>
                  {task.description}
                </ThemedText>
              ) : null}

              <View style={styles.footerRow}>
                <StatusPill status={task.status} />
                <View style={styles.metaRight}>
                  {total > 0 ? (
                    <ThemedText variant="caption" color={COLORS.textTertiary}>
                      {done}/{total} subtasks
                    </ThemedText>
                  ) : null}
                  <ThemedText variant="caption" color={COLORS.textTertiary}>
                    {relativeTime(task.updatedAt)}
                  </ThemedText>
                </View>
              </View>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

export const TaskCard = memo(TaskCardComponent);

const styles = StyleSheet.create({
  outer: {
    marginBottom: SPACING.md,
    justifyContent: 'center',
  },
  deleteBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.danger,
    borderRadius: RADIUS.lg,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: SPACING.xl,
  },
  borderGradient: {
    borderRadius: RADIUS.lg,
    padding: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg - 1,
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  title: {
    flex: 1,
  },
  description: {
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  metaRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
});
