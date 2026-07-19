import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { useConversations, useDoctorEarnings } from '../../../hooks/queries';
import Cross from '../../../components/common/Cross';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { formatMoney } from '../../../utils/format';
import type { EarningItem } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function EarningsScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: earnings } = useDoctorEarnings();
  const { data: conversations = [] } = useConversations();
  const unreadCount = conversations.reduce((n, c) => n + c.unread, 0);

  const balance = earnings?.balance ?? 0;
  const items = earnings?.items ?? [];

  const renderItem = ({ item }: { item: EarningItem }) => {
    const isEarning = item.kind === 'earning';
    return (
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: (isEarning ? Colors.primary : Colors.textGray) + '18' }]}>
          <FontAwesome
            name={isEarning ? 'user' : 'arrow-up'}
            size={16}
            color={isEarning ? Colors.primary : Colors.textGray}
          />
        </View>
        <View style={styles.rowInfo}>
          <Text style={styles.rowTitle}>{isEarning ? item.title : t('earnings.withdrawal')}</Text>
          <Text style={styles.rowMeta}>{item.date} · {item.time}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowAmount, { color: isEarning ? Colors.green : Colors.red }]}>
            {isEarning ? '+' : '−'} {formatMoney('₦', item.amount)}
          </Text>
          {item.status === 'pending' ? (
            <View style={styles.pendingPill}>
              <Text style={styles.pendingText}>{t('earnings.pending')}</Text>
            </View>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Cross size={150} opacity={0.09} rotation={14} style={{ top: -50, right: -36 }} />
        <Cross size={90} opacity={0.07} rotation={-12} style={{ bottom: 10, left: -28 }} />
        <Cross size={60} opacity={0.06} rotation={18} style={{ bottom: -16, left: 110 }} />
        <Cross size={44} opacity={0.06} rotation={-16} style={{ top: 8, right: 150 }} />

        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>{t('earnings.title')}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Messages')} accessibilityRole="button" accessibilityLabel={t('tabs.messages', { defaultValue: 'Messages' })}>
            <FontAwesome name="comment" size={19} color={Colors.white} />
            {unreadCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('SettingsTab')} accessibilityRole="button" accessibilityLabel={t('account.editProfile')}>
            <FontAwesome name="user-md" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Balance card */}
        <View style={styles.balanceCard}>
          <Cross size={120} opacity={0.12} rotation={16} style={{ bottom: -30, right: -10 }} />
          <Text style={styles.balanceLabel}>{t('earnings.myBalance')}</Text>
          <Text style={styles.balanceAmount}>{formatMoney('₦', balance)}</Text>
          <TouchableOpacity
            style={[styles.cashOutBtn, balance <= 0 && styles.cashOutBtnDisabled]}
            onPress={() => navigation.navigate('CashOut')}
            disabled={balance <= 0}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={t('earnings.cashOut')}
          >
            <FontAwesome name="money" size={15} color={Colors.primary} />
            <Text style={styles.cashOutText}>  {t('earnings.cashOut')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {/* Summary stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatMoney('₦', earnings?.thisMonth ?? 0)}</Text>
                <Text style={styles.statLabel}>{t('earnings.thisMonth')}</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={[styles.statValue, (earnings?.pending ?? 0) > 0 && { color: Colors.orange }]}>
                  {formatMoney('₦', earnings?.pending ?? 0)}
                </Text>
                <Text style={styles.statLabel}>{t('earnings.pendingPayout')}</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>{t('earnings.title')}</Text>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="line-chart" size={44} color={Colors.textLight} />
            <Text style={styles.emptyText}>{t('earnings.noEarnings')}</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    paddingHorizontal: 20, paddingBottom: 24, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: Colors.white, fontFamily: 'Poppins_700Bold' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -3, right: -3,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: Colors.white, fontWeight: '800' },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },

  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 22, padding: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)',
  },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_500Medium' },
  balanceAmount: { fontSize: 40, fontWeight: '800', color: Colors.white, marginTop: 4, marginBottom: 16, fontFamily: 'Poppins_700Bold' },
  cashOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start', backgroundColor: Colors.surface,
    borderRadius: 24, paddingHorizontal: 22, height: 44,
  },
  cashOutBtnDisabled: { opacity: 0.5 },
  cashOutText: { fontSize: 14, fontWeight: '700', color: Colors.primary, fontFamily: 'Poppins_700Bold' },

  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 16, padding: 14,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },

  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 12, fontFamily: 'Poppins_700Bold' },

  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  rowIcon: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  rowMeta: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  rowRight: { alignItems: 'flex-end' },
  rowAmount: { fontSize: 15, fontWeight: '800', fontFamily: 'Poppins_700Bold' },
  pendingPill: {
    backgroundColor: Colors.orange + '1F', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  pendingText: { fontSize: 10, color: Colors.orange, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: Colors.textGray, marginTop: 12, fontFamily: 'Poppins_400Regular' },
});
