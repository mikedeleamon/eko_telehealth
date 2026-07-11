import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, TextInput, StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function LoginScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [userType, setUserType] = useState<'Patient' | 'Doctor'>('Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email.trim(), password, userType);
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Login failed',
        text2: err instanceof Error ? err.message : 'Please try again.',
      });
      setLoading(false);
    }
    // On success the navigator swaps to Main, so no need to reset loading.
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
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
            <FontAwesome name="heartbeat" size={30} color={Colors.white} />
          </View>
          <Text style={styles.brandName}>Eko</Text>
          <Text style={styles.brandTagline}>TELEHEALTH</Text>
        </View>

        {/* Patient / Doctor toggle */}
        <View style={styles.toggle}>
          {(['Patient', 'Doctor'] as const).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.toggleBtn, userType === t && styles.toggleBtnActive]}
              onPress={() => setUserType(t)}
              activeOpacity={0.8}
            >
              <Text style={[styles.toggleText, userType === t && styles.toggleTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Email */}
        <View style={[styles.field, emailFocused && styles.fieldFocused]}>
          <FontAwesome name="at" size={18} color={emailFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder="Email"
            placeholderTextColor={Colors.textGray}
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
          <FontAwesome name="lock" size={18} color={pwFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder="Password"
            placeholderTextColor={Colors.textGray}
            value={password}
            onChangeText={setPassword}
            onFocus={() => setPwFocused(true)}
            onBlur={() => setPwFocused(false)}
            secureTextEntry={!showPw}
          />
          <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name={showPw ? 'eye' : 'eye-slash'} size={18} color={Colors.textGray} />
          </TouchableOpacity>
        </View>

        {/* Login button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>{loading ? 'LOGGING IN...' : 'LOGIN'}</Text>
        </TouchableOpacity>

        {/* Forgot password */}
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassLanding')} style={styles.forgotRow}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Sign up link */}
        <View style={styles.signupRow}>
          <Text style={styles.signupLabel}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 28 },

  logoArea: { alignItems: 'center', marginBottom: 44 },
  logoCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 34, fontWeight: '700', color: '#1A1A3E',
    fontFamily: 'Poppins_700Bold',
  },
  brandTagline: {
    fontSize: 11, color: Colors.accent, letterSpacing: 4, marginTop: 3,
    fontFamily: 'Poppins_500Medium',
  },

  toggle: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    borderRadius: 32,
    overflow: 'hidden',
    marginBottom: 28,
  },
  toggleBtn: { flex: 1, paddingVertical: 13, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.accent },
  toggleText: { fontSize: 15, fontWeight: '600', color: Colors.accent, fontFamily: 'Poppins_600SemiBold' },
  toggleTextActive: { color: Colors.white },

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F6FA',
    borderRadius: 32, paddingHorizontal: 20, height: 56,
    marginBottom: 16,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.accent, backgroundColor: Colors.white },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  loginBtn: {
    backgroundColor: Colors.accent, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4, marginBottom: 20,
    shadowColor: Colors.accent,
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
  forgotText: { fontSize: 14, color: Colors.accent, fontFamily: 'Poppins_500Medium' },

  signupRow: { flexDirection: 'row', justifyContent: 'center' },
  signupLabel: { fontSize: 14, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  signupLink: { fontSize: 14, color: Colors.accent, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
