import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import SCButton from '../../../components/common/SCButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function AppointmentConfirmedScreen({ navigation, route }: Props) {
  const { doctor, slot, date, type } = route.params ?? {};

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.topGrad} />
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <FontAwesome name="check" size={44} color={Colors.white} />
        </View>
        <Text style={styles.title}>Appointment{'\n'}Confirmed!</Text>
        <Text style={styles.sub}>Your appointment has been successfully booked.</Text>

        <View style={styles.detailCard}>
          <DetailRow icon="user-md" label="Doctor" value={doctor?.name ?? 'Doctor'} />
          <DetailRow icon="stethoscope" label="Specialty" value={doctor?.specialty ?? ''} />
          <DetailRow icon="calendar" label="Date" value={date ? `${date.day}, ${date.date}` : ''} />
          <DetailRow icon="clock-o" label="Time" value={slot ?? ''} />
          <DetailRow icon="tag" label="Type" value={type ?? ''} />
          <DetailRow icon="dollar" label="Fee" value={doctor?.fee ?? ''} last />
        </View>

        <SCButton title="View Appointments" variant="accent" onPress={() => navigation.navigate('AppointmentsTab')} style={styles.primaryBtn} />
        <SCButton title="Back to Home" onPress={() => navigation.navigate('HomeTab')} variant="outline" style={styles.secondaryBtn} />
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <FontAwesome name={icon as any} size={14} color={Colors.primary} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  topGrad: { height: 180, position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  checkCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.white, textAlign: 'center', marginBottom: 8, lineHeight: 36 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 32 },
  detailCard: {
    width: '100%', backgroundColor: Colors.white, borderRadius: 20, padding: 20,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 6,
    marginBottom: 24,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  detailIcon: { width: 22 },
  detailLabel: { flex: 1, fontSize: 14, color: Colors.textGray },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  primaryBtn: { width: '100%', marginBottom: 12 },
  secondaryBtn: { width: '100%' },
});
