import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoDatePickerField from '../../../components/common/EkoDatePickerField';
import EkoSelectField, { OTHER_OPTION } from '../../../components/common/EkoSelectField';
import EkoButton from '../../../components/common/EkoButton';
import { RELATIONSHIP_OPTIONS } from '../../../constants';
import { isValidDate } from '../../../utils/format';
import { useAddDependent, useDependents, useRemoveDependent } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function AddDependentScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [relation, setRelation] = useState('');
  const [relationOther, setRelationOther] = useState('');
  const { data: dependents = [] } = useDependents();
  const addDependent = useAddDependent();
  const removeDependent = useRemoveDependent();

  const confirmRemove = (id: string, name: string) => {
    Alert.alert(t('account.removeDependentTitle'), t('account.removeDependentBody', { name }), [
      { text: t('account.keep'), style: 'cancel' },
      {
        text: t('account.remove'),
        style: 'destructive',
        onPress: () =>
          removeDependent.mutate(id, {
            onError: (err) =>
              Alert.alert(t('account.couldNotRemove'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
          }),
      },
    ]);
  };

  const save = async () => {
    if (!firstName.trim()) return Alert.alert('', t('account.enterFirstName'));
    if (!lastName.trim()) return Alert.alert('', t('account.enterLastName'));
    if (!dob.trim()) return Alert.alert('', t('account.enterDob'));
    if (!isValidDate(dob, { allowFuture: false })) {
      return Alert.alert('', t('account.validDob'));
    }
    const relationship = relation === OTHER_OPTION ? relationOther.trim() : relation.trim();
    if (relation === OTHER_OPTION && !relationship) {
      return Alert.alert('', t('account.specifyRelationshipErr'));
    }
    try {
      await addDependent.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dob: dob.trim(),
        ...(relationship ? { relationship } : {}),
      });
      Alert.alert(t('auth.success'), t('account.dependentAddedFull'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert(t('account.couldNotAddDependent'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.dependentsTitle')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.info}>{t('account.dependentIntro')}</Text>

        {/* The saved list — without it, dependents would be write-only and the
            booking picker would have nothing to show. */}
        {dependents.length > 0 && (
          <View style={styles.list}>
            <Text style={styles.listTitle}>{t('account.yourDependents')}</Text>
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
                  accessibilityRole="button"
                  accessibilityLabel={t('account.remove')}
                >
                  <FontAwesome name="trash-o" size={18} color={Colors.red} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.formTitle}>{t('account.addSomeoneNew')}</Text>
        <EkoTextField label={t('account.firstName')} placeholder={t('account.firstNamePlaceholder')} icon="user" value={firstName} onChangeText={setFirstName} />
        <EkoTextField label={t('account.lastName')} placeholder={t('account.lastNamePlaceholder')} icon="user" value={lastName} onChangeText={setLastName} />
        <EkoDatePickerField label={t('account.dobLabel')} value={dob} onChangeText={setDob} disableFuture />
        <EkoSelectField
          label={t('account.relationshipLabel')}
          icon="heart"
          placeholder={t('account.selectRelationship')}
          options={RELATIONSHIP_OPTIONS}
          value={relation}
          onSelect={setRelation}
          allowOther
          otherValue={relationOther}
          onChangeOther={setRelationOther}
          otherPlaceholder={t('account.specifyRelationship')}
        />
        <EkoButton title={t('account.addDependentBtn')} variant="accent" onPress={save} loading={addDependent.isPending} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  info: { fontSize: 14, color: Colors.textMedium, lineHeight: 20, marginBottom: 20, backgroundColor: Colors.primaryFaded, borderRadius: 10, padding: 14 },

  list: { marginBottom: 24 },
  listTitle: { fontSize: 13, fontWeight: '700', color: Colors.textGray, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.6 },
  depRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 12, padding: 12, marginBottom: 8,
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
