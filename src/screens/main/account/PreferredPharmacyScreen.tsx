import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';
import { sanitizePhoneInput, isValidPhone } from '../../../utils/format';
import { usePharmacy, useSavePharmacy } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function PreferredPharmacyScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
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
    if (!name.trim()) return Alert.alert('', t('account.enterPharmacyName'));
    if (!address.trim()) return Alert.alert('', t('account.enterPharmacyAddress'));
    if (!fax.trim()) return Alert.alert('', t('account.enterPharmacyFax'));
    if (!isValidPhone(fax)) return Alert.alert('', t('account.validFax'));
    try {
      await savePharmacy.mutateAsync({ name: name.trim(), address: address.trim(), fax: fax.trim() });
      Alert.alert(t('account.saved'), t('account.pharmacySaved'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert(t('account.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.preferredPharmacy')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <EkoTextField label={t('account.pharmacyNameLabel')} placeholder={t('account.pharmacyNamePlaceholder')} icon="medkit" value={name} onChangeText={setName} />
        <EkoTextField label={t('account.addressLabel')} placeholder={t('account.fullAddress')} icon="map-marker" value={address} onChangeText={setAddress} />
        <EkoTextField label={t('account.faxNumber')} placeholder={t('account.faxNumberPlaceholder')} icon="fax" value={fax} onChangeText={(val) => setFax(sanitizePhoneInput(val))} keyboardType="phone-pad" />
        <EkoButton title={t('account.savePharmacy')} variant="accent" onPress={save} loading={savePharmacy.isPending} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  btn: { marginTop: 8 },
});
