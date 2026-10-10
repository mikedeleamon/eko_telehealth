import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import DateStrip from '../../../components/scheduler/DateStrip';
import DatePickerSheet from '../../../components/scheduler/DatePickerSheet';
import {
  useDoctor,
  useOwnOpenSlots,
  usePatients,
  useProviderState,
  useScheduleAppointment,
} from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { TAB_BAR_SPACE } from '../../../constants/layout';
import type { PatientSummary, VisitType } from '../../../api/types';
import { contiguousDurations, formatDuration, formatShortDate, formatTime, startOfDay, ymd } from '../../../utils/schedule';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const TYPES: { type: VisitType; icon: string }[] = [
  { type: 'Video Visit', icon: 'video-camera' },
  { type: 'Clinic Visit', icon: 'hospital-o' },
  { type: 'Home Visit', icon: 'home' },
];

/** 'YYYY-MM-DD' → local midnight, or today when absent/unparseable. */
function dayFromParam(value: unknown): Date {
  if (typeof value === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return startOfDay(new Date());
}

/**
 * Doctor books a visit for one of their patients (Scheduler → New
 * appointment, or a patient's profile → Schedule visit).
 *
 * Starts are limited to the doctor's own open slots — the same ones patients
 * see — and a longer visit can only run across back-to-back open slots, so a
 * booking never lands outside working hours, in blocked time, or on top of
 * another visit. There's no approval step: it goes to the patient as
 * "awaiting payment", and their payment is what confirms it.
 */
export default function NewAppointmentScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t, locale } = useTranslation();
  const today = startOfDay(new Date());

  const { data: patients = [] } = usePatients();
  const { data: provider } = useProviderState();
  const { data: ownProfile } = useDoctor(provider?.doctorId ?? '');
  const schedule = useScheduleAppointment();

  const [patientId, setPatientId] = useState<string | null>((route.params?.patientId as string | undefined) ?? null);
  const [query, setQuery] = useState('');
  const [dependentId, setDependentId] = useState<string | null>(null);
  const [type, setType] = useState<VisitType>('Video Visit');
  const initialDay = dayFromParam(route.params?.date);
  const [day, setDay] = useState(initialDay.getTime() < today.getTime() ? today : initialDay);
  const [pickingDate, setPickingDate] = useState(false);
  const [slotStart, setSlotStart] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const patient = patients.find((p) => p.id === patientId);
  const { data: slots = [], isLoading: slotsLoading } = useOwnOpenSlots(ymd(day));
  const lengths = useMemo(() => (slotStart ? contiguousDurations(slots, slotStart) : []), [slots, slotStart]);
  // Home visits are an admin-granted certification; hide the option rather
  // than let the server refuse it. Unknown profile → offer it, server decides.
  const types = ownProfile && !ownProfile.canProvideInHome ? TYPES.filter((o) => o.type !== 'Home Visit') : TYPES;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? patients.filter((p) => p.name.toLowerCase().includes(q)) : patients;
    // Bookable patients first; walk-ins without an account sink to the bottom.
    return [...list].sort((a, b) => Number(!!b.userId) - Number(!!a.userId) || a.name.localeCompare(b.name));
  }, [patients, query]);

  const pickPatient = (p: PatientSummary) => {
    setPatientId(p.id);
    setDependentId(null);
    setQuery('');
  };

  const pickDay = (d: Date) => {
    setDay(startOfDay(d));
    setSlotStart(null);
    setDuration(null);
  };

  const pickSlot = (startAt: string, length?: number) => {
    setSlotStart(startAt);
    setDuration(length ?? null);
  };

  const submit = async () => {
    if (!patient) return Alert.alert('', t('newAppointment.pickPatient'));
    if (!slotStart) return Alert.alert('', t('newAppointment.pickSlot'));
    try {
      const appointment = await schedule.mutateAsync({
        patientId: patient.id,
        startAt: slotStart,
        type,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
        ...(duration ? { durationMinutes: duration } : {}),
        ...(dependentId ? { dependentId } : {}),
      });
      const start = new Date(appointment.startAt ?? slotStart);
      Alert.alert(
        t('newAppointment.scheduledTitle'),
        t('newAppointment.scheduledBody', {
          name: appointment.patientName ?? patient.name,
          date: formatShortDate(start, locale),
          time: formatTime(start, locale),
        }),
      );
      // Works from the Scheduler stack and from a patient's profile alike:
      // close the form, then land on the booked day in the Scheduler.
      navigation.goBack();
      navigation.navigate('SchedulerTab', { screen: 'Scheduler', params: { focusDate: start.toISOString() } });
    } catch (err) {
      Alert.alert(t('newAppointment.couldNotSchedule'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
      // The slot may have just been taken — let the list catch up.
      setSlotStart(null);
      setDuration(null);
    }
  };

  const fee = ownProfile?.fee;
  const forName = dependentId
    ? (() => {
        const dep = patient?.dependents?.find((d) => d.id === dependentId);
        return dep ? `${dep.firstName} ${dep.lastName}` : patient?.name ?? '';
      })()
    : patient?.name ?? '';

  return (
    <View style={styles.container}>
      <EkoHeader title={t('newAppointment.title')} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Patient */}
          <Text style={styles.label}>{t('newAppointment.patient')}</Text>
          {patient ? (
            <View style={styles.selectedPatient}>
              <View style={styles.avatar}>
                <FontAwesome name="user" size={18} color={Colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.patientName}>{patient.name}</Text>
                <Text style={styles.patientMeta}>{`${patient.age} · ${patient.condition}`}</Text>
              </View>
              <TouchableOpacity onPress={() => setPatientId(null)} accessibilityRole="button">
                <Text style={styles.changeText}>{t('newAppointment.change')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.pickerCard}>
              <View style={styles.searchBar}>
                <FontAwesome name="search" size={14} color={Colors.textGray} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('newAppointment.searchPatients')}
                  placeholderTextColor={Colors.textGray}
                  value={query}
                  onChangeText={setQuery}
                  accessibilityLabel={t('newAppointment.searchPatients')}
                />
              </View>
              {matches.length === 0 ? (
                <Text style={styles.muted}>{t('newAppointment.noPatients')}</Text>
              ) : (
                matches.map((p) => {
                  const bookable = !!p.userId;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.patientRow, !bookable && styles.patientRowDisabled]}
                      onPress={() => pickPatient(p)}
                      disabled={!bookable}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !bookable }}
                    >
                      <View style={styles.avatarSmall}>
                        <FontAwesome name="user" size={14} color={Colors.primary} />
                      </View>
                      <View style={styles.flex}>
                        <Text style={styles.patientRowName}>{p.name}</Text>
                        <Text style={styles.patientMeta}>
                          {bookable ? `${p.age} · ${p.condition}` : t('newAppointment.noAccount')}
                        </Text>
                      </View>
                      {bookable && <FontAwesome name="chevron-right" size={12} color={Colors.textGray} />}
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {/* Who for — only when the patient has dependents on their account. */}
          {patient && (patient.dependents?.length ?? 0) > 0 && (
            <>
              <Text style={styles.label}>{t('newAppointment.whoFor')}</Text>
              <View style={styles.chipRow}>
                {[{ id: null as string | null, label: t('newAppointment.accountHolder', { name: patient.name }) },
                  ...(patient.dependents ?? []).map((d) => ({ id: d.id as string | null, label: `${d.firstName} ${d.lastName}` }))].map((opt) => {
                  const active = dependentId === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id ?? 'self'}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDependentId(opt.id)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Visit type */}
          <Text style={styles.label}>{t('newAppointment.visitType')}</Text>
          <View style={styles.typeRow}>
            {types.map((opt) => {
              const active = type === opt.type;
              return (
                <TouchableOpacity
                  key={opt.type}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setType(opt.type)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                >
                  <FontAwesome name={opt.icon as any} size={18} color={active ? Colors.white : Colors.primary} />
                  <Text style={[styles.typeText, active && styles.typeTextActive]}>
                    {t(`options.appointmentType.${opt.type}`, { defaultValue: opt.type })}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date */}
          <Text style={styles.label}>{t('newAppointment.date')}</Text>
          <View style={styles.bleed}>
            <DateStrip
              selected={day}
              onSelect={pickDay}
              onOpenMonth={() => setPickingDate(true)}
              busyDays={EMPTY_SET}
              blockedDays={EMPTY_SET}
              minDate={today}
            />
          </View>

          {/* Start time */}
          <Text style={styles.label}>{t('newAppointment.startTime')}</Text>
          {slotsLoading ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : slots.length === 0 ? (
            <Text style={styles.muted}>{t('newAppointment.noSlots')}</Text>
          ) : (
            <View style={styles.chipRow}>
              {slots.map((slot) => {
                const active = slotStart === slot.startAt;
                return (
                  <TouchableOpacity
                    key={slot.startAt}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => pickSlot(slot.startAt, slot.durationMinutes)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatTime(new Date(slot.startAt), locale)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Length — only lengths that stay inside back-to-back open slots. */}
          {slotStart && lengths.length > 0 && (
            <>
              <Text style={styles.label}>{t('newAppointment.length')}</Text>
              <View style={styles.chipRow}>
                {lengths.map((minutes) => {
                  const active = (duration ?? lengths[0]) === minutes;
                  return (
                    <TouchableOpacity
                      key={minutes}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setDuration(minutes)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatDuration(minutes, t)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {/* Reason */}
          <Text style={styles.label}>{t('newAppointment.reason')}</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder={t('newAppointment.reasonPlaceholder')}
            placeholderTextColor={Colors.textGray}
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={500}
            accessibilityLabel={t('newAppointment.reason')}
          />

          {patient && (
            <View style={styles.note}>
              <FontAwesome name="info-circle" size={15} color={Colors.primary} />
              <Text style={styles.noteText}>
                {fee
                  ? t('newAppointment.paymentNote', { name: forName, fee })
                  : t('newAppointment.paymentNoteNoFee', { name: forName })}
              </Text>
            </View>
          )}

          <EkoButton
            title={t('newAppointment.submit')}
            variant="primary"
            onPress={submit}
            loading={schedule.isPending}
            disabled={!patient || !slotStart}
            style={styles.submit}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <DatePickerSheet
        visible={pickingDate}
        title={t('newAppointment.date')}
        value={day}
        minDate={today}
        onSelect={pickDay}
        onClose={() => setPickingDate(false)}
      />
    </View>
  );
}

const EMPTY_SET = new Set<string>();

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: TAB_BAR_SPACE },
  label: {
    fontSize: 13, fontWeight: '700', color: Colors.textMedium, marginTop: 18, marginBottom: 10,
    textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'Poppins_600SemiBold',
  },
  muted: { fontSize: 13, color: Colors.textGray, paddingVertical: 8, lineHeight: 19, fontFamily: 'Poppins_400Regular' },
  loader: { alignSelf: 'flex-start', marginVertical: 8 },

  selectedPatient: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.primaryFaded, borderRadius: 16, padding: 14,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  patientName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  patientMeta: { fontSize: 12, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  changeText: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  pickerCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 12, height: 42, marginBottom: 6,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  patientRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.borderGray,
  },
  patientRowDisabled: { opacity: 0.5 },
  avatarSmall: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
  },
  patientRowName: { fontSize: 14, fontWeight: '600', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  typeRow: { flexDirection: 'row', gap: 10 },
  typeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface,
  },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeText: { fontSize: 11.5, fontWeight: '600', color: Colors.primary, marginTop: 6, textAlign: 'center', fontFamily: 'Poppins_600SemiBold' },
  typeTextActive: { color: Colors.white },

  // DateStrip carries its own 16pt left inset; pull it out to the screen edge.
  bleed: { marginHorizontal: -20, marginLeft: -16 },

  reasonInput: {
    borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: 12, padding: 12, backgroundColor: Colors.surface,
    fontSize: 14, color: Colors.textDark, minHeight: 80, textAlignVertical: 'top', fontFamily: 'Poppins_400Regular',
  },
  note: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: Colors.primaryFaded, borderRadius: 14, padding: 14, marginTop: 18,
  },
  noteText: { flex: 1, fontSize: 13, color: Colors.textMedium, lineHeight: 19, fontFamily: 'Poppins_400Regular' },
  submit: { marginTop: 20 },
});
