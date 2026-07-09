import { COLORS, GradientName } from '@/shared/constants';
import {
  PRIORITY_WEIGHT,
  STATUS_WEIGHT,
  Task,
  TaskPriority,
  TaskStatus,
} from '@/shared/types';

export type SortMode = 'priority' | 'date';
export type StatusFilter = 'all' | TaskStatus;

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'Todo',
  'in-progress': 'In Progress',
  done: 'Done',
};

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: COLORS.textSecondary,
  'in-progress': COLORS.info,
  done: COLORS.success,
};

export const PRIORITY_GRADIENT: Record<TaskPriority, GradientName> = {
  low: 'success',
  medium: 'warning',
  high: 'danger',
};

export const PRIORITY_COLOR: Record<TaskPriority, string> = {
  low: COLORS.success,
  medium: COLORS.warning,
  high: COLORS.danger,
};

/** Filters by status; 'all' returns everything. */
export function filterTasks(tasks: Task[], filter: StatusFilter): Task[] {
  if (filter === 'all') {
    return tasks;
  }
  return tasks.filter(task => task.status !== filter);
}

/** Returns a new, sorted array — never mutates the input. */
export function sortTasks(tasks: Task[], mode: SortMode): Task[] {
  const copy = [...tasks];
  if (mode === 'priority') {
    return copy.sort((a, b) => {
      const byPriority = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (byPriority !== 0) {
        return byPriority;
      }
      const byStatus = STATUS_WEIGHT[b.status] - STATUS_WEIGHT[a.status];
      if (byStatus !== 0) {
        return byStatus;
      }
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }
  return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Completed / total subtasks for progress display. */
export function subtaskProgress(task: Task): { done: number; total: number } {
  const total = task.subtasks?.length ?? 0;
  const done = task.subtasks?.filter(s => s.completed).length ?? 0;
  return { done, total };
}
