import { useCallback, useRef, useState } from 'react';

import {
  ClaudeMessage,
  continueDecomposition,
  runDecomposition,
} from '@/services/ai';
import { toAgentErrorMessage } from '@/shared/hooks/agentError';
import { AgentState, DecompositionResult, Task } from '@/shared/types';
import { useSettingsStore } from '@/store';

export function serializeDecompositionResult(result: DecompositionResult): string {
  return [
    result.rationale,
    '',
    ...result.subtasks.map((s, i) => `${i + 1}. ${s}`),
  ].join('\n');
}

const INITIAL: AgentState<DecompositionResult> = {
  phase: 'idle',
  result: null,
  clarifyingQuestion: null,
  error: null,
};

/** Hook driving the multi-step Task Decomposition agent (B). */
export function useDecompositionAgent() {
  const [state, setState] = useState<AgentState<DecompositionResult>>(INITIAL);
  const conversation = useRef<ClaudeMessage[]>([]);
  const apiKey = useSettingsStore(s => s.apiKey);
  const addHistory = useSettingsStore(s => s.addHistory);

  const apply = useCallback(
    (turn: Awaited<ReturnType<typeof runDecomposition>>) => {
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
        agent: 'decomposition',
        label: 'Break Down Task',
        summary: turn.result.subtasks.length > 0
          ? `${turn.result.subtasks.length} subtasks suggested`
          : 'No new subtasks needed',
        fullResult: serializeDecompositionResult(turn.result),
      });
    },
    [addHistory],
  );

  const run = useCallback(
    async (task: Task) => {
      setState({ phase: 'loading', result: null, clarifyingQuestion: null, error: null });
      try {
        apply(await runDecomposition(apiKey, task));
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
        apply(await continueDecomposition(apiKey, conversation.current, text));
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
