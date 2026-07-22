import React, { createContext, useContext, ReactNode } from 'react';
import { api } from '../api';
import type { LoginResult, TwoFactorChallenge, User, UserRole } from '../api/types';
import { useAuthStore } from '../store/authStore';

function isTwoFactorChallenge(result: LoginResult): result is TwoFactorChallenge {
  return (result as TwoFactorChallenge).twoFactorRequired === true;
}

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
  /** Resolves without setting a session when the account has 2FA enabled — see {@link completeTwoFactorLogin}. */
  login: (email: string, password: string) => Promise<{ twoFactorRequired: boolean; challenge?: string }>;
  /** Finishes a login that returned `twoFactorRequired`, using the challenge it handed back. */
  completeTwoFactorLogin: (challenge: string, code: string) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isDoctor: false,
  hasOnboarded: false,
  isRestoring: true,
  login: async () => ({ twoFactorRequired: false }),
  completeTwoFactorLogin: async () => {},
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
    const result = await api.auth.login(email, password);
    if (isTwoFactorChallenge(result)) {
      return { twoFactorRequired: true, challenge: result.challenge };
    }
    useAuthStore.getState().setSession(result);
    return { twoFactorRequired: false };
  };

  const completeTwoFactorLogin = async (challenge: string, code: string) => {
    const newSession = await api.auth.verifyLogin2FA(challenge, code);
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
        completeTwoFactorLogin,
        logout,
        completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
