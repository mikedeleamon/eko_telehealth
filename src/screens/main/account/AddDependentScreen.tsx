import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoDatePickerField from '../../../components/common/EkoDatePickerField';
import EkoSelectField, { OTHER_OPTION } from '../../../components/common/EkoSelectField';
import EkoButton from '../../../components/common/EkoButton';
import { RELATIONSHIP_OPTIONS } from '../../../constants';
import { isValidDate } from '../../../utils/format';
import { useAddDependent, useDependents, useRemoveDependent } from '../../../hooks/queries';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function AddDependentScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [relation, setRelation] = useState('');
  const [relationOther, setRelationOther] = useState('');
  const { data: dependents = [] } = useDependents();
  const addDependent = useAddDependent();
  const removeDependent = useRemoveDependent();

  const confirmRemove = (id: string, name: string) => {
    Alert.alert('Remove dependent?', `${name} will no longer be bookable from your account.`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          removeDependent.mutate(id, {
            onError: (err) =>
              Alert.alert('Could not remove', err instanceof Error ? err.message : 'Please try again.'),
          }),
      },
    ]);
  };

  const save = async () => {
    if (!firstName.trim()) return Alert.alert('', 'Please enter first name.');
    if (!lastName.trim()) return Alert.alert('', 'Please enter last name.');
    if (!dob.trim()) return Alert.alert('', 'Please enter date of birth.');
    if (!isValidDate(dob, { allowFuture: false })) {
      return Alert.alert('', 'Please enter a valid date of birth (DD-MM-YYYY).');
    }
    const relationship = relation === OTHER_OPTION ? relationOther.trim() : relation.trim();
    if (relation === OTHER_OPTION && !relationship) {
      return Alert.alert('', 'Please specify the relationship.');
    }
    try {
      await addDependent.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob.trim(),
        ...(relationship ? { relationship } : {}),
      });
      Alert.alert('Success', 'Dependent added successfully.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Could not add dependent', err instanceof Error ? err.message : 'Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Dependents" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.info}>Add a family member or dependent to manage their healthcare appointments.</Text>

        {/* The saved list — without it, dependents would be write-only and the
            booking picker would have nothing to show. */}
        {dependents.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.listTitle}>Your dependents</Text>
            {dependents.map((d) => (
              <View key={d.id} style={styles.depRow}>
                <View style={styles.depAvatar}>
                  <FontAwesome name="user" size={16} color={Colors.primary} />
                </View>
                <View style={styles.depInfo}>
                  <Text style={styles.depName}>{d.firstName} {d.lastName}</Text>
                  <Text style={styles.depMeta}>
                    {d.relationship ? `${d.relationship} · ` : ''}{d.dob}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmRemove(d.id, `${d.firstName} ${d.lastName}`)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <FontAwesome name="trash-o" size={18} color={Colors.red} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.formTitle}>Add someone new</Text>
        <EkoTextField label="First Name" placeholder="First name" icon="user" value={firstName} onChangeText={setFirstName} />
        <EkoTextField label="Last Name" placeholder="Last name" icon="user" value={lastName} onChangeText={setLastName} />
        <EkoDatePickerField label="Date of Birth" value={dob} onChangeText={setDob} disableFuture />
        <EkoSelectField
          label="Relationship"
          icon="heart"
          placeholder="Select relationship"
          options={RELATIONSHIP_OPTIONS}
          value={relation}
          onSelect={setRelation}
          allowOther
          otherValue={relationOther}
          onChangeOther={setRelationOther}
          otherPlaceholder="Specify relationship"
        />
        <EkoButton title="Add Dependent" variant="accent" onPress={save} loading={addDependent.isPending} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  info: { fontSize: 14, color: Colors.textMedium, lineHeight: 20, marginBottom: 20, backgroundColor: Colors.primaryFaded, borderRadius: 10, padding: 14 },

  list: { marginBottom: 24 },
  listTitle: { fontSize: 13, fontWeight: '700', color: Colors.textGray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  depRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: 12, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  depAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  depInfo: { flex: 1 },
  depName: { fontSize: 14, fontWeight: '600', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  depMeta: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },

  formTitle: { fontSize: 13, fontWeight: '700', color: Colors.textGray, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.6 },
  btn: { marginTop: 8 },
});
