import { DecompositionResult, Task } from '@/shared/types';

import { ClaudeMessage, sendStructured } from '../anthropicClient';
import { serializeTask } from './context';
import { DECOMPOSITION_QUALITY_GUARD } from './contentQualityGuard';

const SYSTEM_PROMPT = `You are an engineering planning agent that breaks a task into a clear,
ordered list of actionable subtasks.

This is a MULTI-STEP agent:
- STEP 1: Evaluate whether the task is specific enough to decompose well. If it
  is vague, under-scoped, or missing key detail, set needsClarification=true and
  ask ONE concise clarifying question. Do NOT guess.
- STEP 2: Once the task is clear (or after the user answers), produce 3-7
  concrete, independently-verifiable subtasks in execution order. Each subtask
  is a short imperative phrase (e.g. "Write unit tests for the parser").
  If the task already has existing subtasks (shown as [x] completed or [ ] pending):
    • Do NOT re-suggest any subtask that is identical to or substantially overlaps
      with an existing one — completed or not.
    • Never re-suggest a completed [x] subtask; that work is already done.
    • Generate only genuinely NEW subtasks that build on the remaining work.
    • If ALL pending subtasks already cover the remaining work completely, return
      subtasks: [] (empty array) — do NOT copy existing subtask titles into the
      output as if they were new suggestions.
    • Otherwise produce only genuinely new items; fewer than 7 is fine.

Always respond using the provided JSON schema.

${DECOMPOSITION_QUALITY_GUARD}`;

interface RawDecomposition {
  needsClarification: boolean;
  clarifyingQuestion: string;
  rationale: string;
  subtasks: string[];
}

const SCHEMA = {
  name: 'decomposition',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      needsClarification: { type: 'boolean' },
      clarifyingQuestion: { type: 'string' },
      rationale: { type: 'string' },
      subtasks: { type: 'array', items: { type: 'string' } },
    },
    required: ['needsClarification', 'clarifyingQuestion', 'rationale', 'subtasks'],
  },
} as const;

export type DecompositionTurn =
  | { kind: 'clarify'; question: string; messages: ClaudeMessage[] }
  | { kind: 'result'; result: DecompositionResult; messages: ClaudeMessage[] };

function toTurn(raw: RawDecomposition, messages: ClaudeMessage[]): DecompositionTurn {
  const fullMessages: ClaudeMessage[] = [
    ...messages,
    { role: 'assistant', content: JSON.stringify(raw) },
  ];

  if (raw.needsClarification && raw.clarifyingQuestion.trim()) {
    return { kind: 'clarify', question: raw.clarifyingQuestion, messages: fullMessages };
  }

  return {
    kind: 'result',
    result: {
      subtasks: raw.subtasks.filter(s => s.trim().length > 0),
      rationale: raw.rationale,
    },
    messages: fullMessages,
  };
}

export async function runDecomposition(
  apiKey: string,
  task: Task,
): Promise<DecompositionTurn> {
  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `Break down this task into subtasks.\n\n${serializeTask(task)}`,
    },
  ];
  const raw = await sendStructured<RawDecomposition>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages,
    jsonSchema: SCHEMA,
  });
  return toTurn(raw, messages);
}

export async function continueDecomposition(
  apiKey: string,
  priorMessages: ClaudeMessage[],
  answer: string,
): Promise<DecompositionTurn> {
  const messages: ClaudeMessage[] = [
    ...priorMessages,
    { role: 'user', content: answer },
  ];
  const raw = await sendStructured<RawDecomposition>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages,
    jsonSchema: SCHEMA,
  });
  return toTurn(raw, messages);
}
