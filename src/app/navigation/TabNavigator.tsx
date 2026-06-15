import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from '@react-native-community/blur';
import { LayoutGrid, Settings, Sparkles } from 'lucide-react-native';

import { AIAgentScreen } from '@/features/ai';
import { SettingsScreen } from '@/features/settings';
import { TaskListScreen } from '@/features/tasks';
import { COLORS, STRINGS } from '@/shared/constants';
import { ErrorBoundary } from '@/shared/components';

import { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

/** Frosted tab bar background (blur on iOS, translucent surface elsewhere). */
function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="dark"
        blurAmount={24}
        reducedTransparencyFallbackColor={COLORS.surface}
      />
    );
  }
  return <View style={[StyleSheet.absoluteFill, styles.androidBar]} />;
}

/** Each tab screen is wrapped in its own error boundary. */
function withBoundary(Screen: React.ComponentType): React.ComponentType {
  return function Wrapped() {
    return (
      <ErrorBoundary>
        <Screen />
      </ErrorBoundary>
    );
  };
}

const TasksTab = withBoundary(TaskListScreen);
const AITab = withBoundary(AIAgentScreen);
const SettingsTab = withBoundary(SettingsScreen);

interface TabIconProps {
  color: string;
  size: number;
}

// Defined at module scope (not inline in options) so identities stay stable.
const renderTasksIcon = ({ color, size }: TabIconProps) => (
  <LayoutGrid color={color} size={size} />
);
const renderAIIcon = ({ color, size }: TabIconProps) => (
  <Sparkles color={color} size={size} />
);
const renderSettingsIcon = ({ color, size }: TabIconProps) => (
  <Settings color={color} size={size} />
);

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#A78BFA',
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarStyle: styles.tabBar,
        tabBarBackground: TabBarBackground,
        tabBarLabelStyle: styles.label,
      }}>
      <Tab.Screen
        name="TasksTab"
        component={TasksTab}
        options={{
          title: STRINGS.tabs.tasks,
          tabBarIcon: renderTasksIcon,
        }}
      />
      <Tab.Screen
        name="AITab"
        component={AITab}
        options={{
          title: STRINGS.tabs.ai,
          tabBarIcon: renderAIIcon,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsTab}
        options={{
          title: STRINGS.tabs.settings,
          tabBarIcon: renderSettingsIcon,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : COLORS.surface,
    elevation: 0,
  },
  androidBar: {
    backgroundColor: COLORS.surface,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
