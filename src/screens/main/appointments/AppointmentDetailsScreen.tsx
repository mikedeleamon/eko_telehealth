import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { useCancelAppointment, useDoctors } from '../../../hooks/queries';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
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
  declined: Colors.red,
  cancelled: Colors.red,
  past: Colors.textGray,
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  pending_approval: 'appointments.statusAwaitingApproval',
  pending_payment: 'appointments.statusPaymentRequired',
  upcoming: 'appointments.statusConfirmed',
  declined: 'appointments.statusDeclined',
  cancelled: 'appointments.statusCancelled',
  past: 'appointments.statusPast',
};

export default function AppointmentDetailsScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const appointment = route.params?.appointment ?? {};
  const { doctor: doctorName, specialty, date, time, type = 'Video Visit', status = 'upcoming' } = appointment;

  const cancelAppointment = useCancelAppointment();

  // Resolve the full doctor record so calls / chat / rescheduling have what they need.
  const { data: doctors = [] } = useDoctors();
  const doctor =
    doctors.find((d) => d.name === doctorName) ??
    { name: doctorName ?? 'Doctor', specialty: specialty ?? '', fee: '₦15,000', rating: 4.8 };

  // Only a paid, confirmed visit can be joined; a request or an unpaid
  // acceptance is not a booking yet.
  const isConfirmed = status === 'upcoming';
  const awaitingPayment = status === 'pending_payment';
  const awaitingApproval = status === 'pending_approval';
  const isLive = isConfirmed || awaitingPayment || awaitingApproval;
  const statusColor = STATUS_COLORS[status] ?? Colors.textGray;
  const statusLabel = STATUS_LABEL_KEYS[status] ? t(STATUS_LABEL_KEYS[status]) : status;
  const typeIcon = TYPE_ICONS[type] ?? 'calendar';

  const joinCall = () => {
    if (type === 'Video Visit') navigation.navigate('VideoCall', { doctor });
    else navigation.navigate('AudioCall', { doctor });
  };

  const cancel = () => {
    Alert.alert(t('appointments.cancelAppointment'), t('appointments.cancelConfirmBody', { doctor: doctor.name ?? t('appointments.theDoctor') }), [
      { text: t('appointments.keep'), style: 'cancel' },
      {
        text: t('appointments.cancelAppointment'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelAppointment.mutateAsync(appointment.id);
            Alert.alert(t('appointments.appointmentCancelled'), t('appointments.cancelledBody'), [
              { text: t('common.ok'), onPress: () => navigation.goBack() },
            ]);
          } catch (err) {
            Alert.alert(t('appointments.couldNotCancel'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('appointments.details')} onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Doctor hero card */}
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            <FontAwesome name="user-md" size={30} color={Colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{doctor.name}</Text>
            <Text style={styles.spec}>{specialty || doctor.specialty}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <DetailRow icon="calendar" label={t('confirmed.date')} value={date ?? '—'} />
          <DetailRow icon="clock-o" label={t('confirmed.time')} value={time ?? '—'} />
          <DetailRow icon={typeIcon} label={t('confirmed.type')} value={t(`options.appointmentType.${type}`, { defaultValue: type })} />
          <DetailRow icon="dollar" label={t('appointments.fee')} value={appointment.fee ?? doctor.fee ?? '₦15,000'} last />
        </View>

        {/* What the patient is waiting on, in plain words. */}
        {awaitingApproval && (
          <View style={[styles.notice, { backgroundColor: Colors.accent + '14' }]}>
            <FontAwesome name="hourglass-half" size={14} color={Colors.accent} />
            <Text style={styles.noticeText}>
              {'  '}{t('appointments.waitingApproval', { doctor: doctor.name ?? t('appointments.theDoctor') })}
            </Text>
          </View>
        )}
        {status === 'declined' && (
          <View style={[styles.notice, { backgroundColor: Colors.red + '14' }]}>
            <FontAwesome name="times-circle" size={14} color={Colors.red} />
            <Text style={styles.noticeText}>
              {'  '}{appointment.declineReason
                ? t('appointments.declinedReason', { reason: appointment.declineReason })
                : t('appointments.declinedGeneric')}
            </Text>
          </View>
        )}

        {/* Actions */}
        {isLive ? (
          <>
            {awaitingPayment && (
              <EkoButton
                title={t('payment.pay', { amount: appointment.fee ?? doctor.fee ?? '₦15,000' })}
                variant="accent"
                onPress={() => navigation.navigate('Payment', { appointment, doctor })}
                style={styles.btn}
              />
            )}
            {isConfirmed && (
              <EkoButton
                title={type === 'Video Visit' ? t('appointments.joinVideoCall') : t('appointments.joinAudioCall')}
                variant="accent"
                onPress={joinCall}
                style={styles.btn}
              />
            )}
            <EkoButton
              title={t('appointments.sendMessage')}
              variant="outline"
              onPress={() => navigation.navigate('Chat', { doctor })}
              style={styles.btn}
            />
            {isConfirmed && (
              <EkoButton
                title={t('appointments.reschedule')}
                variant="outline"
                onPress={() => navigation.navigate('DoctorOverview', { doctor, initialTab: 'schedule' })}
                style={styles.btn}
              />
            )}
            <TouchableOpacity style={styles.cancelLink} onPress={cancel}>
              <Text style={styles.cancelText}>
                {awaitingApproval ? t('appointments.withdrawRequest') : t('appointments.cancelAppointment')}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <EkoButton
              title={t('appointments.bookAgain')}
              variant="accent"
              onPress={() => navigation.navigate('DoctorOverview', { doctor, initialTab: 'schedule' })}
              style={styles.btn}
            />
            <EkoButton
              title={t('appointments.sendMessage')}
              variant="outline"
              onPress={() => navigation.navigate('Chat', { doctor })}
              style={styles.btn}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function DetailRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <FontAwesome name={icon as any} size={15} color={Colors.primary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 20, paddingBottom: 40 },

  doctorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaded,
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  spec: { fontSize: 13, color: Colors.textMedium, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  detailCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  rowIcon: { width: 24 },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },
  rowValue: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },

  btn: { width: '100%', marginBottom: 12 },
  notice: {
    flexDirection: 'row', alignItems: 'flex-start',
    borderRadius: 12, padding: 12, marginBottom: 16,
  },
  noticeText: { flex: 1, fontSize: 12, color: Colors.textDark, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
  cancelLink: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontSize: 14, color: Colors.red, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});
