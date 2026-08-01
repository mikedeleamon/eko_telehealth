import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import SheetModal from '../common/SheetModal';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import EkoButton from '../common/EkoButton';
import { usePatientConditions, useUpdateCondition } from '../../hooks/queries';
import { useTranslation } from '../../i18n/useTranslation';
import type { PatientCondition } from '../../api/types';

interface Props {
  patientId: string;
}

/**
 * The provider's problem-list card (spec §6.4) — active conditions with onset
 * + author, resolved ones collapsed behind a toggle. Row actions never touch
 * `code`/`description` (see PATCH /practice/conditions/:id) — only clinical
 * status, onset date and notes.
 */
export default function ConditionsCard({ patientId }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: conditions, isLoading } = usePatientConditions(patientId);
  const updateCondition = useUpdateCondition(patientId);
  const [showResolved, setShowResolved] = useState(false);
  const [editing, setEditing] = useState<PatientCondition | null>(null);
  const [onsetDate, setOnsetDate] = useState('');
  const [notes, setNotes] = useState('');

  const { active, resolved } = useMemo(() => {
    const list = conditions ?? [];
    return {
      active: list.filter((c) => c.clinicalStatus === 'active'),
      resolved: list.filter((c) => c.clinicalStatus !== 'active'),
    };
  }, [conditions]);

  const openEdit = (condition: PatientCondition) => {
    setEditing(condition);
    setOnsetDate(condition.onsetDate ?? '');
    setNotes(condition.notes ?? '');
  };

  const saveEdit = () => {
    if (!editing) return;
    updateCondition.mutate(
      { id: editing.id, input: { onsetDate: onsetDate.trim() || undefined, notes: notes.trim() || undefined } },
      {
        onError: (err) => Alert.alert('', err instanceof Error ? err.message : t('common.somethingWentWrong')),
        onSuccess: () => setEditing(null),
      },
    );
  };

  const resolve = (condition: PatientCondition) => {
    Alert.alert(t('conditions.resolve'), condition.diagnosis.label ?? condition.diagnosis.description, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('conditions.resolve'),
        onPress: () =>
          updateCondition.mutate({
            id: condition.id,
            input: { clinicalStatus: 'resolved', resolvedDate: new Date().toISOString().slice(0, 10) },
          }),
      },
    ]);
  };

  const markInactive = (condition: PatientCondition) => {
    Alert.alert(t('conditions.markInactive'), condition.diagnosis.label ?? condition.diagnosis.description, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('conditions.markInactive'),
        onPress: () => updateCondition.mutate({ id: condition.id, input: { clinicalStatus: 'inactive' } }),
      },
    ]);
  };

  if (isLoading) {
    return (
      <>
        <Text style={styles.sectionTitle}>{t('conditions.title')}</Text>
        <ActivityIndicator color={Colors.primary} style={styles.loader} />
      </>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>{t('conditions.title')}</Text>
      <View style={styles.card}>
        {active.length === 0 && resolved.length === 0 ? (
          <Text style={styles.emptyText}>{t('conditions.emptyStateProvider')}</Text>
        ) : (
          <>
            {active.length === 0 && <Text style={styles.emptyText}>{t('conditions.emptyStateProvider')}</Text>}
            {active.map((c, i) => (
              <ConditionRow
                key={c.id}
                condition={c}
                isFirst={i === 0}
                onResolve={() => resolve(c)}
                onMarkInactive={() => markInactive(c)}
                onEdit={() => openEdit(c)}
              />
            ))}

            {resolved.length > 0 && (
              <>
                <TouchableOpacity
                  style={styles.toggleRow}
                  onPress={() => setShowResolved((v) => !v)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showResolved }}
                >
                  <Text style={styles.toggleText}>
                    {showResolved ? t('conditions.hideResolved') : t('conditions.showResolved')}
                  </Text>
                  <FontAwesome name={showResolved ? 'chevron-up' : 'chevron-down'} size={11} color={Colors.primary} />
                </TouchableOpacity>
                {showResolved &&
                  resolved.map((c, i) => (
                    <ConditionRow key={c.id} condition={c} isFirst={i === 0} onEdit={() => openEdit(c)} readOnly />
                  ))}
              </>
            )}
          </>
        )}
      </View>

      <SheetModal visible={!!editing} onRequestClose={() => setEditing(null)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.overlay}>
            <View style={styles.sheet}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>{editing?.diagnosis.label ?? editing?.diagnosis.description}</Text>

              <Text style={styles.fieldLabel}>{t('conditions.onsetDate')}</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} value={onsetDate} onChangeText={setOnsetDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textGray} />
              </View>

              <Text style={styles.fieldLabel}>{t('labs.notes')}</Text>
              <View style={styles.inputWrap}>
                <TextInput style={[styles.input, styles.multiline]} value={notes} onChangeText={setNotes} multiline textAlignVertical="top" placeholderTextColor={Colors.textGray} />
              </View>

              <View style={styles.sheetActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)} accessibilityRole="button">
                  <Text style={styles.cancelText}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <EkoButton title={t('common.save')} variant="primary" onPress={saveEdit} loading={updateCondition.isPending} style={styles.saveBtn} />
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SheetModal>
    </>
  );
}

