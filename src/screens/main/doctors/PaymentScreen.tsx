import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import EkoTextField from '../../../components/common/EkoTextField';
import RatingStars from '../../../components/common/RatingStars';
import { api } from '../../../api';
import { queryKeys, usePaymentPreview } from '../../../hooks/queries';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from '../../../i18n/useTranslation';
import { splitFee, formatMoney } from '../../../utils/format';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

// Card details are collected by the provider's hosted checkout, not here, so
// "card" simply routes through Flutterwave (the pitch's NGN processor).
const PAYMENT_METHODS = [
  { id: 'flutterwave', labelKey: 'payment.methodFlutterwave', icon: 'money' },
  { id: 'paypal', labelKey: 'payment.methodPaypal', icon: 'paypal' },
];

// Maps a rejected PromoStatus (everything but 'applied') to the i18n key
// explaining why. See backend services/promos.ts for the source of truth.
const PROMO_ERROR_KEYS: Record<string, string> = {
  not_found: 'payment.promoNotFound',
  inactive: 'payment.promoInactive',
  expired: 'payment.promoExpired',
  min_spend: 'payment.promoMinSpend',
  limit_reached: 'payment.promoLimitReached',
  user_limit_reached: 'payment.promoUserLimitReached',
};

/**
 * Pays for an appointment the doctor has already ACCEPTED — it no longer
 * creates the booking. Reached from AppointmentDetails when a visit is
 * awaiting payment; the visit is only confirmed once the provider webhook
 * settles, which is why this hands off and then polls rather than declaring
 * success on its own.
 */
