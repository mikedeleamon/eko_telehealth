import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthSession } from '../api/types';

interface AuthState {
  session: AuthSession | null;
  /**
   * True once the user has gotten past onboarding (logged in at least once).
   * Lets sign-out return to Login instead of replaying the tutorial.
   */
  hasOnboarded: boolean;
  /** False until the persisted session has been rehydrated from disk. */
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  clearSession: () => void;
  completeOnboarding: () => void;
  setHydrated: () => void;
}

/**
 * Persistent session store (Zustand + AsyncStorage). The API client reads the
 * access token from here; AuthContext exposes a React-friendly view of it.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      hasOnboarded: false,
      hydrated: false,
      setSession: (session) => set({ session, hasOnboarded: true }),
      clearSession: () => set({ session: null }),
      completeOnboarding: () => set({ hasOnboarded: true }),
      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'eko-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: ({ session, hasOnboarded }) => ({ session, hasOnboarded }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
