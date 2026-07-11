import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function InsuranceScreen({ navigation }: Props) {
  const [provider, setProvider] = useState('');
  const [memberId, setMemberId] = useState('');
  const [groupNumber, setGroupNumber] = useState('');
  const [loading, setLoading] = useState(false);

  const save = () => {
    if (!provider.trim()) return Alert.alert('', 'Please enter insurance provider.');
    if (!memberId.trim()) return Alert.alert('', 'Please enter member ID.');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Saved', 'Insurance information saved.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Insurance" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconCard}>
          <FontAwesome name="shield" size={40} color={Colors.primary} />
          <Text style={styles.iconLabel}>Insurance Information</Text>
        </View>
        <EkoTextField label="Insurance Provider" placeholder="e.g. Blue Cross Blue Shield" icon="building" value={provider} onChangeText={setProvider} />
        <EkoTextField label="Member ID" placeholder="Your member ID" icon="id-card-o" value={memberId} onChangeText={setMemberId} />
        <EkoTextField label="Group Number" placeholder="Group number (optional)" icon="users" value={groupNumber} onChangeText={setGroupNumber} />
        <EkoButton title="Save Insurance Info" variant="accent" onPress={save} loading={loading} style={styles.btn} />
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
