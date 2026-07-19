import React, { createContext, useContext, ReactNode } from 'react';
import { api } from '../api';
import type { User, UserRole } from '../api/types';
import { useAuthStore } from '../store/authStore';

export type { UserRole };

// UserRole is the stored account type. It is resolved from the account at
// sign-in, never chosen by the user on the login form.

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isDoctor: boolean;
  // True once the user has gotten past onboarding (logged in at least once).
  // Lets sign-out return to Login instead of replaying the tutorial.
  hasOnboarded: boolean;
  /** False until the persisted session has been restored from disk. */
  isRestoring: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isDoctor: false,
  hasOnboarded: false,
  isRestoring: true,
  login: async () => {},
  logout: () => {},
  completeOnboarding: () => {},
});

/**
 * React-friendly view over the persisted auth store. Screens keep using
 * useAuth(); the session itself lives in Zustand (src/store/authStore) so
 * the API client can read the token outside React.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const session = useAuthStore((s) => s.session);
  const hasOnboarded = useAuthStore((s) => s.hasOnboarded);
  const hydrated = useAuthStore((s) => s.hydrated);

  const login = async (email: string, password: string) => {
    const newSession = await api.auth.login(email, password);
    useAuthStore.getState().setSession(newSession);
  };

  const logout = () => {
    useAuthStore.getState().clearSession();
  };

  const completeOnboarding = () => {
    useAuthStore.getState().completeOnboarding();
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isLoggedIn: !!session,
        isDoctor: session?.user.accountType === 'Doctor',
        hasOnboarded,
        isRestoring: !hydrated,
        login,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
