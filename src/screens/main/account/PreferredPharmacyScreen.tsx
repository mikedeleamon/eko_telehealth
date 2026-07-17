import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';
import { usePharmacy, useSavePharmacy } from '../../../hooks/queries';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function PreferredPharmacyScreen({ navigation }: Props) {
  const { data: existing } = usePharmacy();
  const savePharmacy = useSavePharmacy();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [fax, setFax] = useState('');

  // Prefill from the saved preference; the form used to always open blank.
  useEffect(() => {
    if (existing) {
      setName(existing.name ?? '');
      setAddress(existing.address);
      setFax(existing.fax);
    }
  }, [existing]);

  const save = async () => {
    if (!name.trim()) return Alert.alert('', 'Please enter pharmacy name.');
    if (!address.trim()) return Alert.alert('', 'Please enter pharmacy address.');
    if (!fax.trim()) return Alert.alert('', 'Please enter pharmacy fax number.');
    try {
      await savePharmacy.mutateAsync({ name: name.trim(), address: address.trim(), fax: fax.trim() });
      Alert.alert('Saved', 'Pharmacy preference saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Preferred Pharmacy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <EkoTextField label="Pharmacy Name" placeholder="Pharmacy name" icon="medkit" value={name} onChangeText={setName} />
        <EkoTextField label="Address" placeholder="Full address" icon="map-marker" value={address} onChangeText={setAddress} />
        <EkoTextField label="Fax Number" placeholder="Fax number" icon="fax" value={fax} onChangeText={setFax} keyboardType="phone-pad" />
        <EkoButton title="Save Pharmacy" variant="accent" onPress={save} loading={savePharmacy.isPending} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  btn: { marginTop: 8 },
});
