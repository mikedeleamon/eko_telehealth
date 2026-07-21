import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoSelectField, { OTHER_OPTION } from '../../../components/common/EkoSelectField';
import EkoButton from '../../../components/common/EkoButton';
import { LANGUAGE_OPTIONS, PROVIDER_CATEGORY_OPTIONS, SPECIALTY_OPTIONS } from '../../../constants';
import { api } from '../../../api';
import { queryKeys } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/**
 * Provider application form.
 *
 * Submitting does NOT make the account bookable — an admin reviews it and
 * approval is what creates the doctor profile. Vetting is the point: an
 * unreviewed stranger must never be bookable as a doctor.
 */
export default function ProviderApplyScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const [specialty, setSpecialty] = useState('');
  const [specialtyOther, setSpecialtyOther] = useState('');
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [fee, setFee] = useState('');
  // Patients search/match by shared language (task 2.5) — captured here,
  // once, and carried onto the doctors row when this application is approved.
  const [spokenLanguages, setSpokenLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const toggleLanguage = (lang: string) => {
    setSpokenLanguages((prev) => (prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]));
  };

  const submit = async () => {
    const resolvedSpecialty = specialty === OTHER_OPTION ? specialtyOther.trim() : specialty.trim();
    if (resolvedSpecialty.length < 2) return Alert.alert('', t('provider.valSpecialty'));
    if (category.trim().length < 2) return Alert.alert('', t('provider.valCategory'));
    if (location.trim().length < 2) return Alert.alert('', t('provider.valLocation'));
    if (!fee.trim()) return Alert.alert('', t('provider.valFee'));
    if (!spokenLanguages.length) return Alert.alert('', t('provider.valLanguages'));

    setLoading(true);
    try {
      await api.providers.apply({
        specialty: resolvedSpecialty,
        category: category.trim(),
        location: location.trim(),
        fee: fee.trim(),
        spokenLanguages,
      });
      qc.invalidateQueries({ queryKey: queryKeys.providerState });
      Alert.alert(
        t('provider.applicationSubmittedTitle'),
        t('provider.applicationSubmittedBody'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert(t('provider.couldNotSubmit'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <EkoHeader title={t('provider.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>{t('provider.intro')}</Text>

        <EkoSelectField
          label={t('provider.specialty')}
          icon="stethoscope"
          placeholder={t('provider.selectSpecialty')}
          options={SPECIALTY_OPTIONS}
          value={specialty}
          onSelect={setSpecialty}
          allowOther
          otherValue={specialtyOther}
          onChangeOther={setSpecialtyOther}
          otherPlaceholder={t('provider.enterSpecialty')}
        />
        <EkoSelectField
          label={t('provider.category')}
          icon="tags"
          placeholder={t('provider.howPatientsSearch')}
          options={PROVIDER_CATEGORY_OPTIONS}
          value={category}
          onSelect={setCategory}
        />
        <EkoTextField
          label={t('provider.location')}
          placeholder={t('provider.locationPlaceholder')}
          icon="map-marker"
          value={location}
          onChangeText={setLocation}
        />
        <EkoTextField
          label={t('provider.consultationFee')}
          placeholder={t('provider.feePlaceholder')}
          icon="money"
          value={fee}
          onChangeText={setFee}
        />

        <Text style={styles.chipLabel}>{t('provider.spokenLanguages')}</Text>
        <View style={styles.chipRow}>
          {LANGUAGE_OPTIONS.map((lang) => {
            const active = spokenLanguages.includes(lang);
            return (
              <TouchableOpacity
                key={lang}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => toggleLanguage(lang)}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{lang}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <EkoButton title={t('provider.submitApplication')} variant="primary" onPress={submit} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  intro: {
    fontSize: 13, color: Colors.textGray, lineHeight: 20,
    marginBottom: 20, fontFamily: 'Poppins_400Regular',
  },
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
  btn: { marginTop: 8 },
});
