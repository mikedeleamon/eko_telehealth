import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';
import type { Appointment, VisitType } from '../../api/types';
import { formatDuration, formatTimeRange } from '../../utils/schedule';

interface Props {
  appointment: Appointment;
  start: Date;
  end: Date;
  /** Index into the pastel card fills, so neighbouring cards alternate. */
  colorIndex: number;
  /** The tag icon — the visit's details, fee and payment state. */
  onDetails: () => void;
  /** Absent when no call can be placed for this visit (not yet paid, or over). */
  onCall?: () => void;
  onCallUnavailable: () => void;
  onMessage: () => void;
  /** Absent when the patient isn't on the doctor's list, so there's no record to write to. */
  onNotes?: () => void;
  /** Accept/Decline, offered only on a request the doctor hasn't answered. */
  onAccept?: () => void;
  onDecline?: () => void;
  deciding?: boolean;
}

const VISIT_TYPES: VisitType[] = ['Video Visit', 'Home Visit', 'Clinic Visit'];

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending_approval: 'appointments.statusPendingApproval',
  pending_payment: 'appointments.statusPendingPayment',
  upcoming: 'appointments.statusConfirmed',
  checked_in: 'appointments.statusCheckedIn',
  declined: 'appointments.statusDeclined',
  cancelled: 'appointments.statusCancelled',
  no_show: 'appointments.statusNoShow',
  past: 'appointments.statusPast',
};

/**
 * One visit in the Scheduler's day view, laid out after the client's
 * reference: who and when on top with tag / call / message actions, the
 * visit-type chips, then duration, reason and a link into the visit notes.
 */
