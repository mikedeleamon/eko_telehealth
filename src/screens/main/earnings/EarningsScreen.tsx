import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, LayoutAnimation,
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
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

type PeriodKey = 'month' | 'quarter' | 'year';

/**
 * Splits a ledger display date ("Oct 7, 2026" or "Wed, Oct 7, 2026") into a
 * day line and a year line, so the narrow table column stays two short lines.
 */
function splitDisplayDate(value: string): [string, string] {
  const m = /([A-Za-z]{3,}\.? \d{1,2}), (\d{4})/.exec(value);
  return m ? [m[1], m[2]] : [value, ''];
}

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
  const earningRows = items.filter((i) => i.kind === 'earning');
  const withdrawalRows = items.filter((i) => i.kind === 'withdrawal');

  // Earnings open by default (it's what the tab is for); withdrawals start
  // folded so the two tables don't run together.
  const [open, setOpen] = useState({ earnings: true, withdrawals: false });
  const toggle = (key: keyof typeof open) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Totals. Revenue and fees are only totalled when every row has them — a
  // legacy row without its payment split would otherwise make the totals stop
  // adding up (revenue − fees ≠ net) with no visible reason.
  const netTotal = earningRows.reduce((sum, i) => sum + (i.netAmount ?? i.amount), 0);
  const splitComplete = earningRows.every((i) => i.grossAmount != null && i.platformFee != null);
  const grossTotal = splitComplete ? earningRows.reduce((sum, i) => sum + (i.grossAmount ?? 0), 0) : null;
  const feeTotal = splitComplete ? earningRows.reduce((sum, i) => sum + (i.platformFee ?? 0), 0) : null;
  // A failed withdrawal never left the account, so it isn't money withdrawn.
  const withdrawnTotal = withdrawalRows.filter((i) => i.status !== 'failed').reduce((sum, i) => sum + i.amount, 0);
  const money = (n: number | null | undefined) => (n == null ? '—' : formatMoney('₦', n));

  const methodLabel = (item: EarningItem) =>
    item.method === 'paypal' ? t('earnings.methodPaypal') : item.method === 'flutterwave_bank' ? t('earnings.methodBank') : '—';

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
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('SettingsTab', { screen: 'DoctorSettings' })} accessibilityRole="button" accessibilityLabel={t('tabs.settings')}>
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

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
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

            {/* Earnings — one row per paid visit. */}
            <ReportSection
              title={t('earnings.earningsSection')}
              summary={`${t('earnings.entriesCount', { count: earningRows.length })} · ${money(netTotal)}`}
              icon="line-chart"
              open={open.earnings}
              onToggle={() => toggle('earnings')}
            >
              {earningRows.length === 0 ? (
                <Text style={styles.tableEmpty}>{t('earnings.noEarnings')}</Text>
              ) : (
                <>
                  <View style={[styles.tr, styles.thead]}>
                    <Text style={[styles.th, styles.colDate]}>{t('earnings.colAppointmentDate')}</Text>
                    <Text style={[styles.th, styles.colName]}>{t('earnings.colPatientName')}</Text>
                    <Text style={[styles.th, styles.colMoney, styles.right]}>{t('earnings.colPaidRevenue')}</Text>
                    <Text style={[styles.th, styles.colFee, styles.right]}>{t('earnings.colPlatformFees')}</Text>
                    <Text style={[styles.th, styles.colMoney, styles.right]}>{t('earnings.colNet')}</Text>
                  </View>
                  {earningRows.map((item, i) => {
                    const [dayLine, yearLine] = splitDisplayDate(item.appointmentDate ?? item.date);
                    return (
                      <View key={item.id} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
                        <View style={styles.colDate}>
                          <Text style={styles.td}>{dayLine}</Text>
                          {yearLine ? <Text style={styles.tdSub}>{yearLine}</Text> : null}
                        </View>
                        <Text style={[styles.td, styles.colName]} numberOfLines={2}>{item.patientName ?? item.title}</Text>
                        <Text style={[styles.td, styles.colMoney, styles.right]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          {money(item.grossAmount)}
                        </Text>
                        <Text style={[styles.td, styles.tdMuted, styles.colFee, styles.right]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          {money(item.platformFee)}
                        </Text>
                        <View style={[styles.colMoney, styles.alignEnd]}>
                          <Text style={[styles.td, styles.tdNet]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                            {money(item.netAmount ?? item.amount)}
                          </Text>
                          {item.status === 'pending' ? <Text style={styles.tagPending}>{t('earnings.pending')}</Text> : null}
                        </View>
                      </View>
                    );
                  })}
                  <View style={[styles.tr, styles.tfoot]}>
                    <Text style={[styles.tdTotal, styles.colDate]}>{t('earnings.total')}</Text>
                    <View style={styles.colName} />
                    <Text style={[styles.tdTotal, styles.colMoney, styles.right]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {money(grossTotal)}
                    </Text>
                    <Text style={[styles.tdTotal, styles.colFee, styles.right]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {money(feeTotal)}
                    </Text>
                    <Text style={[styles.tdTotal, styles.tdNet, styles.colMoney, styles.right]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {money(netTotal)}
                    </Text>
                  </View>
                  <Text style={styles.footnote}>{t('earnings.earningsFootnote')}</Text>
                </>
              )}
            </ReportSection>

            {/* Withdrawals — money moved out to the doctor's bank or PayPal. */}
            <ReportSection
              title={t('earnings.withdrawalsSection')}
              summary={`${t('earnings.entriesCount', { count: withdrawalRows.length })} · ${money(withdrawnTotal)}`}
              icon="university"
              open={open.withdrawals}
              onToggle={() => toggle('withdrawals')}
            >
              {withdrawalRows.length === 0 ? (
                <Text style={styles.tableEmpty}>{t('earnings.noWithdrawals')}</Text>
              ) : (
                <>
                  <View style={[styles.tr, styles.thead]}>
                    <Text style={[styles.th, styles.colWDate]}>{t('earnings.colDate')}</Text>
                    <Text style={[styles.th, styles.colMethod]}>{t('earnings.colMethod')}</Text>
                    <Text style={[styles.th, styles.colAmount, styles.right]}>{t('earnings.colAmount')}</Text>
                  </View>
                  {withdrawalRows.map((item, i) => {
                    const [dayLine, yearLine] = splitDisplayDate(item.date);
                    const failed = item.status === 'failed';
                    return (
                      <View key={item.id} style={[styles.tr, i % 2 === 1 && styles.trAlt]}>
                        <View style={styles.colWDate}>
                          <Text style={styles.td}>{dayLine}</Text>
                          {yearLine ? <Text style={styles.tdSub}>{yearLine}</Text> : null}
                        </View>
                        <View style={styles.colMethod}>
                          <Text style={styles.td}>{methodLabel(item)}</Text>
                          {/* Middle-truncated so the account's last digits (or the
                              email's domain) stay visible on a narrow phone. */}
                          {item.destination ? (
                            <Text style={styles.tdSub} numberOfLines={1} ellipsizeMode="middle">{item.destination}</Text>
                          ) : null}
                        </View>
                        <View style={[styles.colAmount, styles.alignEnd]}>
                          <Text style={[styles.td, styles.tdOut, failed && styles.tdStruck]} numberOfLines={1}>
                            {money(item.amount)}
                          </Text>
                          {item.status === 'pending' ? <Text style={styles.tagPending}>{t('earnings.pending')}</Text> : null}
                          {failed ? <Text style={styles.tagFailed}>{t('earnings.failed')}</Text> : null}
                        </View>
                      </View>
                    );
                  })}
                  <View style={[styles.tr, styles.tfoot]}>
                    <Text style={[styles.tdTotal, styles.colWDate]}>{t('earnings.total')}</Text>
                    <View style={styles.colMethod} />
                    <Text style={[styles.tdTotal, styles.colAmount, styles.right]} numberOfLines={1}>
                      {money(withdrawnTotal)}
                    </Text>
                  </View>
                </>
              )}
            </ReportSection>
      </ScrollView>
    </View>
  );
}

/** A collapsible report block: tappable header with a one-line summary, body shown when open. */
function ReportSection({
  title, summary, icon, open, onToggle, children,
}: {
  title: string;
  summary: string;
  icon: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.reportCard}>
      <TouchableOpacity
        style={styles.reportHead}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${title}, ${summary}`}
      >
        <View style={styles.reportIcon}>
          <FontAwesome name={icon as any} size={15} color={Colors.primary} />
        </View>
        <View style={styles.reportHeadText}>
          <Text style={styles.reportTitle}>{title}</Text>
          <Text style={styles.reportSummary}>{summary}</Text>
        </View>
        <FontAwesome name={open ? 'chevron-up' : 'chevron-down'} size={13} color={Colors.textGray} />
      </TouchableOpacity>
      {open ? <View style={styles.reportBody}>{children}</View> : null}
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

  list: { padding: 16, paddingBottom: TAB_BAR_SPACE, flexGrow: 1 },

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

  // Collapsible report sections
  reportCard: {
    backgroundColor: Colors.surface, borderRadius: 18, marginBottom: 14, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 1 },
    }),
  },
  reportHead: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  reportIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
  },
  reportHeadText: { flex: 1 },
  reportTitle: { fontSize: 16, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  reportSummary: { fontSize: 12, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  reportBody: { paddingHorizontal: 10, paddingBottom: 14 },
  tableEmpty: { fontSize: 13, color: Colors.textGray, paddingHorizontal: 6, paddingBottom: 6, fontFamily: 'Poppins_400Regular' },

  // Tables — flex columns so five fit a phone's width without scrolling.
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, paddingHorizontal: 6, gap: 6 },
  trAlt: { backgroundColor: Colors.bgLight, borderRadius: 8 },
  thead: { borderBottomWidth: 1, borderBottomColor: Colors.borderGray, paddingBottom: 8 },
  tfoot: { borderTopWidth: 1, borderTopColor: Colors.borderGray, marginTop: 2 },
  th: { fontSize: 10.5, fontWeight: '700', color: Colors.textGray, lineHeight: 14, fontFamily: 'Poppins_600SemiBold' },
  td: { fontSize: 12, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },
  tdSub: { fontSize: 10.5, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  tdMuted: { color: Colors.textMedium },
  tdNet: { fontWeight: '700', color: Colors.green, fontFamily: 'Poppins_700Bold' },
  // Money that left the account — neutral, not the green of money earned.
  tdOut: { fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  tdStruck: { color: Colors.textGray, textDecorationLine: 'line-through' },
  tdTotal: { fontSize: 12, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  right: { textAlign: 'right' },
  alignEnd: { alignItems: 'flex-end' },
  colDate: { flex: 0.95 },
  colName: { flex: 1.3 },
  colMoney: { flex: 1.15 },
  colFee: { flex: 1.05 },
  colWDate: { flex: 1 },
  colMethod: { flex: 2 },
  colAmount: { flex: 1.3 },
  tagPending: { fontSize: 10, color: Colors.orange, fontWeight: '700', marginTop: 1, fontFamily: 'Poppins_600SemiBold' },
  tagFailed: { fontSize: 10, color: Colors.red, fontWeight: '700', marginTop: 1, fontFamily: 'Poppins_600SemiBold' },
  footnote: { fontSize: 11, color: Colors.textGray, lineHeight: 16, paddingHorizontal: 6, marginTop: 10, fontFamily: 'Poppins_400Regular' },
});
