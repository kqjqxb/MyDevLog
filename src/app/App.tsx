import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { COLORS } from '@/shared/constants';
import { ErrorBoundary } from '@/shared/components';

import { navigationTheme, RootNavigator } from './navigation';
import { SplashScreen } from './SplashScreen';
import { useBootstrap } from './useBootstrap';

/**
 * Application root. Wires the provider stack (gesture handler → safe area →
 * navigation), gates the UI on store hydration, and wraps everything in a
 * top-level error boundary.
 */
export function App() {
  const ready = useBootstrap();

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ErrorBoundary>
          {ready ? (
            <NavigationContainer theme={navigationTheme}>
              <RootNavigator />
            </NavigationContainer>
          ) : (
            <SplashScreen />
          )}
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = { flex: { flex: 1 } } as const;
