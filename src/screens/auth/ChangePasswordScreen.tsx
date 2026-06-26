import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../context/AuthContext';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function ChangePasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isLoggedIn } = useAuth();
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [newFocused, setNewFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = () => {
    if (!newPass) return Alert.alert('', 'Please enter a new password.');
    if (newPass.length < 8) return Alert.alert('', 'Password must be at least 8 characters.');
    if (newPass !== confirmPass) return Alert.alert('', 'Passwords do not match.');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Your password has been updated.', [
        // Logged-in users (Account / Settings) just return; the reset flow returns to Login.
        { text: 'OK', onPress: () => (isLoggedIn ? navigation.goBack() : navigation.navigate('Login')) },
      ]);
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <FontAwesome name="arrow-left" size={20} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>Change Password</Text>
          <Text style={styles.subtitle}>Please Create your new password</Text>

          {/* New password */}
          <View style={[styles.field, newFocused && styles.fieldFocused]}>
            <FontAwesome name="lock" size={18} color={newFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              placeholder="New Password"
              placeholderTextColor={Colors.textGray}
              value={newPass}
              onChangeText={setNewPass}
              onFocus={() => setNewFocused(true)}
              onBlur={() => setNewFocused(false)}
              secureTextEntry={!showNew}
            />
            <TouchableOpacity onPress={() => setShowNew(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name={showNew ? 'eye' : 'eye-slash'} size={18} color={Colors.textGray} />
            </TouchableOpacity>
          </View>

          {/* Confirm password */}
          <View style={[styles.field, confirmFocused && styles.fieldFocused]}>
            <FontAwesome name="lock" size={18} color={confirmFocused ? Colors.accent : Colors.textGray} style={styles.fieldIcon} />
            <TextInput
              style={styles.fieldInput}
              placeholder="Confirm Password"
              placeholderTextColor={Colors.textGray}
              value={confirmPass}
              onChangeText={setConfirmPass}
              onFocus={() => setConfirmFocused(true)}
              onBlur={() => setConfirmFocused(false)}
              secureTextEntry={!showConfirm}
            />
            <TouchableOpacity onPress={() => setShowConfirm(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <FontAwesome name={showConfirm ? 'eye' : 'eye-slash'} size={18} color={Colors.textGray} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handle} disabled={loading} activeOpacity={0.85}>
            <Text style={styles.submitBtnText}>{loading ? 'UPDATING...' : 'CHANGE PASSWORD'}</Text>
          </TouchableOpacity>

          {/* Password rules card */}
          <View style={styles.rulesCard}>
            <Text style={styles.rulesTitle}>Password Rules</Text>
            {[
              'Has at least 8 characters',
              'Has letters, numbers, and special characters',
              'Has no white space',
              'Not easy to guess',
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

const styles = StyleSheet.create({
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

  field: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F5F6FA', borderRadius: 32,
    paddingHorizontal: 20, height: 56, marginBottom: 16,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  fieldFocused: { borderColor: Colors.accent, backgroundColor: Colors.white },
  fieldIcon: { marginRight: 12 },
  fieldInput: { flex: 1, fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  submitBtn: {
    backgroundColor: Colors.accent, borderRadius: 32, height: 56,
    alignItems: 'center', justifyContent: 'center', marginBottom: 28,
    shadowColor: Colors.accent, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitBtnText: {
    color: Colors.white, fontSize: 15, fontWeight: '700',
    letterSpacing: 0.8, fontFamily: 'Poppins_700Bold',
  },

  rulesCard: {
    borderWidth: 1.5, borderColor: Colors.accent, borderRadius: 16,
    padding: 18, backgroundColor: '#FFF5F2',
  },
  rulesTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.textDark,
    marginBottom: 12, fontFamily: 'Poppins_700Bold',
  },
  ruleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  ruleDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.accent, marginRight: 10,
  },
  ruleText: { fontSize: 13, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },
});
