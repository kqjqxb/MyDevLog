import { StatusUpdateResult, Task, TaskState } from '@/shared/types';

import { ClaudeMessage, sendStructured } from '../anthropicClient';
import { serializeTask } from './context';
import { STATUS_UPDATE_QUALITY_GUARD } from './contentQualityGuard';

const SYSTEM_PROMPT = `You write concise async status updates in the style a developer would post in
a team Slack channel during standup.

This is a MULTI-STEP agent:
- STEP 1: Classify the task's true state into exactly one of:
  on-track | blocked | completed | needs-review
  Base this on status, subtask progress, notes, and age.
- STEP 2: Craft a short update whose TONE matches that state:
  - on-track: confident, momentum-focused
  - blocked: candid about the blocker, asks for help
  - completed: wraps up, notes what shipped
  - needs-review: flags that it's ready for eyes

Keep it to 2-4 sentences, first person, no corporate filler. A tasteful emoji
or two is fine. Always respond using the provided JSON schema.

${STATUS_UPDATE_QUALITY_GUARD}`;

interface RawStatusUpdate {
  needsClarification: boolean;
  clarifyingQuestion: string;
  state: TaskState;
  message: string;
}

const SCHEMA = {
  name: 'status_update',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      needsClarification: { type: 'boolean' },
      clarifyingQuestion: { type: 'string' },
      state: {
        type: 'string',
        enum: ['on-track', 'blocked', 'completed', 'needs-review'],
      },
      message: { type: 'string' },
    },
    required: ['needsClarification', 'clarifyingQuestion', 'state', 'message'],
  },
} as const;

export type StatusUpdateTurn =
  | { kind: 'clarify'; question: string; messages: ClaudeMessage[] }
  | { kind: 'result'; result: StatusUpdateResult; messages: ClaudeMessage[] };

function toTurn(raw: RawStatusUpdate, messages: ClaudeMessage[]): StatusUpdateTurn {
  const fullMessages: ClaudeMessage[] = [
    ...messages,
    { role: 'assistant', content: JSON.stringify(raw) },
  ];

  if (raw.needsClarification && raw.clarifyingQuestion.trim()) {
    return { kind: 'clarify', question: raw.clarifyingQuestion, messages: fullMessages };
  }

  return {
    kind: 'result',
    result: { state: raw.state, message: raw.message.trim() },
    messages: fullMessages,
  };
}

export async function runStatusUpdate(
  apiKey: string,
  task: Task,
): Promise<StatusUpdateTurn> {
  const messages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `Write a status update for this task:\n\n${serializeTask(task)}`,
    },
  ];
  const raw = await sendStructured<RawStatusUpdate>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages,
    jsonSchema: SCHEMA,
  });
  return toTurn(raw, messages);
}

export async function continueStatusUpdate(
  apiKey: string,
  priorMessages: ClaudeMessage[],
  answer: string,
): Promise<StatusUpdateTurn> {
  const messages: ClaudeMessage[] = [
    ...priorMessages,
    { role: 'user', content: answer },
  ];
  const raw = await sendStructured<RawStatusUpdate>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages,
    jsonSchema: SCHEMA,
  });
  return toTurn(raw, messages);
}
