import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';
import { sanitizePhoneInput, isValidPhone } from '../../../utils/format';
import { usePharmacy, usePharmacyDirectory, useSavePharmacy } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { PharmacyInput } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/**
 * A patient's preferred pharmacy — either picked from the admin-curated
 * directory (Batch 3 Phase 3, in-network) or entered free text for one
 * that isn't in the directory (out-of-network fallback, never blocked on a
 * pharmacy being onboarded first).
 */
export default function PreferredPharmacyScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: existing } = usePharmacy();
  const { data: directory = [] } = usePharmacyDirectory();
  const savePharmacy = useSavePharmacy();
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [fax, setFax] = useState('');

  // Prefill from the saved preference; the form used to always open blank.
  useEffect(() => {
    if (existing) {
      setSelectedPharmacyId(existing.pharmacyId ?? null);
      setName(existing.name ?? '');
      setAddress(existing.address);
      setFax(existing.fax);
    }
  }, [existing]);

  const selectDirectoryPharmacy = (id: string) => {
    const pharmacy = directory.find((p) => p.id === id);
    if (!pharmacy) return;
    setSelectedPharmacyId(id);
    setName(pharmacy.name);
    setAddress(pharmacy.address);
    setFax(pharmacy.fax);
  };

  const useManualEntry = () => {
    setSelectedPharmacyId(null);
    setName('');
    setAddress('');
    setFax('');
  };

  const save = async () => {
    if (!name.trim()) return Alert.alert('', t('account.enterPharmacyName'));
    if (!address.trim()) return Alert.alert('', t('account.enterPharmacyAddress'));
    if (!fax.trim()) return Alert.alert('', t('account.enterPharmacyFax'));
    if (!isValidPhone(fax)) return Alert.alert('', t('account.validFax'));
    try {
      const input: PharmacyInput = selectedPharmacyId
        ? { pharmacyId: selectedPharmacyId }
        : { name: name.trim(), address: address.trim(), fax: fax.trim() };
      await savePharmacy.mutateAsync(input);
      Alert.alert(t('account.saved'), t('account.pharmacySaved'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert(t('account.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.preferredPharmacy')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {directory.length > 0 && (
          <>
            <Text style={styles.chipLabel}>{t('account.chooseFromNetwork')}</Text>
            <View style={styles.chipRow}>
              {directory.map((pharmacy) => {
                const active = selectedPharmacyId === pharmacy.id;
                return (
                  <TouchableOpacity
                    key={pharmacy.id}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => selectDirectoryPharmacy(pharmacy.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{pharmacy.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {selectedPharmacyId ? (
          <View style={styles.summaryCard}>
            <FontAwesome name="check-circle" size={16} color={Colors.green} />
            <View style={styles.summaryText}>
              <Text style={styles.summaryName}>{name}</Text>
              <Text style={styles.summaryDetail}>{address} · {fax}</Text>
            </View>
            <TouchableOpacity onPress={useManualEntry} accessibilityRole="button">
              <Text style={styles.summaryChange}>{t('account.useDifferentPharmacy')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <EkoTextField label={t('account.pharmacyNameLabel')} placeholder={t('account.pharmacyNamePlaceholder')} icon="medkit" value={name} onChangeText={setName} />
            <EkoTextField label={t('account.addressLabel')} placeholder={t('account.fullAddress')} icon="map-marker" value={address} onChangeText={setAddress} />
            <EkoTextField label={t('account.faxNumber')} placeholder={t('account.faxNumberPlaceholder')} icon="fax" value={fax} onChangeText={(val) => setFax(sanitizePhoneInput(val))} keyboardType="phone-pad" />
          </>
        )}

        <EkoButton title={t('account.savePharmacy')} variant="accent" onPress={save} loading={savePharmacy.isPending} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  chipLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 8, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.white },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.field, borderRadius: 12, padding: 14, marginBottom: 20,
  },
  summaryText: { flex: 1 },
  summaryName: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  summaryDetail: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  summaryChange: { fontSize: 12, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  btn: { marginTop: 8 },
});