export default function ScheduleCard({
  appointment, start, end, colorIndex, onDetails, onCall, onCallUnavailable, onMessage, onNotes, onAccept, onDecline, deciding,
}: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t, locale } = useTranslation();

  const name = appointment.patientName ?? appointment.doctor;
  const title = appointment.patientAge != null ? t('scheduler.nameAge', { name, age: appointment.patientAge }) : name;
  const minutes = Math.round((end.getTime() - start.getTime()) / 60_000);
  const statusKey = STATUS_LABEL_KEYS[appointment.status];
  const statusColor = statusColorFor(appointment.status, Colors);
  const released = appointment.status === 'cancelled' || appointment.status === 'declined';
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: Colors.cardColors[colorIndex % Colors.cardColors.length] },
        released && styles.cardReleased,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials || '?'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={2}>{title}</Text>
          <Text style={styles.time}>{formatTimeRange(start, end, locale)}</Text>
          <Text style={[styles.status, { color: statusColor }]} numberOfLines={1}>
            {statusKey ? t(statusKey) : appointment.status}
          </Text>
          {appointment.scheduledByDoctor ? (
            <Text style={styles.scheduledBy} numberOfLines={1}>{t('scheduler.scheduledByYou')}</Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <CircleAction icon="tag" color={Colors.red} onPress={onDetails} label={t('scheduler.detailsA11y')} />
          <CircleAction
            icon="phone"
            color={Colors.green}
            onPress={onCall ?? onCallUnavailable}
            dimmed={!onCall}
            label={t('scheduler.callPatient')}
          />
          <CircleAction icon="comment" color={Colors.red} onPress={onMessage} label={t('scheduler.messagePatient')} />
        </View>
      </View>

      <View style={styles.typeRow}>
        {VISIT_TYPES.map((type) => {
          const active = appointment.type === type;
          return (
            <View key={type} style={[styles.typeChip, active && styles.typeChipActive]}>
              <Text style={[styles.typeText, active && styles.typeTextActive]} numberOfLines={1}>
                {t(`options.appointmentType.${type}`, { defaultValue: type })}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={styles.detail}>{t('scheduler.duration', { duration: formatDuration(minutes, t) })}</Text>
      {appointment.reason ? (
        <Text style={styles.detail} numberOfLines={2}>{t('scheduler.reason', { reason: appointment.reason })}</Text>
      ) : null}

      {onAccept && onDecline ? (
        <View style={styles.decisionRow}>
          <TouchableOpacity
            style={[styles.decisionBtn, styles.declineBtn, deciding && styles.disabled]}
            onPress={onDecline}
            disabled={deciding}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.decline')}
          >
            {deciding ? <ActivityIndicator size="small" color={Colors.red} /> : <Text style={styles.declineText}>{t('dashboard.decline')}</Text>}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.decisionBtn, styles.acceptBtn, deciding && styles.disabled]}
            onPress={onAccept}
            disabled={deciding}
            accessibilityRole="button"
            accessibilityLabel={t('dashboard.accept')}
          >
            {deciding ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.acceptText}>{t('dashboard.accept')}</Text>}
          </TouchableOpacity>
        </View>
      ) : null}

      {onNotes ? (
        <TouchableOpacity style={styles.notesLink} onPress={onNotes} accessibilityRole="link">
          <Text style={styles.notesText}>{t('scheduler.medicalVisitNotes')}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function statusColorFor(status: Appointment['status'], Colors: ThemeColors): string {
  switch (status) {
    case 'pending_approval':
    case 'pending_payment':
      return Colors.orange;
    case 'upcoming':
      return Colors.primary;
    case 'checked_in':
      return Colors.green;
    case 'declined':
    case 'cancelled':
    case 'no_show':
      return Colors.red;
    default:
      return Colors.textGray;
  }
}

function CircleAction({ icon, color, onPress, label, dimmed }: { icon: string; color: string; onPress: () => void; label: string; dimmed?: boolean }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <TouchableOpacity
      style={[styles.circle, dimmed && styles.circleDimmed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: dimmed }}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
    >
      <FontAwesome name={icon as any} size={16} color={color} />
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) =>
  StyleSheet.create({
    card: { borderRadius: 22, padding: 16, marginBottom: 14 },
    cardReleased: { opacity: 0.55 },
    topRow: { flexDirection: 'row', alignItems: 'flex-start' },
    avatar: {
      width: 58, height: 58, borderRadius: 14, backgroundColor: Colors.surface,
      alignItems: 'center', justifyContent: 'center', marginRight: 12,
    },
    avatarText: { fontSize: 18, fontWeight: '700', color: Colors.primary, fontFamily: 'Poppins_700Bold' },
    info: { flex: 1, marginRight: 6 },
    name: { fontSize: 16, fontWeight: '600', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
    time: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginTop: 1, fontFamily: 'Poppins_600SemiBold' },
    status: { fontSize: 13, marginTop: 2, fontFamily: 'Poppins_500Medium' },
    scheduledBy: { fontSize: 11.5, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
    actions: { flexDirection: 'row', gap: 6 },
    circle: {
      width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.surface,
      alignItems: 'center', justifyContent: 'center',
      ...Platform.select({
        ios: { shadowColor: 'rgba(0,0,0,0.08)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 4 },
        android: { elevation: 2 },
      }),
    },
    circleDimmed: { opacity: 0.4 },
    typeRow: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 12 },
    typeChip: {
      flex: 1, paddingVertical: 6, paddingHorizontal: 4, borderRadius: 6, alignItems: 'center',
      backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderGray,
    },
    typeChipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
    typeText: { fontSize: 11.5, color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },
    typeTextActive: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },
    detail: { fontSize: 14, color: Colors.textDark, marginBottom: 6, fontFamily: 'Poppins_500Medium' },
    decisionRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
    decisionBtn: { flex: 1, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
    declineBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.red },
    acceptBtn: { backgroundColor: Colors.green },
    disabled: { opacity: 0.6 },
    declineText: { fontSize: 13, fontWeight: '700', color: Colors.red, fontFamily: 'Poppins_600SemiBold' },
    acceptText: { fontSize: 13, fontWeight: '700', color: Colors.white, fontFamily: 'Poppins_600SemiBold' },
    notesLink: { alignSelf: 'flex-end', marginTop: 4, paddingVertical: 2 },
    notesText: { fontSize: 13.5, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  });
