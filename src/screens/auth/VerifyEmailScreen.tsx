import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { api } from '../../api';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function VerifyEmailScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  // When verifying as part of a password reset, continue to set a new password.
  const isReset = route.params?.reset === true;
  const email: string | undefined = route.params?.email;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  // Signup flow: nothing has issued a code yet, so send one on arrival.
  // Reset flow: /auth/forgot-password already sent it — don't double-send.
  useEffect(() => {
    if (!isReset && email) {
      api.auth.requestCode('email', email).catch(() => {
        // Non-fatal: the user can tap Resend.
      });
    }
  }, [isReset, email]);

  const handleChange = (val: string, index: number) => {
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < otp.length - 1) inputs.current[index + 1]?.focus();
  };

  const handleResend = async () => {
    if (!email) return Alert.alert('', 'Go back and re-enter your email to get a new code.');
    try {
      await api.auth.requestCode('email', email);
      Alert.alert('', 'A new code is on its way to your email.');
    } catch (err) {
      Alert.alert('Could not resend code', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < otp.length) return Alert.alert('', `Please enter the ${otp.length}-digit code.`);
    setLoading(true);
    try {
      if (!email) return Alert.alert('', 'Go back and re-enter your email address.');
      await api.auth.verifyCode('email', email, code);
      // Fresh signup: show the onboarding tutorial once, then land on Login.
      // Password reset: carry the code forward — /auth/reset-password needs it
      // (and the destination it was issued to) to authorise the change.
      if (isReset) {
        navigation.navigate('ChangePassword', { channel: 'email', destination: email, code });
      } else {
        navigation.navigate('Tutorial');
      }
    } catch (err) {
      Alert.alert('Verification failed', err instanceof Error ? err.message : 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <FontAwesome name="envelope" size={30} color={Colors.accent} />
        </View>

        <Text style={styles.title}>Verify Email</Text>
        <Text style={styles.sub}>We sent a 6-digit code to your email. Enter it below to continue.</Text>

        <View style={styles.otpRow}>
          {otp.map((val, i) => (
            <TextInput
              key={i}
              ref={r => { inputs.current[i] = r; }}
              style={[styles.otpBox, val && styles.otpBoxFilled]}
              value={val}
              onChangeText={v => handleChange(v.slice(-1), i)}
              keyboardType="number-pad"
              maxLength={1}
              onKeyPress={({ nativeEvent }) => {
                if (nativeEvent.key === 'Backspace' && !val && i > 0) inputs.current[i - 1]?.focus();
              }}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={handleVerify} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.btnText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendRow} onPress={handleResend}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <Text style={styles.resendLink}>Resend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 16, alignItems: 'center' },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF0EB',
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: {
    fontSize: 26, fontWeight: '700', color: Colors.textDark,
    marginBottom: 10, fontFamily: 'Poppins_700Bold',
  },
  sub: {
    fontSize: 14, color: Colors.textGray, textAlign: 'center',
    marginBottom: 36, lineHeight: 22, fontFamily: 'Poppins_400Regular',
  },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 36 },
  otpBox: {
    width: 44, height: 54, borderRadius: 12, borderWidth: 2,
    borderColor: Colors.borderGray, textAlign: 'center', fontSize: 20,
    fontWeight: '700', color: Colors.textDark, backgroundColor: '#F5F6FA',
  },
  otpBoxFilled: { borderColor: Colors.accent, backgroundColor: '#FFF5F2' },

  btn: {
    backgroundColor: Colors.accent, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center', width: '100%',
    marginBottom: 20, shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 1, fontFamily: 'Poppins_700Bold' },

  resendRow: { flexDirection: 'row' },
  resendText: { fontSize: 14, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  resendLink: { fontSize: 14, color: Colors.accent, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
