import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import SheetModal from '../common/SheetModal';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import EkoButton from '../common/EkoButton';
import { useTranslation } from '../../i18n/useTranslation';
import { useCodeFavorites, useIcd10Search, usePatientConditions, usePatientSymptoms, usePinCode } from '../../hooks/queries';
import { ICD10_SUBSET } from '../../constants/icd10';
import { findSymptomEntry } from '../../constants/symptoms';
import type { CodedDiagnosis, Icd10Code } from '../../api/types';

type Tab = 'frequent' | 'search' | 'browse';
type DiagnosisStatus = NonNullable<CodedDiagnosis['status']>;

export interface DiagnosisPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (dx: CodedDiagnosis) => void;
  /** Codes already on the note — shown with a check mark. */
  selected: CodedDiagnosis[];
  /** Enables the "For this patient" candidates band (active conditions + recent symptom logs). */
  patientId?: string;
  /** When set, a symptom log tied to this visit is a candidate regardless of age. */
  appointmentId?: string;
}

const STATUSES: DiagnosisStatus[] = ['confirmed', 'provisional', 'ruled_out'];
const CANDIDATE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

interface Candidate {
  code: Icd10Code;
  provenance: string;
}

/** Whole days between an ISO/parseable date string and now — NaN-safe. */
function daysSince(dateStr: string): number | null {
  const ms = Date.now() - new Date(dateStr).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.round(ms / 86_400_000));
}

/**
 * Bottom-sheet code picker. Two tabs: Frequent (default — pinned + recents
 * for the signed-in doctor) and Search (debounced local+remote type-ahead).
 * Tapping a row selects it immediately with default status 'confirmed' — the
 * two-tap path (open picker, tap a code). The pencil affordance opens a
 * one-code customize step for a label override and provisional/ruled-out
 * status, for the cases that need it.
 */
