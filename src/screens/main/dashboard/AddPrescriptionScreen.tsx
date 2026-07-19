import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useAddPrescription } from '../../../hooks/queries';
import type { PatientSummary, PrescriptionInput } from '../../../api/types';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

// Industry-standard quick options; the fields still accept free text.
const FORMS = ['Tablet', 'Capsule', 'Liquid', 'Injection', 'Inhaler', 'Cream', 'Drops'];
const ROUTES = ['Oral', 'Topical', 'Intravenous', 'Intramuscular', 'Inhaled', 'Subcutaneous'];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Every 8 hours', 'As needed', 'At night'];

/**
 * New-prescription form. Captures the standard fields of an e-prescription
 * (drug, strength, form, route, frequency/Sig, duration, quantity, refills and
 * patient instructions). Prescriber and dates are stamped server-side.
 */
export default function AddPrescriptionScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const patient = route.params?.patient as PatientSummary | undefined;
  const addPrescription = useAddPrescription(patient?.id ?? '');

  const [drug, setDrug] = useState('');
  const [strength, setStrength] = useState('');
  const [form, setForm] = useState('');
  const [routeVal, setRouteVal] = useState('');
  const [frequency, setFrequency] = useState('');
  const [duration, setDuration] = useState('');
  const [quantity, setQuantity] = useState('');
  const [refills, setRefills] = useState('');
  const [instructions, setInstructions] = useState('');

  const valid =
    drug.trim().length > 0 &&
    strength.trim().length > 0 &&
    form.trim().length > 0 &&
    routeVal.trim().length > 0 &&
    frequency.trim().length > 0;

  const save = async () => {
    if (!valid || !patient) return;
    const input: PrescriptionInput = {
      patientId: patient.id,
      drug: drug.trim(),
      strength: strength.trim(),
      form: form.trim(),
      route: routeVal.trim(),
      frequency: frequency.trim(),
      duration: duration.trim() || t('prescriptions.ongoing'),
      quantity: quantity.trim() || '—',
      refills: refills.trim() || '0',
      instructions: instructions.trim() || undefined,
    };
    try {
      await addPrescription.mutateAsync(input);
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('prescriptions.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  if (!patient) {
    return (
      <View style={styles.container}>
        <EkoHeader title={t('prescriptions.newPrescription')} onBack={() => navigation.goBack()} />
        <View style={styles.missing}>
          <Text style={styles.missingText}>{t('patients.patientNotFound')}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EkoHeader title={t('prescriptions.newPrescription')} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.patientChip}>
            <FontAwesome name="user" size={13} color={Colors.primary} />
            <Text style={styles.patientChipText}>{t('prescriptions.prescribingFor', { name: patient.name })}</Text>
          </View>

          <Field label={t('prescriptions.drugName')} required value={drug} onChangeText={setDrug} placeholder={t('prescriptions.drugPlaceholder')} />

          <View style={styles.row}>
            <View style={styles.half}>
              <Field label={t('prescriptions.strength')} required value={strength} onChangeText={setStrength} placeholder="e.g. 10 mg" />
            </View>
            <View style={styles.half}>
              <Field label={t('prescriptions.quantity')} value={quantity} onChangeText={setQuantity} placeholder="e.g. 30" keyboardType="number-pad" />
            </View>
          </View>

          <ChipField label={t('prescriptions.form')} required options={FORMS} value={form} onChange={setForm} placeholder={t('prescriptions.formPlaceholder')} />
          <ChipField label={t('prescriptions.route')} required options={ROUTES} value={routeVal} onChange={setRouteVal} placeholder={t('prescriptions.routePlaceholder')} />
          <ChipField label={t('prescriptions.frequency')} required options={FREQUENCIES} value={frequency} onChange={setFrequency} placeholder={t('prescriptions.frequencyPlaceholder')} />

          <View style={styles.row}>
            <View style={styles.half}>
              <Field label={t('prescriptions.duration')} value={duration} onChangeText={setDuration} placeholder="e.g. 30 days" />
            </View>
            <View style={styles.half}>
              <Field label={t('prescriptions.refills')} value={refills} onChangeText={setRefills} placeholder="e.g. 3" keyboardType="number-pad" />
            </View>
          </View>

          <Field
            label={t('prescriptions.instructions')}
            value={instructions}
            onChangeText={setInstructions}
            placeholder={t('prescriptions.instructionsPlaceholder')}
            multiline
          />

          <EkoButton
            title={t('prescriptions.savePrescription')}
            variant="primary"
            onPress={save}
            loading={addPrescription.isPending}
            disabled={!valid}
            style={styles.saveBtn}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label, value, onChangeText, placeholder, required, multiline, keyboardType,
}: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
  required?: boolean; multiline?: boolean; keyboardType?: 'default' | 'number-pad';
}) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused, multiline && styles.inputWrapMultiline]}>
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textGray}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          keyboardType={keyboardType ?? 'default'}
          accessibilityLabel={label}
        />
      </View>
    </View>
  );
}

function ChipField({
  label, options, value, onChange, placeholder, required,
}: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}{required ? <Text style={styles.req}> *</Text> : null}
      </Text>
      <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={Colors.textGray}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          accessibilityLabel={label}
        />
      </View>
      <View style={styles.chipRow}>
        {options.map((opt) => {
          const selected = value.trim().toLowerCase() === opt.toLowerCase();
          return (
            <TouchableOpacity
              key={opt}
              style={[styles.chip, selected && styles.chipActive]}
              onPress={() => onChange(opt)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  missingText: { fontSize: 16, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },

  patientChip: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: Colors.primaryFaded, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 7, marginBottom: 18,
  },
  patientChipText: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold' },
  req: { color: Colors.red },

  inputWrap: {
    backgroundColor: Colors.field, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent', paddingHorizontal: 16,
    justifyContent: 'center', minHeight: 52,
  },
  inputWrapFocused: { borderColor: Colors.primary, backgroundColor: Colors.surface },
  inputWrapMultiline: { minHeight: 96, paddingVertical: 6 },
  input: { fontSize: 15, color: Colors.textDark, paddingVertical: Platform.OS === 'ios' ? 14 : 10, fontFamily: 'Poppins_400Regular' },
  inputMultiline: { height: 84, textAlignVertical: 'top' },

  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16,
    backgroundColor: Colors.field, borderWidth: 1, borderColor: Colors.borderGray,
  },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipText: { fontSize: 12, color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  saveBtn: { marginTop: 8 },
});
