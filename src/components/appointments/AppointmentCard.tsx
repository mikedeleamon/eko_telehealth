import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';

interface Appointment {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  type: string;
  status: string;
}

interface Props {
  appointment: Appointment;
  onPress?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
  showActions?: boolean;
  cardColor?: string;
}

const TYPE_ICONS: Record<string, string> = {
  'Video Visit': 'video-camera',
  'Clinic Visit': 'hospital-o',
  'Home Visit': 'home',
};

const STATUS_COLORS: Record<string, string> = {
  pending_approval: Colors.accent,
  pending_payment: Colors.accent,
  upcoming: Colors.primary,
  checked_in: Colors.green,
  declined: Colors.red,
  cancelled: Colors.red,
  no_show: Colors.red,
  past: Colors.textGray,
};

/** Lifecycle states are snake_case; never show the raw value to a user. */
const STATUS_LABEL_KEYS: Record<string, string> = {
  pending_approval: 'appointments.statusPendingApproval',
  pending_payment: 'appointments.statusPendingPayment',
  upcoming: 'appointments.statusUpcoming',
  checked_in: 'appointments.statusCheckedIn',
  declined: 'appointments.statusCancelled',
  cancelled: 'appointments.statusCancelled',
  no_show: 'appointments.statusNoShow',
  past: 'appointments.statusPast',
};

export default function AppointmentCard({
  appointment, onPress, onAccept, onDecline, showActions = false, cardColor,
}: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const icon = TYPE_ICONS[appointment.type] ?? 'calendar';
  const statusColor = STATUS_COLORS[appointment.status] ?? Colors.textGray;
  const statusKey = STATUS_LABEL_KEYS[appointment.status];
  const statusLabel = statusKey
    ? t(statusKey)
    : appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1);
  const typeLabel = t(`options.appointmentType.${appointment.type}`, { defaultValue: appointment.type });

  return (
    <TouchableOpacity
      style={[styles.card, cardColor ? { backgroundColor: cardColor } : null]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${appointment.doctor}. ${appointment.specialty}. ${appointment.date} ${appointment.time}. ${statusLabel}`}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: Colors.primaryFaded }]}>
          <FontAwesome name={icon as any} size={20} color={Colors.primary} />
        </View>

        <View style={styles.content}>
          <Text style={styles.doctorName} numberOfLines={1}>{appointment.doctor}</Text>
          <Text style={styles.specialty}>{appointment.specialty}</Text>

          <View style={styles.metaRow}>
            <FontAwesome name="calendar-o" size={11} color={Colors.textGray} />
            <Text style={styles.meta}>  {appointment.date}</Text>
            <Text style={styles.metaSep}>  ·  </Text>
            <FontAwesome name="clock-o" size={11} color={Colors.textGray} />
            <Text style={styles.meta}>  {appointment.time}</Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.typeBadge}>
        <FontAwesome name={icon as any} size={11} color={Colors.primary} />
        <Text style={styles.typeBadgeText}>  {typeLabel}</Text>
      </View>

      {/* The caller decides when actions apply (a doctor answering a request);
          gating on a status here as well would just suppress them. */}
      {showActions && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionBtn, styles.declineBtn]} onPress={onDecline} accessibilityRole="button" accessibilityLabel={t('appointments.decline')}>
            <Text style={styles.declineText}>{t('appointments.decline')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept} accessibilityRole="button" accessibilityLabel={t('appointments.accept')}>
            <Text style={styles.acceptText}>{t('appointments.accept')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(39, 42, 58, 0.10)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  iconBox: {
    width: 50, height: 50, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  content: { flex: 1 },
  doctorName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  specialty: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular', marginBottom: 6 },

  metaRow: { flexDirection: 'row', alignItems: 'center' },
  meta: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  metaSep: { color: Colors.textLight, fontSize: 12 },

  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  typeBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryFaded,
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },

  actions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: { flex: 1, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  declineBtn: { backgroundColor: Colors.red + '15', borderWidth: 1, borderColor: Colors.red },
  acceptBtn: { backgroundColor: Colors.green },
  declineText: { fontSize: 13, fontWeight: '600', color: Colors.red, fontFamily: 'Poppins_600SemiBold' },
  acceptText: { fontSize: 13, fontWeight: '600', color: Colors.white, fontFamily: 'Poppins_600SemiBold' },
});
