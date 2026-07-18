import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import * as SplashScreen from 'expo-splash-screen';
import Toast from 'react-native-toast-message';
import './src/i18n'; // initialize i18next before any screen renders
import { AuthProvider } from './src/context/AuthContext';
import { useAuthStore } from './src/store/authStore';
import { useLocaleStore } from './src/store/localeStore';
import { useThemeStore } from './src/store/themeStore';
import { ThemeProvider, useTheme, useThemeMode } from './src/theme';
import AppNavigator from './src/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });
  // Keep the splash up until the persisted session has been restored, so
  // returning users land directly on Main instead of flashing Login.
  const authHydrated = useAuthStore((s) => s.hydrated);
  const localeHydrated = useLocaleStore((s) => s.hydrated);
  const themeHydrated = useThemeStore((s) => s.hydrated);
  const ready = fontsLoaded && authHydrated && localeHydrated && themeHydrated;

  const onLayout = useCallback(async () => {
    if (ready) await SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedRoot onLayout={onLayout} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

/**
 * Lives inside ThemeProvider so the root background and status-bar style follow
 * the active theme — otherwise a dark-themed app would flash a white gutter
 * behind the navigator and show dark status-bar icons on a dark bar.
 */
function ThemedRoot({ onLayout }: { onLayout: () => void }) {
  const Colors = useTheme();
  const { isDark } = useThemeMode();
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgLight }} onLayout={onLayout}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </QueryClientProvider>
      <Toast />
    </View>
  );
}
