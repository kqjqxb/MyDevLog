import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { PRIORITY_LABEL, relativeTime, STATUS_LABEL } from '@/shared/utils';
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

  // If the task was deleted (e.g. via swipe elsewhere), leave the screen.
  useEffect(() => {
    if (!task) {
      navigation.goBack();
    }
  }, [task, navigation]);

  const handleDelete = useCallback(() => {
    Alert.alert(STRINGS.tasks.deleteConfirmTitle, STRINGS.tasks.deleteConfirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTask(taskId);
          navigation.goBack();
        },
      },
    ]);
  }, [deleteTask, navigation, taskId]);

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
          <Pressable onPress={handleDelete} hitSlop={8} style={styles.headerButton}>
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
          <ThemedText variant="caption" color={COLORS.textTertiary} style={styles.meta}>
            Updated {relativeTime(task.updatedAt)}
          </ThemedText>

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
  meta: {
    marginTop: SPACING.xs,
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
