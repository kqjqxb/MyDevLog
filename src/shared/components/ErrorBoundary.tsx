import React, { Component, ErrorInfo, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { TriangleAlert } from 'lucide-react-native';

import { COLORS, SPACING, STRINGS } from '@/shared/constants';

import { GradientButton } from './GradientButton';
import { ThemedText } from './ThemedText';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Screen-level boundary so a render error doesn't blank the whole app. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }
    return (
      <View style={styles.container}>
        <TriangleAlert color={COLORS.warning} size={48} />
        <ThemedText variant="title" style={styles.title}>
          {STRINGS.errors.boundary}
        </ThemedText>
        <GradientButton
          label={STRINGS.errors.boundaryRetry}
          onPress={this.handleRetry}
          gradient="primary"
          compact
          style={styles.button}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    padding: SPACING.xxxl,
    gap: SPACING.lg,
  },
  title: {
    textAlign: 'center',
  },
  button: {
    marginTop: SPACING.sm,
  },
});
