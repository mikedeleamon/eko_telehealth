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
import type { Appointment, MedicalNote, MedicalNoteInput, PatientSummary } from '../../api/types';

interface Props {
  patient: PatientSummary;
  /** Existing note → edit (own) or read-only (someone else's). Absent → create. */
  note?: MedicalNote;
  onSave: (input: MedicalNoteInput) => void;
  saving?: boolean;
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
export default function MedicalNotes({ patient, note, onSave, saving = false }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAuthor = !!note && note.doctorId === user?.id;
  const readOnly = !!note && !isAuthor;
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
              {t('patients.readOnlyAuthored', { doctor: note!.doctorName })}
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

        {!readOnly && (
          <EkoButton
            title={creating ? t('common.save') : t('common.saveChanges')}
            variant="accent"
            onPress={save}
            loading={saving}
            disabled={!valid}
            style={styles.saveBtn}
          />
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
