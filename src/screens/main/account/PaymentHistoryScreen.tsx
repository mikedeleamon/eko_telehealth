import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useMyPayments } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { formatMoney } from '../../../utils/format';
import type { PaymentReceipt } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const TYPE_ICONS: Record<string, string> = {
  'Video Visit': 'video-camera',
  'Clinic Visit': 'hospital-o',
  'Home Visit': 'home',
};

/** '₦' for NGN, '$' for USD, else the ISO code itself as a prefix. */
function currencySymbol(currency: string): string {
  if (currency === 'NGN') return '₦';
  if (currency === 'USD') return '$';
  return `${currency} `;
}

/**
 * A patient's own spend history — every settled payment they've made, newest
 * first. Read-only; nothing here can be edited or disputed in-app.
 */
export default function PaymentHistoryScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: receipts, isLoading } = useMyPayments();
  const items = receipts ?? [];

  // Summed from the canonical-NGN breakdown fields, never from `amount` —
  // amount is whatever currency the gateway actually charged (USD for
  // PayPal), so summing it directly across receipts would mix currencies.
  const totalSpentNgn = items.reduce(
    (sum, r) => sum + (r.consultationFee ?? 0) + (r.serviceCharge ?? 0) + (r.vat ?? 0) - r.discount,
    0,
  );

  const renderItem = ({ item }: { item: PaymentReceipt }) => {
    const icon = TYPE_ICONS[item.visitType] ?? 'calendar';
    return (
      <View style={styles.row}>
        <View style={styles.rowIcon}>
          <FontAwesome name={icon as any} size={16} color={Colors.primary} />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>{item.doctorName}</Text>
          <Text style={styles.rowMeta}>{item.specialty} · {item.date}</Text>
          {item.discount > 0 && (
            <View style={styles.promoPill}>
              <FontAwesome name="tag" size={9} color={Colors.green} />
              <Text style={styles.promoPillText}>
                {'  '}
                {item.promoCode ? t('paymentHistory.promoAppliedCode', { code: item.promoCode }) : t('paymentHistory.promoApplied')}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.rowAmount}>{formatMoney(currencySymbol(item.currency), item.amount)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('paymentHistory.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            items.length > 0 ? (
              <View style={styles.summaryCard}>
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{formatMoney('₦', totalSpentNgn)}</Text>
                  <Text style={styles.summaryLabel}>{t('paymentHistory.totalSpent')}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryStat}>
                  <Text style={styles.summaryValue}>{items.length}</Text>
                  <Text style={styles.summaryLabel}>{t('paymentHistory.visitsPaid')}</Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="file-text-o" size={44} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>{t('paymentHistory.empty')}</Text>
              <Text style={styles.emptyHint}>{t('paymentHistory.emptyHint')}</Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  loader: { marginTop: 60 },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },

  summaryCard: {
    flexDirection: 'row', backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, marginBottom: 16,
  },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: Colors.borderGray, marginVertical: 4 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  summaryLabel: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  rowMeta: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  promoPill: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  promoPillText: { fontSize: 11, color: Colors.green, fontFamily: 'Poppins_400Regular' },
  rowAmount: { fontSize: 14, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, marginTop: 12, fontFamily: 'Poppins_600SemiBold' },
  emptyHint: { fontSize: 13, color: Colors.textGray, marginTop: 4, textAlign: 'center', paddingHorizontal: 30, fontFamily: 'Poppins_400Regular' },
});
