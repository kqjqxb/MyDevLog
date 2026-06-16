import { useCallback, useState } from 'react';

import { runStatusUpdate } from '@/services/ai';
import { AgentState, StatusUpdateResult, Task } from '@/shared/types';
import { toAgentErrorMessage } from '@/shared/hooks/agentError';
import { useSettingsStore } from '@/store';

const INITIAL: AgentState<StatusUpdateResult> = {
  phase: 'idle',
  result: null,
  clarifyingQuestion: null,
  error: null,
};

/** Hook driving the Status Update generator agent (C). */
export function useStatusUpdateAgent() {
  const [state, setState] = useState<AgentState<StatusUpdateResult>>(INITIAL);
  const apiKey = useSettingsStore(s => s.apiKey);
  const addHistory = useSettingsStore(s => s.addHistory);

  const run = useCallback(
    async (task: Task) => {
      setState({ phase: 'loading', result: null, clarifyingQuestion: null, error: null });
      try {
        const result = await runStatusUpdate(apiKey, task);
        setState({ phase: 'success', result, clarifyingQuestion: null, error: null });
        addHistory({
          agent: 'status-update',
          label: 'Status Update',
          summary: `${task.title} — ${result.state}`,
          fullResult: result.message,
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