function ConditionRow({
  condition,
  isFirst,
  onResolve,
  onMarkInactive,
  onEdit,
  readOnly,
}: {
  condition: PatientCondition;
  isFirst: boolean;
  onResolve?: () => void;
  onMarkInactive?: () => void;
  onEdit: () => void;
  readOnly?: boolean;
}) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();

  return (
    <View style={[styles.row, !isFirst && styles.rowDivider]}>
      <View style={styles.rowText}>
        <Text style={styles.description}>{condition.diagnosis.label ?? condition.diagnosis.description}</Text>
        {!!condition.diagnosis.code && <Text style={styles.code}>{condition.diagnosis.code}</Text>}
        {!!condition.onsetDate && <Text style={styles.meta}>{t('conditions.onsetDate')}: {condition.onsetDate}</Text>}
        <Text style={styles.meta}>{t('conditions.addedBy', { name: condition.addedByName })}</Text>
      </View>
      <View style={styles.rowActions}>
        <TouchableOpacity onPress={onEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('conditions.editOnset')}>
          <FontAwesome name="pencil" size={15} color={Colors.textGray} />
        </TouchableOpacity>
        {!readOnly && (
          <>
            <TouchableOpacity onPress={onMarkInactive} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('conditions.markInactive')}>
              <FontAwesome name="eye-slash" size={15} color={Colors.textGray} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onResolve} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={t('conditions.resolve')}>
              <FontAwesome name="check-circle-o" size={16} color={Colors.green} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textGray, marginTop: 16, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.6, fontFamily: 'Poppins_600SemiBold',
  },
  loader: { marginVertical: 12 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  emptyText: { fontSize: 13, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },

  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10 },
  rowDivider: { borderTopWidth: 1, borderTopColor: Colors.borderGray },
  rowText: { flex: 1, paddingRight: 10 },
  description: { fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  code: { fontSize: 11, color: Colors.textGray, marginTop: 2, fontFamily: 'monospace' },
  meta: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingTop: 12 },
  toggleText: { fontSize: 12, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 32 },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 14 },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 16, fontFamily: 'Poppins_700Bold' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 6, fontFamily: 'Poppins_600SemiBold' },
  inputWrap: { backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, marginBottom: 16 },
  input: { fontSize: 14, color: Colors.textDark, height: 48, fontFamily: 'Poppins_400Regular' },
  multiline: { height: 84, paddingTop: 12, paddingBottom: 12 },
  sheetActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 12 },
  cancelText: { fontSize: 15, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  saveBtn: { flex: 1 },
});
