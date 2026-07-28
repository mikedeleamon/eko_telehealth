import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { useConversations, useDoctorEarnings, useEarningsAnalysis } from '../../../hooks/queries';
import Cross from '../../../components/common/Cross';
import TrendBars from '../../../components/earnings/TrendBars';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';
import { formatMoney } from '../../../utils/format';
import type { EarningItem, RevenueGranularity } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

type PeriodKey = 'month' | 'quarter' | 'year';

/** yyyy-mm-dd, the form both analysis endpoints parse. */
const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * The window and bucket size behind each preset. Granularity is pinned rather
 * than left to the server's default so the chart's shape doesn't change under
 * the provider as a month grows past the day/week threshold mid-period.
 */
function rangeFor(period: PeriodKey): { from: string; to: string; granularity: RevenueGranularity } {
  const now = new Date();
  const to = isoDay(now);
  if (period === 'month') {
    return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to, granularity: 'day' };
  }
  if (period === 'quarter') {
    return { from: isoDay(new Date(now.getFullYear(), now.getMonth() - 2, 1)), to, granularity: 'week' };
  }
  return { from: isoDay(new Date(now.getFullYear(), 0, 1)), to, granularity: 'month' };
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

  // Revenue analysis (SOW 1.18): the wallet answers "what am I owed", this
  // answers "how am I doing". Presets rather than a date-picker dialog — these
  // are the windows a provider actually asks about, and each one carries its
  // own bucket size so the chart stays readable.
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [chartVariant, setChartVariant] = useState<'bar' | 'line'>('bar');
  const range = useMemo(() => rangeFor(period), [period]);
  const { data: analysis } = useEarningsAnalysis(range);

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

            {/* Revenue analysis (SOW 1.18) — trend, comparison, breakdown. */}
            <View style={styles.analysisCard}>
              <View style={styles.analysisHead}>
                <Text style={styles.analysisTitle}>{t('earnings.analysisTitle')}</Text>
                {/* Bar vs. line is a display preference, not an analysis
                    choice — kept as a lightweight icon toggle rather than
                    competing with the period chips for attention. */}
                <View style={styles.chartToggle}>
                  {(['bar', 'line'] as const).map((key) => {
                    const active = chartVariant === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[styles.chartToggleBtn, active && styles.chartToggleBtnActive]}
                        onPress={() => setChartVariant(key)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={t(key === 'bar' ? 'earnings.barChart' : 'earnings.lineChart')}
                      >
                        <FontAwesome
                          name={key === 'bar' ? 'bar-chart' : 'line-chart'}
                          size={13}
                          color={active ? Colors.primary : Colors.textGray}
                        />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.periodRow}>
                {(['month', 'quarter', 'year'] as const).map((key) => {
                  const active = period === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.periodChip, active && styles.periodChipActive]}
                      onPress={() => setPeriod(key)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.periodText, active && styles.periodTextActive]}>
                        {t(`earnings.period.${key}`)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.analysisTotals}>
                <View>
                  <Text style={styles.analysisAmount}>{formatMoney('₦', analysis?.totals.earned ?? 0)}</Text>
                  <Text style={styles.analysisCaption}>
                    {t('earnings.visitsCount', { count: analysis?.totals.visits ?? 0 })}
                    {(analysis?.totals.visits ?? 0) > 0
                      ? ` · ${t('earnings.perVisit', { amount: formatMoney('₦', analysis?.totals.averagePerVisit ?? 0) })}`
                      : ''}
                  </Text>
                </View>
                {/* Only shown when there IS a preceding period to compare with —
                    "+100% vs nothing" is not a comparison. */}
                {analysis?.previous.earnedChangePct != null && (
                  <View
                    style={[
                      styles.deltaPill,
                      { backgroundColor: (analysis.previous.earnedChangePct >= 0 ? Colors.green : Colors.red) + '1F' },
                    ]}
                  >
                    <FontAwesome
                      name={analysis.previous.earnedChangePct >= 0 ? 'arrow-up' : 'arrow-down'}
                      size={10}
                      color={analysis.previous.earnedChangePct >= 0 ? Colors.green : Colors.red}
                    />
                    <Text
                      style={[
                        styles.deltaText,
                        { color: analysis.previous.earnedChangePct >= 0 ? Colors.green : Colors.red },
                      ]}
                    >
                      {Math.abs(analysis.previous.earnedChangePct)}%
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.analysisVsPrevious}>
                {t('earnings.vsPrevious', { amount: formatMoney('₦', analysis?.previous.earned ?? 0) })}
              </Text>

              <TrendBars
                points={(analysis?.series ?? []).map((s) => ({ bucket: s.bucket, label: s.label, value: s.earned }))}
                variant={chartVariant}
              />

              {(analysis?.byVisitType.length ?? 0) > 0 && (
                <View style={styles.breakdown}>
                  <Text style={styles.breakdownTitle}>{t('earnings.byVisitType')}</Text>
                  {analysis!.byVisitType.map((row) => {
                    const share = analysis!.totals.earned > 0 ? row.earned / analysis!.totals.earned : 0;
                    return (
                      <View key={row.type} style={styles.breakdownRow}>
                        <View style={styles.breakdownLabelCol}>
                          <Text style={styles.breakdownLabel} numberOfLines={1}>{row.type}</Text>
                          <View style={styles.shareTrack}>
                            <View style={[styles.shareFill, { width: `${Math.round(share * 100)}%` }]} />
                          </View>
                        </View>
                        <View style={styles.breakdownValueCol}>
                          <Text style={styles.breakdownValue}>{formatMoney('₦', row.earned)}</Text>
                          <Text style={styles.breakdownCount}>{t('earnings.visitsCount', { count: row.visits })}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
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

  analysisCard: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 20,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  analysisHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  analysisTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  chartToggle: { flexDirection: 'row', backgroundColor: Colors.field, borderRadius: 10, padding: 2, gap: 2 },
  chartToggleBtn: { width: 28, height: 26, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  chartToggleBtnActive: { backgroundColor: Colors.surface },
  periodRow: { flexDirection: 'row', gap: 8, marginTop: 12, marginBottom: 16 },
  periodChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.bgLight,
  },
  periodChipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  periodText: { fontSize: 12.5, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  periodTextActive: { color: Colors.primary, fontWeight: '700' },

  analysisTotals: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  analysisAmount: { fontSize: 26, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  analysisCaption: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  deltaPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 4 },
  deltaText: { fontSize: 12, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  analysisVsPrevious: { fontSize: 11.5, color: Colors.textGray, marginTop: 4, marginBottom: 16, fontFamily: 'Poppins_400Regular' },

  breakdown: { marginTop: 18 },
  breakdownTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMedium, marginBottom: 10, fontFamily: 'Poppins_600SemiBold' },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  breakdownLabelCol: { flex: 1 },
  breakdownLabel: { fontSize: 13, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  shareTrack: { height: 6, borderRadius: 3, backgroundColor: Colors.field, marginTop: 6, overflow: 'hidden' },
  shareFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  breakdownValueCol: { alignItems: 'flex-end' },
  breakdownValue: { fontSize: 13.5, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  breakdownCount: { fontSize: 11, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },

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
