import React, { useCallback } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MotiView } from 'moti';
import { X } from 'lucide-react-native';
import { Pressable } from 'react-native';

import { RootStackParamList } from '@/app/navigation/types';
import {
  AnimatedTextInput,
  FormError,
  GradientButton,
  PillOption,
  ScreenContainer,
  SelectablePills,
  ThemedText,
} from '@/shared/components';
import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { PRIORITY_LABEL, STATUS_LABEL } from '@/shared/utils';
import { TaskPriority, TaskStatus } from '@/shared/types';
import { useTaskStore } from '@/store';
import { taskFormSchema, TaskFormValues } from '../taskSchema';

type Nav = NativeStackNavigationProp<RootStackParamList, 'TaskForm'>;
type Route = RouteProp<RootStackParamList, 'TaskForm'>;

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

export function TaskFormScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const taskId = route.params?.taskId;

  const getTask = useTaskStore(state => state.getTask);
  const createTask = useTaskStore(state => state.createTask);
  const updateTask = useTaskStore(state => state.updateTask);

  const existing = taskId ? getTask(taskId) : undefined;
  const isEditing = Boolean(existing);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: existing?.title ?? '',
      description: existing?.description ?? '',
      status: existing?.status ?? 'todo',
      priority: existing?.priority ?? 'medium',
      notes: existing?.notes ?? '',
    },
  });

  const onSubmit = useCallback(
    (values: TaskFormValues) => {
      const draft = {
        title: values.title,
        description: values.description ?? '',
        status: values.status as TaskStatus,
        priority: values.priority as TaskPriority,
        notes: values.notes ?? '',
      };
      if (isEditing && taskId) {
        updateTask(taskId, draft);
      } else {
        createTask(draft);
      }
      navigation.goBack();
    },
    [createTask, isEditing, navigation, taskId, updateTask],
  );

  return (
    <ScreenContainer edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <ThemedText variant="title">
            {isEditing ? STRINGS.tasks.editTitle : STRINGS.tasks.createTitle}
          </ThemedText>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <X color={COLORS.textSecondary} size={24} />
          </Pressable>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 24 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 18, stiffness: 160 }}
          style={styles.flex}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <AnimatedTextInput
                    label={STRINGS.form.titleLabel}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={STRINGS.form.titlePlaceholder}
                  />
                  <FormError message={errors.title?.message} />
                </View>
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <AnimatedTextInput
                    label={STRINGS.form.descriptionLabel}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={STRINGS.form.descriptionPlaceholder}
                    multiline
                  />
                  <FormError message={errors.description?.message} />
                </View>
              )}
            />

            <Controller
              control={control}
              name="status"
              render={({ field: { onChange, value } }) => (
                <View style={styles.group}>
                  <ThemedText variant="caption" color={COLORS.textSecondary} style={styles.label}>
                    {STRINGS.form.statusLabel}
                  </ThemedText>
                  <SelectablePills
                    options={STATUS_OPTIONS}
                    value={value as TaskStatus}
                    onChange={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="priority"
              render={({ field: { onChange, value } }) => (
                <View style={styles.group}>
                  <ThemedText variant="caption" color={COLORS.textSecondary} style={styles.label}>
                    {STRINGS.form.priorityLabel}
                  </ThemedText>
                  <SelectablePills
                    options={PRIORITY_OPTIONS}
                    value={value as TaskPriority}
                    onChange={onChange}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <AnimatedTextInput
                    label={STRINGS.tasks.notesLabel}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder={STRINGS.tasks.noNotes}
                    multiline
                  />
                  <FormError message={errors.notes?.message} />
                </View>
              )}
            />
          </ScrollView>

          <View style={styles.footer}>
            <GradientButton
              style={{ marginBottom: SPACING.lg }}
              label={isEditing ? STRINGS.form.submitEdit : STRINGS.form.submitCreate}
              gradient="primary"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxxl,
    gap: SPACING.xl,
  },
  group: {
    gap: SPACING.sm,
  },
  label: {
    marginBottom: SPACING.xs,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
});
