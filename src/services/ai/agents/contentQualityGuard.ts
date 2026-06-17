import { ContentQualityWarning } from '@/shared/types';

export interface ContextScope {
  useTitle: boolean;
  useDescription: boolean;
  useSubtasks: boolean;
  useNotes: boolean;
}

/**
 * Declarative scope config — one entry per agent, single source of truth.
 * Fields set to true count as "real content" when evaluating whether a task
 * has enough context to proceed. A task is only flagged/blocked when ALL
 * fields in its agent's scope are absent or placeholder-like.
 */
export const AGENT_CONTEXT_SCOPE = {
  'status-update': { useTitle: true, useDescription: true, useSubtasks: true, useNotes: true },
  decomposition:   { useTitle: true, useDescription: true, useSubtasks: true, useNotes: true },
  prioritization:  { useTitle: true, useDescription: true, useSubtasks: true, useNotes: true },
  blocker:         { useTitle: true, useDescription: true, useSubtasks: false, useNotes: false },
} satisfies Record<string, ContextScope>;

function scopeFields(scope: ContextScope): string {
  const fields: string[] = [];
  if (scope.useTitle) fields.push('title');
  if (scope.useDescription) fields.push('description');
  if (scope.useSubtasks) fields.push('subtasks');
  if (scope.useNotes) fields.push('notes');
  return fields.join(', ');
}

function buildSingleTaskGuard(scope: ContextScope, subtaskInstruction: string): string {
  if (scope.useSubtasks || scope.useNotes) {
    return (
      `Content quality: Before analysing, check whether the task has meaningful real content in ` +
      `any of: ${scopeFields(scope)}. Only set needsClarification=true when ALL of these are ` +
      `absent or clearly placeholder/gibberish (e.g. random characters, "test", "asdf"). ` +
      subtaskInstruction
    );
  }
  return (
    `Content quality: Before analysing, assess whether the task title and description contain ` +
    `meaningful, real content. If they appear to be random characters, placeholder text, or test ` +
    `data (e.g. "test", "asdf", "Fsdffsdf"), set needsClarification=true and ask the user to ` +
    `describe what the task is actually about. Do NOT produce an analysis of meaningless content.`
  );
}

function buildAggregateGuard(scope: ContextScope): string {
  if (scope.useSubtasks || scope.useNotes) {
    return (
      `Content quality: While processing tasks, add a contentWarning only for tasks where ALL ` +
      `of the following are absent or clearly placeholder/gibberish: ${scopeFields(scope)}. A ` +
      `task with a nonsensical title but real subtasks has sufficient context and must NOT be ` +
      `flagged. This is advisory only — still produce the full analysis for all other tasks.`
    );
  }
  return (
    `Content quality: While processing tasks, note any whose title or description appears to be ` +
    `random characters, placeholder text, or test data. Include them in the contentWarnings array ` +
    `with a brief reason. This is advisory only — still produce the full analysis for all other tasks.`
  );
}

/**
 * Guard for the Status Update agent (full scope).
 * When meaningful subtasks exist, the agent infers the task's purpose from them
 * and generates a real update — no clarifying question.
 */
export const STATUS_UPDATE_QUALITY_GUARD = buildSingleTaskGuard(
  AGENT_CONTEXT_SCOPE['status-update'],
  `If meaningful subtasks exist, infer the task's purpose from them and generate the status ` +
  `update based on that inferred context — do NOT set needsClarification=true just because the ` +
  `title or description look like random characters.`,
);

/**
 * Guard for the Break Down Task agent (full scope).
 * When meaningful subtasks already exist, they serve as context for the task's scope;
 * produce a result without blocking.
 */
export const DECOMPOSITION_QUALITY_GUARD = buildSingleTaskGuard(
  AGENT_CONTEXT_SCOPE.decomposition,
  `If the task already has meaningful subtasks, use them as context for the overall scope and ` +
  `produce a result without blocking.`,
);

/**
 * Guard for the Prioritize My Day agent (full scope, aggregate).
 * A task with real subtasks is NOT flagged even if its title/description are placeholder-like.
 */
export const PRIORITIZATION_QUALITY_GUARD = buildAggregateGuard(AGENT_CONTEXT_SCOPE.prioritization);

/**
 * Guard for the Detect Blockers agent (narrow scope: title + description only).
 * Subtasks are not relevant signal for dependency/stale-work detection, so the
 * evaluation scope intentionally excludes them.
 */
export const AGGREGATE_QUALITY_GUARD = buildAggregateGuard(AGENT_CONTEXT_SCOPE.blocker);

/** JSON Schema fragment for the contentWarnings field in aggregate agent schemas. */
export const CONTENT_WARNINGS_SCHEMA_FRAGMENT = {
  type: 'array',
  items: {
    type: 'object',
    additionalProperties: false,
    properties: {
      taskId: { type: 'string' },
      taskTitle: { type: 'string' },
      reason: { type: 'string' },
    },
    required: ['taskId', 'taskTitle', 'reason'],
  },
} as const;

export type { ContentQualityWarning };
