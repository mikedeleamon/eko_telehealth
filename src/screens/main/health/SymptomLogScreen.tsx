import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import SheetModal from '../../../components/common/SheetModal';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useLogSymptom, useMySymptoms, useUpdateSymptom } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { MONTH_NAMES } from '../../../utils/format';
import { SYMPTOM_CATALOG, findSymptomEntry, type SymptomCatalogEntry } from '../../../constants/symptoms';
import type { SymptomLog, SymptomLogInput } from '../../../api/types';
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const SEVERITIES = [1, 2, 3, 4, 5] as const;

/** "Jul 20, 2026" for today — matches the free-text date convention used on LabsScreen. */
function todayLabel(): string {
  const d = new Date();
  return `${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
}

/**
 * Patient symptom logging (spec §7.2). Deliberately plain-language only —
 * codes are never shown here (D4: a symptom log entry must never read like a
 * diagnosis). `suggestedCode` travels with the entry purely as a hint for the
 * provider's DiagnosisPicker "For this patient" band.
 */
export default function SymptomLogScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const appointmentId = route.params?.appointmentId as string | undefined;

  const { data: logs, isLoading } = useMySymptoms();
  const logSymptom = useLogSymptom();
  const updateSymptom = useUpdateSymptom();

  const [showResolved, setShowResolved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<SymptomCatalogEntry | null>(null);
  const [severity, setSeverity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [startedAt, setStartedAt] = useState(todayLabel());
  const [notes, setNotes] = useState('');

  const { active, resolved } = useMemo(() => {
    const list = logs ?? [];
    return { active: list.filter((l) => !l.resolvedAt), resolved: list.filter((l) => !!l.resolvedAt) };
  }, [logs]);

  const filteredCatalog = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SYMPTOM_CATALOG;
    return SYMPTOM_CATALOG.filter((e) => t(e.labelKey).toLowerCase().includes(q));
  }, [query, t]);

  const openSheet = () => {
    setQuery('');
    setSelected(null);
    setSeverity(3);
    setStartedAt(todayLabel());
    setNotes('');
    setSheetOpen(true);
  };

  const pickEntry = (entry: SymptomCatalogEntry) => setSelected(entry);

  const submit = async () => {
    if (!selected) return;
    const input: SymptomLogInput = {
      symptomKey: selected.key,
      severity,
      startedAt: startedAt.trim(),
      appointmentId,
      notes: notes.trim() || undefined,
    };
    try {
      await logSymptom.mutateAsync(input);
      setSheetOpen(false);
    } catch (err) {
      Alert.alert(t('symptoms.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const markResolved = (log: SymptomLog) => {
    updateSymptom.mutate(
      { id: log.id, input: { resolvedAt: new Date().toISOString() } },
      { onError: (err) => Alert.alert(t('symptoms.couldNotUpdate'), err instanceof Error ? err.message : t('common.somethingWentWrong')) },
    );
  };

  const renderLog = (log: SymptomLog) => {
    const catalogEntry = findSymptomEntry(log.symptomKey);
    const label = catalogEntry ? t(catalogEntry.labelKey) : log.symptomKey;
    return (
      <View key={log.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.label}>{label}</Text>
          {!!log.severity && (
            <View style={styles.severityPill}>
              <Text style={styles.severityText}>{t(`symptoms.severity${log.severity}`)}</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta}>
          {log.resolvedAt ? t('symptoms.resolvedOn', { date: log.resolvedAt.slice(0, 10) }) : t('symptoms.startedOn', { date: log.startedAt })}
        </Text>
        {!!log.notes && <Text style={styles.notes}>{log.notes}</Text>}
        {!log.resolvedAt && (
          <TouchableOpacity onPress={() => markResolved(log)} style={styles.resolveLink} accessibilityRole="button">
            <FontAwesome name="check-circle-o" size={13} color={Colors.primary} />
            <Text style={styles.resolveLinkText}>{t('symptoms.markResolved')}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('symptoms.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : active.length === 0 && resolved.length === 0 ? (
        <View style={styles.empty}>
          <FontAwesome name="stethoscope" size={40} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>{t('symptoms.emptyState')}</Text>
          <Text style={styles.emptyHint}>{t('symptoms.emptyBody')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>{t('symptoms.subtitle')}</Text>
          {active.map(renderLog)}
          {resolved.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setShowResolved((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showResolved }}
              >
                <Text style={styles.toggleText}>{showResolved ? t('symptoms.hideResolved') : t('symptoms.showResolved')}</Text>
                <FontAwesome name={showResolved ? 'chevron-up' : 'chevron-down'} size={11} color={Colors.primary} />
              </TouchableOpacity>
              {showResolved && resolved.map(renderLog)}
            </>
          )}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <EkoButton title={t('symptoms.logSymptom')} variant="primary" onPress={openSheet} />
      </View>

      <SheetModal visible={sheetOpen} onRequestClose={() => setSheetOpen(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.grabber} />

              {!selected ? (
                <>
                  <Text style={styles.sheetTitle}>{t('symptoms.logSymptom')}</Text>
                  <View style={styles.searchInputWrap}>
                    <FontAwesome name="search" size={14} color={Colors.textGray} style={styles.searchIcon} />
                    <TextInput
                      style={styles.searchInput}
                      value={query}
                      onChangeText={setQuery}
                      placeholder={t('symptoms.searchPlaceholder')}
                      placeholderTextColor={Colors.textGray}
                      autoFocus
                    />
                  </View>
                  <ScrollView style={styles.catalogList} keyboardShouldPersistTaps="handled">
                    {filteredCatalog.map((entry) => (
                      <TouchableOpacity
                        key={entry.key}
                        style={styles.catalogRow}
                        onPress={() => pickEntry(entry)}
                        accessibilityRole="button"
                        accessibilityLabel={t(entry.labelKey)}
                      >
                        <Text style={styles.catalogRowText}>{t(entry.labelKey)}</Text>
                        <FontAwesome name="chevron-right" size={13} color={Colors.textGray} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              ) : (
                <ScrollView keyboardShouldPersistTaps="handled">
                  <Text style={styles.sheetTitle}>{t(selected.labelKey)}</Text>

                  <Text style={styles.fieldLabel}>{t('symptoms.howSevere')}</Text>
                  <View style={styles.segmented}>
                    {SEVERITIES.map((s) => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => setSeverity(s)}
                        style={[styles.segment, severity === s && styles.segmentActive]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: severity === s }}
                        accessibilityLabel={t(`symptoms.severity${s}`)}
                      >
                        <Text style={[styles.segmentText, severity === s && styles.segmentTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.severityCaption}>{t(`symptoms.severity${severity}`)}</Text>

                  <Text style={styles.fieldLabel}>{t('symptoms.startedWhen')}</Text>
                  <View style={styles.inputWrap}>
                    <TextInput style={styles.input} value={startedAt} onChangeText={setStartedAt} placeholderTextColor={Colors.textGray} />
                  </View>

                  <Text style={styles.fieldLabel}>{t('symptoms.notesOptional')}</Text>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={[styles.input, styles.multiline]}
                      value={notes}
                      onChangeText={setNotes}
                      placeholder={t('symptoms.notesPlaceholder')}
                      placeholderTextColor={Colors.textGray}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.sheetActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelected(null)} accessibilityRole="button">
                      <Text style={styles.cancelText}>{t('common.back')}</Text>
                    </TouchableOpacity>
                    <EkoButton title={t('common.save')} variant="primary" onPress={submit} loading={logSymptom.isPending} style={styles.saveBtn} />
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SheetModal>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 100, flexGrow: 1 },
  subtitle: { fontSize: 13, color: Colors.textGray, marginBottom: 14, fontFamily: 'Poppins_400Regular' },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginTop: 14, fontFamily: 'Poppins_700Bold' },
  emptyHint: { fontSize: 13, color: Colors.textGray, textAlign: 'center', marginTop: 6, lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  severityPill: { backgroundColor: Colors.primaryFaded, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 },
  severityText: { fontSize: 11, color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  meta: { fontSize: 12, color: Colors.textGray, marginTop: 4, fontFamily: 'Poppins_400Regular' },
  notes: { fontSize: 13, color: Colors.textMedium, marginTop: 8, lineHeight: 19, fontFamily: 'Poppins_400Regular' },
  resolveLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  resolveLinkText: { fontSize: 12, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  toggleText: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  footer: { paddingBottom: TAB_BAR_SPACE, padding: 16, backgroundColor: Colors.bgLight, borderTopWidth: 1, borderTopColor: Colors.borderGray },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 32, maxHeight: '85%' },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 14 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.textDark, marginBottom: 14, fontFamily: 'Poppins_700Bold' },

  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 48, marginBottom: 12,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  catalogList: { flexGrow: 0 },
  catalogRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  catalogRowText: { fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 8, fontFamily: 'Poppins_600SemiBold' },
  segmented: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  segment: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
    backgroundColor: Colors.bgGray,
  },
  segmentActive: { backgroundColor: Colors.primary },
  segmentText: { fontSize: 14, fontWeight: '700', color: Colors.textMedium, fontFamily: 'Poppins_600SemiBold' },
  segmentTextActive: { color: Colors.white },
  severityCaption: { fontSize: 12, color: Colors.textGray, textAlign: 'center', marginBottom: 16, fontFamily: 'Poppins_400Regular' },

  inputWrap: { backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 },
  input: { fontSize: 14, color: Colors.textDark, height: 48, fontFamily: 'Poppins_400Regular' },
  multiline: { height: 84, paddingTop: 12, paddingBottom: 12 },

  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 12 },
  cancelText: { fontSize: 15, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  saveBtn: { flex: 1 },
});
