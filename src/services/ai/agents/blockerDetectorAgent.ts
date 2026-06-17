import { BlockerDetectionResult, Task } from '@/shared/types';

import { ClaudeMessage, sendStructured } from '../anthropicClient';
import { serializeTasks } from './context';
import { CONTENT_WARNINGS_SCHEMA_FRAGMENT } from './contentQualityGuard';

// Step 1: detect dependency links, stale work, and flag candidate content warnings
// Step 2: resolve the advisory-vs-skip decision for each flagged task and write the summary

const DETECT_SYSTEM_PROMPT = `You are a delivery-risk agent that surfaces hidden blockers in an
engineering backlog before they kill velocity at standup.

Analyse ALL tasks together and reason in two passes:
1. DEPENDENCIES: Using titles, descriptions, and notes, infer where one task likely blocks another
   (e.g. "set up auth backend" blocks "build login screen"). Only assert a link when the semantic
   relationship is plausible — do not invent dependencies. For each link give a one-sentence reason.
2. STALE WORK: Flag tasks that have been "in-progress" too long relative to their age (heuristic:
   in-progress and ageDays >= 3, or notes implying it's stuck). Recommend a concrete unblocking
   action for each.

Also, flag any tasks whose title or description appears to be random characters or placeholder text
in candidateWarnings with a brief reason. Do NOT make the skip/advisory decision yet — that comes
in the next step.

Always respond using the provided JSON schema. Use the exact task ids provided.`;

const RESOLVE_SYSTEM_PROMPT = `You are a delivery-risk summarizer. You will receive the prior
analysis of blockers, stale tasks, and candidate content warnings.

Your tasks:
1. For each candidateWarning, make the explicit advisory-vs-skip decision:
   - skipped=true: ALL of the task's title and description are placeholder/gibberish — no real
     content to work with. Phrase the reason as: "Can't assess dependencies or staleness without
     a real description — title/description appear to be placeholder text."
   - skipped=false: At least some meaningful content exists in title or description; note that
     the content quality is poor but analysis was still possible.
2. Write a short overall summary (2-4 sentences) a lead could read aloud at standup, incorporating
   the blocker and stale-work findings. Do not include skipped tasks in the analysis.

Always respond using the provided JSON schema.`;

interface RawDetection {
  links: Array<{
    blockerTaskId: string;
    blockerTitle: string;
    blockedTaskId: string;
    blockedTitle: string;
    reason: string;
  }>;
  stale: Array<{
    taskId: string;
    title: string;
    status: 'todo' | 'in-progress' | 'done';
    daysInProgress: number;
    recommendation: string;
  }>;
  candidateWarnings: Array<{ taskId: string; taskTitle: string; reason: string }>;
}

interface RawResolution {
  summary: string;
  contentWarnings: Array<{ taskId: string; taskTitle: string; reason: string; skipped: boolean }>;
}

const DETECT_SCHEMA = {
  name: 'blocker_detection',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      links: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            blockerTaskId: { type: 'string' },
            blockerTitle: { type: 'string' },
            blockedTaskId: { type: 'string' },
            blockedTitle: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['blockerTaskId', 'blockerTitle', 'blockedTaskId', 'blockedTitle', 'reason'],
        },
      },
      stale: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            taskId: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'in-progress', 'done'] },
            daysInProgress: { type: 'integer' },
            recommendation: { type: 'string' },
          },
          required: ['taskId', 'title', 'status', 'daysInProgress', 'recommendation'],
        },
      },
      candidateWarnings: {
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
      },
    },
    required: ['links', 'stale', 'candidateWarnings'],
  },
} as const;

const RESOLVE_SCHEMA = {
  name: 'blocker_resolution',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      contentWarnings: CONTENT_WARNINGS_SCHEMA_FRAGMENT,
    },
    required: ['summary', 'contentWarnings'],
  },
} as const;

export async function runBlockerDetection(
  apiKey: string,
  tasks: Task[],
): Promise<BlockerDetectionResult> {
  const initialMessages: ClaudeMessage[] = [
    {
      role: 'user',
      content: `Analyse this backlog for blockers and stale work:\n\n${serializeTasks(tasks)}`,
    },
  ];

  // Step 1: detect dependency links, stale tasks, and flag candidate content warnings
  const detection = await sendStructured<RawDetection>({
    apiKey,
    system: DETECT_SYSTEM_PROMPT,
    messages: initialMessages,
    jsonSchema: DETECT_SCHEMA,
    maxTokens: 3072,
  });

  const messagesAfterDetect: ClaudeMessage[] = [
    ...initialMessages,
    { role: 'assistant', content: JSON.stringify(detection) },
    {
      role: 'user',
      content:
        'Now resolve the advisory-vs-skip decision for each candidateWarning and write the standup summary.',
    },
  ];

  // Step 2: resolve content flags and produce the final standup-ready summary
  const resolution = await sendStructured<RawResolution>({
    apiKey,
    system: RESOLVE_SYSTEM_PROMPT,
    messages: messagesAfterDetect,
    jsonSchema: RESOLVE_SCHEMA,
  });

  return {
    links: detection.links,
    stale: detection.stale,
    summary: resolution.summary,
    contentWarnings: resolution.contentWarnings,
  };
}
