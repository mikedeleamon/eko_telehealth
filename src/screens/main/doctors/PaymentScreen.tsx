import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import RatingStars from '../../../components/common/RatingStars';
import { api } from '../../../api';
import { queryKeys } from '../../../hooks/queries';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

// Card details are collected by the provider's hosted checkout, not here, so
// "card" simply routes through Flutterwave (the pitch's NGN processor).
const PAYMENT_METHODS = [
  { id: 'flutterwave', label: 'Card / Bank / Transfer (Flutterwave)', icon: 'money' },
  { id: 'paypal', label: 'PayPal', icon: 'paypal' },
];

/**
 * Pays for an appointment the doctor has already ACCEPTED — it no longer
 * creates the booking. Reached from AppointmentDetails when a visit is
 * awaiting payment; the visit is only confirmed once the provider webhook
 * settles, which is why this hands off and then polls rather than declaring
 * success on its own.
 */
export default function PaymentScreen({ navigation, route }: Props) {
  const { appointment, doctor } = route.params ?? {};
  const [method, setMethod] = useState('flutterwave');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();

  const fee = appointment?.fee ?? doctor?.fee ?? '₦15,000';

  const pay = async () => {
    if (!appointment?.id) return Alert.alert('', 'This appointment is no longer available to pay.');
    setLoading(true);
    try {
      const intent = await api.payments.createIntent({
        appointmentId: appointment.id,
        provider: method === 'paypal' ? 'paypal' : 'flutterwave',
      });

      if (/^https?:\/\//.test(intent.checkoutRef)) {
        // Live: hand off to the provider's hosted checkout, then verify with
        // the backend — the redirect back carries no trustworthy result.
        await Linking.openURL(intent.checkoutRef);
        navigation.replace('PaymentPending', { paymentId: intent.id, doctor, appointment });
      } else {
        // Mock: no real checkout exists, so the intent stands in for settlement.
        qc.invalidateQueries({ queryKey: queryKeys.appointments });
        Alert.alert('Payment Successful', 'Your payment has been processed successfully.', [
          { text: 'OK', onPress: () => navigation.navigate('AppointmentConfirmed', { doctor, appointment }) },
        ]);
      }
    } catch (err) {
      Alert.alert('Payment failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Payment" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            <FontAwesome name="user-md" size={28} color={Colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{doctor?.name ?? 'Doctor'}</Text>
            <Text style={styles.spec}>{doctor?.specialty ?? ''}</Text>
            <RatingStars rating={doctor?.rating ?? 4.5} size={12} />
          </View>
          <View style={styles.feeBox}>
            <Text style={styles.fee}>{fee}</Text>
            <Text style={styles.feeLabel}>Fee</Text>
          </View>
        </View>

        {appointment ? (
          <View style={styles.visitRow}>
            <FontAwesome name="calendar-o" size={12} color={Colors.textGray} />
            <Text style={styles.visitText}>
              {'  '}{appointment.date} · {appointment.time} · {appointment.type}
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionLabel}>Payment Method</Text>
        {PAYMENT_METHODS.map((pm) => (
          <TouchableOpacity
            key={pm.id}
            style={[styles.methodBtn, method === pm.id && styles.methodBtnActive]}
            onPress={() => setMethod(pm.id)}
          >
            <FontAwesome name={pm.icon as any} size={20} color={method === pm.id ? Colors.primary : Colors.textGray} />
            <Text style={[styles.methodText, method === pm.id && styles.methodTextActive]}>{pm.label}</Text>
            <FontAwesome name={method === pm.id ? 'dot-circle-o' : 'circle-o'} size={18} color={method === pm.id ? Colors.primary : Colors.textGray} />
          </TouchableOpacity>
        ))}

        {/* No card fields here on purpose: card details are entered on the
            provider's hosted checkout page, so collecting them in-app would
            gather data that goes nowhere (and put us in PCI scope). */}
        <Text style={styles.handoffNote}>
          You'll be taken to a secure checkout page to complete payment. Your visit is confirmed once
          payment clears.
        </Text>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{fee}</Text>
        </View>

        <EkoButton title={`Pay ${fee}`} variant="accent" onPress={pay} loading={loading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  content: { padding: 20, paddingBottom: 40 },
  doctorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaded,
    borderRadius: 14, padding: 14, marginBottom: 24,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.white,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  spec: { fontSize: 12, color: Colors.textMedium, marginBottom: 4 },
  feeBox: { alignItems: 'flex-end' },
  fee: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  feeLabel: { fontSize: 10, color: Colors.textGray },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  methodBtn: {
    flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.borderGray, marginBottom: 10, backgroundColor: Colors.white,
  },
  methodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryFaded },
  methodText: { flex: 1, fontSize: 15, color: Colors.textMedium, marginLeft: 12 },
  methodTextActive: { color: Colors.primary, fontWeight: '600' },
  visitRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, marginTop: -4 },
  visitText: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  handoffNote: {
    fontSize: 12, color: Colors.textGray, lineHeight: 18,
    marginTop: 16, fontFamily: 'Poppins_400Regular',
  },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 12, padding: 16, marginBottom: 20, marginTop: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: Colors.textMedium },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
});
