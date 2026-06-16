import { useCallback, useState } from 'react';

import { runBlockerDetection } from '@/services/ai';
import { AgentState, BlockerDetectionResult, Task } from '@/shared/types';
import { toAgentErrorMessage } from '@/shared/hooks/agentError';
import { useSettingsStore } from '@/store';

export function serializeBlockerResult(result: BlockerDetectionResult): string {
  const lines: string[] = [result.summary];
  if (result.links.length > 0) {
    lines.push('', 'DEPENDENCIES:');
    result.links.forEach(l => {
      lines.push(`${l.blockerTitle} → blocks → ${l.blockedTitle}`);
      lines.push(l.reason);
    });
  }
  if (result.stale.length > 0) {
    lines.push('', 'STALE WORK:');
    result.stale.forEach(s => {
      lines.push(`${s.title} (${s.daysInProgress}d in progress)`);
      lines.push(s.recommendation);
    });
  }
  return lines.join('\n');
}

const INITIAL: AgentState<BlockerDetectionResult> = {
  phase: 'idle',
  result: null,
  clarifyingQuestion: null,
  error: null,
};

/** Hook driving the Smart Blocker Detector agent (D). */
export function useBlockerAgent() {
  const [state, setState] = useState<AgentState<BlockerDetectionResult>>(INITIAL);
  const apiKey = useSettingsStore(s => s.apiKey);
  const addHistory = useSettingsStore(s => s.addHistory);

  const run = useCallback(
    async (tasks: Task[]) => {
      setState({ phase: 'loading', result: null, clarifyingQuestion: null, error: null });
      try {
        const result = await runBlockerDetection(apiKey, tasks);
        setState({ phase: 'success', result, clarifyingQuestion: null, error: null });
        addHistory({
          agent: 'blocker',
          label: 'Detect Blockers',
          summary: `${result.links.length} dependencies, ${result.stale.length} stale tasks`,
          fullResult: serializeBlockerResult(result),
        });
      } catch (error) {
        setState({ phase: 'error', result: null, clarifyingQuestion: null, error: toAgentErrorMessage(error) });
      }
    },
    [apiKey, addHistory],
  );

  const reset = useCallback(() => setState(INITIAL), []);

  return { state, run, reset };
}
