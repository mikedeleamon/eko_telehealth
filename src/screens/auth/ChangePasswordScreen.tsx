import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api';
import { useTranslation } from '../../i18n/useTranslation';
import EkoTextField from '../../components/common/EkoTextField';
import EkoButton from '../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function ChangePasswordScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();
  // Set by the reset flows (VerifyEmail / VerifyMobile pass the verified code
  // on). Absent for logged-in users changing their password from Account.
  const channel: 'email' | 'sms' | undefined = route.params?.channel;
  const destination: string | undefined = route.params?.destination;
  const resetCode: string | undefined = route.params?.code;
  const isReset = !!(channel && destination && resetCode);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    if (!isReset && !currentPass) return Alert.alert('', t('auth.valEnterCurrent'));
    if (!newPass) return Alert.alert('', t('auth.valEnterNew'));
    if (newPass.length < 8) return Alert.alert('', t('auth.valMin8'));
    if (newPass !== confirmPass) return Alert.alert('', t('auth.valMismatch'));

    // Reached without reset params and without a session there's nothing to
    // authorise the change — don't report a success that never happened.
    if (!isReset && !isLoggedIn) {
      return Alert.alert('', t('auth.resetLinkExpired'));
    }

    setLoading(true);
    try {
      if (isReset) {
        await api.auth.resetPassword(channel!, destination!, resetCode!, newPass);
      } else {
        await api.auth.changePassword(currentPass, newPass);
      }
      Alert.alert(t('auth.success'), t('auth.passwordUpdated'), [
        // Logged-in users return to where they were; the reset flow signs in.
        { text: t('common.ok'), onPress: () => (isReset ? navigation.navigate('Login') : navigation.goBack()) },
      ]);
    } catch (err) {
      Alert.alert(t('auth.couldNotUpdatePassword'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
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
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('a11y.back')}>
            <FontAwesome name="arrow-left" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{t('auth.changePasswordTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.createNewPassword')}</Text>

          {/* Current password — only when already signed in; the reset flows
              prove identity with the code instead. */}
          {!isReset && (
            <EkoTextField
              pill
              isPassword
              icon="lock"
              placeholder={t('auth.currentPasswordPlaceholder')}
              value={currentPass}
              onChangeText={setCurrentPass}
            />
          )}

          {/* New password */}
          <EkoTextField
            pill
            isPassword
            icon="lock"
            placeholder={t('auth.newPasswordPlaceholder')}
            value={newPass}
            onChangeText={setNewPass}
          />

          {/* Confirm password */}
          <EkoTextField
            pill
            isPassword
            icon="lock"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            value={confirmPass}
            onChangeText={setConfirmPass}
          />

          <EkoButton
            title={t('auth.changePasswordCta')}
            onPress={handle}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
          />

          {/* Password rules card */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>{t('auth.passwordRules')}</Text>
            {[
              t('auth.crit8'),
              t('auth.critMix'),
              t('auth.ruleNoSpaceShort'),
              t('auth.critNotGuess'),
            ].map(r => (
              <View key={r} style={styles.ruleRow}>
                <View style={styles.ruleDot} />
                <Text style={styles.ruleText}>{r}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  body: { paddingHorizontal: 28, paddingTop: 16 },

  title: {
    fontSize: 26, fontWeight: '700', color: Colors.textDark,
    marginBottom: 8, fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 14, color: Colors.textGray, marginBottom: 28,
    fontFamily: 'Poppins_400Regular',
  },

  submitBtn: {
    height: 56, marginBottom: 28,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },

  rulesCard: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 16,
    padding: 18, backgroundColor: Colors.primaryFaded,
  },
  rulesTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.textDark,
    marginBottom: 12, fontFamily: 'Poppins_700Bold',
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ruleDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.primary, marginRight: 10,
  },
  ruleText: { fontSize: 13, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },
});
