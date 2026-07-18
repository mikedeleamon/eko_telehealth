import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '../api/types';

// Canonical shape lives on the server contract (UserSettings.themeMode); re-export
// so the store stays the single import site for theme-mode types.
export type { ThemeMode };

export const THEME_MODES: { mode: ThemeMode; labelKey: string; icon: string }[] = [
  { mode: 'system', labelKey: 'settings.themeSystem', icon: 'mobile' },
  { mode: 'light', labelKey: 'settings.themeLight', icon: 'sun-o' },
  { mode: 'dark', labelKey: 'settings.themeDark', icon: 'moon-o' },
];

interface ThemeState {
  /** User's explicit choice. 'system' defers to the OS appearance. */
  mode: ThemeMode;
  /** False until the persisted mode has been rehydrated from disk. */
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
}

/**
 * Persisted theme-preference store. Kept on-device (mirrors localeStore) so the
 * chosen theme applies on the very first paint, before any network call. It is
 * the render source; the matching server preference (UserSettings.themeMode) is
 * written on every change and reconciled back into this store on load (see
 * ThemeServerSync), so the choice follows the user across devices.
 */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      hydrated: false,
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'eko-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ mode }) => ({ mode }),
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ hydrated: true });
      },
    },
  ),
);
