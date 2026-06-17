import { useCallback, useRef, useState } from 'react';

import {
  ClaudeMessage,
  continueStatusUpdate,
  runStatusUpdate,
} from '@/services/ai';
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
  const conversation = useRef<ClaudeMessage[]>([]);
  const taskTitleRef = useRef<string>('');
  const apiKey = useSettingsStore(s => s.apiKey);
  const addHistory = useSettingsStore(s => s.addHistory);

  const apply = useCallback(
    (turn: Awaited<ReturnType<typeof runStatusUpdate>>) => {
      conversation.current = turn.messages;
      if (turn.kind === 'clarify') {
        setState({
          phase: 'clarifying',
          result: null,
          clarifyingQuestion: turn.question,
          error: null,
        });
        return;
      }
      setState({ phase: 'success', result: turn.result, clarifyingQuestion: null, error: null });
      addHistory({
        agent: 'status-update',
        label: 'Status Update',
        summary: `${taskTitleRef.current} — ${turn.result.state}`,
        fullResult: turn.result.message,
      });
    },
    [addHistory],
  );

  const run = useCallback(
    async (task: Task) => {
      taskTitleRef.current = task.title;
      setState({ phase: 'loading', result: null, clarifyingQuestion: null, error: null });
      try {
        apply(await runStatusUpdate(apiKey, task));
      } catch (error) {
        setState({ phase: 'error', result: null, clarifyingQuestion: null, error: toAgentErrorMessage(error) });
      }
    },
    [apiKey, apply],
  );

  const answer = useCallback(
    async (text: string) => {
      setState(prev => ({ ...prev, phase: 'loading', clarifyingQuestion: null }));
      try {
        apply(await continueStatusUpdate(apiKey, conversation.current, text));
      } catch (error) {
        setState({ phase: 'error', result: null, clarifyingQuestion: null, error: toAgentErrorMessage(error) });
      }
    },
    [apiKey, apply],
  );

  const reset = useCallback(() => {
    conversation.current = [];
    taskTitleRef.current = '';
    setState(INITIAL);
  }, []);

  return { state, run, answer, reset };
}
