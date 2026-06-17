import { create } from 'zustand';

export type BannerVariant = 'invalid_key' | 'rate_limit' | 'network';

export interface BannerNotification {
  id: string;
  variant: BannerVariant;
  title: string;
  subtitle: string;
}

interface NotificationStoreState {
  banner: BannerNotification | null;
  showBanner: (notification: Omit<BannerNotification, 'id'>) => void;
  dismissBanner: () => void;
}

export const useNotificationStore = create<NotificationStoreState>(set => ({
  banner: null,

  showBanner: notification =>
    set({
      banner: {
        ...notification,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      },
    }),

  dismissBanner: () => set({ banner: null }),
}));