export default function DiagnosisPicker({ visible, onClose, onSelect, selected, patientId, appointmentId }: DiagnosisPickerProps) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();

  const [tab, setTab] = useState<Tab>('frequent');
  const [query, setQuery] = useState('');
  const [customizing, setCustomizing] = useState<Icd10Code | null>(null);
  const [label, setLabel] = useState('');
  const [status, setStatus] = useState<DiagnosisStatus>('confirmed');
  const [browseChapter, setBrowseChapter] = useState<string | null>(null);
  const [browseCategory, setBrowseCategory] = useState<string | null>(null);

  const { data: favorites = [], isLoading: loadingFavorites } = useCodeFavorites();
  const { data: searchResults = [], isFetching: searching } = useIcd10Search(query);
  const { data: activeConditions = [] } = usePatientConditions(patientId);
  const { data: symptomLogs = [] } = usePatientSymptoms(patientId);
  const pinMutation = usePinCode();

  const selectedCodes = useMemo(
    () => new Set(selected.map((d) => d.code).filter((c): c is string => !!c)),
    [selected],
  );

  /**
   * "For this patient" band (spec §7.2/§6.1): active problem-list entries,
   * plus unresolved symptom logs from the last 30 days or tied to this visit.
   * Deduped by code — a condition already on the chart wins over a symptom
   * suggesting the same code.
   */
  const candidates = useMemo<Candidate[]>(() => {
    const byCode = new Map<string, Candidate>();

    for (const c of activeConditions) {
      if (c.clinicalStatus !== 'active' || !c.diagnosis.code) continue;
      byCode.set(c.diagnosis.code, {
        code: { code: c.diagnosis.code, description: c.diagnosis.description, isBillable: true },
        provenance: t('diagnosis.onProblemList'),
      });
    }

    for (const s of symptomLogs) {
      if (s.resolvedAt || !s.suggestedCode || byCode.has(s.suggestedCode)) continue;
      const isRecent = daysSince(s.createdAt) !== null && daysSince(s.createdAt)! <= 30;
      const isThisVisit = !!appointmentId && s.appointmentId === appointmentId;
      if (!isRecent && !isThisVisit) continue;
      const entry = findSymptomEntry(s.symptomKey);
      const symptomLabel = entry ? t(entry.labelKey) : s.symptomKey;
      const days = daysSince(s.startedAt);
      const codeInfo = ICD10_SUBSET.find((c) => c.code === s.suggestedCode);
      if (!codeInfo) continue;
      byCode.set(s.suggestedCode, {
        code: codeInfo,
        provenance:
          days !== null
            ? t('diagnosis.patientReported', { symptom: symptomLabel, count: days })
            : t('diagnosis.patientReportedNoDate', { symptom: symptomLabel }),
      });
    }

    return [...byCode.values()];
  }, [activeConditions, symptomLogs, appointmentId, t]);

  /**
   * Browse tab (spec §6.1): chapter → category → code drill-down, for when
   * the clinician knows the clinical neighborhood but not the exact term.
   */
  const chapters = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of ICD10_SUBSET) {
      if (!c.chapter) continue;
      counts.set(c.chapter, (counts.get(c.chapter) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const categoriesInChapter = useMemo(() => {
    if (!browseChapter) return [];
    const counts = new Map<string, number>();
    for (const c of ICD10_SUBSET) {
      if (c.chapter !== browseChapter || !c.category) continue;
      counts.set(c.category, (counts.get(c.category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [browseChapter]);

  const codesInCategory = useMemo(() => {
    if (!browseChapter || !browseCategory) return [];
    return ICD10_SUBSET.filter((c) => c.chapter === browseChapter && c.category === browseCategory).sort((a, b) =>
      a.code.localeCompare(b.code),
    );
  }, [browseChapter, browseCategory]);

  const reset = () => {
    setTab('frequent');
    setQuery('');
    setCustomizing(null);
    setLabel('');
    setStatus('confirmed');
    setBrowseChapter(null);
    setBrowseCategory(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const selectCode = (code: Icd10Code) => {
    onSelect({ code: code.code, description: code.description, codeSystem: 'icd10cm', status: 'confirmed' });
    close();
  };

  const openCustomize = (code: Icd10Code) => {
    setCustomizing(code);
    setLabel('');
    setStatus('confirmed');
  };

  const confirmCustomize = () => {
    if (!customizing) return;
    onSelect({
      code: customizing.code,
      description: customizing.description,
      codeSystem: 'icd10cm',
      label: label.trim() || undefined,
      status,
    });
    close();
  };

  const list = tab === 'frequent' ? favorites : tab === 'search' ? searchResults : [];

  const renderRow = (code: Icd10Code) => {
    const isSelected = selectedCodes.has(code.code);
    const rowLabel = code.isBillable
      ? `${code.code}: ${code.description}`
      : `${code.code}: ${code.description}. ${t('diagnosis.notBillableHelp')}`;
    return (
      <View key={code.code} style={styles.row}>
        <TouchableOpacity
          style={styles.rowMain}
          onPress={() => selectCode(code)}
          accessibilityRole="button"
          accessibilityLabel={rowLabel}
        >
          {isSelected && <FontAwesome name="check" size={14} color={Colors.primary} style={styles.rowCheck} />}
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowDescription} numberOfLines={2}>{code.description}</Text>
            <View style={styles.rowMeta}>
              <Text style={styles.rowCode}>{code.code}</Text>
              {!code.isBillable && (
                <View style={styles.notBillablePill}>
                  <Text style={styles.notBillablePillText}>{t('diagnosis.notBillable')}</Text>
                </View>
              )}
            </View>
            {!code.isBillable && <Text style={styles.notBillableCaption}>{t('diagnosis.notBillableHelp')}</Text>}
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => pinMutation.mutate(code.code)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('diagnosis.pin')}
        >
          <FontAwesome name="star-o" size={18} color={Colors.textGray} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openCustomize(code)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel={t('diagnosis.renameForNote')}
        >
          <FontAwesome name="pencil" size={16} color={Colors.textGray} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SheetModal visible={visible} onRequestClose={close}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={close}>
        <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
          <View style={styles.grabber} />

          {customizing ? (
            <>
              <Text style={styles.sheetTitle}>{customizing.code}</Text>
              <Text style={styles.customizeDescription}>{customizing.description}</Text>

              <Text style={styles.fieldLabel}>{t('diagnosis.renameForNote')}</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  value={label}
                  onChangeText={setLabel}
                  placeholder={customizing.description}
                  placeholderTextColor={Colors.textGray}
                  accessibilityLabel={t('diagnosis.renameForNote')}
                />
              </View>

              <View style={styles.segmented}>
                {STATUSES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStatus(s)}
                    style={[styles.segment, status === s && styles.segmentActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: status === s }}
                  >
                    <Text style={[styles.segmentText, status === s && styles.segmentTextActive]}>
                      {t(`diagnosis.${s === 'ruled_out' ? 'ruledOut' : s}`)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.customizeActions}>
                <TouchableOpacity style={styles.customizeCancel} onPress={() => setCustomizing(null)} accessibilityRole="button">
                  <Text style={styles.customizeCancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <EkoButton title={t('common.add')} variant="primary" onPress={confirmCustomize} style={styles.customizeAddBtn} />
              </View>
            </>
          ) : (
            <>
              <View style={styles.tabs}>
                <TouchableOpacity
                  onPress={() => setTab('frequent')}
                  style={[styles.tab, tab === 'frequent' && styles.tabActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === 'frequent' }}
                >
                  <Text style={[styles.tabText, tab === 'frequent' && styles.tabTextActive]}>{t('diagnosis.frequent')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTab('search')}
                  style={[styles.tab, tab === 'search' && styles.tabActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === 'search' }}
                >
                  <Text style={[styles.tabText, tab === 'search' && styles.tabTextActive]}>{t('common.search')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setTab('browse')}
                  style={[styles.tab, tab === 'browse' && styles.tabActive]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === 'browse' }}
                >
                  <Text style={[styles.tabText, tab === 'browse' && styles.tabTextActive]}>{t('diagnosis.browse')}</Text>
                </TouchableOpacity>
              </View>

              {tab === 'search' && (
                <View style={styles.searchInputWrap}>
                  <FontAwesome name="search" size={14} color={Colors.textGray} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    value={query}
                    onChangeText={setQuery}
                    placeholder={t('diagnosis.searchPlaceholder')}
                    placeholderTextColor={Colors.textGray}
                    autoFocus
                    accessibilityLabel={t('diagnosis.searchPlaceholder')}
                  />
                </View>
              )}

              {tab === 'browse' && browseChapter && (
                <TouchableOpacity
                  style={styles.browseBackRow}
                  onPress={() => (browseCategory ? setBrowseCategory(null) : setBrowseChapter(null))}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.back')}
                >
                  <FontAwesome name="chevron-left" size={13} color={Colors.primary} />
                  <Text style={styles.browseBackText} numberOfLines={1}>
                    {browseCategory ? browseChapter : t('diagnosis.browse')}
                  </Text>
                </TouchableOpacity>
              )}

              <ScrollView style={styles.list} keyboardShouldPersistTaps="handled" bounces={false}>
                {tab === 'frequent' && candidates.length > 0 && (
                  <>
                    <Text style={styles.candidatesHeader}>{t('diagnosis.forThisPatient')}</Text>
                    {candidates.map((c) => (
                      <TouchableOpacity
                        key={c.code.code}
                        style={styles.candidateRow}
                        onPress={() => selectCode(c.code)}
                        accessibilityRole="button"
                        accessibilityLabel={`${c.code.code}: ${c.code.description}`}
                      >
                        <View style={styles.rowTextWrap}>
                          <Text style={styles.rowDescription} numberOfLines={2}>{c.code.description}</Text>
                          <Text style={styles.candidateProvenance}>{c.provenance}</Text>
                        </View>
                        <Text style={styles.rowCode}>{c.code.code}</Text>
                      </TouchableOpacity>
                    ))}
                    <View style={styles.candidatesDivider} />
                  </>
                )}
                {tab === 'frequent' && loadingFavorites && (
                  <ActivityIndicator color={Colors.primary} style={styles.loading} />
                )}
                {tab === 'frequent' && !loadingFavorites && favorites.length === 0 && candidates.length === 0 && (
                  <Text style={styles.emptyText}>{t('diagnosis.emptyFrequent')}</Text>
                )}
                {tab === 'search' && query.trim().length === 0 && (
                  <Text style={styles.emptyText}>{t('diagnosis.emptySearch')}</Text>
                )}
                {tab === 'search' && searching && query.trim().length > 0 && (
                  <ActivityIndicator color={Colors.primary} style={styles.loading} />
                )}
                {tab === 'browse' && !browseChapter &&
                  chapters.map(([name, count]) => (
                    <TouchableOpacity
                      key={name}
                      style={styles.browseRow}
                      onPress={() => setBrowseChapter(name)}
                      accessibilityRole="button"
                      accessibilityLabel={name}
                    >
                      <Text style={styles.browseRowText} numberOfLines={2}>{name}</Text>
                      <View style={styles.browseRowRight}>
                        <Text style={styles.browseCount}>{count}</Text>
                        <FontAwesome name="chevron-right" size={12} color={Colors.textGray} />
                      </View>
                    </TouchableOpacity>
                  ))}
                {tab === 'browse' && browseChapter && !browseCategory &&
                  categoriesInChapter.map(([name, count]) => (
                    <TouchableOpacity
                      key={name}
                      style={styles.browseRow}
                      onPress={() => setBrowseCategory(name)}
                      accessibilityRole="button"
                      accessibilityLabel={name}
                    >
                      <Text style={styles.browseRowText}>{name}</Text>
                      <View style={styles.browseRowRight}>
                        <Text style={styles.browseCount}>{count}</Text>
                        <FontAwesome name="chevron-right" size={12} color={Colors.textGray} />
                      </View>
                    </TouchableOpacity>
                  ))}
                {tab === 'browse' && browseChapter && browseCategory && codesInCategory.map(renderRow)}
                {list.map(renderRow)}
              </ScrollView>
            </>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </SheetModal>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, height: '78%',
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderGray, marginBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.textDark, fontFamily: 'monospace' },

  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: Colors.bgGray,
  },
  tabActive: { backgroundColor: Colors.primaryFaded },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, fontFamily: 'Poppins_600SemiBold' },
  tabTextActive: { color: Colors.primary },

  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.field, borderRadius: 12,
    paddingHorizontal: 14, height: 48, marginBottom: 12,
  },
  searchIcon: {},
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  browseBackRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, marginBottom: 4 },
  browseBackText: { flex: 1, fontSize: 14, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  browseRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  browseRowText: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  browseRowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  browseCount: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },

  list: { flex: 1 },
  loading: { marginTop: 24 },
  emptyText: {
    fontSize: 13, color: Colors.textGray, textAlign: 'center',
    marginTop: 24, paddingHorizontal: 16, lineHeight: 19, fontFamily: 'Poppins_400Regular',
  },

  candidatesHeader: {
    fontSize: 11, fontWeight: '700', color: Colors.textGray, textTransform: 'uppercase',
    letterSpacing: 0.4, marginBottom: 6, fontFamily: 'Poppins_600SemiBold',
  },
  candidateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  candidateProvenance: { fontSize: 11, color: Colors.primary, marginTop: 2, fontFamily: 'Poppins_500Medium' },
  candidatesDivider: { height: 10 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  rowCheck: { marginTop: 3, marginRight: 8 },
  rowTextWrap: { flex: 1 },
  rowDescription: { fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_500Medium', lineHeight: 19 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  rowCode: { fontSize: 12, color: Colors.textGray, fontFamily: 'monospace' },
  notBillablePill: {
    backgroundColor: Colors.warning + '22', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  notBillablePillText: { fontSize: 10, color: Colors.warning, fontFamily: 'Poppins_600SemiBold' },
  notBillableCaption: { fontSize: 11, color: Colors.warning, marginTop: 3, fontFamily: 'Poppins_400Regular' },

  customizeDescription: { fontSize: 14, color: Colors.textMedium, marginTop: 4, marginBottom: 18, fontFamily: 'Poppins_400Regular' },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  inputWrap: {
    backgroundColor: Colors.field, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 16, marginBottom: 16,
  },
  input: { fontSize: 14, color: Colors.textDark, height: 50, fontFamily: 'Poppins_400Regular' },

  segmented: { flexDirection: 'row', backgroundColor: Colors.bgGray, borderRadius: 12, padding: 4, marginBottom: 20 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9 },
  segmentActive: { backgroundColor: Colors.surface },
  segmentText: { fontSize: 12, color: Colors.textMedium, fontFamily: 'Poppins_600SemiBold' },
  segmentTextActive: { color: Colors.textDark },

  customizeActions: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 'auto' },
  customizeCancel: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: Colors.borderGray },
  customizeCancelText: { fontSize: 15, color: Colors.textMedium, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  customizeAddBtn: { flex: 1 },
});
