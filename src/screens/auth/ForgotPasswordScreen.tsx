import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import SheetModal from '../../components/common/SheetModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { api } from '../../api';
import { useTranslation } from '../../i18n/useTranslation';
import EkoTextField from '../../components/common/EkoTextField';
import EkoButton from '../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      // Always 200 from the backend (it never reveals whether the email is
      // registered), so the error modal only shows on network failure.
      await api.auth.requestPasswordReset(email.trim());
      navigation.navigate('VerifyEmail', { reset: true, email: email.trim() });
    } catch {
      setErrorEmail(email);
      setShowError(true);
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('a11y.back')}>
            <FontAwesome name="arrow-left" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{t('auth.forgotPasswordTitle')}</Text>
          <Text style={styles.subtitle}>{t('auth.forgotRegisteredEmail')}</Text>

          {/* Email field */}
          <EkoTextField
            pill
            icon="envelope-o"
            placeholder={t('auth.emailAddress')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
          />

          <EkoButton
            title={t('auth.sendResetLink')}
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitBtn}
          />
        </View>
      </View>

      {/* Error Modal */}
      <SheetModal visible={showError} variant="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowError(false)} accessibilityRole="button" accessibilityLabel={t('common.close')}>
              <FontAwesome name="times" size={14} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>{t('common.somethingWentWrong')}</Text>
            <Text style={styles.modalEmail}>{errorEmail}</Text>
            <Text style={styles.modalSub}>{t('auth.checkConnectionTryAgain')}</Text>

            <TouchableOpacity
              style={styles.tryAgainBtn}
              onPress={() => { setShowError(false); setEmail(''); }}
              activeOpacity={0.85}
            >
              <Text style={styles.tryAgainText}>{t('auth.tryAgain')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SheetModal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 24 },

  title: {
    fontSize: 26, fontWeight: '700', color: Colors.textDark,
    marginBottom: 10, fontFamily: 'Poppins_700Bold',
  },
  subtitle: {
    fontSize: 14, color: Colors.textGray, lineHeight: 22,
    marginBottom: 32, fontFamily: 'Poppins_400Regular',
  },

  submitBtn: {
    height: 56,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },

  // Error modal
  modalOverlay: {
    flex: 1,
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  modal: {
    backgroundColor: Colors.surface, borderRadius: 24,
    padding: 28, width: '100%', alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: -14, right: -14,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textDark,
    textAlign: 'center', marginBottom: 10, marginTop: 8,
    fontFamily: 'Poppins_700Bold',
  },
  modalEmail: {
    fontSize: 14, color: Colors.primary, fontWeight: '600',
    marginBottom: 8, fontFamily: 'Poppins_600SemiBold',
  },
  modalSub: {
    fontSize: 14, color: Colors.textGray, textAlign: 'center',
    marginBottom: 24, fontFamily: 'Poppins_400Regular',
  },
  tryAgainBtn: {
    backgroundColor: Colors.primary, borderRadius: 32, height: 50,
    paddingHorizontal: 48, alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  tryAgainText: { color: Colors.white, fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
