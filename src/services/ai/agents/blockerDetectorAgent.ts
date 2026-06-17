import { BlockerDetectionResult, Task } from '@/shared/types';

import { sendStructured } from '../anthropicClient';
import { serializeTasks } from './context';
import { AGGREGATE_QUALITY_GUARD, CONTENT_WARNINGS_SCHEMA_FRAGMENT } from './contentQualityGuard';

const SYSTEM_PROMPT = `You are a delivery-risk agent that surfaces hidden blockers in an engineering
backlog before they kill velocity at standup.

Analyse ALL tasks together and reason in two passes:
1. DEPENDENCIES: Using titles, descriptions, and notes, infer where one task
   likely blocks another (e.g. "set up auth backend" blocks "build login
   screen"). Only assert a link when the semantic relationship is plausible —
   do not invent dependencies. For each link give a one-sentence reason.
2. STALE WORK: Flag tasks that have been "in-progress" too long relative to
   their age (heuristic: in-progress and ageDays >= 3, or notes implying it's
   stuck). Recommend a concrete unblocking action for each.

Return a short overall summary a lead could read aloud at standup. Always
respond using the provided JSON schema. Use the exact task ids provided.

${AGGREGATE_QUALITY_GUARD}`;

interface RawBlocker {
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
  summary: string;
  contentWarnings: Array<{ taskId: string; taskTitle: string; reason: string; skipped: boolean }>;
}

const SCHEMA = {
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
          required: [
            'blockerTaskId',
            'blockerTitle',
            'blockedTaskId',
            'blockedTitle',
            'reason',
          ],
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
      summary: { type: 'string' },
      contentWarnings: CONTENT_WARNINGS_SCHEMA_FRAGMENT,
    },
    required: ['links', 'stale', 'summary', 'contentWarnings'],
  },
} as const;

export async function runBlockerDetection(
  apiKey: string,
  tasks: Task[],
): Promise<BlockerDetectionResult> {
  const raw = await sendStructured<RawBlocker>({
    apiKey,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Analyse this backlog for blockers and stale work:\n\n${serializeTasks(tasks)}`,
      },
    ],
    jsonSchema: SCHEMA,
    maxTokens: 3072,
  });
  return {
    links: raw.links,
    stale: raw.stale,
    summary: raw.summary,
    contentWarnings: raw.contentWarnings,
  };
}
