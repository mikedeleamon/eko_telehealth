import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import SCButton from '../../../components/common/SCButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function AppointmentAlertScreen({ navigation, route }: Props) {
  const { doctor, type } = route.params ?? {};

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <FontAwesome name="times" size={18} color={Colors.textGray} />
        </TouchableOpacity>

        <View style={styles.iconCircle}>
          <FontAwesome name="calendar-plus-o" size={36} color={Colors.primary} />
        </View>

        <Text style={styles.title}>Book Appointment</Text>
        <Text style={styles.doctor}>{doctor?.name ?? 'Doctor'}</Text>
        <Text style={styles.type}>{type ?? 'Video Visit'}</Text>
        <Text style={styles.sub}>How would you like to proceed with this appointment?</Text>

        <SCButton
          title="Make Appointment"
          variant="accent"
          onPress={() => navigation.navigate('DoctorOverview', { doctor })}
          style={styles.primaryBtn}
        />
        <SCButton
          title="Eko Telehealth Support"
          variant="outline"
          onPress={() => navigation.goBack()}
          style={styles.secondaryBtn}
        />
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelLink}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24,
  },
  card: {
    width: '100%', backgroundColor: Colors.white, borderRadius: 24, padding: 28,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 12,
  },
  closeBtn: { position: 'absolute', top: 16, right: 16, padding: 8 },
  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textDark, marginBottom: 4 },
  doctor: { fontSize: 16, fontWeight: '600', color: Colors.primary, marginBottom: 4 },
  type: {
    backgroundColor: Colors.primaryFaded, paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 10, fontSize: 12, color: Colors.primary, fontWeight: '600', marginBottom: 12,
  },
  sub: { fontSize: 13, color: Colors.textGray, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  primaryBtn: { width: '100%', marginBottom: 10 },
  secondaryBtn: { width: '100%', marginBottom: 8 },
  cancelLink: { paddingVertical: 8 },
  cancelText: { fontSize: 14, color: Colors.textGray },
});
