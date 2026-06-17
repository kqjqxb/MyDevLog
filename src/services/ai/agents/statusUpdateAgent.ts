import { StatusUpdateResult, Task, TaskState } from '@/shared/types';

import { ClaudeMessage, sendStructured } from '../anthropicClient';
import { serializeTask } from './context';
import { STATUS_UPDATE_QUALITY_GUARD } from './contentQualityGuard';

// Step 1: classify the task's true state (on-track / blocked / completed / needs-review)
// Step 2: write the Slack-style message whose tone matches that classified state

const CLASSIFY_SYSTEM_PROMPT = `You are a task status classifier for an engineering team.

Given a task with its subtasks, notes, and metadata, classify its true state into exactly
one of: on-track | blocked | completed | needs-review
Base this on status, subtask progress, notes, and age. Include brief reasoning.

${STATUS_UPDATE_QUALITY_GUARD}`;

const WRITE_SYSTEM_PROMPT = `You write concise async status updates in the style a developer
would post in a team Slack channel during standup.

You will receive a prior classification (state + reasoning). Write a short update whose TONE
matches that state:
  - on-track: confident, momentum-focused
  - blocked: candid about the blocker, asks for help
  - completed: wraps up, notes what shipped
  - needs-review: flags that it's ready for eyes

Keep it to 2-4 sentences, first person, no corporate filler. A tasteful emoji or two is fine.
Always respond using the provided JSON schema.`;

interface RawClassification {
  needsClarification: boolean;
  clarifyingQuestion: string;
  state: TaskState;
  reasoning: string;
}

interface RawMessage {
  message: string;
}

const CLASSIFY_SCHEMA = {
  name: 'status_classification',
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
      reasoning: { type: 'string' },
    },
    required: ['needsClarification', 'clarifyingQuestion', 'state', 'reasoning'],
  },
} as const;

const WRITE_SCHEMA = {
  name: 'status_message',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      message: { type: 'string' },
    },
    required: ['message'],
  },
} as const;

export type StatusUpdateTurn =
  | { kind: 'clarify'; question: string; messages: ClaudeMessage[] }
  | { kind: 'result'; result: StatusUpdateResult; messages: ClaudeMessage[] };

/** Step 1: classify the task state. Returns classification + updated message history. */
async function classifyState(
  apiKey: string,
  messages: ClaudeMessage[],
): Promise<{ raw: RawClassification; messages: ClaudeMessage[] }> {
  const raw = await sendStructured<RawClassification>({
    apiKey,
    system: CLASSIFY_SYSTEM_PROMPT,
    messages,
    jsonSchema: CLASSIFY_SCHEMA,
  });
  return {
    raw,
    messages: [...messages, { role: 'assistant', content: JSON.stringify(raw) }],
  };
}

/** Step 2: write the Slack message based on the classified state in conversation history. */
async function writeMessage(
  apiKey: string,
  messagesAfterClassify: ClaudeMessage[],
): Promise<{ raw: RawMessage; messages: ClaudeMessage[] }> {
  const messages: ClaudeMessage[] = [
    ...messagesAfterClassify,
    { role: 'user', content: 'Now write the Slack status update for this classification.' },
  ];
  const raw = await sendStructured<RawMessage>({
    apiKey,
    system: WRITE_SYSTEM_PROMPT,
    messages,
    jsonSchema: WRITE_SCHEMA,
  });
  return {
    raw,
    messages: [...messages, { role: 'assistant', content: JSON.stringify(raw) }],
  };
}

export async function runStatusUpdate(
  apiKey: string,
  task: Task,
): Promise<StatusUpdateTurn> {
  const initialMessages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `Write a status update for this task:\n\n${serializeTask(task)}`,
    },
  ];

  // Step 1: classify state
  const { raw: classification, messages: messagesAfterClassify } =
    await classifyState(apiKey, initialMessages);

  if (classification.needsClarification && classification.clarifyingQuestion.trim()) {
    return { kind: 'clarify', question: classification.clarifyingQuestion, messages: messagesAfterClassify };
  }

  // Step 2: write message based on classified state
  const { raw: messageResult, messages: finalMessages } =
    await writeMessage(apiKey, messagesAfterClassify);

  return {
    kind: 'result',
    result: { state: classification.state, message: messageResult.message.trim() },
    messages: finalMessages,
  };
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

  // Step 1: classify state (with user's answer threaded in)
  const { raw: classification, messages: messagesAfterClassify } =
    await classifyState(apiKey, messages);

  if (classification.needsClarification && classification.clarifyingQuestion.trim()) {
    return { kind: 'clarify', question: classification.clarifyingQuestion, messages: messagesAfterClassify };
  }

  // Step 2: write message based on classified state
  const { raw: messageResult, messages: finalMessages } =
    await writeMessage(apiKey, messagesAfterClassify);

  return {
    kind: 'result',
    result: { state: classification.state, message: messageResult.message.trim() },
    messages: finalMessages,
  };
}
