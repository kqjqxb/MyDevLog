import { PrioritizationResult, Task } from '@/shared/types';

import { ClaudeMessage, sendStructured } from '../anthropicClient';
import { serializeTasks } from './context';
import { PRIORITIZATION_QUALITY_GUARD, CONTENT_WARNINGS_SCHEMA_FRAGMENT } from './contentQualityGuard';

const SYSTEM_PROMPT = `You are a senior engineering lead helping a developer decide what to work on TODAY.
You receive a backlog of tasks with status, priority, age in days, and subtask progress.

Reason like a pragmatic tech lead:
- High-priority and in-progress work generally comes first.
- Old, stale tasks may need attention before they rot.
- Done tasks should never be recommended.
- Balance urgency (priority) against momentum (already in progress) and risk (age).

This is a MULTI-STEP agent. If the backlog is genuinely ambiguous — for example
several equally-urgent tasks with no tie-breaker, or missing context that would
change the ordering — set needsClarification to true and ask ONE focused
question. Otherwise produce the final ranked plan.

Always respond using the provided JSON schema. When you produce a final plan,
rank only the tasks worth doing today (skip done tasks), lowest rank number =
do first, and give a one-sentence reasoning per task.

${PRIORITIZATION_QUALITY_GUARD}`;

interface RawPrioritization {
  needsClarification: boolean;
  clarifyingQuestion: string;
  summary: string;
  ranked: Array<{
    taskId: string;
    rank: number;
    title: string;
    reasoning: string;
  }>;
  contentWarnings: Array<{ taskId: string; taskTitle: string; reason: string }>;
}

const SCHEMA = {
  name: 'prioritization',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      needsClarification: { type: 'boolean' },
      clarifyingQuestion: { type: 'string' },
      summary: { type: 'string' },
      ranked: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            taskId: { type: 'string' },
            rank: { type: 'integer' },
            title: { type: 'string' },
            reasoning: { type: 'string' },
          },
          required: ['taskId', 'rank', 'title', 'reasoning'],
        },
      },
      contentWarnings: CONTENT_WARNINGS_SCHEMA_FRAGMENT,
    },
    required: ['needsClarification', 'clarifyingQuestion', 'summary', 'ranked', 'contentWarnings'],
  },
} as const;

export type PrioritizationTurn =
  | { kind: 'clarify'; question: string; messages: ClaudeMessage[] }
  | { kind: 'result'; result: PrioritizationResult; messages: ClaudeMessage[] };

function toTurn(raw: RawPrioritization, messages: ClaudeMessage[]): PrioritizationTurn {
  const fullMessages: ClaudeMessage[] = [
    ...messages,
    { role: 'assistant', content: JSON.stringify(raw) },
  ];

  if (raw.needsClarification && raw.clarifyingQuestion.trim()) {
    return { kind: 'clarify', question: raw.clarifyingQuestion, messages: fullMessages };
  }

  const ranked = [...raw.ranked].sort((a, b) => a.rank - b.rank);
  return {
    kind: 'result',
    result: { ranked, summary: raw.summary, contentWarnings: raw.contentWarnings },
    messages: fullMessages,
  };
}

/** Step 1 — analyse the backlog and either clarify or rank. */
export async function runPrioritization(
  apiKey: string,
  tasks: Task[],
): Promise<PrioritizationTurn> {
  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `Here is my current backlog:\n\n${serializeTasks(tasks)}\n\nWhat should I work on today?`,
    },
  ];
  const raw = await sendStructured<RawPrioritization>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages,
    jsonSchema: SCHEMA,
  });
  return toTurn(raw, messages);
}

/** Step 2 — continue after the user answers a clarifying question. */
export async function continuePrioritization(
  apiKey: string,
  priorMessages: ClaudeMessage[],
  answer: string,
): Promise<PrioritizationTurn> {
  const messages: ClaudeMessage[] = [
    ...priorMessages,
    { role: 'user', content: answer },
  ];
  const raw = await sendStructured<RawPrioritization>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages,
    jsonSchema: SCHEMA,
  });
  return toTurn(raw, messages);
}
