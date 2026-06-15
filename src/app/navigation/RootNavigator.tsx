import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { TaskDetailScreen, TaskFormScreen } from '@/features/tasks';
import { ErrorBoundary } from '@/shared/components';

import { RootStackParamList } from './types';
import { TabNavigator } from './TabNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

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
 * Root native stack. Detail slides in from the right with the platform spring;
 * the create/edit form presents as a bottom-sheet modal.
 */
export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#0A0A0F' },
      }}>
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="TaskDetail" component={TaskDetail} />
      <Stack.Screen
        name="TaskForm"
        component={TaskForm}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack.Navigator>
  );
}
