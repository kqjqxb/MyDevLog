import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyRound } from 'lucide-react-native';

import { useTabContext } from '@/app/navigation/TabNavigator';
import { RootStackParamList } from '@/app/navigation/types';
import { COLORS, SPACING, STRINGS } from '@/shared/constants';
import { GlassCard, GradientButton, ThemedText } from '@/shared/components';

const SETTINGS_TAB_INDEX = 2;

/** Shown wherever AI features are gated on a missing API key. */
export function NoApiKeyNotice() {
  const { switchTab } = useTabContext();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const goToSettings = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.navigate('Tabs', { switchToTab: SETTINGS_TAB_INDEX });
    } else {
      switchTab(SETTINGS_TAB_INDEX);
    }
  }, [navigation, switchTab]);

  return (
    <GlassCard style={styles.card}>
      <View style={styles.row}>
        <KeyRound color={COLORS.warning} size={20} />
        <ThemedText variant="bodyMedium" style={styles.text}>
          {STRINGS.ai.needsKey}
        </ThemedText>
      </View>
      <GradientButton
        label={STRINGS.settings.title}
        gradient="primary"
        compact
        onPress={goToSettings}
        style={styles.button}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.lg,
  },
  row: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  text: {
    flex: 1,
    lineHeight: 21,
  },
  button: {
    marginTop: SPACING.lg,
  },
});
