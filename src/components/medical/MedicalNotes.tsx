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
  /** Existing record → locked, read-only view with amendments. Absent → create. */
  note?: MedicalNote;
  onSave: (input: MedicalNoteInput) => void;
  saving?: boolean;
  /** Append an amendment to the locked record. Returns the updated record. */
  onAddAmendment?: (text: string) => Promise<MedicalNote | void> | void;
  amendmentSaving?: boolean;
}

const SOAP_SECTIONS = [
  { key: 'subjective', labelKey: 'patients.subjective', helperKey: 'patients.subjectiveHelper' },
  { key: 'objective', labelKey: 'patients.objective', helperKey: 'patients.objectiveHelper' },
  { key: 'assessment', labelKey: 'patients.assessment', helperKey: 'patients.assessmentHelper' },
  { key: 'plan', labelKey: 'patients.plan', helperKey: 'patients.planHelper' },
] as const;

type SoapKey = (typeof SOAP_SECTIONS)[number]['key'];

/** Notes can only document real visits — booked or completed, not pending. */
const LINKABLE_STATUSES = ['past', 'upcoming'];

/**
 * SOAP-format visit note form. Mode is derived, never passed: no note means
 * create; a note authored by the logged-in doctor means edit; anyone else's
 * note renders read-only.
 */
export default function MedicalNotes({ patient, note, onSave, saving = false, onAddAmendment, amendmentSaving = false }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { user } = useAuth();
  // A saved record is always locked: the SOAP body can never be edited, by the
  // author or anyone else. Corrections are made as amendments instead.
  const readOnly = !!note;
  const creating = !note;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [reason, setReason] = useState(note?.reason ?? '');
  const [soap, setSoap] = useState<Record<SoapKey, string>>({
    subjective: note?.subjective ?? '',
    objective: note?.objective ?? '',
    assessment: note?.assessment ?? '',
    plan: note?.plan ?? '',
  });

  // Amendments trail. Seeded from the record and appended to locally so a newly
  // added amendment shows immediately (the record arrives via route params).
  const [amendments, setAmendments] = useState<NoteAmendment[]>(note?.amendments ?? []);
  const [amending, setAmending] = useState(false);
  const [amendmentText, setAmendmentText] = useState('');

  const submitAmendment = async () => {
    const text = amendmentText.trim();
    if (!text || !onAddAmendment) return;
    const updated = await onAddAmendment(text);
    if (updated && updated.amendments) {
      setAmendments(updated.amendments);
    } else {
      // Optimistic fallback: stamp with the current doctor, matching the server.
      setAmendments((prev) => [
        ...prev,
        {
          id: `amd-local-${Date.now()}`,
          text,
          authorId: user?.id ?? '',
          authorName: note?.doctorId === user?.id && note ? note.doctorName : `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setAmendmentText('');
    setAmending(false);
  };

  // Picker data — only needed in create mode.
  const { data: schedule = [] } = usePracticeAppointments(creating);
  const { data: existingNotes = [] } = useMedicalNotes(creating ? patient.id : '');

  const linkable = useMemo(
    () => schedule.filter((a) => a.patientId === patient.id && LINKABLE_STATUSES.includes(a.status)),
    [schedule, patient.id],
  );
  /** Appointments this doctor already documented — disabled, not hidden. */
  const notedAppointmentIds = useMemo(
    () => new Set(existingNotes.filter((n) => n.doctorId === user?.id).map((n) => n.appointmentId)),
    [existingNotes, user?.id],
  );

  const setSection = (key: SoapKey, value: string) => setSoap((prev) => ({ ...prev, [key]: value }));

  const hasSoapContent = SOAP_SECTIONS.some((s) => soap[s.key].trim().length > 0);
  const valid = (creating ? !!appointment : true) && reason.trim().length > 0 && hasSoapContent;

  const pickAppointment = (a: Appointment) => {
    setAppointment(a);
    // The schedule stores the visit reason in `specialty`; pre-fill but keep editable.
    if (!reason.trim()) setReason(a.specialty);
    setPickerOpen(false);
  };

  const save = () => {
    if (!valid) return;
    onSave({
      patientId: patient.id,
      appointmentId: note?.appointmentId ?? appointment!.id,
      date: note?.date ?? appointment!.date,
      visitType: note?.visitType ?? appointment!.type,
      reason: reason.trim(),
      subjective: soap.subjective.trim(),
      objective: soap.objective.trim(),
      assessment: soap.assessment.trim(),
      plan: soap.plan.trim(),
    });
  };

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

        {/* SOAP sections */}
        {SOAP_SECTIONS.map((s) => (
          <View key={s.key}>
            <Text style={styles.fieldLabel}>{t(s.labelKey)}</Text>
            {readOnly ? (
              <View style={styles.readCard}>
                <Text style={styles.readText}>{soap[s.key] || '—'}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.helper}>{t(s.helperKey)}</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={[styles.input, styles.multiline]}
                    placeholder={t(s.labelKey)}
                    placeholderTextColor={Colors.textGray}
                    value={soap[s.key]}
                    onChangeText={(val) => setSection(s.key, val)}
                    multiline
                    textAlignVertical="top"
                    accessibilityLabel={t(s.labelKey)}
                  />
                </View>
              </>
            )}
          </View>
        ))}

        {creating && (
          <EkoButton
            title={t('common.save')}
            variant="primary"
            onPress={save}
            loading={saving}
            disabled={!valid}
            style={styles.saveBtn}
          />
        )}

        {/* Amendments — the only way to change a locked record. Append-only,
            unlimited, each stamped with its author and time. */}
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

  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  helper: { fontSize: 11, color: Colors.textGray, marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_400Regular' },
  fieldIcon: { marginRight: 10 },

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

  saveBtn: { marginTop: 4 },

  // Amendments
  amendmentsSection: {
    marginTop: 8, borderTopWidth: 1, borderTopColor: Colors.borderGray, paddingTop: 18,
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
});
