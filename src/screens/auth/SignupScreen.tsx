import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, TextInput, StatusBar, Alert, Modal,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { GENDER_OPTIONS } from '../../constants';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const criteria = (pw: string) => [
  { label: 'Has at least 8 characters', met: pw.length >= 8 },
  { label: 'Has letters, numbers, and special characters', met: /[a-zA-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw) },
  { label: 'Has no white space characters', met: pw.length > 0 && !/\s/.test(pw) },
  { label: 'Not easy to guess', met: pw.length >= 10 && /[a-zA-Z]/.test(pw) && /\d/.test(pw) && /[^a-zA-Z0-9]/.test(pw) },
];

export default function SignupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [userType, setUserType] = useState<'Patient' | 'Doctor'>('Patient');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [hipaaAccepted, setHipaaAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [genderModal, setGenderModal] = useState(false);

  const validate = () => {
    if (!email.trim()) return 'Please enter your email address.';
    const emailRe = /^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/;
    if (!emailRe.test(email)) return 'Please enter a valid email address.';
    if (email !== confirmEmail) return 'Email addresses must match.';
    if (!password) return 'Please enter a password.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!firstName.trim()) return 'Please enter your first name.';
    if (!lastName.trim()) return 'Please enter your last name.';
    if (!dob) return 'Please enter your date of birth.';
    if (!gender) return 'Please select your gender.';
    if (!termsAccepted) return 'Please accept the Terms of Use.';
    if (!hipaaAccepted) return 'Please accept the HIPAA authorization.';
    return null;
  };

  const handleSignup = () => {
    const err = validate();
    if (err) return Alert.alert('', err);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('VerifyEmail');
    }, 1200);
  };

  const pwCriteria = criteria(password);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create an Account</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle */}
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

        <AuthField icon="at" placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <AuthField icon="at" placeholder="Confirm Email" value={confirmEmail} onChangeText={setConfirmEmail} keyboardType="email-address" autoCapitalize="none" />

        {/* Password with strength indicator */}
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

        <AuthField icon="user" placeholder="First Name" value={firstName} onChangeText={setFirstName} />
        <AuthField icon="user" placeholder="Last Name" value={lastName} onChangeText={setLastName} />
        <AuthField icon="calendar" placeholder="Date of Birth (DD-MM-YYYY)" value={dob} onChangeText={setDob} keyboardType="numbers-and-punctuation" />

        {/* Gender picker */}
        <TouchableOpacity style={styles.field} onPress={() => setGenderModal(true)}>
          <FontAwesome name="venus-mars" size={18} color={Colors.textGray} style={styles.fieldIcon} />
          <Text style={[styles.fieldInput, !gender && { color: Colors.textGray }]}>{gender || 'Sex'}</Text>
          <FontAwesome name="chevron-down" size={13} color={Colors.textGray} />
        </TouchableOpacity>

        {/* Checkboxes */}
        <CheckRow
          checked={termsAccepted}
          onToggle={() => setTermsAccepted(v => !v)}
          label="I have read and accept Eko Telehealth "
          linkText="Terms of Use and Privacy Policy"
        />
        <CheckRow
          checked={hipaaAccepted}
          onToggle={() => setHipaaAccepted(v => !v)}
          label="I have read and accept Eko Telehealth "
          linkText="HIPAA authorization"
        />

        {/* Submit */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSignup} disabled={loading} activeOpacity={0.85}>
          <Text style={styles.submitBtnText}>{loading ? 'CREATING ACCOUNT...' : 'SAVE AND CONTINUE'}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={genderModal} transparent animationType="slide">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setGenderModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Gender</Text>
            {GENDER_OPTIONS.map(g => (
              <TouchableOpacity key={g} style={styles.modalOption} onPress={() => { setGender(g); setGenderModal(false); }}>
                <FontAwesome name={gender === g ? 'dot-circle-o' : 'circle-o'} size={20} color={gender === g ? Colors.accent : Colors.textGray} />
                <Text style={styles.modalOptionText}>{g}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function AuthField({ icon, ...props }: any) {
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 16,
    backgroundColor: Colors.white,
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
    backgroundColor: '#F5F6FA', borderRadius: 32,
    paddingHorizontal: 20, height: 54,
    marginBottom: 14, borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.accent, backgroundColor: Colors.white },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  strengthPopup: {
    backgroundColor: Colors.white, borderRadius: 12,
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
    backgroundColor: Colors.white, borderTopLeftRadius: 28,
    borderTopRightRadius: 28, padding: 28, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textDark, marginBottom: 20, fontFamily: 'Poppins_700Bold' },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  modalOptionText: { fontSize: 16, color: Colors.textDark, marginLeft: 14, fontFamily: 'Poppins_400Regular' },
});