export default function PaymentScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { appointment, doctor } = route.params ?? {};
  const [method, setMethod] = useState('flutterwave');
  const [loading, setLoading] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  // The code actually being previewed/paid with — only set once the patient
  // taps Apply, so the preview doesn't refetch on every keystroke.
  const [appliedPromo, setAppliedPromo] = useState('');
  const qc = useQueryClient();

  const fee = appointment?.fee ?? doctor?.fee ?? '₦15,000';
  const feeSymbol = splitFee(fee)?.symbol ?? '₦';

  // The real charge — consultation fee + service charge + VAT (Video Visit
  // only) − any promo discount — comes from the server (admin-managed rates
  // and codes, backend lib/pricing.ts / services/promos.ts), not computed
  // locally. Falls back to the raw fee while this loads so the screen isn't blank.
  const { data: preview } = usePaymentPreview(appointment?.id ?? '', appliedPromo || undefined);
  const total = preview ? formatMoney(feeSymbol, preview.patientTotal) : fee;
  const promoError = appliedPromo && preview?.promoStatus && preview.promoStatus !== 'applied'
    ? t(PROMO_ERROR_KEYS[preview.promoStatus] ?? 'payment.promoErrorGeneric')
    : undefined;

  const pay = async () => {
    if (!appointment?.id) return Alert.alert('', t('payment.notAvailable'));
    setLoading(true);
    try {
      const intent = await api.payments.createIntent({
        appointmentId: appointment.id,
        provider: method === 'paypal' ? 'paypal' : 'flutterwave',
        // Re-validated server-side — never trust the discount preview() showed.
        code: appliedPromo || undefined,
      });

      if (/^https?:\/\//.test(intent.checkoutRef)) {
        // Live: hand off to the provider's hosted checkout, then verify with
        // the backend — the redirect back carries no trustworthy result.
        await Linking.openURL(intent.checkoutRef);
        navigation.replace('PaymentPending', { paymentId: intent.id, doctor, appointment });
      } else {
        // Mock: no real checkout exists, so the intent stands in for settlement.
        qc.invalidateQueries({ queryKey: queryKeys.appointments });
        Alert.alert(t('payment.paymentSuccessful'), t('payment.paymentProcessed'), [
          { text: t('common.ok'), onPress: () => navigation.navigate('AppointmentConfirmed', { doctor, appointment }) },
        ]);
      }
    } catch (err) {
      Alert.alert(t('payment.paymentFailed'), err instanceof Error ? err.message : t('payment.payFailedRetry'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('payment.title')} onBack={() => navigation.goBack()} />
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
            <Text style={styles.feeLabel}>{t('payment.feeLabel')}</Text>
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

        <Text style={styles.sectionLabel}>{t('payment.paymentMethodTitle')}</Text>
        {PAYMENT_METHODS.map((pm) => (
          <TouchableOpacity
            key={pm.id}
            style={[styles.methodBtn, method === pm.id && styles.methodBtnActive]}
            onPress={() => setMethod(pm.id)}
            accessibilityRole="radio"
            accessibilityLabel={t(pm.labelKey)}
            accessibilityState={{ selected: method === pm.id }}
          >
            <FontAwesome name={pm.icon as any} size={20} color={method === pm.id ? Colors.primary : Colors.textGray} />
            <Text style={[styles.methodText, method === pm.id && styles.methodTextActive]}>{t(pm.labelKey)}</Text>
            <FontAwesome name={method === pm.id ? 'dot-circle-o' : 'circle-o'} size={18} color={method === pm.id ? Colors.primary : Colors.textGray} />
          </TouchableOpacity>
        ))}

        {/* No card fields here on purpose: card details are entered on the
            provider's hosted checkout page, so collecting them in-app would
            gather data that goes nowhere (and put us in PCI scope). */}
        <Text style={styles.handoffNote}>
          {t('payment.handoffNote')}
        </Text>

        <Text style={styles.sectionLabel}>{t('payment.promoCodeTitle')}</Text>
        <View style={styles.promoRow}>
          <EkoTextField
            value={promoInput}
            onChangeText={(v: string) => setPromoInput(v.toUpperCase())}
            placeholder={t('payment.promoCodePlaceholder')}
            autoCapitalize="characters"
            autoCorrect={false}
            containerStyle={styles.promoInput}
            error={promoError}
          />
          <TouchableOpacity
            style={[styles.promoApplyBtn, !promoInput.trim() && styles.promoApplyBtnDisabled]}
            onPress={() => setAppliedPromo(promoInput.trim())}
            disabled={!promoInput.trim()}
            accessibilityRole="button"
            accessibilityLabel={t('payment.apply')}
          >
            <Text style={styles.promoApplyText}>{t('payment.apply')}</Text>
          </TouchableOpacity>
        </View>
        {preview?.promoStatus === 'applied' && (
          <Text style={styles.promoSuccess}>{t('payment.promoApplied', { code: appliedPromo })}</Text>
        )}

        {preview && (
          <View style={styles.breakdownCard}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>{t('payment.consultation')}</Text>
              <Text style={styles.breakdownValue}>{formatMoney(feeSymbol, preview.consultationFee)}</Text>
            </View>
            {preview.serviceCharge > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('payment.serviceFee')}</Text>
                <Text style={styles.breakdownValue}>{formatMoney(feeSymbol, preview.serviceCharge)}</Text>
              </View>
            )}
            {preview.vat > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('payment.vat')}</Text>
                <Text style={styles.breakdownValue}>{formatMoney(feeSymbol, preview.vat)}</Text>
              </View>
            )}
            {preview.discount > 0 && (
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>{t('payment.promoDiscount')}</Text>
                <Text style={[styles.breakdownValue, styles.discountValue]}>− {formatMoney(feeSymbol, preview.discount)}</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{t('payment.totalAmount')}</Text>
          <Text style={styles.totalValue}>{total}</Text>
        </View>

        <EkoButton title={t('payment.pay', { amount: total })} variant="accent" onPress={pay} loading={loading} />
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  doctorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaded,
    borderRadius: 14, padding: 14, marginBottom: 24,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: Colors.surface,
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
    borderWidth: 1.5, borderColor: Colors.borderGray, marginBottom: 10, backgroundColor: Colors.surface,
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
  promoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  promoInput: { flex: 1, marginBottom: 0 },
  promoApplyBtn: {
    height: 54, paddingHorizontal: 18, borderRadius: 12,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  promoApplyBtnDisabled: { backgroundColor: Colors.borderGray },
  promoApplyText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  promoSuccess: { fontSize: 12, color: Colors.green, marginTop: -8, marginBottom: 12, fontFamily: 'Poppins_400Regular' },
  breakdownCard: {
    backgroundColor: Colors.surface, borderRadius: 12, borderWidth: 1, borderColor: Colors.borderGray,
    padding: 14, marginTop: 16,
  },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  breakdownLabel: { fontSize: 13, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },
  breakdownValue: { fontSize: 13, color: Colors.textDark, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  discountValue: { color: Colors.green },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 12, padding: 16, marginBottom: 20, marginTop: 8,
  },
  totalLabel: { fontSize: 16, fontWeight: '600', color: Colors.textMedium },
  totalValue: { fontSize: 22, fontWeight: '900', color: Colors.primary },
});
