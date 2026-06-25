import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import SCHeader from '../../../components/common/SCHeader';
import SCTextField from '../../../components/common/SCTextField';
import SCButton from '../../../components/common/SCButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function AddDependentScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [relation, setRelation] = useState('');
  const [loading, setLoading] = useState(false);

  const save = () => {
    if (!firstName.trim()) return Alert.alert('', 'Please enter first name.');
    if (!lastName.trim()) return Alert.alert('', 'Please enter last name.');
    if (!dob.trim()) return Alert.alert('', 'Please enter date of birth.');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Success', 'Dependent added successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <SCHeader title="Add Dependent" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.info}>Add a family member or dependent to manage their healthcare appointments.</Text>
        <SCTextField label="First Name" placeholder="First name" icon="user" value={firstName} onChangeText={setFirstName} />
        <SCTextField label="Last Name" placeholder="Last name" icon="user" value={lastName} onChangeText={setLastName} />
        <SCTextField label="Date of Birth" placeholder="DD-MM-YYYY" icon="calendar" value={dob} onChangeText={setDob} />
        <SCTextField label="Relationship" placeholder="e.g. Child, Parent, Spouse" icon="heart" value={relation} onChangeText={setRelation} />
        <SCButton title="Add Dependent" variant="accent" onPress={save} loading={loading} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  info: { fontSize: 14, color: Colors.textMedium, lineHeight: 20, marginBottom: 20, backgroundColor: Colors.primaryFaded, borderRadius: 10, padding: 14 },
  btn: { marginTop: 8 },
});
