import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoSelectField, { OTHER_OPTION } from '../../../components/common/EkoSelectField';
import EkoButton from '../../../components/common/EkoButton';
import { INSURANCE_PROVIDER_OPTIONS } from '../../../constants';
import { useInsurance, useSaveInsurance } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function InsuranceScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
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
    if (!resolvedProvider) return Alert.alert('', t('account.selectEnterProvider'));
    if (!memberId.trim()) return Alert.alert('', t('account.enterMemberId'));
    try {
      await saveInsurance.mutateAsync({
        provider: resolvedProvider,
        memberId: memberId.trim(),
        ...(groupNumber.trim() ? { groupNumber: groupNumber.trim() } : {}),
      });
      Alert.alert(t('account.saved'), t('account.insuranceSaved'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert(t('account.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.insurance')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.iconCard}>
          <FontAwesome name="shield" size={40} color={Colors.primary} />
          <Text style={styles.iconLabel}>{t('account.insuranceInformation')}</Text>
        </View>
        <EkoSelectField
          label={t('account.insuranceProvider')}
          icon="building"
          placeholder={t('account.selectProvider')}
          options={INSURANCE_PROVIDER_OPTIONS}
          value={provider}
          onSelect={setProvider}
          allowOther
          otherValue={providerOther}
          onChangeOther={setProviderOther}
          otherPlaceholder={t('account.enterProviderName')}
        />
        <EkoTextField label={t('account.memberId')} placeholder={t('account.yourMemberId')} icon="id-card-o" value={memberId} onChangeText={setMemberId} />
        <EkoTextField label={t('account.groupNumber')} placeholder={t('account.groupNumberOptional')} icon="users" value={groupNumber} onChangeText={setGroupNumber} />
        <EkoButton title={t('account.saveInsuranceInfo')} variant="accent" onPress={save} loading={saveInsurance.isPending} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  iconCard: { alignItems: 'center', backgroundColor: Colors.primaryFaded, borderRadius: 16, padding: 24, marginBottom: 24 },
  iconLabel: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginTop: 12 },
  btn: { marginTop: 8 },
});
