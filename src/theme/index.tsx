import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance } from 'react-native';
import { useThemeStore, type ThemeMode } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { darkColors, lightColors, makeDoctorColors, type ThemeColors } from './palette';

export type { ThemeColors } from './palette';
export { lightColors, darkColors, makeDoctorColors } from './palette';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  /** The user's stored preference ('system' | 'light' | 'dark'). */
  mode: ThemeMode;
  /** The resolved scheme after applying 'system'. */
  scheme: 'light' | 'dark';
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/**
 * Resolves the stored theme preference against the live OS appearance and
 * exposes the active palette. When mode is 'system' the palette tracks the
 * device's light/dark setting in real time (Appearance change listener).
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const [systemDark, setSystemDark] = useState(Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemDark(colorScheme === 'dark'));
    return () => sub.remove();
  }, []);

  const scheme: 'light' | 'dark' = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;
  const isDark = scheme === 'dark';

  // Doctors get the orange-led role palette; patients (and logged-out) keep the
  // default purple brand. Read straight from the auth store since ThemeProvider
  // sits above AuthProvider.
  const isDoctor = useAuthStore((s) => s.session?.user.accountType === 'Doctor');

  const value = useMemo<ThemeContextValue>(() => {
    const base = isDark ? darkColors : lightColors;
    const colors = isDoctor ? makeDoctorColors(base, isDark) : base;
    return { colors, isDark, mode, scheme, setMode };
  }, [isDark, isDoctor, mode, scheme, setMode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

/** Active colour palette for the current theme. This is the common hook. */
export function useTheme(): ThemeColors {
  return useThemeContext().colors;
}

/** Theme metadata + setter, for the Settings selector and StatusBar. */
export function useThemeMode() {
  const { isDark, mode, scheme, setMode } = useThemeContext();
  return { isDark, mode, scheme, setMode };
}
