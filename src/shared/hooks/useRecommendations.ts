import { useEffect, useMemo, useState } from 'react';

import { getRecommendations } from '@/services/recommendations';
import { useTaskStore } from '@/store';
import {
  EnrichedRecommendation,
  RecommendationContext,
  RecommendationResult,
} from '@/shared/types/recommendation';

interface UseRecommendationsResult {
  recommendations: EnrichedRecommendation[];
  loading: boolean;
}

/**
 * Integration seam for recommendations. UI components should only ever go
 * through this hook, never call `getRecommendations` (or a future real
 * backend client) directly — that keeps the swap from heuristic to a real
 * model to a one-line change inside this file.
 *
 * Currently backed by `recommendationEngine.ts`, a local heuristic — see the
 * TODO there. The `async` call shape already matches what a network-backed
 * recommender would look like.
 */
export function useRecommendations(
  context: RecommendationContext,
  limit: number = 5,
): UseRecommendationsResult {
  const tasks = useTaskStore(state => state.tasks);
  const hydrated = useTaskStore(state => state.hydrated);

  const [results, setResults] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    let cancelled = false;
    setLoading(true);

    getRecommendations({ tasks, context, limit })
      .then(res => {
        if (!cancelled) {
          setResults(res);
        }
      })
      .catch(error => {
        console.warn('[useRecommendations] failed', error);
        if (!cancelled) {
          setResults([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, context, limit, hydrated]);

  const recommendations = useMemo<EnrichedRecommendation[]>(() => {
    const taskById = new Map(tasks.map(task => [task.id, task]));
    return results
      .map(result => {
        const task = taskById.get(result.taskId);
        return task ? { ...result, task } as EnrichedRecommendation : null;
      })
      .filter((r): r is EnrichedRecommendation => r !== null);
  }, [results, tasks]);

  return { recommendations, loading: !hydrated || loading };
}
