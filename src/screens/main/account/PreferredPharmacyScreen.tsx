import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function PreferredPharmacyScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [fax, setFax] = useState('');
  const [loading, setLoading] = useState(false);

  const save = () => {
    if (!name.trim()) return Alert.alert('', 'Please enter pharmacy name.');
    if (!address.trim()) return Alert.alert('', 'Please enter pharmacy address.');
    if (!fax.trim()) return Alert.alert('', 'Please enter pharmacy fax number.');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Saved', 'Pharmacy preference saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Preferred Pharmacy" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <EkoTextField label="Pharmacy Name" placeholder="Pharmacy name" icon="medkit" value={name} onChangeText={setName} />
        <EkoTextField label="Address" placeholder="Full address" icon="map-marker" value={address} onChangeText={setAddress} />
        <EkoTextField label="Fax Number" placeholder="Fax number" icon="fax" value={fax} onChangeText={setFax} keyboardType="phone-pad" />
        <EkoButton title="Save Pharmacy" variant="accent" onPress={save} loading={loading} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  btn: { marginTop: 8 },
});
