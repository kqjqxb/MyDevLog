import { AgentHistoryEntry } from '@/shared/types';

import { readJSON, readString, remove, writeJSON, writeString } from './asyncStorage';
import { STORAGE_KEYS } from './keys';

/** Persistence for app settings (API key) and the AI action history. */
export const settingsStorage = {
  async getApiKey(): Promise<string | null> {
    return readString(STORAGE_KEYS.apiKey);
  },

  async setApiKey(key: string): Promise<void> {
    await writeString(STORAGE_KEYS.apiKey, key);
  },

  async clearApiKey(): Promise<void> {
    await remove(STORAGE_KEYS.apiKey);
  },

  async getHistory(): Promise<AgentHistoryEntry[]> {
    return readJSON<AgentHistoryEntry[]>(STORAGE_KEYS.aiHistory, []);
  },

  async saveHistory(history: AgentHistoryEntry[]): Promise<void> {
    await writeJSON(STORAGE_KEYS.aiHistory, history);
  },
};
