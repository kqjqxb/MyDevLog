/**
 * TODO: replace with real recommendation model — this is a heuristic placeholder.
 *
 * There is no ML/backend recommendation service in this app. Everything below
 * is a simple, explainable, local scoring rule over the task's own fields
 * (status, priority, updatedAt, subtasks) — good enough to demo a
 * "Recommended for you" rail, not an actual personalization model.
 *
 * The function is `async` even though it currently resolves synchronously so
 * that swapping it for a real network-backed recommender later doesn't
 * change the call site (`useRecommendations`) or the UI.
 */
import { daysSince } from '@/shared/utils/date';
import { subtaskProgress } from '@/shared/utils/taskHelpers';
import { PRIORITY_WEIGHT, Task } from '@/shared/types';
import {
  RecommendationContext,
  RecommendationKind,
  RecommendationRequest,
  RecommendationResult,
} from '@/shared/types/recommendation';

const STALE_IN_PROGRESS_DAYS = 3;
const DORMANT_TODO_DAYS = 7;

interface Candidate {
  kind: RecommendationKind;
  score: number;
  reason: string;
}

/** Scores a single task against every heuristic rule, keeping the best match. */
function scoreTask(task: Task): Candidate | null {
  if (task.status === 'done') {
    return null;
  }

  const idleDays = daysSince(task.updatedAt);
  const { done, total } = subtaskProgress(task);
  const priorityWeight = PRIORITY_WEIGHT[task.priority];

  const candidates: Candidate[] = [];

  if (task.status === 'in-progress' && idleDays >= STALE_IN_PROGRESS_DAYS) {
    candidates.push({
      kind: 'stale-in-progress',
      score: 40 + idleDays * 2 + priorityWeight * 5,
      reason: `In progress for ${idleDays} day${idleDays === 1 ? '' : 's'} — pick it back up`,
    });
  }

  if (task.status === 'todo' && task.priority === 'high') {
    candidates.push({
      kind: 'high-priority-todo',
      score: 35 + idleDays + priorityWeight * 8,
      reason: 'High priority and not started yet',
    });
  }

  if (total > 0 && done < total) {
    const remaining = total - done;
    candidates.push({
      kind: 'unfinished-subtasks',
      score: 20 + remaining * 6 + priorityWeight * 3,
      reason: `${remaining} of ${total} subtask${total === 1 ? '' : 's'} left`,
    });
  }

  if (task.status === 'todo' && idleDays >= DORMANT_TODO_DAYS) {
    candidates.push({
      kind: 'dormant-todo',
      score: 10 + idleDays,
      reason: `Untouched for ${idleDays} days — still worth doing?`,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((best, current) => (current.score > best.score ? current : best));
}

/** Per-context tweaks so the same heuristic set feels relevant where it's shown. */
function contextMultiplier(kind: RecommendationKind, context: RecommendationContext): number {
  if (context === 'post-complete' && kind === 'high-priority-todo') {
    return 1.3; // just finished something — nudge toward the next important thing
  }
  if (context === 'empty-state') {
    return 1; // no strong signal either way with few/no tasks
  }
  return 1;
}

/**
 * Heuristic placeholder for a real recommendation backend. Ranks the user's
 * own open tasks by "how much this deserves attention right now" using
 * hand-written rules, not learned weights.
 */
export async function getRecommendations(
  request: RecommendationRequest,
): Promise<RecommendationResult[]> {
  const { tasks, context, limit } = request;

  const scored = tasks
    .map(task => {
      const candidate = scoreTask(task);
      if (!candidate) {
        return null;
      }
      return {
        taskId: task.id,
        score: candidate.score * contextMultiplier(candidate.kind, context),
        kind: candidate.kind,
        reason: candidate.reason,
      } satisfies RecommendationResult;
    })
    .filter((r): r is RecommendationResult => r !== null)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}
