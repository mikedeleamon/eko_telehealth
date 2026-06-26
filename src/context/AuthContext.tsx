import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'Patient' | 'Doctor';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  token: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isDoctor: boolean;
  // True once the user has gotten past onboarding (logged in at least once).
  // Lets sign-out return to Login instead of replaying the tutorial.
  hasOnboarded: boolean;
  login: (user: User) => void;
  logout: () => void;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isDoctor: false,
  hasOnboarded: false,
  login: () => {},
  logout: () => {},
  completeOnboarding: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [hasOnboarded, setHasOnboarded] = useState(false);

  const login = (userData: User) => {
    setHasOnboarded(true);
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  const completeOnboarding = () => {
    setHasOnboarded(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isDoctor: user?.role === 'Doctor',
        hasOnboarded,
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
