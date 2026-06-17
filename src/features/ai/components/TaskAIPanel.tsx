import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AlertTriangle,
  ListTree,
  Send,
  Sparkles,
} from 'lucide-react-native';

import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { ThemedText } from '@/shared/components';
import { Task } from '@/shared/types';
import { useSettingsStore, useTaskStore } from '@/store';

import {
  useBlockerAgent,
  useDecompositionAgent,
  usePrioritizationAgent,
  useStatusUpdateAgent,
  serializePrioritizationResult,
  serializeBlockerResult,
} from '../hooks';
import { AgentCard } from './AgentCard';
import { BlockerResultView } from './BlockerResultView';
import { DecompositionResultView } from './DecompositionResultView';
import { NoApiKeyNotice } from './NoApiKeyNotice';
import { PrioritizationResultView } from './PrioritizationResultView';
import { StatusUpdateResultView } from './StatusUpdateResultView';

interface TaskAIPanelProps {
  task: Task;
  onApplySubtasks: (titles: string[]) => void;
}

/**
 * AI actions panel shown on the task detail screen. Surfaces all four agents:
 * decomposition + status update operate on this task; prioritization + blocker
 * detection reason over the whole backlog.
 */
export function TaskAIPanel({ task, onApplySubtasks }: TaskAIPanelProps) {
  const hasKey = useSettingsStore(state => state.apiKey.trim().length > 0);
  const tasks = useTaskStore(state => state.tasks);

  const decomposition = useDecompositionAgent();
  const statusUpdate = useStatusUpdateAgent();
  const prioritization = usePrioritizationAgent();
  const blocker = useBlockerAgent();

  const [applied, setApplied] = useState(false);

  const runDecomposition = useCallback(() => {
    setApplied(false);
    decomposition.run(task.title, task.description);
  }, [decomposition, task]);

  const handleApply = useCallback(() => {
    if (decomposition.state.result) {
      onApplySubtasks(decomposition.state.result.subtasks);
      setApplied(true);
    }
  }, [decomposition.state.result, onApplySubtasks]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Sparkles color={COLORS.textPrimary} size={20} />
        <ThemedText variant="subheading">{STRINGS.ai.panelTitle}</ThemedText>
      </View>

      {!hasKey ? <NoApiKeyNotice /> : null}

      <AgentCard
        title={STRINGS.ai.decompose}
        description={STRINGS.ai.decomposeDesc}
        icon={<ListTree color={COLORS.white} size={22} />}
        gradient="primary"
        phase={decomposition.state.phase}
        error={decomposition.state.error}
        clarifyingQuestion={decomposition.state.clarifyingQuestion}
        runLabel={STRINGS.ai.decompose}
        disabled={!hasKey}
        onRun={runDecomposition}
        onAnswer={decomposition.answer}
        onClose={decomposition.reset}>
        {decomposition.state.result ? (
          <DecompositionResultView
            result={decomposition.state.result}
            applied={applied}
            onApply={handleApply}
          />
        ) : null}
      </AgentCard>

      <AgentCard
        title={STRINGS.ai.statusUpdate}
        description={STRINGS.ai.statusUpdateDesc}
        icon={<Send color={COLORS.white} size={20} />}
        gradient="accent"
        phase={statusUpdate.state.phase}
        error={statusUpdate.state.error}
        clarifyingQuestion={statusUpdate.state.clarifyingQuestion}
        runLabel={STRINGS.ai.statusUpdate}
        disabled={!hasKey}
        onRun={() => statusUpdate.run(task)}
        onAnswer={statusUpdate.answer}
        onClose={statusUpdate.reset}>
        {statusUpdate.state.result ? (
          <StatusUpdateResultView
            result={statusUpdate.state.result}
            onClose={statusUpdate.reset}
          />
        ) : null}
      </AgentCard>

      <AgentCard
        title={STRINGS.ai.prioritize}
        description={STRINGS.ai.prioritizeDesc}
        icon={<Sparkles color={COLORS.white} size={20} />}
        gradient="primary"
        phase={prioritization.state.phase}
        error={prioritization.state.error}
        clarifyingQuestion={prioritization.state.clarifyingQuestion}
        runLabel={STRINGS.ai.prioritize}
        disabled={!hasKey}
        onRun={() => prioritization.run(tasks)}
        onAnswer={prioritization.answer}
        onClose={prioritization.reset}
        resultText={
          prioritization.state.result
            ? serializePrioritizationResult(prioritization.state.result)
            : undefined
        }>
        {prioritization.state.result ? (
          <PrioritizationResultView result={prioritization.state.result} />
        ) : null}
      </AgentCard>

      <AgentCard
        title={STRINGS.ai.blockers}
        description={STRINGS.ai.blockersDesc}
        icon={<AlertTriangle color={COLORS.white} size={20} />}
        gradient="danger"
        phase={blocker.state.phase}
        error={blocker.state.error}
        clarifyingQuestion={null}
        runLabel={STRINGS.ai.blockers}
        disabled={!hasKey}
        onRun={() => blocker.run(tasks)}
        onClose={blocker.reset}
        resultText={
          blocker.state.result
            ? serializeBlockerResult(blocker.state.result)
            : undefined
        }>
        {blocker.state.result ? <BlockerResultView result={blocker.state.result} /> : null}
      </AgentCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
});
