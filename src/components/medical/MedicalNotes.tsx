import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity,
  Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import EkoButton from '../common/EkoButton';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../i18n/useTranslation';
import { useMedicalNotes, usePracticeAppointments } from '../../hooks/queries';
import { MONTH_NAMES } from '../../utils/format';
import type { Appointment, MedicalNote, MedicalNoteInput, NoteAmendment, PatientSummary } from '../../api/types';

/** "Jun 10, 2026 · 3:10 PM" from an ISO timestamp, without relying on Intl. */
function formatAmendmentTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const month = MONTH_NAMES[d.getMonth()]?.slice(0, 3) ?? '';
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${month} ${d.getDate()}, ${d.getFullYear()} · ${hours}:${minutes} ${ampm}`;
}

interface Props {
  patient: PatientSummary;
  /** Existing record. A 'final' note → locked read-only view; a 'draft' → editable. */
  note?: MedicalNote;
  /** Finalize (lock) the record. */
  onSave: (input: MedicalNoteInput) => void;
  saving?: boolean;
  /** Save as a resumable draft (create or update). */
  onSaveDraft?: (input: MedicalNoteInput) => void;
  savingDraft?: boolean;
  /** Append an amendment to the locked record. Returns the updated record. */
  onAddAmendment?: (text: string) => Promise<MedicalNote | void> | void;
  amendmentSaving?: boolean;
}

/** The three free-text SOAP sections; Assessment is rendered specially between O and P. */
const TEXT_SECTIONS = {
  subjective: { labelKey: 'patients.subjective', helperKey: 'patients.subjectiveHelper' },
  objective: { labelKey: 'patients.objective', helperKey: 'patients.objectiveHelper' },
  plan: { labelKey: 'patients.plan', helperKey: 'patients.planHelper' },
} as const;

type TextKey = keyof typeof TEXT_SECTIONS;

/** Notes can only document real visits — booked or completed, not pending. */
const LINKABLE_STATUSES = ['past', 'upcoming'];

/**
 * SOAP-format visit note form. Mode is derived: no note → create; a 'draft'
 * note → resume editing; a 'final' note → locked, read-only with amendments.
 * The Assessment section captures a structured Primary Diagnosis plus any number
 * of Secondary Diagnoses. Saving is a two-step commit: Save Draft keeps it
 * editable; Save (behind a confirmation) locks it permanently.
 */
export default function MedicalNotes({ patient, note, onSave, saving = false, onSaveDraft, savingDraft = false, onAddAmendment, amendmentSaving = false }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { user } = useAuth();

  // A 'final' record is locked forever; a 'draft' is still editable by its
  // author. Legacy records without a status are treated as final.
  const isFinal = !!note && (note.status ?? 'final') === 'final';
  const readOnly = isFinal;
  const creating = !note;
  const editingDraft = !!note && !isFinal;
  const editable = !readOnly;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState(note?.reason ?? '');
  const [text, setText] = useState<Record<TextKey, string>>({
    subjective: note?.subjective ?? '',
    objective: note?.objective ?? '',
    plan: note?.plan ?? '',
  });
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState(note?.primaryDiagnosis ?? '');
  const [secondaryDiagnoses, setSecondaryDiagnoses] = useState<string[]>(note?.secondaryDiagnoses ?? []);

  // Amendments trail (final records only).
  const [amendments, setAmendments] = useState<NoteAmendment[]>(note?.amendments ?? []);
  const [amending, setAmending] = useState(false);
  const [amendmentText, setAmendmentText] = useState('');

  const submitAmendment = async () => {
    const value = amendmentText.trim();
    if (!value || !onAddAmendment) return;
    const updated = await onAddAmendment(value);
    if (updated && updated.amendments) {
      setAmendments(updated.amendments);
    } else {
      setAmendments((prev) => [
        ...prev,
        {
          id: `amd-local-${Date.now()}`,
          text: value,
          authorId: user?.id ?? '',
          authorName: note?.doctorId === user?.id && note ? note.doctorName : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setAmendmentText('');
    setAmending(false);
  };

  // Picker data — only needed when creating.
  const { data: schedule = [] } = usePracticeAppointments(creating);
  const { data: existingNotes = [] } = useMedicalNotes(creating ? patient.id : '');

  const linkable = useMemo(
    () => schedule.filter((a) => a.patientId === patient.id && LINKABLE_STATUSES.includes(a.status)),
    [schedule, patient.id],
  );
  const notedAppointmentIds = useMemo(
    () => new Set(existingNotes.filter((n) => n.doctorId === user?.id && (n.status ?? 'final') === 'final').map((n) => n.appointmentId)),
    [existingNotes, user?.id],
  );

  const setTextSection = (key: TextKey, value: string) => setText((prev) => ({ ...prev, [key]: value }));
  const setSecondary = (i: number, value: string) =>
    setSecondaryDiagnoses((prev) => prev.map((d, idx) => (idx === i ? value : d)));
  const addSecondary = () => setSecondaryDiagnoses((prev) => [...prev, '']);
  const removeSecondary = (i: number) => setSecondaryDiagnoses((prev) => prev.filter((_, idx) => idx !== i));

  // A visit must be linked; a draft needs at least a reason; finalizing also
  // requires a primary diagnosis (the minimum for a real assessment).
  const hasVisit = creating ? !!appointment : true;
  const canDraft = hasVisit && reason.trim().length > 0;
  const canFinalize = canDraft && primaryDiagnosis.trim().length > 0;

  const pickAppointment = (a: Appointment) => {
    setAppointment(a);
    if (!reason.trim()) setReason(a.specialty);
    setPickerOpen(false);
  };

  const buildInput = (status: 'draft' | 'final'): MedicalNoteInput => ({
    patientId: patient.id,
    appointmentId: note?.appointmentId ?? appointment!.id,
    date: note?.date ?? appointment!.date,
    visitType: note?.visitType ?? appointment!.type,
    reason: reason.trim(),
    subjective: text.subjective.trim(),
    objective: text.objective.trim(),
    assessment: primaryDiagnosis.trim(),
    primaryDiagnosis: primaryDiagnosis.trim(),
    secondaryDiagnoses: secondaryDiagnoses.map((d) => d.trim()).filter(Boolean),
    plan: text.plan.trim(),
    status,
  });

  const handleSaveDraft = () => {
    if (!canDraft || !onSaveDraft) return;
    onSaveDraft(buildInput('draft'));
  };

  const confirmSave = () => {
    setConfirmOpen(false);
    onSave(buildInput('final'));
  };

  const renderTextSection = (key: TextKey) => {
    const meta = TEXT_SECTIONS[key];
    return (
      <View key={key}>
        <Text style={styles.fieldLabel}>{t(meta.labelKey)}</Text>
        {readOnly ? (
          <View style={styles.readCard}>
            <Text style={styles.readText}>{note![key] || '—'}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.helper}>{t(meta.helperKey)}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder={t(meta.labelKey)}
                placeholderTextColor={Colors.textGray}
                value={text[key]}
                onChangeText={(val) => setTextSection(key, val)}
                multiline
                textAlignVertical="top"
                accessibilityLabel={t(meta.labelKey)}
              />
            </View>
          </>
        )}
      </View>
    );
  };

  const renderAssessment = () => (
    <View>
      <Text style={styles.fieldLabel}>{t('patients.assessment')}</Text>
      {readOnly ? (
        note!.primaryDiagnosis ? (
          <View style={styles.readCard}>
            <Text style={styles.dxLabel}>{t('patients.primaryDiagnosis')}</Text>
            <Text style={styles.readText}>{note!.primaryDiagnosis || '—'}</Text>
            {note!.secondaryDiagnoses && note!.secondaryDiagnoses.length > 0 ? (
              <>
                <Text style={[styles.dxLabel, { marginTop: 10 }]}>{t('patients.secondaryDiagnosis')}</Text>
                {note!.secondaryDiagnoses.map((d, i) => (
                  <Text key={i} style={styles.readText}>• {d}</Text>
                ))}
              </>
            ) : null}
          </View>
        ) : (
          <View style={styles.readCard}>
            <Text style={styles.readText}>{note!.assessment || '—'}</Text>
          </View>
        )
      ) : (
        <>
          <Text style={styles.helper}>{t('patients.assessmentHelper')}</Text>
          <Text style={styles.dxLabel}>{t('patients.primaryDiagnosis')}</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder={t('patients.primaryDiagnosisPlaceholder')}
              placeholderTextColor={Colors.textGray}
              value={primaryDiagnosis}
              onChangeText={setPrimaryDiagnosis}
              accessibilityLabel={t('patients.primaryDiagnosis')}
            />
          </View>

          {secondaryDiagnoses.length > 0 && (
            <Text style={styles.dxLabel}>{t('patients.secondaryDiagnosis')}</Text>
          )}
          {secondaryDiagnoses.map((d, i) => (
            <View key={i} style={styles.secondaryRow}>
              <View style={[styles.inputWrap, styles.secondaryInputWrap]}>
                <TextInput
                  style={styles.input}
                  placeholder={t('patients.secondaryDiagnosisPlaceholder')}
                  placeholderTextColor={Colors.textGray}
                  value={d}
                  onChangeText={(val) => setSecondary(i, val)}
                  accessibilityLabel={`${t('patients.secondaryDiagnosis')} ${i + 1}`}
                />
              </View>
              <TouchableOpacity
                onPress={() => removeSecondary(i)}
                style={styles.removeDx}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={t('patients.removeDiagnosis')}
              >
                <FontAwesome name="times-circle" size={20} color={Colors.textGray} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity onPress={addSecondary} style={styles.addDxLink} accessibilityRole="button">
            <Text style={styles.addDxText}>{t('patients.addSecondaryDiagnosis')}</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {readOnly && (
          <View style={styles.readOnlyBanner}>
            <FontAwesome name="lock" size={14} color={Colors.textMedium} />
            <Text style={styles.readOnlyText}>
              {t('patients.lockedRecord', { doctor: note!.doctorName })}
            </Text>
          </View>
        )}
        {editingDraft && (
          <View style={styles.draftBanner}>
            <FontAwesome name="pencil-square-o" size={14} color={Colors.accent} />
            <Text style={styles.draftBannerText}>{t('patients.draftBanner')}</Text>
          </View>
        )}

        {/* Linked appointment */}
        <Text style={styles.fieldLabel}>{t('patients.appointment')}</Text>
        {creating ? (
          <TouchableOpacity style={styles.appointmentField} onPress={() => setPickerOpen(true)} activeOpacity={0.7}>
            <FontAwesome name="calendar" size={16} color={appointment ? Colors.primary : Colors.textGray} style={styles.fieldIcon} />
            {appointment ? (
              <Text style={styles.appointmentValue}>
                {appointment.date} · {appointment.time} · {appointment.type}
              </Text>
            ) : (
              <Text style={styles.appointmentPlaceholder}>{t('patients.selectVisitDocuments')}</Text>
            )}
            <FontAwesome name="chevron-down" size={13} color={Colors.textGray} />
          </TouchableOpacity>
        ) : (
          <View style={styles.appointmentFixed}>
            <FontAwesome name="calendar-check-o" size={15} color={Colors.primary} style={styles.fieldIcon} />
            <Text style={styles.appointmentValue}>
              {note!.date}{note!.visitType ? ` · ${note!.visitType}` : ''}
            </Text>
          </View>
        )}

        {/* Reason for visit */}
        <Text style={styles.fieldLabel}>{t('patients.visitReason')}</Text>
        {readOnly ? (
          <View style={styles.readCard}>
            <Text style={styles.readText}>{note!.reason}</Text>
          </View>
        ) : (
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder={t('patients.reasonPlaceholder')}
              placeholderTextColor={Colors.textGray}
              value={reason}
              onChangeText={setReason}
              accessibilityLabel={t('patients.visitReason')}
            />
          </View>
        )}

        {/* SOAP — Subjective, Objective, Assessment (structured), Plan */}
        {renderTextSection('subjective')}
        {renderTextSection('objective')}
        {renderAssessment()}
        {renderTextSection('plan')}

        {editable && (
          <View style={styles.saveRow}>
            <EkoButton
              title={t('patients.saveDraft')}
              variant="outline"
              onPress={handleSaveDraft}
              loading={savingDraft}
              disabled={!canDraft}
              style={styles.draftBtn}
            />
            <EkoButton
              title={t('common.save')}
              variant="primary"
              onPress={() => setConfirmOpen(true)}
              disabled={!canFinalize}
              style={styles.saveBtn}
            />
          </View>
        )}

        {/* Amendments — the only way to change a locked record. */}
        {readOnly && (
          <View style={styles.amendmentsSection}>
            <View style={styles.amendmentsHeader}>
              <FontAwesome name="file-text-o" size={14} color={Colors.textMedium} />
              <Text style={styles.amendmentsTitle}>
                {t('patients.amendments')}{amendments.length > 0 ? ` (${amendments.length})` : ''}
              </Text>
            </View>

            {amendments.length === 0 && !amending && (
              <Text style={styles.amendmentsEmpty}>{t('patients.noAmendments')}</Text>
            )}

            {amendments.map((a, i) => (
              <View key={a.id} style={styles.amendmentCard}>
                <View style={styles.amendmentTop}>
                  <Text style={styles.amendmentLabel}>{t('patients.amendmentN', { n: i + 1 })}</Text>
                  <Text style={styles.amendmentMeta}>{formatAmendmentTime(a.createdAt)}</Text>
                </View>
                <Text style={styles.amendmentText}>{a.text}</Text>
                <Text style={styles.amendmentAuthor}>{t('patients.authoredBy', { doctor: a.authorName })}</Text>
              </View>
            ))}

            {amending ? (
              <View style={styles.amendmentEditor}>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    placeholder={t('patients.amendmentPlaceholder')}
                    placeholderTextColor={Colors.textGray}
                    value={amendmentText}
                    onChangeText={setAmendmentText}
                    multiline
                    textAlignVertical="top"
                    accessibilityLabel={t('patients.addAmendment')}
                  />
                </View>
                <View style={styles.amendmentActions}>
                  <TouchableOpacity
                    style={styles.amendmentCancel}
                    onPress={() => { setAmending(false); setAmendmentText(''); }}
                    accessibilityRole="button"
                    accessibilityLabel={t('common.cancel')}
                  >
                    <Text style={styles.amendmentCancelText}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                  <EkoButton
                    title={t('patients.saveAmendment')}
                    variant="primary"
                    size="sm"
                    onPress={submitAmendment}
                    loading={amendmentSaving}
                    disabled={!amendmentText.trim()}
                    style={styles.amendmentSaveBtn}
                  />
                </View>
              </View>
            ) : (
              <EkoButton
                title={t('patients.addAmendment')}
                variant="outline"
                onPress={() => setAmending(true)}
                style={styles.addAmendmentBtn}
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Appointment picker sheet */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text style={styles.sheetTitle}>{t('patients.selectAppointment')}</Text>
            <Text style={styles.sheetSub}>{t('patients.visitsWith', { name: patient.name })}</Text>

            {linkable.length === 0 ? (
              <View style={styles.sheetEmpty}>
                <FontAwesome name="calendar-times-o" size={32} color={Colors.textLight} />
                <Text style={styles.sheetEmptyText}>
                  {t('patients.noEligibleAppointments')}
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.sheetScroll} bounces={false}>
                {linkable.map((a) => {
                  const noted = notedAppointmentIds.has(a.id);
                  return (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.aptRow, noted && styles.aptRowDisabled]}
                      onPress={() => pickAppointment(a)}
                      disabled={noted}
                    >
                      <View style={[styles.aptIcon, noted && { backgroundColor: Colors.bgGray }]}>
                        <FontAwesome
                          name={a.status === 'past' ? 'check' : 'clock-o'}
                          size={14}
                          color={noted ? Colors.textLight : Colors.primary}
                        />
                      </View>
                      <View style={styles.aptInfo}>
                        <Text style={[styles.aptDate, noted && { color: Colors.textLight }]}>
                          {a.date} · {a.time}
                        </Text>
                        <Text style={styles.aptMeta}>{a.type} · {a.specialty}</Text>
                      </View>
                      {noted && (
                        <View style={styles.notedTag}>
                          <Text style={styles.notedTagText}>{t('patients.noteAddedTag')}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Save confirmation — records are immutable once finalized. */}
      <Modal visible={confirmOpen} transparent animationType="fade" onRequestClose={() => setConfirmOpen(false)}>
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <FontAwesome name="lock" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.confirmTitle}>{t('patients.confirmSaveTitle')}</Text>
            <Text style={styles.confirmBody}>{t('patients.confirmSaveBody')}</Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity style={styles.confirmCancel} onPress={() => setConfirmOpen(false)} accessibilityRole="button">
                <Text style={styles.confirmCancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <EkoButton
                title={t('patients.confirmSaveButton')}
                variant="primary"
                onPress={confirmSave}
                loading={saving}
                style={styles.confirmSaveBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },

  readOnlyBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.bgGray, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  readOnlyText: { flex: 1, fontSize: 13, color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },
  draftBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.accent + '14', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  draftBannerText: { flex: 1, fontSize: 13, color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },

  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  helper: { fontSize: 11, color: Colors.textGray, marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_400Regular' },
  fieldIcon: { marginRight: 10 },

  dxLabel: { fontSize: 12, fontWeight: '700', color: Colors.textGray, marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold' },
  secondaryRow: { flexDirection: 'row', alignItems: 'center' },
  secondaryInputWrap: { flex: 1 },
  removeDx: { paddingLeft: 10, paddingBottom: 16 },
  addDxLink: { paddingVertical: 4, marginBottom: 16 },
  addDxText: { fontSize: 14, color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  appointmentField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.field, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 16, height: 54, marginBottom: 16,
  },
  appointmentFixed: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryFaded, borderRadius: 12,
    paddingHorizontal: 16, height: 48, marginBottom: 16,
  },
  appointmentValue: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  appointmentPlaceholder: { flex: 1, fontSize: 14, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },

  inputWrap: {
    backgroundColor: Colors.field, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent',
    paddingHorizontal: 16, marginBottom: 16,
  },
  input: { fontSize: 14, color: Colors.textDark, height: 50, fontFamily: 'Poppins_400Regular' },
  multiline: { height: 104, paddingTop: 14, paddingBottom: 14 },

  readCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  readText: { fontSize: 14, color: Colors.textDark, lineHeight: 21, fontFamily: 'Poppins_400Regular' },

  saveRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  draftBtn: { flex: 1 },
  saveBtn: { flex: 1 },

  // Amendments
  amendmentsSection: {
    marginTop: 20, borderTopWidth: 1, borderTopColor: Colors.borderGray, paddingTop: 18,
  },
  amendmentsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  amendmentsTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  amendmentsEmpty: { fontSize: 13, color: Colors.textGray, marginBottom: 14, fontFamily: 'Poppins_400Regular' },
  amendmentCard: {
    backgroundColor: Colors.surface, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderGray,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  amendmentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  amendmentLabel: { fontSize: 12, fontWeight: '700', color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
  amendmentMeta: { fontSize: 11, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  amendmentText: { fontSize: 14, color: Colors.textDark, lineHeight: 21, fontFamily: 'Poppins_400Regular' },
  amendmentAuthor: { fontSize: 12, color: Colors.textGray, marginTop: 8, fontFamily: 'Poppins_500Medium' },
  amendmentEditor: { marginTop: 4 },
  amendmentActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: -4 },
  amendmentCancel: { paddingVertical: 10, paddingHorizontal: 8 },
  amendmentCancelText: { fontSize: 14, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  amendmentSaveBtn: { paddingHorizontal: 24 },
  addAmendmentBtn: { marginTop: 4 },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, maxHeight: '70%',
  },
  grabber: {
    alignSelf: 'center', width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.borderGray, marginBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  sheetSub: { fontSize: 13, color: Colors.textGray, marginTop: 2, marginBottom: 12, fontFamily: 'Poppins_400Regular' },
  sheetScroll: { flexGrow: 0 },

  aptRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  aptRowDisabled: { opacity: 0.75 },
  aptIcon: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  aptInfo: { flex: 1 },
  aptDate: { fontSize: 14, fontWeight: '600', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  aptMeta: { fontSize: 12, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  notedTag: {
    backgroundColor: Colors.bgGray, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  notedTagText: { fontSize: 11, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  sheetEmpty: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  sheetEmptyText: {
    fontSize: 13, color: Colors.textGray, textAlign: 'center',
    marginTop: 12, lineHeight: 19, fontFamily: 'Poppins_400Regular',
  },

  // Confirm modal
  confirmOverlay: { flex: 1, backgroundColor: Colors.overlay, alignItems: 'center', justifyContent: 'center', padding: 32 },
  confirmCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 24, width: '100%', alignItems: 'center',
  },
  confirmIcon: {
    width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  confirmTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, textAlign: 'center', fontFamily: 'Poppins_700Bold' },
  confirmBody: { fontSize: 14, color: Colors.textMedium, textAlign: 'center', lineHeight: 21, marginTop: 8, marginBottom: 20, fontFamily: 'Poppins_400Regular' },
  confirmActions: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'stretch' },
  confirmCancel: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: Colors.borderGray },
  confirmCancelText: { fontSize: 15, color: Colors.textMedium, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  confirmSaveBtn: { flex: 1 },
});
