import { StatusUpdateResult, Task, TaskState } from '@/shared/types';

import { sendStructured } from '../anthropicClient';
import { serializeTask } from './context';

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
or two is fine. Always respond using the provided JSON schema.`;

interface RawStatusUpdate {
  state: TaskState;
  message: string;
}

const SCHEMA = {
  name: 'status_update',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      state: {
        type: 'string',
        enum: ['on-track', 'blocked', 'completed', 'needs-review'],
      },
      message: { type: 'string' },
    },
    required: ['state', 'message'],
  },
} as const;

export async function runStatusUpdate(
  apiKey: string,
  task: Task,
): Promise<StatusUpdateResult> {
  const raw = await sendStructured<RawStatusUpdate>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Write a status update for this task:\n\n${serializeTask(task)}`,
      },
    ],
    jsonSchema: SCHEMA,
  });
  return { state: raw.state, message: raw.message.trim() };
}
