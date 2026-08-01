import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import SheetModal from '../common/SheetModal';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import EkoButton from '../common/EkoButton';
import { useAddCondition } from '../../hooks/queries';
import { useTranslation } from '../../i18n/useTranslation';
import type { CodedDiagnosis } from '../../api/types';

/**
 * Chronic-leaning chapters (spec §6.3) default to checked: E00-E89
 * (endocrine/metabolic), I00-I99 (circulatory), F01-F99 (mental/behavioural),
 * plus a small curated set of chronic codes that fall outside those chapters
 * but are still ongoing conditions (asthma, COPD, CKD, RA...).
 */
const CHRONIC_CHAPTER_LETTERS = new Set(['E', 'I', 'F']);
const CHRONIC_CODE_PREFIXES = ['J45', 'J44', 'N18', 'M05', 'M06', 'M32'];

function isChronicLeaning(code: string): boolean {
  const letter = code.charAt(0).toUpperCase();
  if (CHRONIC_CHAPTER_LETTERS.has(letter)) return true;
  return CHRONIC_CODE_PREFIXES.some((p) => code.startsWith(p));
}

interface Props {
  visible: boolean;
  patientId: string;
  sourceNoteId?: string;
  /** Confirmed, coded diagnoses not already on the patient's active problem list. */
  candidates: CodedDiagnosis[];
  /** Called once, whether the user confirmed, skipped, or dismissed the sheet. */
  onDone: () => void;
}

/**
 * Post-finalize sheet (spec §6.3) — the only automatic write to the problem
 * list, and it's always user-confirmed. Never shown for diagnoses without a
 * code (nothing to add) or with status other than 'confirmed'.
 */
export default function AddToConditionsSheet({ visible, patientId, sourceNoteId, candidates, onDone }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const addCondition = useAddCondition(patientId);
  const [checked, setChecked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible) {
      setChecked(new Set(candidates.filter((d) => d.code && isChronicLeaning(d.code)).map((d) => d.code!)));
    }
  }, [visible, candidates]);

  const toggle = (code: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const confirm = async () => {
    const selected = candidates.filter((d) => d.code && checked.has(d.code));
    try {
      await Promise.all(
        selected.map((dx) => addCondition.mutateAsync({ diagnosis: dx, sourceNoteId })),
      );
    } catch {
      // Best-effort: the note is already finalized and saved regardless —
      // a failed problem-list write isn't worth blocking the provider on.
    }
    onDone();
  };

  return (
    <SheetModal visible={visible} onRequestClose={onDone}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{t('diagnosis.addToConditions')}</Text>
          <Text style={styles.help}>{t('diagnosis.addToConditionsHelp')}</Text>

          <ScrollView style={styles.list} bounces={false}>
            {candidates.map((dx) => {
              const isChecked = !!dx.code && checked.has(dx.code);
              return (
                <TouchableOpacity
                  key={dx.code}
                  style={styles.row}
                  onPress={() => dx.code && toggle(dx.code)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isChecked }}
                  accessibilityLabel={`${dx.code}: ${dx.label ?? dx.description}`}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <FontAwesome name="check" size={12} color={Colors.white} />}
                  </View>
                  <View style={styles.rowText}>
                    <Text style={styles.rowCode}>{dx.code}</Text>
                    <Text style={styles.rowDescription}>{dx.label ?? dx.description}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onDone} accessibilityRole="button">
              <Text style={styles.skipText}>{t('common.skip')}</Text>
            </TouchableOpacity>
            <EkoButton title={t('common.confirm')} variant="primary" onPress={confirm} loading={addCondition.isPending} style={styles.confirmBtn} />
          </View>
        </View>
      </View>
    </SheetModal>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 32, maxHeight: '75%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 14 },
  title: { fontSize: 17, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  help: { fontSize: 13, color: Colors.textGray, marginTop: 4, marginBottom: 16, lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  list: { flexGrow: 0, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: Colors.borderGray,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  rowText: { flex: 1 },
  rowCode: { fontSize: 11, color: Colors.textGray, fontFamily: 'monospace' },
  rowDescription: { fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },

  actions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: { paddingVertical: 12, paddingHorizontal: 12 },
  skipText: { fontSize: 15, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  confirmBtn: { flex: 1 },
});
