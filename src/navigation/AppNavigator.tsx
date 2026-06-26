import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

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

export default function AppNavigator() {
  const { isLoggedIn, hasOnboarded } = useAuth();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{ headerShown: false, animation: 'fade' }}
        initialRouteName={hasOnboarded ? 'Login' : 'Tutorial'}
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Tutorial" component={TutorialScreen} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ animation: 'slide_from_right' }} />
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
  );
}
