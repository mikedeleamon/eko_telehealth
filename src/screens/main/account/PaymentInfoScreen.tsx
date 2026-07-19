import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';
import { useAuth } from '../../../context/AuthContext';
import { usePaymentMethod, useSavePaymentMethod } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { PaymentMethod, PaymentMethodType } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const METHODS: { type: PaymentMethodType; icon: string; labelKey: string }[] = [
  { type: 'bank', icon: 'bank', labelKey: 'paymentInfo.bank' },
  { type: 'card', icon: 'credit-card', labelKey: 'paymentInfo.card' },
  { type: 'paypal', icon: 'paypal', labelKey: 'paymentInfo.paypal' },
];

export default function PaymentInfoScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { isDoctor } = useAuth();
  const { data: existing } = usePaymentMethod();
  const savePaymentMethod = useSavePaymentMethod();

  const [type, setType] = useState<PaymentMethodType>('bank');
  const [accountName, setAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Prefill from the saved method (the form used to always open blank).
  useEffect(() => {
    if (existing) {
      setType(existing.type);
      setAccountName(existing.accountName ?? '');
      setBankName(existing.bankName ?? '');
      setAccountNumber(existing.accountNumber ?? '');
      setCardExpiry(existing.cardExpiry ?? '');
      setPaypalEmail(existing.paypalEmail ?? '');
    }
  }, [existing]);

  const save = async () => {
    let method: PaymentMethod;
    if (type === 'bank') {
      if (!accountName.trim()) return Alert.alert('', t('paymentInfo.enterAccountName'));
      if (!bankName.trim()) return Alert.alert('', t('paymentInfo.enterBankName'));
      if (!accountNumber.trim()) return Alert.alert('', t('paymentInfo.enterAccountNumber'));
      method = { type, accountName: accountName.trim(), bankName: bankName.trim(), accountNumber: accountNumber.trim() };
    } else if (type === 'card') {
      if (!accountName.trim()) return Alert.alert('', t('paymentInfo.enterCardholder'));
      if (!accountNumber.trim()) return Alert.alert('', t('paymentInfo.enterCardNumber'));
      if (!cardExpiry.trim()) return Alert.alert('', t('paymentInfo.enterExpiry'));
      method = {
        type,
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        cardExpiry: cardExpiry.trim(),
        cardLast4: accountNumber.replace(/\D/g, '').slice(-4),
      };
    } else {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paypalEmail.trim())) return Alert.alert('', t('paymentInfo.enterPaypalEmail'));
      method = { type, accountName: accountName.trim() || paypalEmail.trim(), paypalEmail: paypalEmail.trim() };
    }
    try {
      await savePaymentMethod.mutateAsync(method);
      Alert.alert(t('paymentInfo.saved'), t('paymentInfo.savedBody'), [{ text: t('common.ok'), onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert(t('account.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.paymentInfo')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          {isDoctor ? t('paymentInfo.subtitleDoctor') : t('paymentInfo.subtitlePatient')}
        </Text>

        {/* Method type */}
        <Text style={styles.label}>{t('paymentInfo.methodType')}</Text>
        <View style={styles.methodRow}>
          {METHODS.map((m) => {
            const selected = type === m.type;
            return (
              <TouchableOpacity
                key={m.type}
                style={[styles.methodChip, selected && styles.methodChipActive]}
                onPress={() => setType(m.type)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected }}
              >
                <FontAwesome name={m.icon as any} size={16} color={selected ? Colors.primary : Colors.textGray} />
                <Text style={[styles.methodText, selected && styles.methodTextActive]}>{t(m.labelKey)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Fields per method */}
        {type === 'bank' && (
          <>
            <EkoTextField label={t('paymentInfo.accountName')} placeholder={t('paymentInfo.accountNamePlaceholder')} icon="user" value={accountName} onChangeText={setAccountName} />
            <EkoTextField label={t('paymentInfo.bankName')} placeholder={t('paymentInfo.bankNamePlaceholder')} icon="bank" value={bankName} onChangeText={setBankName} />
            <EkoTextField label={t('paymentInfo.accountNumber')} placeholder={t('paymentInfo.accountNumberPlaceholder')} icon="hashtag" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />
          </>
        )}
        {type === 'card' && (
          <>
            <EkoTextField label={t('paymentInfo.cardholder')} placeholder={t('paymentInfo.cardholderPlaceholder')} icon="user" value={accountName} onChangeText={setAccountName} />
            <EkoTextField label={t('paymentInfo.cardNumber')} placeholder="•••• •••• •••• ••••" icon="credit-card" value={accountNumber} onChangeText={setAccountNumber} keyboardType="number-pad" />
            <EkoTextField label={t('paymentInfo.expiry')} placeholder="MM/YY" icon="calendar" value={cardExpiry} onChangeText={setCardExpiry} />
          </>
        )}
        {type === 'paypal' && (
          <>
            <EkoTextField label={t('paymentInfo.accountName')} placeholder={t('paymentInfo.accountNamePlaceholder')} icon="user" value={accountName} onChangeText={setAccountName} />
            <EkoTextField label={t('paymentInfo.paypalEmail')} placeholder={t('paymentInfo.paypalEmailPlaceholder')} icon="envelope-o" value={paypalEmail} onChangeText={setPaypalEmail} keyboardType="email-address" autoCapitalize="none" />
          </>
        )}

        <View style={styles.secureRow}>
          <FontAwesome name="lock" size={12} color={Colors.textGray} />
          <Text style={styles.secureText}>{t('paymentInfo.secureNote')}</Text>
        </View>

        <EkoButton
          title={t('paymentInfo.save')}
          variant={isDoctor ? 'primary' : 'accent'}
          onPress={save}
          loading={savePaymentMethod.isPending}
          style={styles.btn}
        />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  subtitle: { fontSize: 14, color: Colors.textGray, lineHeight: 20, marginBottom: 20, fontFamily: 'Poppins_400Regular' },

  label: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 8, marginLeft: 2, fontFamily: 'Poppins_600SemiBold' },
  methodRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  methodChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 46, borderRadius: 12, backgroundColor: Colors.field,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  methodChipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  methodText: { fontSize: 13, color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },
  methodTextActive: { color: Colors.primary, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  secureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, marginBottom: 8 },
  secureText: { flex: 1, fontSize: 11, color: Colors.textGray, lineHeight: 16, fontFamily: 'Poppins_400Regular' },

  btn: { marginTop: 8 },
});
