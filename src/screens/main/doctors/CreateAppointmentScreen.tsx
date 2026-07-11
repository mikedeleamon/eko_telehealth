import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const TYPES = [
  { label: 'Video Visit', icon: 'video-camera' },
  { label: 'Clinic Visit', icon: 'hospital-o' },
  { label: 'Home Visit', icon: 'home' },
];

export default function CreateAppointmentScreen({ navigation, route }: Props) {
  const { doctor, slot, date, type } = route.params ?? {};
  const [selectedType, setSelectedType] = useState(
    TYPES.some((t) => t.label === type) ? type : 'Video Visit'
  );
  const [loading] = useState(false);

  // The appointment is only committed once payment succeeds (PaymentScreen),
  // so this step just carries the selection forward.
  const handleConfirm = () => {
    navigation.navigate('Payment', { doctor, slot, date, type: selectedType });
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Create Appointment" onBack={() => navigation.goBack()} />
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            <FontAwesome name="user-md" size={30} color={Colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{doctor?.name ?? 'Doctor'}</Text>
            <Text style={styles.spec}>{doctor?.specialty ?? ''}</Text>
          </View>
          <Text style={styles.fee}>{doctor?.fee ?? ''}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Row icon="calendar" label="Date" value={date ? `${date.day}, ${date.date}` : 'Selected Date'} />
          <Row icon="clock-o" label="Time" value={slot ?? 'Selected Slot'} />
        </View>

        <Text style={styles.sectionLabel}>Appointment Type</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.label}
              style={[styles.typeBtn, selectedType === t.label && styles.typeBtnActive]}
              onPress={() => setSelectedType(t.label)}
            >
              <FontAwesome
                name={t.icon as any}
                size={22}
                color={selectedType === t.label ? Colors.white : Colors.primary}
              />
              <Text style={[styles.typeText, selectedType === t.label && styles.typeTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>Consultation Fee</Text>
          <Text style={styles.feeValue}>{doctor?.fee ?? '$0'}</Text>
        </View>

        <EkoButton title="Proceed to Payment" variant="accent" onPress={handleConfirm} loading={loading} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <FontAwesome name={icon as any} size={15} color={Colors.primary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  body: { flex: 1 },
  content: { padding: 20 },
  doctorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaded,
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  spec: { fontSize: 13, color: Colors.textMedium, marginTop: 2 },
  fee: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  summaryCard: {
    backgroundColor: Colors.bgLight, borderRadius: 14, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.borderGray,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  rowIcon: { width: 24 },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.textMedium },
  rowValue: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.white,
  },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeText: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: 6, textAlign: 'center' },
  typeTextActive: { color: Colors.white },
  feeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  feeLabel: { fontSize: 15, color: Colors.textMedium, fontWeight: '500' },
  feeValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  btn: {},
});
