import { ContentQualityWarning } from '@/shared/types';

/**
 * Instruction fragment injected into single-task agent system prompts
 * (Break Down Task, Status Update). If title/description is placeholder
 * or gibberish, the agent blocks with a clarifying question rather than
 * producing a spurious result.
 */
export const SINGLE_TASK_QUALITY_GUARD = `Content quality: Before analysing, assess whether the \
task title and description contain meaningful, real content. If they appear to be random characters, \
placeholder text, or test data (e.g. "test", "asdf", "Fsdffsdf"), set needsClarification=true and \
ask the user to describe what the task is actually about. Do NOT produce an analysis of meaningless \
content.`;

/**
 * Instruction fragment injected into aggregate agent system prompts
 * (Detect Blockers, Prioritize My Day). Placeholder tasks do not block
 * the overall result; they are flagged in contentWarnings for the user.
 */
export const AGGREGATE_QUALITY_GUARD = `Content quality: While processing tasks, note any whose \
title or description appears to be random characters, placeholder text, or test data. Include them \
in the contentWarnings array with a brief reason. This is advisory only — still produce the full \
analysis for all other tasks.`;

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
