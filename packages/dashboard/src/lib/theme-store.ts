'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'dark' | 'warm';

interface ThemeStore {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    set => ({
      theme: 'dark',
      setTheme: theme => set({ theme }),
      toggle: () => set(s => ({ theme: s.theme === 'dark' ? 'warm' : 'dark' })),
    }),
    { name: 'helios-theme' },
  ),
);
