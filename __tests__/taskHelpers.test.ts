/**
 * Unit tests for the pure task-domain helpers. These cover the sorting and
 * filtering logic the list screen relies on without needing native modules.
 */
import { filterTasks, sortTasks, subtaskProgress } from '@/shared/utils/taskHelpers';
import { Task } from '@/shared/types';

function makeTask(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? 'id',
    title: overrides.title ?? 'Task',
    description: overrides.description ?? '',
    status: overrides.status ?? 'todo',
    priority: overrides.priority ?? 'medium',
    createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
    updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
    subtasks: overrides.subtasks,
    notes: overrides.notes,
  };
}

describe('filterTasks', () => {
  const tasks = [
    makeTask({ id: 'a', status: 'todo' }),
    makeTask({ id: 'b', status: 'in-progress' }),
    makeTask({ id: 'c', status: 'done' }),
  ];

  it('returns everything for "all"', () => {
    expect(filterTasks(tasks, 'all')).toHaveLength(3);
  });

  it('filters to a single status', () => {
    expect(filterTasks(tasks, 'in-progress').map(t => t.id)).toEqual(['b']);
  });
});

describe('sortTasks', () => {
  it('orders by priority weight (high → low) without mutating input', () => {
    const tasks = [
      makeTask({ id: 'low', priority: 'low' }),
      makeTask({ id: 'high', priority: 'high' }),
      makeTask({ id: 'med', priority: 'medium' }),
    ];
    const sorted = sortTasks(tasks, 'priority');
    expect(sorted.map(t => t.id)).toEqual(['high', 'med', 'low']);
    // original array untouched
    expect(tasks.map(t => t.id)).toEqual(['low', 'high', 'med']);
  });

  it('orders by most-recently created for "date"', () => {
    const tasks = [
      makeTask({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
      makeTask({ id: 'new', createdAt: '2026-06-01T00:00:00.000Z' }),
    ];
    expect(sortTasks(tasks, 'date').map(t => t.id)).toEqual(['new', 'old']);
  });
});

describe('subtaskProgress', () => {
  it('counts completed vs total', () => {
    const task = makeTask({
      subtasks: [
        { id: '1', title: 'a', completed: true },
        { id: '2', title: 'b', completed: false },
      ],
    });
    expect(subtaskProgress(task)).toEqual({ done: 1, total: 2 });
  });

  it('handles tasks with no subtasks', () => {
    expect(subtaskProgress(makeTask({}))).toEqual({ done: 0, total: 0 });
  });
});
