import { Task } from '@/shared/types';

import { readJSON, writeJSON, remove } from './asyncStorage';
import { STORAGE_KEYS } from './keys';

/**
 * Persistence layer for tasks. The store treats this as the single source of
 * truth on disk — it loads once on boot and writes through on every mutation.
 */
export const taskStorage = {
  async getTasks(): Promise<Task[]> {
    return readJSON<Task[]>(STORAGE_KEYS.tasks, []);
  },

  async saveTasks(tasks: Task[]): Promise<void> {
    await writeJSON(STORAGE_KEYS.tasks, tasks);
  },

  /** Convenience upsert kept for parity with the service API surface. */
  async saveTask(task: Task): Promise<Task[]> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    const next = index >= 0
      ? tasks.map(t => (t.id === task.id ? task : t))
      : [task, ...tasks];
    await this.saveTasks(next);
    return next;
  },

  async updateTask(id: string, patch: Partial<Task>): Promise<Task[]> {
    const tasks = await this.getTasks();
    const next = tasks.map(t => (t.id === id ? { ...t, ...patch } : t));
    await this.saveTasks(next);
    return next;
  },

  async deleteTask(id: string): Promise<Task[]> {
    const tasks = await this.getTasks();
    const next = tasks.filter(t => t.id !== id);
    await this.saveTasks(next);
    return next;
  },

  async clear(): Promise<void> {
    await remove(STORAGE_KEYS.tasks);
  },
};
