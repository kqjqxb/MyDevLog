export type TaskStatus = 'todo' | 'in-progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  subtasks?: Subtask[];
  notes?: string;
}

/** Fields accepted when creating a task; the store fills in the rest. */
export interface TaskDraft {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  notes?: string;
}

export const TASK_STATUSES: readonly TaskStatus[] = [
  'todo',
  'in-progress',
  'done',
] as const;

export const TASK_PRIORITIES: readonly TaskPriority[] = [
  'low',
  'medium',
  'high',
] as const;

/** Numeric weight for priority sorting (higher = more urgent). */
export const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export const STATUS_WEIGHT: Record<TaskStatus, number> = {
  'in-progress': 3,
  todo: 2,
  done: 1,
};
