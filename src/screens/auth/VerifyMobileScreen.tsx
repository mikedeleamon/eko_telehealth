import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, StatusBar,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { api } from '../../api';
import { sanitizePhoneInput, isValidPhone } from '../../utils/format';
import { useTranslation } from '../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function VerifyMobileScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [phone, setPhone] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const sendCode = async () => {
    if (!phone.trim()) return Alert.alert('', t('auth.valEnterMobile'));
    if (!isValidPhone(phone)) return Alert.alert('', t('auth.valValidMobile'));
    setLoading(true);
    try {
      await api.auth.requestCode('sms', phone.trim());
      setCodeSent(true);
    } catch (err) {
      Alert.alert(t('auth.couldNotSend'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
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
    if (code.length < 6) return Alert.alert('', t('auth.valEnter6Digit'));
    setLoading(true);
    try {
      await api.auth.verifyCode('sms', phone.trim(), code);
      // Carry the number + code on: /auth/reset-password resolves the account
      // from the phone and re-checks the code before changing anything.
      navigation.navigate('ChangePassword', { channel: 'sms', destination: phone.trim(), code });
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
          <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.body}>
        <View style={styles.iconCircle}>
          <FontAwesome name="mobile" size={36} color={Colors.accent} />
        </View>

        <Text style={styles.title}>{t('auth.mobileVerification')}</Text>
        <Text style={styles.sub}>{t('auth.mobileVerificationBody')}</Text>

        <View style={[styles.field, phoneFocused && styles.fieldFocused]}>
          <FontAwesome name="phone" size={18} color={phoneFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder={t('auth.phonePlaceholder')}
            placeholderTextColor={Colors.textGray}
            accessibilityLabel={t('auth.phone')}
            value={phone}
            onChangeText={(val) => setPhone(sanitizePhoneInput(val))}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
            keyboardType="phone-pad"
            editable={!codeSent}
          />
        </View>

        {!codeSent ? (
          <TouchableOpacity style={styles.btn} onPress={sendCode} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.btnText}>{loading ? t('auth.sending') : t('auth.sendCodeCta')}</Text>
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
              <Text style={styles.btnText}>{loading ? t('auth.verifying') : t('auth.verifyCta')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resendRow} onPress={() => setCodeSent(false)}>
              <Text style={styles.resendLink}>{t('auth.resendCodeShort')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 16, alignItems: 'center' },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.accentFaded,
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
    backgroundColor: Colors.field, borderRadius: 32,
    paddingHorizontal: 20, height: 56, marginBottom: 20, width: '100%',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.accent, backgroundColor: Colors.surface },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 28 },
  otpBox: {
    width: 44, height: 54, borderRadius: 12, borderWidth: 2,
    borderColor: Colors.borderGray, textAlign: 'center', fontSize: 20,
    fontWeight: '700', color: Colors.textDark, backgroundColor: Colors.field,
  },
  otpBoxFilled: { borderColor: Colors.accent, backgroundColor: Colors.accentFaded },

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
