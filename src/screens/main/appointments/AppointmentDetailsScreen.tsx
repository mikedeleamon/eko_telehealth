import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { MOCK_DOCTORS } from '../../../constants';
import SCHeader from '../../../components/common/SCHeader';
import SCButton from '../../../components/common/SCButton';

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
  upcoming: Colors.primary,
  past: Colors.textGray,
  cancelled: Colors.red,
};

export default function AppointmentDetailsScreen({ navigation, route }: Props) {
  const appointment = route.params?.appointment ?? {};
  const { doctor: doctorName, specialty, date, time, type = 'Video Visit', status = 'upcoming' } = appointment;

  // Resolve the full doctor record so calls / chat / rescheduling have what they need.
  const doctor =
    MOCK_DOCTORS.find((d) => d.name === doctorName) ??
    { name: doctorName ?? 'Doctor', specialty: specialty ?? '', fee: '$80', rating: 4.8 };

  const isUpcoming = status === 'upcoming';
  const statusColor = STATUS_COLORS[status] ?? Colors.textGray;
  const typeIcon = TYPE_ICONS[type] ?? 'calendar';

  const joinCall = () => {
    if (type === 'Video Visit') navigation.navigate('VideoCall', { doctor });
    else navigation.navigate('AudioCall', { doctor });
  };

  const cancel = () => {
    Alert.alert('Cancel Appointment', 'Are you sure you want to cancel this appointment?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel Appointment',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Appointment Cancelled', 'Your appointment has been cancelled.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <SCHeader title="Appointment Details" onBack={() => navigation.goBack()} />

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
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailCard}>
          <DetailRow icon="calendar" label="Date" value={date ?? '—'} />
          <DetailRow icon="clock-o" label="Time" value={time ?? '—'} />
          <DetailRow icon={typeIcon} label="Type" value={type} />
          <DetailRow icon="dollar" label="Fee" value={doctor.fee ?? '$80'} last />
        </View>

        {/* Actions */}
        {isUpcoming ? (
          <>
            <SCButton
              title={type === 'Video Visit' ? 'Join Video Call' : 'Join Audio Call'}
              variant="accent"
              onPress={joinCall}
              style={styles.btn}
            />
            <SCButton
              title="Send Message"
              variant="outline"
              onPress={() => navigation.navigate('Chat', { doctor })}
              style={styles.btn}
            />
            <SCButton
              title="Reschedule"
              variant="outline"
              onPress={() => navigation.navigate('DoctorOverview', { doctor, initialTab: 'schedule' })}
              style={styles.btn}
            />
            <TouchableOpacity style={styles.cancelLink} onPress={cancel}>
              <Text style={styles.cancelText}>Cancel Appointment</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <SCButton
              title="Book Again"
              variant="accent"
              onPress={() => navigation.navigate('DoctorOverview', { doctor, initialTab: 'schedule' })}
              style={styles.btn}
            />
            <SCButton
              title="Send Message"
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
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <FontAwesome name={icon as any} size={15} color={Colors.primary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 20, paddingBottom: 40 },

  doctorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaded,
    borderRadius: 16, padding: 16, marginBottom: 16,
  },
  avatar: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  spec: { fontSize: 13, color: Colors.textMedium, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  detailCard: {
    backgroundColor: Colors.white, borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  rowIcon: { width: 24 },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },
  rowValue: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },

  btn: { width: '100%', marginBottom: 12 },
  cancelLink: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontSize: 14, color: Colors.red, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});
