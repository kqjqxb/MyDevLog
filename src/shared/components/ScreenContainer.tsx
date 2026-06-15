import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '@/shared/constants';

interface ScreenContainerProps {
  children?: ReactNode;
  /** Which safe-area edges to inset. Defaults to top only (tab bar handles bottom). */
  edges?: readonly Edge[];
}

/** Full-bleed dark background with safe-area handling for every screen. */
export function ScreenContainer({
  children,
  edges = ['top'],
}: ScreenContainerProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safe: {
    flex: 1,
  },
});
