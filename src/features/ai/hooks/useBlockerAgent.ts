import { useCallback, useState } from 'react';

import { runBlockerDetection } from '@/services/ai';
import { AgentState, BlockerDetectionResult, Task } from '@/shared/types';
import { toAgentErrorMessage } from '@/shared/hooks/agentError';
import { useSettingsStore } from '@/store';

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
          summary:
            `${result.links.length} dependencies, ${result.stale.length} stale tasks`,
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
