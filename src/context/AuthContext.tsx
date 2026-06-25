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
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoggedIn: false,
  isDoctor: false,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isDoctor: user?.role === 'Doctor', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
