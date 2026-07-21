import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useAddLab, useLabs, useRemoveLab } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { MONTH_NAMES } from '../../../utils/format';
import type { LabFlag, LabInput, LabResult, LabStatus, PatientSummary, PickedFile } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const FLAGS: LabFlag[] = ['normal', 'low', 'high', 'critical', 'abnormal'];
const STATUSES: LabStatus[] = ['ordered', 'collected', 'resulted'];
const MAX_BYTES = 10 * 1024 * 1024;

const FLAG_COLOR = (c: ThemeColors): Record<LabFlag, string> => ({
  normal: c.green,
  low: c.blue,
  high: c.orange,
  critical: c.red,
  abnormal: c.orange,
});

/** "Jul 20, 2026" for today, matching how results display their dates. */
function todayLabel(): string {
  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

const EMPTY_FORM: LabInput = {
  testName: '', loincCode: '', specimen: '', value: '', unit: '', referenceRange: '',
  flag: 'normal', status: 'resulted', orderedBy: '', performingLab: '',
  collectedDate: todayLabel(), resultedDate: '', notes: '',
};

/**
 * Lab results screen, shared by two surfaces: a doctor viewing a roster
 * patient's labs (route.params.patient present) and a patient viewing their own
 * (no param). Both can view and add.
 */
export default function LabsScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const patient = route.params?.patient as PatientSummary | undefined;
  const patientId = patient?.id; // undefined → the signed-in patient's own labs

  const { data: labs = [], isLoading } = useLabs(patientId);
  const addLab = useAddLab(patientId);
  const removeLab = useRemoveLab(patientId);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<LabInput>(EMPTY_FORM);
  const [file, setFile] = useState<PickedFile | null>(null);

  const set = (key: keyof LabInput) => (val: string) => setForm((f) => ({ ...f, [key]: val }));

  const openForm = () => {
    setForm({ ...EMPTY_FORM, collectedDate: todayLabel(), orderedBy: patient ? '' : '' });
    setFile(null);
    setFormOpen(true);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      const size = a.size ?? 0;
      if (size > MAX_BYTES) return Alert.alert(t('labs.couldNotSave'), t('labs.tooLarge'));
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/octet-stream', size });
    } catch {
      Alert.alert(t('labs.couldNotSave'), t('labs.pickFailed'));
    }
  };

  const submit = async () => {
    if (!form.testName.trim()) return Alert.alert('', t('labs.testRequired'));
    if (!form.specimen.trim()) return Alert.alert('', t('labs.specimenRequired'));
    if (!form.value.trim()) return Alert.alert('', t('labs.valueRequired'));
    if (!form.collectedDate.trim()) return Alert.alert('', t('labs.dateRequired'));
    // Trim optionals to undefined so empty strings don't persist.
    const data: LabInput = {
      testName: form.testName.trim(),
      loincCode: form.loincCode?.trim() || undefined,
      specimen: form.specimen.trim(),
      value: form.value.trim(),
      unit: form.unit?.trim() || undefined,
      referenceRange: form.referenceRange?.trim() || undefined,
      flag: form.flag,
      status: form.status,
      orderedBy: form.orderedBy?.trim() || undefined,
      performingLab: form.performingLab?.trim() || undefined,
      collectedDate: form.collectedDate.trim(),
      resultedDate: form.resultedDate?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };
    try {
      await addLab.mutateAsync({ data, file: file ?? undefined });
      setFormOpen(false);
    } catch (err) {
      Alert.alert(t('labs.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const confirmRemove = (lab: LabResult) => {
    Alert.alert(t('labs.removeTitle'), t('labs.removeConfirm', { name: lab.testName }), [
      { text: t('labs.cancel'), style: 'cancel' },
      {
        text: t('labs.remove'),
        style: 'destructive',
        onPress: () =>
          removeLab.mutate(lab.id, {
            onError: (err) => Alert.alert(t('labs.couldNotRemove'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
          }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('labs.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={labs}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.subtitle}>
              {patient ? t('labs.patientSubtitle', { name: patient.name }) : t('labs.mySubtitle')}
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="flask" size={40} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>{t('labs.empty')}</Text>
              <Text style={styles.emptyHint}>{t('labs.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => <LabCard lab={item} onRemove={() => confirmRemove(item)} />}
        />
      )}

      <View style={styles.footer}>
        <EkoButton title={t('labs.addLab')} variant="primary" onPress={openForm} />
      </View>

      {/* Add-lab sheet */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>{t('labs.newLab')}</Text>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Field label={t('labs.testName')}>
                  <TextInput style={styles.input} placeholder={t('labs.testNamePlaceholder')} placeholderTextColor={Colors.textGray} value={form.testName} onChangeText={set('testName')} />
                </Field>
                <Field label={t('labs.loinc')}>
                  <TextInput style={styles.input} placeholder={t('labs.loincPlaceholder')} placeholderTextColor={Colors.textGray} value={form.loincCode} onChangeText={set('loincCode')} />
                </Field>
                <Field label={t('labs.specimen')}>
                  <TextInput style={styles.input} placeholder={t('labs.specimenPlaceholder')} placeholderTextColor={Colors.textGray} value={form.specimen} onChangeText={set('specimen')} />
                </Field>
                <View style={styles.row}>
                  <Field label={t('labs.value')} style={styles.rowItem}>
                    <TextInput style={styles.input} placeholder={t('labs.valuePlaceholder')} placeholderTextColor={Colors.textGray} value={form.value} onChangeText={set('value')} />
                  </Field>
                  <Field label={t('labs.unit')} style={styles.rowItem}>
                    <TextInput style={styles.input} placeholder={t('labs.unitPlaceholder')} placeholderTextColor={Colors.textGray} value={form.unit} onChangeText={set('unit')} />
                  </Field>
                </View>
                <Field label={t('labs.referenceRange')}>
                  <TextInput style={styles.input} placeholder={t('labs.referenceRangePlaceholder')} placeholderTextColor={Colors.textGray} value={form.referenceRange} onChangeText={set('referenceRange')} />
                </Field>

                <Text style={styles.fieldLabel}>{t('labs.flag')}</Text>
                <View style={styles.chipRow}>
                  {FLAGS.map((fl) => {
                    const active = form.flag === fl;
                    const color = FLAG_COLOR(Colors)[fl];
                    return (
                      <TouchableOpacity key={fl} style={[styles.chip, active && { backgroundColor: color + '1A', borderColor: color }]} onPress={() => setForm((f) => ({ ...f, flag: fl }))} accessibilityRole="radio" accessibilityState={{ selected: active }}>
                        <Text style={[styles.chipText, active && { color, fontWeight: '700' }]}>{t(`labs.flags.${fl}`)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.fieldLabel}>{t('labs.status')}</Text>
                <View style={styles.chipRow}>
                  {STATUSES.map((st) => {
                    const active = form.status === st;
                    return (
                      <TouchableOpacity key={st} style={[styles.chip, active && styles.chipActive]} onPress={() => setForm((f) => ({ ...f, status: st }))} accessibilityRole="radio" accessibilityState={{ selected: active }}>
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`labs.statuses.${st}`)}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Field label={t('labs.orderedBy')}>
                  <TextInput style={styles.input} placeholder={t('labs.orderedByPlaceholder')} placeholderTextColor={Colors.textGray} value={form.orderedBy} onChangeText={set('orderedBy')} />
                </Field>
                <Field label={t('labs.performingLab')}>
                  <TextInput style={styles.input} placeholder={t('labs.performingLabPlaceholder')} placeholderTextColor={Colors.textGray} value={form.performingLab} onChangeText={set('performingLab')} />
                </Field>
                <View style={styles.row}>
                  <Field label={t('labs.collectedDate')} style={styles.rowItem}>
                    <TextInput style={styles.input} placeholderTextColor={Colors.textGray} value={form.collectedDate} onChangeText={set('collectedDate')} />
                  </Field>
                  <Field label={t('labs.resultedDate')} style={styles.rowItem}>
                    <TextInput style={styles.input} placeholderTextColor={Colors.textGray} value={form.resultedDate} onChangeText={set('resultedDate')} />
                  </Field>
                </View>
                <Field label={t('labs.notes')}>
                  <TextInput style={[styles.input, styles.multiline]} placeholder={t('labs.notesPlaceholder')} placeholderTextColor={Colors.textGray} value={form.notes} onChangeText={set('notes')} multiline textAlignVertical="top" />
                </Field>

                <TouchableOpacity style={styles.filePicker} onPress={pickFile} accessibilityRole="button">
                  <FontAwesome name="paperclip" size={16} color={Colors.primary} />
                  <Text style={styles.fileText} numberOfLines={1}>
                    {file ? file.name : t('labs.attachReport')}
                  </Text>
                  {file ? <FontAwesome name="check-circle" size={16} color={Colors.green} /> : <FontAwesome name="chevron-right" size={13} color={Colors.textGray} />}
                </TouchableOpacity>

                <View style={styles.sheetActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormOpen(false)}>
                    <Text style={styles.cancelText}>{t('labs.cancel')}</Text>
                  </TouchableOpacity>
                  <EkoButton title={t('labs.save')} variant="primary" onPress={submit} loading={addLab.isPending} style={styles.saveBtn} />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function Field({ label, children, style }: { label: string; children: React.ReactNode; style?: any }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={style}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function LabCard({ lab, onRemove }: { lab: LabResult; onRemove: () => void }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const flagColor = FLAG_COLOR(Colors)[lab.flag];

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardHeadText}>
          <Text style={styles.testName}>{lab.testName}</Text>
          {lab.loincCode ? <Text style={styles.loinc}>LOINC {lab.loincCode}</Text> : null}
        </View>
        <View style={[styles.statusPill, { backgroundColor: Colors.primaryFaded }]}>
          <Text style={[styles.statusText, { color: Colors.primary }]}>{t(`labs.statuses.${lab.status}`)}</Text>
        </View>
        <TouchableOpacity onPress={onRemove} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} style={styles.trash} accessibilityRole="button" accessibilityLabel={t('labs.remove')}>
          <FontAwesome name="trash-o" size={16} color={Colors.red} />
        </TouchableOpacity>
      </View>

      <View style={styles.resultRow}>
        <Text style={styles.resultValue}>
          {lab.value}{lab.unit ? <Text style={styles.resultUnit}> {lab.unit}</Text> : null}
        </Text>
        <View style={[styles.flagChip, { backgroundColor: flagColor + '1A' }]}>
          <Text style={[styles.flagText, { color: flagColor }]}>{t(`labs.flags.${lab.flag}`)}</Text>
        </View>
      </View>
      {lab.referenceRange ? <Text style={styles.refText}>{t('labs.refLabel')}: {lab.referenceRange}</Text> : null}

      <View style={styles.metaGrid}>
        <Meta label={t('labs.specimen')} value={lab.specimen} />
        <Meta label={t('labs.collectedLabel')} value={lab.collectedDate} />
        {lab.resultedDate ? <Meta label={t('labs.resultedLabel')} value={lab.resultedDate} /> : null}
        {lab.orderedBy ? <Meta label={t('labs.orderedByLabel')} value={lab.orderedBy} /> : null}
        {lab.performingLab ? <Meta label={t('labs.labLabel')} value={lab.performingLab} /> : null}
      </View>

      {lab.notes ? (
        <View style={styles.notes}>
          <FontAwesome name="info-circle" size={12} color={Colors.textGray} style={{ marginTop: 2 }} />
          <Text style={styles.notesText}>{lab.notes}</Text>
        </View>
      ) : null}

      {lab.attachmentUrl ? (
        <View style={styles.attachment}>
          <FontAwesome name="paperclip" size={12} color={Colors.primary} />
          <Text style={styles.attachmentText} numberOfLines={1}>{lab.attachmentName ?? t('labs.reportAttached')}</Text>
        </View>
      ) : null}
    </View>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.metaItem}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  subtitle: { fontSize: 13, color: Colors.textGray, marginBottom: 14, fontFamily: 'Poppins_400Regular' },

  empty: { alignItems: 'center', marginTop: 50, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginTop: 14, fontFamily: 'Poppins_700Bold' },
  emptyHint: { fontSize: 13, color: Colors.textGray, textAlign: 'center', marginTop: 6, lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardHeadText: { flex: 1 },
  testName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  loinc: { fontSize: 11, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginRight: 10 },
  statusText: { fontSize: 11, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  trash: { paddingTop: 2 },

  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  resultValue: { fontSize: 22, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  resultUnit: { fontSize: 14, fontWeight: '500', color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },
  flagChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  flagText: { fontSize: 11, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  refText: { fontSize: 12, color: Colors.textGray, marginTop: 4, fontFamily: 'Poppins_400Regular' },

  metaGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.borderGray, paddingTop: 12,
  },
  metaItem: { width: '50%', marginBottom: 10 },
  metaLabel: { fontSize: 11, color: Colors.textGray, marginBottom: 2, fontFamily: 'Poppins_400Regular' },
  metaValue: { fontSize: 13, color: Colors.textDark, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  notes: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.bgGray, borderRadius: 10, padding: 10, marginTop: 2, marginBottom: 4,
  },
  notesText: { flex: 1, fontSize: 12, color: Colors.textMedium, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
  attachment: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  attachmentText: { flex: 1, fontSize: 12, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  footer: { padding: 16, backgroundColor: Colors.bgLight, borderTopWidth: 1, borderTopColor: Colors.borderGray },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 30, maxHeight: '90%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 14 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 12, fontFamily: 'Poppins_700Bold' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 6, fontFamily: 'Poppins_600SemiBold' },
  input: {
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 48,
    fontSize: 14, color: Colors.textDark, marginBottom: 12, fontFamily: 'Poppins_400Regular',
  },
  multiline: { height: 84, paddingTop: 12, paddingBottom: 12 },
  row: { flexDirection: 'row', gap: 12 },
  rowItem: { flex: 1 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.bgLight,
  },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 52,
    borderWidth: 1.5, borderColor: Colors.borderGray, borderStyle: 'dashed', marginBottom: 16, marginTop: 4,
  },
  fileText: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 12 },
  cancelText: { fontSize: 15, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  saveBtn: { flex: 1 },
});
