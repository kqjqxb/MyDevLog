import { create } from 'zustand';

import { taskStorage } from '@/services/storage';
import { Subtask, Task, TaskDraft } from '@/shared/types';
import { createId } from '@/shared/utils';

interface TaskStoreState {
  tasks: Task[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  createTask: (draft: TaskDraft) => Task;
  updateTask: (id: string, patch: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;
  getTask: (id: string) => Task | undefined;

  addSubtasks: (taskId: string, titles: string[]) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  removeSubtask: (taskId: string, subtaskId: string) => void;

  clearAll: () => Promise<void>;
}

function nowISO(): string {
  return new Date().toISOString();
}

/** Writes the latest task array through to disk; fire-and-forget. */
function persist(tasks: Task[]): void {
  taskStorage.saveTasks(tasks).catch(error => {
    console.warn('[taskStore] persist failed', error);
  });
}

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  hydrated: false,

  hydrate: async () => {
    const tasks = await taskStorage.getTasks();
    set({ tasks, hydrated: true });
  },

  createTask: draft => {
    const timestamp = nowISO();
    const task: Task = {
      id: createId('task'),
      title: draft.title.trim(),
      description: draft.description.trim(),
      status: draft.status,
      priority: draft.priority,
      notes: draft.notes?.trim() ?? '',
      subtasks: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const tasks = [task, ...get().tasks];
    set({ tasks });
    persist(tasks);
    return task;
  },

  updateTask: (id, patch) => {
    const tasks = get().tasks.map(task =>
      task.id === id ? { ...task, ...patch, updatedAt: nowISO() } : task,
    );
    set({ tasks });
    persist(tasks);
  },

  deleteTask: id => {
    const tasks = get().tasks.filter(task => task.id !== id);
    set({ tasks });
    persist(tasks);
  },

  getTask: id => get().tasks.find(task => task.id === id),

  addSubtasks: (taskId, titles) => {
    const newSubtasks: Subtask[] = titles
      .map(title => title.trim())
      .filter(Boolean)
      .map(title => ({ id: createId('sub'), title, completed: false }));

    const tasks = get().tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            subtasks: [...(task.subtasks ?? []), ...newSubtasks],
            updatedAt: nowISO(),
          }
        : task,
    );
    set({ tasks });
    persist(tasks);
  },

  toggleSubtask: (taskId, subtaskId) => {
    const tasks = get().tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            subtasks: (task.subtasks ?? []).map(sub =>
              sub.id === subtaskId ? { ...sub, completed: !sub.completed } : sub,
            ),
            updatedAt: nowISO(),
          }
        : task,
    );
    set({ tasks });
    persist(tasks);
  },

  removeSubtask: (taskId, subtaskId) => {
    const tasks = get().tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            subtasks: (task.subtasks ?? []).filter(sub => sub.id !== subtaskId),
            updatedAt: nowISO(),
          }
        : task,
    );
    set({ tasks });
    persist(tasks);
  },

  clearAll: async () => {
    set({ tasks: [] });
    await taskStorage.clear();
  },
}));
