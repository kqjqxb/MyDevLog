import React, { useCallback, useState } from 'react';
import { Alert, FlatList, ListRenderItem, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ClipboardList } from 'lucide-react-native';

import { RootStackParamList } from '@/app/navigation/types';
import {
  AnimatedListItem,
  EmptyState,
  FilterTabs,
  GradientText,
  ScreenContainer,
  SkeletonCard,
  ThemedText,
} from '@/shared/components';
import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { useTasks } from '@/shared/hooks';
import { SortMode, StatusFilter } from '@/shared/utils';
import { Task } from '@/shared/types';
import { useTaskStore } from '@/store';
import { CreateTaskFab, SortToggle, TaskCard } from '../components';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FILTER_OPTIONS: ReadonlyArray<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: STRINGS.filters.all },
  { value: 'todo', label: STRINGS.filters.todo },
  { value: 'in-progress', label: STRINGS.filters.inProgress },
  { value: 'done', label: STRINGS.filters.done },
];

export function TaskListScreen() {
  const navigation = useNavigation<Nav>();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [sort, setSort] = useState<SortMode>('priority');

  const { visibleTasks, counts, hydrated } = useTasks(filter, sort);
  const deleteTask = useTaskStore(state => state.deleteTask);

  const tabOptions = FILTER_OPTIONS.map(option => ({
    ...option,
    count: counts[option.value],
  }));

  const handleOpen = useCallback(
    (task: Task) => navigation.navigate('TaskDetail', { taskId: task.id }),
    [navigation],
  );

  const handleDelete = useCallback(
    (task: Task) => {
      Alert.alert(STRINGS.tasks.deleteConfirmTitle, STRINGS.tasks.deleteConfirmMessage, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTask(task.id) },
      ]);
    },
    [deleteTask],
  );

  const renderItem = useCallback<ListRenderItem<Task>>(
    ({ item, index }) => (
      <AnimatedListItem index={index}>
        <TaskCard task={item} onPress={handleOpen} onDelete={handleDelete} />
      </AnimatedListItem>
    ),
    [handleOpen, handleDelete],
  );

  const isEmpty = visibleTasks.length === 0;
  const noTasksAtAll = counts.all === 0;

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <GradientText text={STRINGS.appName} gradient="accent" fontSize={34} />
        <ThemedText variant="secondary" color={COLORS.textSecondary}>
          {STRINGS.tagline}
        </ThemedText>
      </View>

      <View style={styles.controls}>
        <View style={styles.tabs}>
          <FilterTabs options={tabOptions} value={filter} onChange={setFilter} />
        </View>
        <SortToggle mode={sort} onToggle={setSort} />
      </View>

      {!hydrated ? (
        <View style={styles.listContent}>
          {[0, 1, 2, 3].map(i => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : isEmpty ? (
        <EmptyState
          title={noTasksAtAll ? STRINGS.tasks.emptyTitle : STRINGS.tasks.emptyFilteredTitle}
          subtitle={
            noTasksAtAll ? STRINGS.tasks.emptySubtitle : STRINGS.tasks.emptyFilteredSubtitle
          }
          icon={<ClipboardList color={COLORS.white} size={40} />}
        />
      ) : (
        <FlatList
          data={visibleTasks}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      <CreateTaskFab onPress={() => navigation.navigate('TaskForm')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
  },
  tabs: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: 120,
  },
});
