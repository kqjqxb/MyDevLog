import { daysSince, subtaskProgress } from '@/shared/utils';
import { Task } from '@/shared/types';

/**
 * Serialises tasks into a compact, model-friendly context block. Includes the
 * derived signals agents reason over (age in days, subtask progress) so the
 * model doesn't have to compute them.
 *
 * Pass includeSubtaskTitles=true for agents whose ContextScope has useSubtasks:true
 * so the model can see actual subtask content during quality evaluation.
 */
export function serializeTasks(tasks: Task[], includeSubtaskTitles = false): string {
  if (tasks.length === 0) {
    return '(no tasks)';
  }
  return tasks
    .map(task => {
      const { done, total } = subtaskProgress(task);
      const age = daysSince(task.createdAt);
      const parts = [
        `- id: ${task.id}`,
        `  title: ${task.title}`,
        `  status: ${task.status}`,
        `  priority: ${task.priority}`,
        `  ageDays: ${age}`,
        `  subtasks: ${done}/${total}`,
      ];
      if (includeSubtaskTitles && task.subtasks && task.subtasks.length > 0) {
        for (const sub of task.subtasks) {
          parts.push(`    - [${sub.completed ? 'x' : ' '}] ${sub.title}`);
        }
      }
      if (task.description.trim()) {
        parts.push(`  description: ${task.description.trim()}`);
      }
      if (task.notes?.trim()) {
        parts.push(`  notes: ${task.notes.trim()}`);
      }
      return parts.join('\n');
    })
    .join('\n');
}

/** Serialises one task plus its subtasks/notes for single-task agents. */
export function serializeTask(task: Task): string {
  const { done, total } = subtaskProgress(task);
  const lines = [
    `title: ${task.title}`,
    `status: ${task.status}`,
    `priority: ${task.priority}`,
    `ageDays: ${daysSince(task.createdAt)}`,
    `description: ${task.description.trim() || '(none)'}`,
    `notes: ${task.notes?.trim() || '(none)'}`,
    `subtasks (${done}/${total} done):`,
  ];
  if (task.subtasks && task.subtasks.length > 0) {
    for (const sub of task.subtasks) {
      lines.push(`  - [${sub.completed ? 'x' : ' '}] ${sub.title}`);
    }
  } else {
    lines.push('  (none)');
  }
  return lines.join('\n');
}
