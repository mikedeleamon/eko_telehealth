import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Modal, StatusBar, KeyboardAvoidingView, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [emailFocused, setEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorEmail, setErrorEmail] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = () => {
    if (!email.trim()) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Mock: simulate wrong email for demo
      if (!email.endsWith('@ekotelehealth.com') && !email.includes('test')) {
        setErrorEmail(email);
        setShowError(true);
      } else {
        navigation.navigate('VerifyEmail', { reset: true });
      }
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>Please enter your registered email address to receive a reset link</Text>

          {/* Email field */}
          <View style={[styles.field, emailFocused && styles.fieldFocused]}>
            <FontAwesome name="envelope-o" size={17} color={emailFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Email address"
              placeholderTextColor={Colors.textGray}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>{loading ? 'SENDING...' : 'SEND RESET LINK'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Error Modal */}
      <Modal visible={showError} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowError(false)}>
              <FontAwesome name="times" size={14} color={Colors.white} />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Sorry , This Email Address not found</Text>
            <Text style={styles.modalEmail}>{errorEmail}</Text>
            <Text style={styles.modalSub}>Please use the Registered Email Address</Text>

            <TouchableOpacity
              style={styles.tryAgainBtn}
              onPress={() => { setShowError(false); setEmail(''); }}
              activeOpacity={0.85}
            >
              <Text style={styles.tryAgainText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
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

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F6FA', borderRadius: 32,
    paddingHorizontal: 20, height: 56,
    marginBottom: 24, borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.accent, backgroundColor: Colors.white },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  submitBtn: {
    backgroundColor: Colors.accent, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitBtnText: {
    color: Colors.white, fontSize: 16, fontWeight: '700',
    letterSpacing: 0.8, fontFamily: 'Poppins_700Bold',
  },

  // Error modal
  modalOverlay: {
    flex: 1, backgroundColor: Colors.overlay,
    alignItems: 'center', justifyContent: 'center', padding: 28,
  },
  modal: {
    backgroundColor: Colors.white, borderRadius: 24,
    padding: 28, width: '100%', alignItems: 'center',
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute', top: -14, right: -14,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textDark,
    textAlign: 'center', marginBottom: 10, marginTop: 8,
    fontFamily: 'Poppins_700Bold',
  },
  modalEmail: {
    fontSize: 14, color: Colors.accent, fontWeight: '600',
    marginBottom: 8, fontFamily: 'Poppins_600SemiBold',
  },
  modalSub: {
    fontSize: 14, color: Colors.textGray, textAlign: 'center',
    marginBottom: 24, fontFamily: 'Poppins_400Regular',
  },
  tryAgainBtn: {
    backgroundColor: Colors.accent, borderRadius: 32, height: 50,
    paddingHorizontal: 48, alignItems: 'center', justifyContent: 'center', width: '100%',
  },
  tryAgainText: { color: Colors.white, fontSize: 15, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
});
