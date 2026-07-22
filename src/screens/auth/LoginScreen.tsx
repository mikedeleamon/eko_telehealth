import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TextInput, StatusBar, Image,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';

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
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

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
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 32 }]}
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
        <View style={[styles.field, emailFocused && styles.fieldFocused]}>
          <FontAwesome name="at" size={18} color={emailFocused ? Colors.primary : Colors.textGray} style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder={t('auth.email')}
            placeholderTextColor={Colors.textGray}
            accessibilityLabel={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            onFocus={() => setEmailFocused(true)}
            onBlur={() => setEmailFocused(false)}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Password */}
        <View style={[styles.field, pwFocused && styles.fieldFocused]}>
          <FontAwesome name="lock" size={18} color={pwFocused ? Colors.primary : Colors.textGray} style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder={t('auth.password')}
            placeholderTextColor={Colors.textGray}
            accessibilityLabel={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
            secureTextEntry={!showPw}
          />
          <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={showPw ? t('a11y.hidePassword') : t('a11y.showPassword')}>
            <FontAwesome name={showPw ? 'eye' : 'eye-slash'} size={18} color={Colors.textGray} />
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85} accessibilityRole="button" accessibilityLabel={t('auth.login')}>
          <Text style={styles.loginBtnText}>{loading ? t('auth.loggingIn') : t('auth.loginCta')}</Text>
        </TouchableOpacity>

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
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIcon: { width: 52, height: 52 },
  brandName: {
    fontSize: 34, fontWeight: '700', color: '#1A1A3E',
    fontFamily: 'Poppins_700Bold',
  },
  brandTagline: {
    fontSize: 11, color: Colors.primary, letterSpacing: 4, marginTop: 3,
    fontFamily: 'Poppins_500Medium',
  },

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.field,
    borderRadius: 32, paddingHorizontal: 20, height: 56,
    marginBottom: 16,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4, marginBottom: 20,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  loginBtnText: {
    color: Colors.white, fontSize: 16, fontWeight: '700',
    letterSpacing: 1.5, fontFamily: 'Poppins_700Bold',
  },

  forgotRow: { alignItems: 'flex-end', marginBottom: 48 },
  forgotText: { fontSize: 14, color: Colors.primary, fontFamily: 'Poppins_500Medium' },

  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupLabel: { fontSize: 14, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  signupLink: { fontSize: 14, color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
