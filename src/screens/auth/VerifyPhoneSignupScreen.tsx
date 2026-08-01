import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { api } from '../../api';
import { useTranslation } from '../../i18n/useTranslation';
import EkoButton from '../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * Second, mandatory verification step in the signup chain (after
 * VerifyEmailScreen) — mirrors its shape exactly, just on the sms channel.
 * The phone was already typed and validated on the signup form, so this
 * only confirms the account holder actually controls it, same reasoning as
 * email verification.
 */
export default function VerifyPhoneSignupScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const phone: string | undefined = route.params?.phone;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (phone) {
      api.auth.requestCode('sms', phone).catch(() => {
        // Non-fatal: the user can tap Resend.
      });
    }
  }, [phone]);

  const handleChange = (val: string, index: number) => {
    const next = [...otp];
    next[index] = val;
    setOtp(next);
    if (val && index < otp.length - 1) inputs.current[index + 1]?.focus();
  };

  const handleResend = async () => {
    if (!phone) return;
    try {
      await api.auth.requestCode('sms', phone);
      Alert.alert('', t('auth.newCodePhone'));
    } catch (err) {
      Alert.alert(t('auth.couldNotResend'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < otp.length) return Alert.alert('', t('auth.valEnterNDigit', { count: otp.length }));
    if (!phone) return navigation.navigate('Tutorial');
    setLoading(true);
    try {
      await api.auth.verifyCode('sms', phone, code);
      navigation.navigate('Tutorial');
    } catch (err) {
      Alert.alert(t('auth.verificationFailed'), err instanceof Error ? err.message : t('auth.invalidExpired'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('a11y.back')}>
          <FontAwesome name="arrow-left" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <FontAwesome name="mobile" size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>{t('auth.verifyPhoneShort')}</Text>
        <Text style={styles.sub}>{t('auth.verifyPhoneBodyShort')}</Text>

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
              accessibilityLabel={`Digit ${i + 1} of 6`}
            />
          ))}
        </View>

        <EkoButton
          title={t('auth.verifyCta')}
          onPress={handleVerify}
          loading={loading}
          disabled={loading}
          style={styles.btn}
        />

        <TouchableOpacity style={styles.resendRow} onPress={handleResend}>
          <Text style={styles.resendText}>{t('auth.didntReceive')}</Text>
          <Text style={styles.resendLink}>{t('auth.resend')}</Text>
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
    height: 56, width: '100%',
    marginBottom: 20, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },

  resendRow: { flexDirection: 'row' },
  resendText: { fontSize: 14, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  resendLink: { fontSize: 14, color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
