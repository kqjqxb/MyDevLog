import { create } from 'zustand';

import { settingsStorage } from '@/services/storage';
import { AgentHistoryEntry } from '@/shared/types';
import { createId } from '@/shared/utils';

const MAX_HISTORY = 30;

interface SettingsStoreState {
  apiKey: string;
  history: AgentHistoryEntry[];
  onboardingCompleted: boolean;
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  hasApiKey: () => boolean;

  addHistory: (entry: Omit<AgentHistoryEntry, 'id' | 'createdAt'>) => void;
  completeOnboarding: () => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  apiKey: '',
  history: [],
  onboardingCompleted: false,
  hydrated: false,

  hydrate: async () => {
    const [apiKey, history, onboardingCompleted] = await Promise.all([
      settingsStorage.getApiKey(),
      settingsStorage.getHistory(),
      settingsStorage.getOnboardingCompleted(),
    ]);
    set({ apiKey: apiKey ?? '', history, onboardingCompleted, hydrated: true });
  },

  setApiKey: async key => {
    const trimmed = key.trim();
    set({ apiKey: trimmed });
    await settingsStorage.setApiKey(trimmed);
  },

  clearApiKey: async () => {
    set({ apiKey: '' });
    await settingsStorage.clearApiKey();
  },

  hasApiKey: () => get().apiKey.trim().length > 0,

  addHistory: entry => {
    const record: AgentHistoryEntry = {
      ...entry,
      id: createId('hist'),
      createdAt: new Date().toISOString(),
    };
    const history = [record, ...get().history].slice(0, MAX_HISTORY);
    set({ history });
    settingsStorage.saveHistory(history).catch(error => {
      console.warn('[settingsStore] history persist failed', error);
    });
  },

  completeOnboarding: () => {
    set({ onboardingCompleted: true });
    settingsStorage.setOnboardingCompleted().catch(error => {
      console.warn('[settingsStore] onboarding persist failed', error);
    });
  },
}));
