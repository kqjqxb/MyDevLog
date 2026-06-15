import { useCallback, useRef, useState } from 'react';

import {
  ClaudeMessage,
  continuePrioritization,
  runPrioritization,
} from '@/services/ai';
import { AgentState, PrioritizationResult, Task } from '@/shared/types';
import { toAgentErrorMessage } from '@/shared/hooks/agentError';
import { useSettingsStore } from '@/store';

const INITIAL: AgentState<PrioritizationResult> = {
  phase: 'idle',
  result: null,
  clarifyingQuestion: null,
  error: null,
};

/** Hook driving the multi-step Prioritization agent (A). */
export function usePrioritizationAgent() {
  const [state, setState] = useState<AgentState<PrioritizationResult>>(INITIAL);
  const conversation = useRef<ClaudeMessage[]>([]);
  const apiKey = useSettingsStore(s => s.apiKey);
  const addHistory = useSettingsStore(s => s.addHistory);

  const apply = useCallback(
    (turn: Awaited<ReturnType<typeof runPrioritization>>) => {
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
        agent: 'prioritization',
        label: 'Prioritize My Day',
        summary: turn.result.summary,
      });
    },
    [addHistory],
  );

  const run = useCallback(
    async (tasks: Task[]) => {
      setState({ phase: 'loading', result: null, clarifyingQuestion: null, error: null });
      try {
        apply(await runPrioritization(apiKey, tasks));
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
        apply(await continuePrioritization(apiKey, conversation.current, text));
      } catch (error) {
        setState({ phase: 'error', result: null, clarifyingQuestion: null, error: toAgentErrorMessage(error) });
      }
    },
    [apiKey, apply],
  );

  const reset = useCallback(() => {
    conversation.current = [];
    setState(INITIAL);
  }, []);

  return { state, run, answer, reset };
}
