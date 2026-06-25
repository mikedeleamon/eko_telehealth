import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import SCHeader from '../../../components/common/SCHeader';
import SCTextField from '../../../components/common/SCTextField';
import SCButton from '../../../components/common/SCButton';
import RatingStars from '../../../components/common/RatingStars';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: 'credit-card' },
  { id: 'paypal', label: 'PayPal', icon: 'paypal' },
  { id: 'flutterwave', label: 'Flutterwave', icon: 'money' },
];

export default function PaymentScreen({ navigation, route }: Props) {
  const { doctor, slot, date, type } = route.params ?? {};
  const [method, setMethod] = useState('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);

  const pay = () => {
    if (method === 'card') {
      if (!cardName.trim()) return Alert.alert('', 'Please enter card holder name.');
      if (cardNumber.length < 16) return Alert.alert('', 'Please enter a valid card number.');
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert('Payment Successful', 'Your payment has been processed successfully.', [
        { text: 'OK', onPress: () => navigation.navigate('AppointmentConfirmed', { doctor, slot, date, type }) },
      ]);
    }, 1500);
  };

  return (
    <View style={styles.container}>
      <SCHeader title="Payment" onBack={() => navigation.goBack()} />
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
            <Text style={styles.fee}>{doctor?.fee ?? '$80'}</Text>
            <Text style={styles.feeLabel}>Fee</Text>
          </View>
        </View>

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

        {method === 'card' && (
          <View style={styles.cardForm}>
            <Text style={styles.sectionLabel}>Card Details</Text>
            <SCTextField placeholder="Card Holder Name" icon="user" value={cardName} onChangeText={setCardName} />
            <SCTextField placeholder="Card Number" icon="credit-card" value={cardNumber} onChangeText={setCardNumber} keyboardType="number-pad" maxLength={16} />
            <View style={styles.row}>
              <SCTextField placeholder="MM / YY" icon="calendar" value={expiry} onChangeText={setExpiry} containerStyle={styles.halfField} keyboardType="numbers-and-punctuation" />
              <SCTextField placeholder="CVV" icon="lock" value={cvv} onChangeText={setCvv} containerStyle={styles.halfField} keyboardType="number-pad" maxLength={3} isPassword />
            </View>
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Amount</Text>
          <Text style={styles.totalValue}>{doctor?.fee ?? '$80'}</Text>
        </View>

        <SCButton title={`Pay ${doctor?.fee ?? '$80'}`} variant="accent" onPress={pay} loading={loading} />
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
  cardForm: { marginTop: 16 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 12, padding: 16, marginBottom: 20, marginTop: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: Colors.textMedium },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
});
