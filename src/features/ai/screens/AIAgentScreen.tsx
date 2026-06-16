import React, { useCallback } from 'react';
import { Dimensions, ScrollView, StyleSheet, View } from 'react-native';
import { AlertTriangle, Sparkles } from 'lucide-react-native';

import {
  GradientText,
  ScreenContainer,
  ThemedText,
} from '@/shared/components';
import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { useSettingsStore, useTaskStore } from '@/store';

import {
  AgentCard,
  AgentHistoryList,
  AnimatedAIBackdrop,
  BlockerResultView,
  NoApiKeyNotice,
  PrioritizationResultView,
} from '../components';
import { useBlockerAgent, usePrioritizationAgent } from '../hooks';

/**
 * Dedicated AI tab. Focuses on the two backlog-wide agents (prioritization &
 * blocker detection) plus the persisted action history. Task-specific agents
 * live on the task detail screen.
 */
export function AIAgentScreen() {
  const hasKey = useSettingsStore(state => state.apiKey.trim().length > 0);
  const history = useSettingsStore(state => state.history);
  const tasks = useTaskStore(state => state.tasks);

  const prioritization = usePrioritizationAgent();
  const blocker = useBlockerAgent();

  const noTasks = tasks.length === 0;
  const disabled = !hasKey || noTasks;

  const runPrioritize = useCallback(() => prioritization.run(tasks), [prioritization, tasks]);
  const runBlocker = useCallback(() => blocker.run(tasks), [blocker, tasks]);

  return (
    <ScreenContainer>
      <AnimatedAIBackdrop />
      <View style={styles.header}>
        <GradientText text={STRINGS.ai.panelTitle} gradient="ai" fontSize={30} width={320} />
        <ThemedText variant="secondary" color={COLORS.textSecondary}>
          {STRINGS.ai.panelSubtitle}
        </ThemedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {!hasKey ? <NoApiKeyNotice /> : null}

        {hasKey && noTasks ? (
          <ThemedText variant="secondary" color={COLORS.textSecondary} style={styles.hint}>
            {STRINGS.ai.noTasks}
          </ThemedText>
        ) : null}

        <AgentCard
          title={STRINGS.ai.prioritize}
          description={STRINGS.ai.prioritizeDesc}
          icon={<Sparkles color={COLORS.white} size={22} />}
          gradient="primary"
          phase={prioritization.state.phase}
          error={prioritization.state.error}
          clarifyingQuestion={prioritization.state.clarifyingQuestion}
          runLabel={STRINGS.ai.prioritize}
          disabled={disabled}
          onRun={runPrioritize}
          onAnswer={prioritization.answer}>
          {prioritization.state.result ? (
            <PrioritizationResultView result={prioritization.state.result} />
          ) : null}
        </AgentCard>

        <AgentCard
          title={STRINGS.ai.blockers}
          description={STRINGS.ai.blockersDesc}
          icon={<AlertTriangle color={COLORS.white} size={22} />}
          gradient="danger"
          phase={blocker.state.phase}
          error={blocker.state.error}
          clarifyingQuestion={null}
          runLabel={STRINGS.ai.blockers}
          disabled={disabled}
          onRun={runBlocker}>
          {blocker.state.result ? <BlockerResultView result={blocker.state.result} /> : null}
        </AgentCard>

        <AgentHistoryList history={history} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: Dimensions.get('window').height * 0.16,
  },
  hint: {
    marginBottom: SPACING.lg,
    lineHeight: 21,
  },
});
