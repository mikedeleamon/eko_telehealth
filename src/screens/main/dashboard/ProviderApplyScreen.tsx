import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';
import { api } from '../../../api';
import { queryKeys } from '../../../hooks/queries';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/**
 * Provider application form.
 *
 * Submitting does NOT make the account bookable — an admin reviews it and
 * approval is what creates the doctor profile. Vetting is the point: an
 * unreviewed stranger must never be bookable as a doctor.
 */
export default function ProviderApplyScreen({ navigation }: Props) {
  const [specialty, setSpecialty] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [fee, setFee] = useState('');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const submit = async () => {
    if (specialty.trim().length < 2) return Alert.alert('', 'Enter your specialty, e.g. "Cardiologist".');
    if (category.trim().length < 2) return Alert.alert('', 'Enter the category patients search by, e.g. "Cardiology".');
    if (location.trim().length < 2) return Alert.alert('', 'Enter your practice location.');
    if (!fee.trim()) return Alert.alert('', 'Enter your consultation fee, e.g. "₦15,000".');

    setLoading(true);
    try {
      await api.providers.apply({
        specialty: specialty.trim(),
        category: category.trim(),
        location: location.trim(),
        fee: fee.trim(),
      });
      qc.invalidateQueries({ queryKey: queryKeys.providerState });
      Alert.alert(
        'Application Submitted',
        "We'll review your details and notify you. Patients can book you as soon as you're approved.",
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert('Could not submit', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <EkoHeader title="Provider Application" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Tell us about your practice. Our team verifies every provider before their profile goes live.
        </Text>

        <EkoTextField
          label="Specialty"
          placeholder="e.g. Cardiologist, Internal Medicine"
          icon="stethoscope"
          value={specialty}
          onChangeText={setSpecialty}
        />
        <EkoTextField
          label="Category"
          placeholder="e.g. Cardiology — how patients search"
          icon="tags"
          value={category}
          onChangeText={setCategory}
        />
        <EkoTextField
          label="Location"
          placeholder="e.g. Victoria Island, Lagos"
          icon="map-marker"
          value={location}
          onChangeText={setLocation}
        />
        <EkoTextField
          label="Consultation Fee"
          placeholder="e.g. ₦15,000"
          icon="money"
          value={fee}
          onChangeText={setFee}
        />

        <EkoButton title="Submit Application" variant="accent" onPress={submit} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  intro: {
    fontSize: 13, color: Colors.textGray, lineHeight: 20,
    marginBottom: 20, fontFamily: 'Poppins_400Regular',
  },
  btn: { marginTop: 8 },
});
