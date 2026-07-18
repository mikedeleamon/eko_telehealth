import React, { useEffect, useMemo } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/queries';
import { useTheme, useThemeMode } from '../theme';

import TutorialScreen from '../screens/onboarding/TutorialScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignupScreen from '../screens/auth/SignupScreen';
import ForgotPassLandingScreen from '../screens/auth/ForgotPassLandingScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import VerifyEmailScreen from '../screens/auth/VerifyEmailScreen';
import VerifyMobileScreen from '../screens/auth/VerifyMobileScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

/**
 * Adopts the server-stored theme preference into the local theme store on load
 * (and whenever it changes on the server), so the choice follows the user across
 * devices. Mounted only inside the logged-in tree, since the settings query is
 * auth-gated. Renders nothing.
 *
 * The effect deliberately keys on the SERVER value only — not the local `mode`.
 * A local change (from the Settings selector) writes the server and updates this
 * query's cache to match, so keying on `mode` too would let a stale server value
 * momentarily fight the user's fresh choice.
 */
function ThemeServerSync() {
  const { data } = useSettings();
  const { mode, setMode } = useThemeMode();
  const serverMode = data?.themeMode;
  useEffect(() => {
    if (serverMode && serverMode !== mode) setMode(serverMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverMode]);
  return null;
}

export default function AppNavigator() {
  const { isLoggedIn } = useAuth();
  const Colors = useTheme();
  const { isDark } = useThemeMode();

  // Match the navigator's own surfaces to the theme so transitions don't flash
  // a white card behind dark screens.
  const navTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: Colors.bgLight,
        card: Colors.surface,
        text: Colors.textDark,
        border: Colors.borderGray,
        primary: Colors.primary,
      },
    };
  }, [isDark, Colors]);

  return (
    <>
      {isLoggedIn && <ThemeServerSync />}
      <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
        initialRouteName="Login"
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            {/* Reached only after Signup + VerifyEmail — onboarding is a
                post-signup welcome, not a pre-login gate. */}
            <Stack.Screen name="Tutorial" component={TutorialScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ForgotPassLanding" component={ForgotPassLandingScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="VerifyMobile" component={VerifyMobileScreen} options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ animation: 'slide_from_right' }} />
          </>
        ) : (
          <Stack.Screen name="Main" component={TabNavigator} />
        )}
      </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
