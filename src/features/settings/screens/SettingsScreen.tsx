import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Check, Eye, EyeOff, Info, KeyRound, Trash2 } from 'lucide-react-native';

import { ANTHROPIC_CONFIG } from '@/services/ai';
import {
  AnimatedTextInput,
  GlassCard,
  GradientButton,
  ScreenContainer,
  ThemedText,
} from '@/shared/components';
import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { useSettingsStore, useTaskStore } from '@/store';

export function SettingsScreen() {
  const apiKey = useSettingsStore(state => state.apiKey);
  const setApiKey = useSettingsStore(state => state.setApiKey);
  const clearApiKey = useSettingsStore(state => state.clearApiKey);
  const clearAll = useTaskStore(state => state.clearAll);

  const [draft, setDraft] = useState(apiKey);
  const [masked, setMasked] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setDraft(apiKey);
  }, [apiKey]);

  const handleSave = useCallback(async () => {
    await setApiKey(draft);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, [draft, setApiKey]);

  const handleClearKey = useCallback(async () => {
    await clearApiKey();
    setDraft('');
  }, [clearApiKey]);

  const handleClearData = useCallback(() => {
    Alert.alert(STRINGS.settings.clearDataLabel, STRINGS.tasks.deleteConfirmMessage, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearAll().catch(() => undefined);
        },
      },
    ]);
  }, [clearAll]);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <ThemedText variant="heading">{STRINGS.settings.title}</ThemedText>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <KeyRound color={COLORS.textPrimary} size={18} />
              <ThemedText variant="subheading">{STRINGS.settings.apiKeyLabel}</ThemedText>
            </View>

            <View style={styles.keyRow}>
              <AnimatedTextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={STRINGS.settings.apiKeyPlaceholder}
                secureTextEntry={masked}
                autoCapitalize="none"
                autoCorrect={false}
                containerStyle={styles.keyInput}
              />
              <Pressable onPress={() => setMasked(m => !m)} hitSlop={8} style={styles.eye}>
                {masked ? (
                  <Eye color={COLORS.textSecondary} size={20} />
                ) : (
                  <EyeOff color={COLORS.textSecondary} size={20} />
                )}
              </Pressable>
            </View>

            <ThemedText variant="caption" color={COLORS.textTertiary} style={styles.hint}>
              {STRINGS.settings.apiKeyHint}
            </ThemedText>

            <View style={styles.actions}>
              <GradientButton
                label={saved ? STRINGS.settings.saved : STRINGS.settings.save}
                gradient={saved ? 'success' : 'primary'}
                compact
                onPress={handleSave}
                icon={saved ? <Check color={COLORS.white} size={16} /> : undefined}
                style={styles.flex}
              />
              <Pressable onPress={handleClearKey} style={styles.clearButton}>
                <ThemedText variant="caption" color={COLORS.textSecondary}>
                  {STRINGS.settings.clear}
                </ThemedText>
              </Pressable>
            </View>
          </GlassCard>

          <GlassCard style={styles.card} flat>
            <View style={styles.cardHeader}>
              <Info color={COLORS.textPrimary} size={18} />
              <ThemedText variant="subheading">{STRINGS.settings.modelLabel}</ThemedText>
            </View>
            <ThemedText variant="body" color={COLORS.textSecondary}>
              {ANTHROPIC_CONFIG.model}
            </ThemedText>
          </GlassCard>

          <GlassCard style={styles.card} flat>
            <View style={styles.cardHeader}>
              <Trash2 color={COLORS.danger} size={18} />
              <ThemedText variant="subheading">{STRINGS.settings.storageTitle}</ThemedText>
            </View>
            <Pressable onPress={handleClearData} style={styles.dangerRow}>
              <ThemedText variant="body" color={COLORS.danger}>
                {STRINGS.settings.clearDataLabel}
              </ThemedText>
            </Pressable>
          </GlassCard>

          <View style={styles.about}>
            <ThemedText variant="caption" color={COLORS.textTertiary}>
              {STRINGS.appName} · {STRINGS.tagline}
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.lg,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.huge,
    gap: SPACING.lg,
  },
  card: {
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  keyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginVertical: SPACING.sm,
  },
  keyInput: {
    flex: 1,
  },
  eye: {
    padding: SPACING.sm,
  },
  hint: {
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.xs,
  },
  clearButton: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  dangerRow: {
    paddingVertical: SPACING.xs,
  },
  about: {
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
});
