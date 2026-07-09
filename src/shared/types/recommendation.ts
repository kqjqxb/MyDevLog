/**
 * Recommendation integration boundary.
 *
 * This app is single-user and fully local (AsyncStorage, no auth/backend), so
 * `RecommendationRequest` carries the task history directly instead of a
 * `userId` lookup — a real backend would swap that for a user/session id and
 * fetch history server-side, but the shape of `RecommendationResult` and the
 * `context`/`limit` contract are what a future model needs to stay compatible
 * with.
 *
 * NOTE: everything in this file is a stable interface. The actual scoring
 * logic behind it (see `src/services/recommendations/recommendationEngine.ts`)
 * is a heuristic placeholder, not a real model — see the TODO there.
 */
import { Task } from './task';

/** Where in the app recommendations are being requested for. */
export type RecommendationContext = 'home' | 'post-complete' | 'empty-state';

/** The kind of nudge a heuristic (or future model) is surfacing. */
export type RecommendationKind =
  | 'stale-in-progress'
  | 'high-priority-todo'
  | 'unfinished-subtasks'
  | 'dormant-todo';

export interface RecommendationRequest {
  /** Full local task history to reason over — stands in for a server-side user lookup. */
  tasks: Task[];
  context: RecommendationContext;
  limit: number;
}

export interface RecommendationResult {
  taskId: string;
  /** Higher = more worth surfacing. Not normalised to any fixed range. */
  score: number;
  /** Which heuristic/rule produced this recommendation. */
  kind: RecommendationKind;
  /** Human-readable, shown in the UI for transparency, e.g. "In progress for 5 days". */
  reason: string;
}

/** A recommendation joined back to its source task for rendering. */
export interface EnrichedRecommendation extends RecommendationResult {
  task: Task;
}
