import { useMemo } from 'react';

import { useTaskStore } from '@/store';
import {
  filterTasks,
  sortTasks,
  SortMode,
  StatusFilter,
} from '@/shared/utils';

/**
 * Business-logic hook over the task store. Returns the raw task list plus a
 * memoised filtered+sorted view and per-status counts for the filter tabs.
 */
export function useTasks(filter: StatusFilter = 'all', sort: SortMode = 'priority') {
  const tasks = useTaskStore(state => state.tasks);
  const hydrated = useTaskStore(state => state.hydrated);

  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(tasks, filter), sort),
    [tasks, filter, sort],
  );

  const counts = useMemo(
    () => ({
      all: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      'in-progress': tasks.filter(t => t.status === 'in-progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    }),
    [tasks],
  );

  return { tasks, visibleTasks, counts, hydrated };
}
