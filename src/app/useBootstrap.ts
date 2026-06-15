import { useEffect, useState } from 'react';

import { useSettingsStore, useTaskStore } from '@/store';

/**
 * Hydrates persisted state (tasks + settings) from AsyncStorage on launch.
 * Returns `ready` once both stores have loaded so the UI doesn't flash empty.
 */
export function useBootstrap(): boolean {
  const [ready, setReady] = useState(false);
  const hydrateTasks = useTaskStore(state => state.hydrate);
  const hydrateSettings = useSettingsStore(state => state.hydrate);

  useEffect(() => {
    let active = true;
    Promise.all([hydrateTasks(), hydrateSettings()]).finally(() => {
      if (active) {
        setReady(true);
      }
    });
    return () => {
      active = false;
    };
  }, [hydrateTasks, hydrateSettings]);

  return ready;
}
