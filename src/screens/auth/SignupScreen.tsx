import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, StatusBar, Alert, Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { GENDER_OPTIONS } from '../../constants';
import { useTranslation } from '../../i18n/useTranslation';
import { api } from '../../api';
import CalendarSheet from '../../components/common/CalendarSheet';
import { sanitizePhoneInput, isValidPhone, maskDateInput, isValidDate } from '../../utils/format';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const criteria = (pw: string, t: (k: string) => string) => [
  { label: t('auth.crit8'), met: pw.length >= 8 },
  { label: t('auth.critMix'), met: /[a-zA-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw) },
  { label: t('auth.critNoSpace'), met: pw.length > 0 && !/\s/.test(pw) },
  { label: t('auth.critNotGuess'), met: pw.length >= 10 && /[a-zA-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw) },
];

export default function SignupScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [userType, setUserType] = useState<'Patient' | 'Doctor'>('Patient');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hipaaAccepted, setHipaaAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [genderModal, setGenderModal] = useState(false);
  const [dobCalendar, setDobCalendar] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);

  const validate = () => {
    if (!email.trim()) return t('auth.valEnterEmail');
    const emailRe = /^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!emailRe.test(email)) return t('auth.valValidEmail');
    if (email !== confirmEmail) return t('auth.valEmailsMatch');
    if (!password) return t('auth.valEnterPassword');
    if (password.length < 8) return t('auth.valMin8');
    if (!firstName.trim()) return t('auth.valEnterFirstName');
    if (!lastName.trim()) return t('auth.valEnterLastName');
    // Required here (though optional server-side, where seeded accounts have
    // none): it's the only way to reset this account's password by SMS.
    if (!isValidPhone(phone)) return t('auth.valValidMobile');
    if (!dob) return t('auth.valEnterDob');
    if (!isValidDate(dob, { allowFuture: false })) return t('auth.valValidDob');
    if (!gender) return t('auth.valSelectGender');
    if (!termsAccepted) return t('auth.valAcceptTerms');
    if (!hipaaAccepted) return t('auth.valAcceptHipaa');
    return null;
  };

  const handleSignup = async () => {
    const err = validate();
    if (err) return Alert.alert('', err);
    setLoading(true);
    try {
      // Records a pending signup only — no account exists until the emailed
      // code is verified on the next screen. Safe to come back and resubmit:
      // it replaces the pending signup rather than erroring as a duplicate.
      await api.auth.signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role: userType,
        phone: phone.trim(),
      });
      navigation.navigate('VerifyEmail', { email: email.trim() });
    } catch (err) {
      Alert.alert(t('auth.couldNotCreate'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  const pwCriteria = criteria(password, t);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('a11y.back')}>
          <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('auth.createAnAccount')}</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle */}
        <View style={styles.toggle}>
          {(['Patient', 'Doctor'] as const).map(role => (
            <TouchableOpacity
              key={role}
              style={[styles.toggleBtn, userType === role && styles.toggleBtnActive]}
              onPress={() => setUserType(role)}
              activeOpacity={0.8}
              accessibilityRole="radio"
              accessibilityState={{ selected: userType === role }}
            >
              <Text style={[styles.toggleText, userType === role && styles.toggleTextActive]}>{role === 'Patient' ? t('auth.loginAsPatient') : t('auth.loginAsDoctor')}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <AuthField icon="at" placeholder={t('auth.email')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <AuthField icon="at" placeholder={t('auth.confirmEmail')} value={confirmEmail} onChangeText={setConfirmEmail} keyboardType="email-address" autoCapitalize="none" />

        {/* Password with strength indicator */}
        <View style={[styles.field, pwFocused && styles.fieldFocused]}>
          <FontAwesome name="lock" size={18} color={pwFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
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
          <TouchableOpacity onPress={() => setShowPw(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name={showPw ? 'eye' : 'eye-slash'} size={18} color={Colors.textGray} />
          </TouchableOpacity>
        </View>

        {pwFocused && password.length > 0 && (
          <View style={styles.strengthPopup}>
            {pwCriteria.map((c, i) => (
              <View key={i} style={styles.criteriaRow}>
                <FontAwesome name={c.met ? 'check' : 'times'} size={12} color={c.met ? '#3FBE6E' : Colors.red} style={{ width: 16 }} />
                <Text style={styles.criteriaText}>{c.label}</Text>
              </View>
            ))}
          </View>
        )}

        <AuthField icon="user" placeholder={t('auth.firstName')} value={firstName} onChangeText={setFirstName} />
        <AuthField icon="user" placeholder={t('auth.lastName')} value={lastName} onChangeText={setLastName} />
        <AuthField icon="mobile" placeholder={t('auth.mobileNumber')} value={phone} onChangeText={(val: string) => setPhone(sanitizePhoneInput(val))} keyboardType="phone-pad" />

        {/* Date of birth — typeable (masked to DD-MM-YYYY) with a calendar shortcut */}
        <View style={[styles.field, dobFocused && styles.fieldFocused]}>
          <FontAwesome name="calendar" size={18} color={dobFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
          <TextInput
            style={styles.fieldInput}
            placeholder={t('auth.dobPlaceholder')}
            placeholderTextColor={Colors.textGray}
            accessibilityLabel={t('auth.dobTitle')}
            value={dob}
            onChangeText={(val) => setDob(maskDateInput(val))}
            onFocus={() => setDobFocused(true)}
            onBlur={() => setDobFocused(false)}
            keyboardType="number-pad"
            maxLength={10}
          />
          <TouchableOpacity onPress={() => setDobCalendar(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="calendar-o" size={18} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Gender picker */}
        <TouchableOpacity style={styles.field} onPress={() => setGenderModal(true)}>
          <FontAwesome name="venus-mars" size={18} color={Colors.textGray} style={styles.fieldIcon} />
          <Text style={[styles.fieldInput, !gender && { color: Colors.textGray }]}>{gender ? t(`options.gender.${gender}`) : t('auth.sex')}</Text>
          <FontAwesome name="chevron-down" size={13} color={Colors.textGray} />
        </TouchableOpacity>

        {/* Checkboxes */}
        <CheckRow
          checked={termsAccepted}
          onToggle={() => setTermsAccepted(v => !v)}
          label={t('auth.termsPrefix')}
          linkText={t('auth.termsLink')}
        />
        <CheckRow
          checked={hipaaAccepted}
          onToggle={() => setHipaaAccepted(v => !v)}
          label={t('auth.termsPrefix')}
          linkText={t('auth.hipaaLink')}
        />

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>{loading ? t('auth.creatingAccount') : t('auth.saveAndContinue')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <CalendarSheet
        visible={dobCalendar}
        value={dob}
        onSelect={setDob}
        onClose={() => setDobCalendar(false)}
        disableFuture
        title={t('auth.dobTitle')}
      />

      <Modal visible={genderModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setGenderModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>{t('auth.selectGender')}</Text>
            {GENDER_OPTIONS.map(g => (
              <TouchableOpacity key={g} style={styles.modalOption} onPress={() => { setGender(g); setGenderModal(false); }} accessibilityRole="radio" accessibilityState={{ selected: gender === g }}>
                <FontAwesome name={gender === g ? 'dot-circle-o' : 'circle-o'} size={20} color={gender === g ? Colors.accent : Colors.textGray} />
                <Text style={styles.modalOptionText}>{t(`options.gender.${g}`)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function AuthField({ icon, ...props }: any) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, focused && styles.fieldFocused]}>
      <FontAwesome name={icon} size={18} color={focused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
      <TextInput
        style={styles.fieldInput}
        placeholderTextColor={Colors.textGray}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

function CheckRow({ checked, onToggle, label, linkText }: { checked: boolean; onToggle: () => void; label: string; linkText: string }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <FontAwesome name="check" size={11} color={Colors.white} />}
      </View>
      <Text style={styles.checkText}>
        {label}
        <Text style={styles.checkLink}>{linkText}</Text>
      </Text>
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.surface,
  },
  headerTitle: {
    flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700',
    color: Colors.textDark, fontFamily: 'Poppins_700Bold',
  },
  content: { paddingHorizontal: 24, paddingTop: 8 },

  toggle: {
    flexDirection: 'row', borderWidth: 1.5, borderColor: Colors.accent,
    borderRadius: 32, overflow: 'hidden', marginBottom: 20,
  },
  toggleBtn: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: Colors.accent },
  toggleText: { fontSize: 14, fontWeight: '600', color: Colors.accent, fontFamily: 'Poppins_600SemiBold' },
  toggleTextActive: { color: Colors.white },

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.field, borderRadius: 32,
    paddingHorizontal: 20, height: 54,
    marginBottom: 14, borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.accent, backgroundColor: Colors.surface },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  strengthPopup: {
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: 12, marginTop: -8, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.borderGray,
    shadowColor: Colors.shadowCard, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 6, elevation: 3,
  },
  criteriaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  criteriaText: { fontSize: 12, color: Colors.textMedium, flex: 1, fontFamily: 'Poppins_400Regular' },

  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 },
  checkbox: {
    width: 22, height: 22, borderRadius: 4,
    borderWidth: 2, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  checkText: { flex: 1, fontSize: 13, color: Colors.textGray, lineHeight: 20, fontFamily: 'Poppins_400Regular' },
  checkLink: { color: Colors.accent, fontWeight: '600' },

  submitBtn: {
    backgroundColor: Colors.accent, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitBtnText: {
    color: Colors.white, fontSize: 15, fontWeight: '700',
    letterSpacing: 0.8, fontFamily: 'Poppins_700Bold',
  },

  modalOverlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 20, fontFamily: 'Poppins_700Bold' },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  modalOptionText: { fontSize: 16, color: Colors.textDark, marginLeft: 14, fontFamily: 'Poppins_400Regular' },
});
