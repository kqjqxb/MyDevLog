import { TaskStatus } from './task';

/** Generic async lifecycle for any AI agent run. */
export type AgentPhase = 'idle' | 'loading' | 'clarifying' | 'success' | 'error';

export interface AgentState<TResult> {
  phase: AgentPhase;
  result: TResult | null;
  /** Set when the agent needs more info before producing a final result. */
  clarifyingQuestion: string | null;
  error: string | null;
}

// ---------------------------------------------------------------------------
// A — Prioritization Agent
// ---------------------------------------------------------------------------

export interface PrioritizedTask {
  taskId: string;
  rank: number;
  title: string;
  reasoning: string;
}

export interface PrioritizationResult {
  ranked: PrioritizedTask[];
  summary: string;
}

// ---------------------------------------------------------------------------
// B — Task Decomposition Agent
// ---------------------------------------------------------------------------

export interface DecompositionResult {
  subtasks: string[];
  rationale: string;
}

// ---------------------------------------------------------------------------
// C — Status Update Generator
// ---------------------------------------------------------------------------

export type TaskState = 'on-track' | 'blocked' | 'completed' | 'needs-review';

export interface StatusUpdateResult {
  state: TaskState;
  message: string;
}

// ---------------------------------------------------------------------------
// D — Smart Blocker Detector
// ---------------------------------------------------------------------------

export interface BlockerLink {
  blockerTaskId: string;
  blockerTitle: string;
  blockedTaskId: string;
  blockedTitle: string;
  reason: string;
}

export interface StaleTask {
  taskId: string;
  title: string;
  status: TaskStatus;
  daysInProgress: number;
  recommendation: string;
}

export interface BlockerDetectionResult {
  links: BlockerLink[];
  stale: StaleTask[];
  summary: string;
}

/** A single record appended to the AI action history. */
export interface AgentHistoryEntry {
  id: string;
  agent: 'prioritization' | 'decomposition' | 'status-update' | 'blocker';
  label: string;
  summary: string;
  /** Plain-text serialization of the full result, used by the history modal. */
  fullResult?: string;
  createdAt: string; // ISO 8601
}
