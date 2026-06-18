import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Rect, Stop } from 'react-native-svg';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';
import {
  ChevronLeft,
  ListChecks,
  MessageSquareText,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';

import { RootStackParamList } from '@/app/navigation/types';
import {
  AnimatedTextInput,
  GlassCard,
  GradientButton,
  PillOption,
  ScreenContainer,
  SelectablePills,
  ThemedText,
} from '@/shared/components';
import { COLORS, GRADIENTS, MOTION, RADIUS, SPACING, STRINGS } from '@/shared/constants';
import { absoluteDate, PRIORITY_COLOR, PRIORITY_LABEL, STATUS_LABEL } from '@/shared/utils';
import { useRelativeTime } from '@/shared/hooks';
import { TaskPriority, TaskStatus } from '@/shared/types';
import { useTaskStore } from '@/store';
import { SubtaskRow } from '../components';
import { TaskAIPanel } from '@/features/ai';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TaskDetail'>;
type Route = RouteProp<RootStackParamList, 'TaskDetail'>;

const STATUS_OPTIONS: ReadonlyArray<PillOption<TaskStatus>> = [
  { value: 'todo', label: STATUS_LABEL.todo, gradient: 'primary' },
  { value: 'in-progress', label: STATUS_LABEL['in-progress'], gradient: 'primary' },
  { value: 'done', label: STATUS_LABEL.done, gradient: 'success' },
];

const PRIORITY_OPTIONS: ReadonlyArray<PillOption<TaskPriority>> = [
  { value: 'low', label: PRIORITY_LABEL.low, gradient: 'success' },
  { value: 'medium', label: PRIORITY_LABEL.medium, gradient: 'warning' },
  { value: 'high', label: PRIORITY_LABEL.high, gradient: 'danger' },
];

// ---------------------------------------------------------------------------
// Delete confirmation modal
// ---------------------------------------------------------------------------

// Enter: underdamped for a natural pop (ζ ≈ 0.63 → slight overshoot).
// Exit: mirror via the same spring going 1→0; clamping prevents negative scale/opacity.
const DIALOG_SPRING = { damping: 20, stiffness: 260, mass: 0.88 } as const;

interface DeleteConfirmModalProps {
  visible: boolean;
  priority: TaskPriority;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ visible, priority, onCancel, onConfirm }: DeleteConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [dialogSize, setDialogSize] = useState<{ width: number; height: number } | null>(null);

  // Single progress value drives both scale and opacity in sync.
  const progress = useSharedValue(0);
  const backdropOpacity = useSharedValue(0);

  const animateIn = useCallback(() => {
    backdropOpacity.value = withTiming(1, MOTION.timingFast);
    progress.value = withSpring(1, DIALOG_SPRING);
  }, [backdropOpacity, progress]);

  const animateOut = useCallback(
    (done: () => void) => {
      backdropOpacity.value = withTiming(0, { duration: 220 });
      progress.value = withSpring(0, DIALOG_SPRING);
      setTimeout(done, 300);
    },
    [backdropOpacity, progress],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      requestAnimationFrame(animateIn);
    }
  }, [visible, animateIn]);

  const handleCancel = useCallback(() => {
    animateOut(() => {
      setMounted(false);
      onCancel();
    });
  }, [animateOut, onCancel]);

  const handleConfirm = useCallback(() => {
    animateOut(() => {
      setMounted(false);
      onConfirm();
    });
  }, [animateOut, onConfirm]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
  const dialogStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.9, 1], Extrapolation.CLAMP) }],
  }));

  if (!mounted) return null;

  const priorityTint = PRIORITY_COLOR[priority];

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={handleCancel}
      statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, modalStyles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
      </Animated.View>

      <View style={modalStyles.centeredContainer} pointerEvents="box-none">
        <Animated.View
          style={[modalStyles.dialog, dialogStyle]}
          onLayout={e =>
            setDialogSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
            })
          }>

          {/* Subtle priority tint — same muted opacity as an inactive pill surface */}
          <View
            style={[
              StyleSheet.absoluteFill,
              modalStyles.tintOverlay,
              { backgroundColor: priorityTint },
            ]}
          />

          {/* Animated gradient border — mirrors AnimatedAIBackdrop opacity breathe */}
          {dialogSize && (
            <MotiView
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              from={{ opacity: 0.5 }}
              animate={{ opacity: 1.0 }}
              transition={{
                type: 'timing',
                duration: 4000,
                loop: true,
                repeatReverse: true,
                easing: Easing.inOut(Easing.ease),
              }}>
              <Svg
                width={dialogSize.width}
                height={dialogSize.height}
                style={StyleSheet.absoluteFill}
                pointerEvents="none">
                <Defs>
                  <SvgLinearGradient id="aiBorderGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0" stopColor={GRADIENTS.ai[0]} />
                    <Stop offset="0.5" stopColor={GRADIENTS.ai[1]} />
                    <Stop offset="1" stopColor={GRADIENTS.ai[2]} />
                  </SvgLinearGradient>
                </Defs>
                <Rect
                  x={1}
                  y={1}
                  width={dialogSize.width - 2}
                  height={dialogSize.height - 2}
                  rx={RADIUS.xl}
                  ry={RADIUS.xl}
                  fill="none"
                  stroke="url(#aiBorderGrad)"
                  strokeWidth={2}
                />
              </Svg>
            </MotiView>
          )}

          <View style={modalStyles.iconRow}>
            <View style={modalStyles.iconWrap}>
              <Trash2 color={COLORS.danger} size={22} />
            </View>
          </View>

          <ThemedText variant="subheading" style={modalStyles.title}>
            {STRINGS.tasks.deleteConfirmTitle}
          </ThemedText>
          <ThemedText variant="body" color={COLORS.textSecondary} style={modalStyles.message}>
            {STRINGS.tasks.deleteConfirmMessage}
          </ThemedText>

          <View style={modalStyles.actions}>
            <Pressable onPress={handleCancel} style={modalStyles.cancelBtn}>
              <ThemedText variant="bodyMedium" color={COLORS.textSecondary}>
                Cancel
              </ThemedText>
            </Pressable>
            <GradientButton
              label="Delete"
              gradient="danger"
              onPress={handleConfirm}
              style={modalStyles.deleteBtn}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  dialog: {
    width: '100%',
    backgroundColor: '#000017',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  tintOverlay: {
    borderRadius: RADIUS.xl,
    opacity: 0.07,
  },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(239,68,68,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  iconRow: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginTop: SPACING.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COLORS.border,
  },
  deleteBtn: {
    flex: 1,
  },
});

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export function TaskDetailScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { taskId } = params;

  const task = useTaskStore(state => state.tasks.find(t => t.id === taskId));
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.deleteTask);
  const toggleSubtask = useTaskStore(state => state.toggleSubtask);
  const removeSubtask = useTaskStore(state => state.removeSubtask);
  const addSubtasks = useTaskStore(state => state.addSubtasks);

  const [newSubtask, setNewSubtask] = useState('');
  const [notesDraft, setNotesDraft] = useState(task?.notes ?? '');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const updatedLabel = useRelativeTime(task?.updatedAt ?? '');

  // Navigate back when the task is gone (deleted here or from elsewhere).
  useEffect(() => {
    if (!task) {
      navigation.goBack();
    }
  }, [task, navigation]);

  const handleDeletePress = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteModal(false);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    setShowDeleteModal(false);
    // Only delete — the useEffect above handles goBack() once task disappears.
    deleteTask(taskId);
  }, [deleteTask, taskId]);

  const handleAddSubtask = useCallback(() => {
    const trimmed = newSubtask.trim();
    if (!trimmed) {
      return;
    }
    addSubtasks(taskId, [trimmed]);
    setNewSubtask('');
  }, [addSubtasks, newSubtask, taskId]);

  const handleNotesBlur = useCallback(() => {
    if (task && notesDraft !== task.notes) {
      updateTask(taskId, { notes: notesDraft });
    }
  }, [notesDraft, task, taskId, updateTask]);

  if (!task) {
    return <ScreenContainer edges={['top']} />;
  }

  return (
    <ScreenContainer edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft color={COLORS.textPrimary} size={26} />
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate('TaskForm', { taskId })}
            hitSlop={8}
            style={styles.headerButton}>
            <Pencil color={COLORS.textSecondary} size={20} />
          </Pressable>
          <Pressable onPress={handleDeletePress} hitSlop={8} style={styles.headerButton}>
            <Trash2 color={COLORS.danger} size={20} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 160 }}>
          <ThemedText variant="heading">{task.title}</ThemedText>
          <View style={styles.metaRow}>
            <ThemedText variant="caption" color={COLORS.textTertiary}>
              Created {absoluteDate(task.createdAt)}
            </ThemedText>
            <ThemedText variant="caption" color={COLORS.textTertiary} style={styles.metaSep}>
              ·
            </ThemedText>
            <ThemedText variant="caption" color={COLORS.textTertiary}>
              Updated {updatedLabel}
            </ThemedText>
          </View>

          {task.description ? (
            <ThemedText variant="body" color={COLORS.textSecondary} style={styles.description}>
              {task.description}
            </ThemedText>
          ) : null}

          <View style={styles.group}>
            <ThemedText variant="caption" color={COLORS.textSecondary} style={styles.label}>
              {STRINGS.form.statusLabel}
            </ThemedText>
            <SelectablePills
              options={STATUS_OPTIONS}
              value={task.status}
              onChange={status => updateTask(taskId, { status })}
            />
          </View>

          <View style={styles.group}>
            <ThemedText variant="caption" color={COLORS.textSecondary} style={styles.label}>
              {STRINGS.form.priorityLabel}
            </ThemedText>
            <SelectablePills
              options={PRIORITY_OPTIONS}
              value={task.priority}
              onChange={priority => updateTask(taskId, { priority })}
            />
          </View>
        </MotiView>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ListChecks color={COLORS.textSecondary} size={18} />
            <ThemedText variant="subheading">{STRINGS.tasks.subtasksLabel}</ThemedText>
          </View>
          <GlassCard flat>
            {(task.subtasks ?? []).map((subtask, index) => (
              <SubtaskRow
                key={subtask.id}
                subtask={subtask}
                index={index}
                onToggle={id => toggleSubtask(taskId, id)}
                onRemove={id => removeSubtask(taskId, id)}
              />
            ))}
            <View style={styles.addRow}>
              <AnimatedTextInput
                value={newSubtask}
                onChangeText={setNewSubtask}
                placeholder={STRINGS.tasks.addSubtask}
                onSubmitEditing={handleAddSubtask}
                returnKeyType="done"
                containerStyle={styles.addInput}
              />
              <GradientButton
                onPress={handleAddSubtask}
                gradient="primary"
                compact
                disabled={newSubtask.trim().length === 0}
                icon={<Plus color={COLORS.white} size={20} />}
                style={styles.addButton}
              />
            </View>
          </GlassCard>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquareText color={COLORS.textSecondary} size={18} />
            <ThemedText variant="subheading">{STRINGS.tasks.notesLabel}</ThemedText>
          </View>
          <AnimatedTextInput
            value={notesDraft}
            onChangeText={setNotesDraft}
            onBlur={handleNotesBlur}
            placeholder={STRINGS.tasks.noNotes}
            multiline
          />
        </View>

        <TaskAIPanel task={task} onApplySubtasks={titles => addSubtasks(taskId, titles)} />
      </ScrollView>

      <DeleteConfirmModal
        visible={showDeleteModal}
        priority={task.priority}
        onCancel={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  headerButton: {
    padding: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.huge,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  metaSep: {
    opacity: 0.4,
  },
  description: {
    marginTop: SPACING.lg,
    lineHeight: 22,
  },
  group: {
    marginTop: SPACING.xl,
    gap: SPACING.sm,
  },
  label: {
    marginBottom: SPACING.xs,
  },
  section: {
    marginTop: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  addInput: {
    flex: 1,
  },
  addButton: {
    height: 50,
    width: 50,
  },
});
