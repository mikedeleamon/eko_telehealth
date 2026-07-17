import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoSelectField, { OTHER_OPTION } from '../../../components/common/EkoSelectField';
import EkoButton from '../../../components/common/EkoButton';
import { INSURANCE_PROVIDER_OPTIONS } from '../../../constants';
import { useInsurance, useSaveInsurance } from '../../../hooks/queries';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function InsuranceScreen({ navigation }: Props) {
  const { data: existing } = useInsurance();
  const saveInsurance = useSaveInsurance();
  const [provider, setProvider] = useState('');
  const [providerOther, setProviderOther] = useState('');
  const [memberId, setMemberId] = useState('');
  const [groupNumber, setGroupNumber] = useState('');

  // Prefill once the saved record arrives — the form previously always opened
  // blank, so a saved record looked lost. A saved provider that isn't in the
  // preset list is restored through the "Other" free-text field.
  useEffect(() => {
    if (existing) {
      if (INSURANCE_PROVIDER_OPTIONS.includes(existing.provider)) {
        setProvider(existing.provider);
      } else {
        setProvider(OTHER_OPTION);
        setProviderOther(existing.provider);
      }
      setMemberId(existing.memberId);
      setGroupNumber(existing.groupNumber ?? '');
    }
  }, [existing]);

  const save = async () => {
    const resolvedProvider = provider === OTHER_OPTION ? providerOther.trim() : provider.trim();
    if (!resolvedProvider) return Alert.alert('', 'Please select or enter your insurance provider.');
    if (!memberId.trim()) return Alert.alert('', 'Please enter member ID.');
    try {
      await saveInsurance.mutateAsync({
        provider: resolvedProvider,
        memberId: memberId.trim(),
        ...(groupNumber.trim() ? { groupNumber: groupNumber.trim() } : {}),
      });
      Alert.alert('Saved', 'Insurance information saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Insurance" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconCard}>
          <FontAwesome name="shield" size={40} color={Colors.primary} />
          <Text style={styles.iconLabel}>Insurance Information</Text>
        </View>
        <EkoSelectField
          label="Insurance Provider"
          icon="building"
          placeholder="Select your provider"
          options={INSURANCE_PROVIDER_OPTIONS}
          value={provider}
          onSelect={setProvider}
          allowOther
          otherValue={providerOther}
          onChangeOther={setProviderOther}
          otherPlaceholder="Enter provider name"
        />
        <EkoTextField label="Member ID" placeholder="Your member ID" icon="id-card-o" value={memberId} onChangeText={setMemberId} />
        <EkoTextField label="Group Number" placeholder="Group number (optional)" icon="users" value={groupNumber} onChangeText={setGroupNumber} />
        <EkoButton title="Save Insurance Info" variant="accent" onPress={save} loading={saveInsurance.isPending} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  iconCard: { alignItems: 'center', backgroundColor: Colors.primaryFaded, borderRadius: 16, padding: 24, marginBottom: 24 },
  iconLabel: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginTop: 12 },
  btn: { marginTop: 8 },
});
