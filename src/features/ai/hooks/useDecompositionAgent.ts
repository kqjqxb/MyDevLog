import { useCallback, useRef, useState } from 'react';

import {
  ClaudeMessage,
  continueDecomposition,
  runDecomposition,
} from '@/services/ai';
import { AgentState, DecompositionResult } from '@/shared/types';

export function serializeDecompositionResult(result: DecompositionResult): string {
  return [
    result.rationale,
    '',
    ...result.subtasks.map((s, i) => `${i + 1}. ${s}`),
  ].join('\n');
}
import { toAgentErrorMessage } from '@/shared/hooks/agentError';
import { useSettingsStore } from '@/store';

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
        summary: `${turn.result.subtasks.length} subtasks suggested`,
        fullResult: serializeDecompositionResult(turn.result),
      });
    },
    [addHistory],
  );

  const run = useCallback(
    async (title: string, description: string) => {
      setState({ phase: 'loading', result: null, clarifyingQuestion: null, error: null });
      try {
        apply(await runDecomposition(apiKey, title, description));
      } catch (error) {
        console.error('[DecompositionAgent] run failed', error);
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
        console.error('[DecompositionAgent] answer failed', error);
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
