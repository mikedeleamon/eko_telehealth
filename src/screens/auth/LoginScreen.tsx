import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StatusBar, Image,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import EkoTextField from '../../components/common/EkoTextField';
import EkoButton from '../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function LoginScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // Role is resolved server-side from the account, not chosen at sign-in.
      const result = await login(email.trim(), password);
      if (result.twoFactorRequired && result.challenge) {
        navigation.navigate('LoginTwoFactor', { challenge: result.challenge });
        setLoading(false);
      }
      // Otherwise the navigator swaps to Main, so no need to reset loading.
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('auth.loginFailed'),
        text2: err instanceof Error ? err.message : t('common.somethingWentWrong'),
      });
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 96, paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Image source={require('../../../assets/EkoTelehealthIcon.png')} style={styles.logoIcon} resizeMode="contain" />
          </View>
          <Text style={styles.brandName}>Eko</Text>
          <Text style={styles.brandTagline}>TELEHEALTH</Text>
        </View>

        {/* Email */}
        <EkoTextField
          pill
          icon="at"
          placeholder={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password */}
        <EkoTextField
          pill
          isPassword
          icon="lock"
          placeholder={t('auth.password')}
          value={password}
          onChangeText={setPassword}
        />

        {/* Login button */}
        <EkoButton
          title={t('auth.loginCta')}
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.loginBtn}
        />

        {/* Forgot password */}
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassLanding')} style={styles.forgotRow}>
          <Text style={styles.forgotText}>{t('auth.forgotPasswordQ')}</Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupLabel}>{t('auth.noAccount')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')} accessibilityRole="button" accessibilityLabel={t('auth.signUp')}>
            <Text style={styles.signupLink}>{t('auth.signUp')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { paddingHorizontal: 28 },

  logoArea: { alignItems: 'center', marginBottom: 44 },
  logoCircle: {
    width: 120, height: 120,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  logoIcon: { width: 100, height: 100 },
  brandName: {
    fontSize: 34, fontWeight: '700', color: '#1A1A3E',
    fontFamily: 'Poppins_700Bold',
  },
  brandTagline: {
    fontSize: 11, color: Colors.primary, letterSpacing: 4, marginTop: 3,
    fontFamily: 'Poppins_500Medium',
  },

  loginBtn: {
    height: 56,
    marginTop: 4, marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  forgotRow: { alignItems: 'flex-end', marginBottom: 48 },
  forgotText: { fontSize: 14, color: Colors.primary, fontFamily: 'Poppins_500Medium' },

  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupLabel: { fontSize: 14, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  signupLink: { fontSize: 14, color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
