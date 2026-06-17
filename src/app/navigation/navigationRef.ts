import { createNavigationContainerRef } from '@react-navigation/native';

import { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigateToSettings(): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Tabs', { switchToTab: 2 });
  }
}
