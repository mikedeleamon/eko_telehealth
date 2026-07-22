import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme, type ThemeColors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * Second step of a 2FA login. /auth/login already sent the code and handed
 * back `challenge` (route param) — this screen only needs the code, not the
 * password again, since the challenge is the proof that already checked out.
 */
export default function LoginTwoFactorScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { completeTwoFactorLogin } = useAuth();
  const challenge: string | undefined = route.params?.challenge;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (val: string, index: number) => {
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < otp.length - 1) inputs.current[index + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < otp.length) return Alert.alert('', t('auth.valEnterNDigit', { count: otp.length }));
    if (!challenge) return Alert.alert('', t('auth.goBackSignInAgain'));
    setLoading(true);
    try {
      await completeTwoFactorLogin(challenge, code);
      // On success the navigator swaps to Main once the session is set.
    } catch (err) {
      Alert.alert(t('auth.verificationFailed'), err instanceof Error ? err.message : t('auth.invalidExpired'));
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Login')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('a11y.back')}>
          <FontAwesome name="arrow-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <FontAwesome name="shield" size={28} color={Colors.primary} />
        </View>

        <Text style={styles.title}>{t('auth.twoFactorTitle')}</Text>
        <Text style={styles.sub}>{t('auth.twoFactorBody')}</Text>

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
          <Text style={styles.btnText}>{loading ? t('auth.verifying') : t('auth.verifyCta')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resendRow} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.resendText}>{t('auth.didntReceive')}</Text>
          <Text style={styles.resendLink}>{t('auth.twoFactorBackToLogin')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 16, alignItems: 'center' },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryFaded,
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
    fontWeight: '700', color: Colors.textDark, backgroundColor: Colors.field,
  },
  otpBoxFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },

  btn: {
    backgroundColor: Colors.primary, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center', width: '100%',
    marginBottom: 20, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  btnText: { color: Colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 1, fontFamily: 'Poppins_700Bold' },

  resendRow: { flexDirection: 'row' },
  resendText: { fontSize: 14, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
