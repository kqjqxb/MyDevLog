import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { OnboardingScreen } from '@/features/onboarding';
import { COLORS } from '@/shared/constants';
import { ErrorBoundary } from '@/shared/components';
import { useSettingsStore } from '@/store';

import { navigationTheme, RootNavigator } from './navigation';
import { SplashScreen } from './SplashScreen';
import { StatusBar } from 'react-native';
import { useBootstrap } from './useBootstrap';

/**
 * Application root. Provider stack (gesture handler → safe area → navigation),
 * a launch splash that fades once state hydrates, then either the first-launch
 * onboarding flow or the main navigator — all under a top-level error boundary.
 */
export function App() {
  const ready = useBootstrap();
  const [splashDone, setSplashDone] = useState(false);
  const onboardingCompleted = useSettingsStore(state => state.onboardingCompleted);

  const showMain = ready && splashDone;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ErrorBoundary>
          <View style={styles.flex}>
            {showMain ? (
              onboardingCompleted ? (
                <NavigationContainer theme={navigationTheme}>
                  <RootNavigator />
                </NavigationContainer>
              ) : (
                <OnboardingScreen />
              )
            ) : null}

            {!splashDone ? (
              <SplashScreen ready={ready} onFinish={() => setSplashDone(true)} />
            ) : null}
          </View>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
