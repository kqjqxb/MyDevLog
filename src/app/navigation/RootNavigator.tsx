import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { TaskDetailScreen, TaskFormScreen } from '@/features/tasks';
import { COLORS } from '@/shared/constants';
import { ErrorBoundary } from '@/shared/components';

import { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';
import { bottomSheet, slideUpFade, springTransition } from './transitions';

const Stack = createStackNavigator<RootStackParamList>();

function TaskDetail() {
  return (
    <ErrorBoundary>
      <TaskDetailScreen />
    </ErrorBoundary>
  );
}

function TaskForm() {
  return (
    <ErrorBoundary>
      <TaskFormScreen />
    </ErrorBoundary>
  );
}

/**
 * Root JS stack with custom spring transitions:
 *  - TaskDetail slides up from 30% with a fade (iOS-sheet feel).
 *  - TaskForm presents as a bottom sheet springing up from the bottom.
 * Both are swipe-down dismissible.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: COLORS.background },
        transitionSpec: springTransition,
        cardStyleInterpolator: slideUpFade,
        gestureEnabled: true,
        gestureDirection: 'vertical',
      }}>
      <Stack.Screen
        name="Tabs"
        component={TabNavigator}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="TaskDetail" component={TaskDetail} />
      <Stack.Screen
        name="TaskForm"
        component={TaskForm}
        options={{
          presentation: 'transparentModal',
          cardStyleInterpolator: bottomSheet,
        }}
      />
    </Stack.Navigator>
  );
}
