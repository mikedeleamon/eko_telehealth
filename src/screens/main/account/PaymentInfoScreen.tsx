import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoSelectField from '../../../components/common/EkoSelectField';
import EkoButton from '../../../components/common/EkoButton';
import { useBanks, usePayoutMethod, useSavePayoutMethod } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { PayoutMethodInput, PayoutRail } from '../../../api/types';
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const RAILS: { rail: PayoutRail; icon: string; labelKey: string }[] = [
  { rail: 'flutterwave_bank', icon: 'bank', labelKey: 'payout.railBank' },
  { rail: 'paypal', icon: 'paypal', labelKey: 'payout.railPaypal' },
];

/**
 * Where this provider gets paid. Strictly money-OUT — there's deliberately no
 * card option: patients pay through hosted gateway checkout, so a card here
 * would be a PAN stored for nothing.
 *
 * On save, a bank destination is verified against the bank before it's
 * accepted, and the name that comes back is what gets stored — a mistyped
 * account number usually still belongs to a real stranger, so catching it
 * here is the difference between a rejected form and an irreversible payment
 * to the wrong person.
 */
export default function PaymentInfoScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: existing, isLoading } = usePayoutMethod();
  const { data: banks = [], isLoading: banksLoading } = useBanks();
  const savePayoutMethod = useSavePayoutMethod();

  const [rail, setRail] = useState<PayoutRail>('flutterwave_bank');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  useEffect(() => {
    if (existing) {
      setRail(existing.rail);
      setBankName(existing.bankName ?? '');
      setPaypalEmail(existing.paypalEmail ?? '');
      // accountNumber is intentionally NOT prefilled — the server only ever
      // returns it masked, so re-entering it in full is the only honest edit.
    }
  }, [existing]);

  const save = async () => {
    let input: PayoutMethodInput;
    if (rail === 'flutterwave_bank') {
      const bank = banks.find((b) => b.name === bankName);
      if (!bank) return Alert.alert('', t('payout.selectBank'));
      if (!/^\d{10}$/.test(accountNumber.trim())) return Alert.alert('', t('payout.valAccountNumber'));
      input = { rail, bankCode: bank.code, bankName: bank.name, accountNumber: accountNumber.trim() };
    } else {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(paypalEmail.trim())) return Alert.alert('', t('payout.valPaypalEmail'));
      input = { rail, paypalEmail: paypalEmail.trim() };
    }
    try {
      const saved = await savePayoutMethod.mutateAsync(input);
      Alert.alert(
        t('payout.saved'),
        rail === 'flutterwave_bank' ? t('payout.savedBankBody', { name: saved.accountName }) : t('payout.savedPaypalBody'),
        [{ text: t('common.ok'), onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      Alert.alert(t('payout.couldNotSave'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('payout.title')} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.subtitle}>{t('payout.subtitle')}</Text>

          {existing && (
            <View style={styles.currentCard}>
              <FontAwesome name="check-circle" size={16} color={Colors.green} />
              <View style={styles.currentInfo}>
                <Text style={styles.currentName}>{existing.accountName}</Text>
                <Text style={styles.currentDetail}>
                  {existing.rail === 'paypal'
                    ? existing.paypalEmail
                    : `${existing.bankName} ${existing.accountNumberMasked ?? ''}`}
                </Text>
              </View>
            </View>
          )}

          <Text style={styles.sectionLabel}>{t('payout.howPaid')}</Text>
          <View style={styles.railRow}>
            {RAILS.map((m) => {
              const selected = rail === m.rail;
              return (
                <TouchableOpacity
                  key={m.rail}
                  style={[styles.railBtn, selected && styles.railBtnActive]}
                  onPress={() => setRail(m.rail)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                >
                  <FontAwesome name={m.icon as any} size={20} color={selected ? Colors.white : Colors.primary} />
                  <Text style={[styles.railText, selected && styles.railTextActive]}>{t(m.labelKey)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {rail === 'flutterwave_bank' ? (
            <>
              <EkoSelectField
                label={t('payout.bank')}
                icon="bank"
                placeholder={banksLoading ? t('payout.loadingBanks') : t('payout.selectYourBank')}
                options={banks.map((b) => b.name)}
                value={bankName}
                onSelect={setBankName}
              />
              <EkoTextField
                label={t('payout.accountNumber')}
                placeholder={t('payout.accountNumberPlaceholder')}
                icon="hashtag"
                value={accountNumber}
                onChangeText={(v) => setAccountNumber(v.replace(/\D/g, '').slice(0, 10))}
                keyboardType="number-pad"
              />
              <Text style={styles.hint}>{t('payout.verifyHint')}</Text>
            </>
          ) : (
            <>
              <EkoTextField
                label={t('payout.paypalEmail')}
                placeholder={t('payout.paypalEmailPlaceholder')}
                icon="at"
                value={paypalEmail}
                onChangeText={setPaypalEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={styles.hint}>{t('payout.paypalHint')}</Text>
            </>
          )}

          <EkoButton
            title={savePayoutMethod.isPending ? t('payout.verifying') : t('payout.save')}
            variant="accent"
            onPress={save}
            loading={savePayoutMethod.isPending}
            style={styles.btn}
          />
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loader: { marginTop: 60 },
  content: { padding: 20, paddingBottom: TAB_BAR_SPACE },
  subtitle: { fontSize: 13, color: Colors.textGray, lineHeight: 19, marginBottom: 20 },

  currentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.field, borderRadius: 12, padding: 14, marginBottom: 20,
  },
  currentInfo: { flex: 1 },
  currentName: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  currentDetail: { fontSize: 12, color: Colors.textGray, marginTop: 2 },

  sectionLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 8, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  railRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  railBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.surface,
  },
  railBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  railText: { fontSize: 13, fontWeight: '600', color: Colors.textMedium },
  railTextActive: { color: Colors.white },

  hint: { fontSize: 12, color: Colors.textGray, lineHeight: 17, marginTop: -8, marginBottom: 12 },
  btn: { marginTop: 8 },
});
