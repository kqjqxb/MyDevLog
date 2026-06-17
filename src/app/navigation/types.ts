import { NavigatorScreenParams } from '@react-navigation/native';

export type TabParamList = {
  TasksTab: undefined;
  AITab: undefined;
  SettingsTab: undefined;
};

export type RootStackParamList = {
  Tabs: { switchToTab?: number } | undefined;
  TaskDetail: { taskId: string };
  /** taskId omitted → create flow; present → edit flow. */
  TaskForm: { taskId?: string } | undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
