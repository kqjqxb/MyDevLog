import { create } from 'zustand';

import { settingsStorage } from '@/services/storage';
import { AgentHistoryEntry } from '@/shared/types';
import { createId } from '@/shared/utils';

const MAX_HISTORY = 30;

interface SettingsStoreState {
  apiKey: string;
  history: AgentHistoryEntry[];
  hydrated: boolean;

  hydrate: () => Promise<void>;
  setApiKey: (key: string) => Promise<void>;
  clearApiKey: () => Promise<void>;
  hasApiKey: () => boolean;

  addHistory: (entry: Omit<AgentHistoryEntry, 'id' | 'createdAt'>) => void;
}

export const useSettingsStore = create<SettingsStoreState>((set, get) => ({
  apiKey: '',
  history: [],
  hydrated: false,

  hydrate: async () => {
    const [apiKey, history] = await Promise.all([
      settingsStorage.getApiKey(),
      settingsStorage.getHistory(),
    ]);
    set({ apiKey: apiKey ?? '', history, hydrated: true });
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
}));
