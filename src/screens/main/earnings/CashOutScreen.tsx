import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoButton from '../../../components/common/EkoButton';
import { useCashOut, useDoctorEarnings, usePaymentMethod } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { formatMoney, groupThousands, paymentMethodLabel } from '../../../utils/format';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/** Minimum withdrawal — mirrors the mock/back-end floor. */
const MIN_CASHOUT = 1000;

export default function CashOutScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();

  const { data: earnings } = useDoctorEarnings();
  const { data: method } = usePaymentMethod();
  const cashOut = useCashOut();
  const balance = earnings?.balance ?? 0;

  // Prefill to the full balance; the doctor can lower it or tap Max.
  const [amountStr, setAmountStr] = useState(String(balance));
  const amount = parseInt(amountStr.replace(/\D/g, ''), 10) || 0;

  const hasMethod = !!method;
  let error: string | null = null;
  if (amount > 0 && amount < MIN_CASHOUT) error = t('cashout.minAmount', { amount: groupThousands(MIN_CASHOUT) });
  else if (amount > balance) error = t('cashout.exceedsBalance');
  const canConfirm = hasMethod && amount >= MIN_CASHOUT && amount <= balance;

  const onChangeAmount = (val: string) => setAmountStr(val.replace(/\D/g, ''));

  const confirm = async () => {
    if (!canConfirm) return;
    try {
      await cashOut.mutateAsync({ amount });
      navigation.goBack();
      Alert.alert(t('cashout.successTitle'), t('cashout.successBody', { amount: formatMoney('₦', amount) }));
    } catch (err) {
      Alert.alert(t('cashout.couldNotCashOut'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>{t('cashout.title')}</Text>
          <Text style={styles.available}>{t('cashout.available', { amount: formatMoney('₦', balance) })}</Text>

          {/* Amount */}
          <Text style={styles.label}>{t('cashout.amount')}</Text>
          <View style={[styles.amountField, error ? styles.amountFieldError : null]}>
            <Text style={styles.currency}>₦</Text>
            <TextInput
              style={styles.amountInput}
              value={amountStr ? groupThousands(amount) : ''}
              onChangeText={onChangeAmount}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={Colors.textGray}
              accessibilityLabel={t('cashout.amount')}
            />
            <TouchableOpacity onPress={() => setAmountStr(String(balance))} accessibilityRole="button" accessibilityLabel={t('cashout.max')}>
              <Text style={styles.maxBtn}>{t('cashout.max')}</Text>
            </TouchableOpacity>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Destination */}
          <Text style={styles.label}>{t('cashout.destination')}</Text>
          {hasMethod ? (
            <TouchableOpacity style={styles.destRow} onPress={() => navigation.navigate('PaymentInfo')} activeOpacity={0.8}>
              <View style={styles.destIcon}>
                <FontAwesome name={method!.type === 'paypal' ? 'paypal' : method!.type === 'card' ? 'credit-card' : 'bank'} size={15} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.destLabel}>{paymentMethodLabel(method)}</Text>
                <Text style={styles.destName}>{method!.accountName}</Text>
              </View>
              <Text style={styles.change}>{t('cashout.change')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.addMethod} onPress={() => navigation.navigate('PaymentInfo')} activeOpacity={0.8}>
              <FontAwesome name="plus-circle" size={16} color={Colors.primary} />
              <Text style={styles.addMethodText}>{t('cashout.addMethod')}</Text>
            </TouchableOpacity>
          )}

          <EkoButton
            title={t('cashout.confirm')}
            variant="primary"
            onPress={confirm}
            loading={cashOut.isPending}
            disabled={!canConfirm}
            style={styles.confirmBtn}
          />
          <TouchableOpacity style={styles.cancel} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel={t('common.cancel')}>
            <Text style={styles.cancelText}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 40,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  available: { fontSize: 13, color: Colors.textGray, marginTop: 2, marginBottom: 18, fontFamily: 'Poppins_400Regular' },

  label: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold' },
  amountField: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.field, borderRadius: 12,
    borderWidth: 1.5, borderColor: 'transparent', paddingHorizontal: 16, height: 60,
  },
  amountFieldError: { borderColor: Colors.error },
  currency: { fontSize: 24, fontWeight: '700', color: Colors.textDark, marginRight: 6, fontFamily: 'Poppins_700Bold' },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  maxBtn: { fontSize: 13, fontWeight: '700', color: Colors.primary, fontFamily: 'Poppins_700Bold' },
  error: { fontSize: 12, color: Colors.error, marginTop: 6, marginLeft: 2, fontFamily: 'Poppins_400Regular' },

  destRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.field, borderRadius: 12, padding: 12, marginTop: 4,
  },
  destIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  destLabel: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  destName: { fontSize: 12, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  change: { fontSize: 13, fontWeight: '700', color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },

  addMethod: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryFaded, borderRadius: 12, padding: 14, marginTop: 4,
    borderWidth: 1, borderColor: Colors.primary + '40', borderStyle: 'dashed',
  },
  addMethodText: { fontSize: 14, fontWeight: '600', color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },

  confirmBtn: { marginTop: 24 },
  cancel: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
  cancelText: { fontSize: 14, color: Colors.textGray, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});
