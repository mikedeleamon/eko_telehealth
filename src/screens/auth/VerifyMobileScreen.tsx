import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { api } from '../../api';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function VerifyMobileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const sendCode = async () => {
    if (!phone.trim()) return Alert.alert('', 'Please enter your mobile number.');
    setLoading(true);
    try {
      await api.auth.requestCode('sms', phone.trim());
      setCodeSent(true);
    } catch (err) {
      Alert.alert('Could not send code', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (val: string, i: number) => {
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const verify = async () => {
    const code = otp.join('');
    if (code.length < 6) return Alert.alert('', 'Please enter the 6-digit code.');
    setLoading(true);
    try {
      await api.auth.verifyCode('sms', code);
      navigation.navigate('ChangePassword');
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
          <FontAwesome name="mobile" size={36} color={Colors.accent} />
        </View>

        <Text style={styles.title}>Mobile Verification</Text>
        <Text style={styles.sub}>Enter your mobile number to receive a verification code.</Text>

        <View style={[styles.field, phoneFocused && styles.fieldFocused]}>
          <FontAwesome name="phone" size={18} color={phoneFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder="+1 Phone number"
            placeholderTextColor={Colors.textGray}
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            keyboardType="phone-pad"
            editable={!codeSent}
          />
        </View>

        {!codeSent ? (
          <TouchableOpacity style={styles.btn} onPress={sendCode} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.btnText}>{loading ? 'SENDING...' : 'SEND CODE'}</Text>
          </TouchableOpacity>
        ) : (
          <>
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
                />
              ))}
            </View>
            <TouchableOpacity style={styles.btn} onPress={verify} disabled={loading} activeOpacity={0.85}>
              <Text style={styles.btnText}>{loading ? 'VERIFYING...' : 'VERIFY'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendRow} onPress={() => setCodeSent(false)}>
              <Text style={styles.resendLink}>Resend Code</Text>
            </TouchableOpacity>
          </>
        )}
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
    marginBottom: 28, lineHeight: 22, fontFamily: 'Poppins_400Regular',
  },

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F6FA', borderRadius: 32,
    paddingHorizontal: 20, height: 56, marginBottom: 20, width: '100%',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.accent, backgroundColor: Colors.white },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  otpBox: {
    width: 44, height: 54, borderRadius: 12, borderWidth: 2,
    borderColor: Colors.borderGray, textAlign: 'center', fontSize: 20,
    fontWeight: '700', color: Colors.textDark, backgroundColor: '#F5F6FA',
  },
  otpBoxFilled: { borderColor: Colors.accent, backgroundColor: '#FFF5F2' },

  btn: {
    backgroundColor: Colors.accent, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center', width: '100%',
    marginBottom: 16, shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 1, fontFamily: 'Poppins_700Bold' },

  resendRow: { marginTop: 4 },
  resendLink: { fontSize: 14, color: Colors.accent, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
