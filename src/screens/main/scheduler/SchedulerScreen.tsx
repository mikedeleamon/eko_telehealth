import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Alert, RefreshControl,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { useTheme, type ThemeColors } from '../../../theme';
import {
  useAppointmentDecision,
  useConversations,
  usePatients,
  usePracticeAppointments,
  useProviderState,
  useRemoveTimeOff,
  useTimeOff,
} from '../../../hooks/queries';
import Cross from '../../../components/common/Cross';
import DateStrip from '../../../components/scheduler/DateStrip';
import MonthGrid, { type DaySummary } from '../../../components/scheduler/MonthGrid';
import ScheduleCard from '../../../components/scheduler/ScheduleCard';
import { useTranslation } from '../../../i18n/useTranslation';
import { TAB_BAR_SPACE } from '../../../constants/layout';
import type { Appointment, TimeOffBlock } from '../../../api/types';
import {
  DAY_MS,
  addDays,
  blocksOnDay,
  formatDayLabel,
  formatMonthHeading,
  formatTime,
  holdsTime,
  placeAppointments,
  sameDay,
  startOfDay,
  ymd,
} from '../../../utils/schedule';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

type ViewMode = 'day' | 'month';

/** Statuses a call can be placed for — mirrors useJoinableVisit / the backend's /calls/token. */
const CALLABLE: Appointment['status'][] = ['upcoming', 'checked_in'];
const PENDING: Appointment['status'][] = ['pending_approval', 'pending_payment'];

/**
 * The doctor's Scheduler tab: a day view (date strip + that day's visits, laid
 * out after the client's reference) and a month view (a grid of visit counts
 * and blocked days). From here the doctor books a patient in, blocks out
 * time, answers requests, and jumps into a visit's details, call, chat or
 * notes.
 */
export default function SchedulerScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();

  const [mode, setMode] = useState<ViewMode>('day');
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [month, setMonth] = useState(() => startOfDay(new Date()));

  // New Appointment hands back the day it booked, so the doctor lands on it.
  const focusDate = route.params?.focusDate as string | undefined;
  useEffect(() => {
    if (!focusDate) return;
    const d = startOfDay(new Date(focusDate));
    if (Number.isNaN(d.getTime())) return;
    setSelected(d);
    setMonth(d);
    setMode('day');
  }, [focusDate]);

  const { data: provider } = useProviderState();
  // Until an application is approved there's no practice to schedule.
  const isLive = provider?.state === 'live';
  const { data: appointments = [], isRefetching, refetch } = usePracticeAppointments(isLive);
  const { data: timeOff = [], refetch: refetchTimeOff } = useTimeOff(isLive);
  const { data: patients = [] } = usePatients();
  const { data: conversations = [] } = useConversations();
  const unreadCount = conversations.reduce((n, c) => n + c.unread, 0);
  const decision = useAppointmentDecision();
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const removeTimeOff = useRemoveTimeOff();

  const placed = useMemo(() => placeAppointments(appointments), [appointments]);

  const summaries = useMemo(() => {
    const map = new Map<string, DaySummary>();
    for (const { appointment, start } of placed) {
      if (!holdsTime(appointment)) continue;
      const key = ymd(start);
      const prev = map.get(key) ?? { count: 0, hasPending: false };
      map.set(key, { count: prev.count + 1, hasPending: prev.hasPending || PENDING.includes(appointment.status) });
    }
    return map;
  }, [placed]);
  const busyDays = useMemo(() => new Set(summaries.keys()), [summaries]);

  // Which days each block touches, and whether it swallows them whole.
  const blocked = useMemo(() => {
    const map = new Map<string, 'all' | 'partial'>();
    for (const block of timeOff) {
      const end = new Date(block.endAt).getTime();
      for (let day = startOfDay(new Date(block.startAt)); day.getTime() < end; day = addDays(day, 1)) {
        const key = ymd(day);
        const whole = blocksOnDay([block], day)[0]?.allDay ?? false;
        if (whole || !map.has(key)) map.set(key, whole ? 'all' : (map.get(key) ?? 'partial'));
      }
    }
    return map;
  }, [timeOff]);
  const blockedDays = useMemo(
    () => new Set([...blocked.entries()].filter(([, kind]) => kind === 'all').map(([key]) => key)),
    [blocked],
  );

  const dayItems = placed.filter((p) => sameDay(p.start, selected));
  const dayBlocks = blocksOnDay(timeOff, selected);
  const isToday = sameDay(selected, new Date());
  const rosterFor = (a: Appointment) => (a.patientId ? patients.find((p) => p.userId === a.patientId) : undefined);

  const onRefresh = () => {
    refetch();
    refetchTimeOff();
  };

  const selectDay = (day: Date) => {
    setSelected(startOfDay(day));
    setMonth(startOfDay(day));
    setMode('day');
  };

  const respond = (a: Appointment, decide: 'accept' | 'decline') => {
    const name = a.patientName ?? a.doctor;
    setDecidingId(a.id);
    decision.mutate(
      { id: a.id, decision: decide },
      {
        onSettled: () => setDecidingId(null),
        onError: (err) =>
          Alert.alert(
            decide === 'accept' ? t('dashboard.couldNotAccept') : t('dashboard.couldNotDecline'),
            err instanceof Error ? err.message : t('dashboard.couldNotActionRequest', { action: decide, name }),
          ),
      },
    );
  };

  const confirmUnblock = (block: TimeOffBlock) => {
    Alert.alert(t('scheduler.unblockTitle'), t('scheduler.unblockBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('scheduler.unblock'),
        onPress: () =>
          removeTimeOff.mutate(block.id, {
            onError: (err) =>
              Alert.alert(t('scheduler.couldNotUnblock'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
          }),
      },
    ]);
  };

  const sectionTitle = isToday
    ? t('scheduler.todaysSchedule', { date: formatDayLabel(selected, locale) })
    : t('scheduler.scheduleFor', { date: formatDayLabel(selected, locale) });

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
        <Cross size={90} opacity={0.07} rotation={-12} style={{ bottom: 6, left: -28 }} />
        <Cross size={60} opacity={0.06} rotation={18} style={{ bottom: -16, left: 120 }} />
        <Cross size={44} opacity={0.06} rotation={-16} style={{ top: 8, right: 150 }} />
        <Cross size={32} opacity={0.05} rotation={22} style={{ top: 70, right: 80 }} />

        <View style={styles.topRow}>
          <Text style={styles.headerTitle}>{t('scheduler.title')}</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Messages')}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.messages')}
          >
            <FontAwesome name="comment" size={19} color={Colors.white} />
            {unreadCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('SettingsTab', { screen: 'DoctorSettings' })}
            accessibilityRole="button"
            accessibilityLabel={t('tabs.settings')}
          >
            <FontAwesome name="user-md" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.modeRow}>
          {(['day', 'month'] as const).map((key) => {
            const active = mode === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.modeBtn, active && styles.modeBtnActive]}
                onPress={() => {
                  if (key === 'month') setMonth(selected);
                  setMode(key);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.modeText, active && styles.modeTextActive]}>
                  {key === 'day' ? t('scheduler.dayView') : t('scheduler.monthView')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.body}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {mode === 'day' ? (
          <>
            <View style={styles.monthRow}>
              <Text style={styles.monthHeading}>{formatMonthHeading(selected, locale)}</Text>
              {!isToday && (
                <TouchableOpacity onPress={() => selectDay(new Date())} accessibilityRole="button">
                  <Text style={styles.todayLink}>{t('scheduler.today')}</Text>
                </TouchableOpacity>
              )}
            </View>
            <DateStrip
              selected={selected}
              onSelect={(d) => setSelected(startOfDay(d))}
              onOpenMonth={() => {
                setMonth(selected);
                setMode('month');
              }}
              busyDays={busyDays}
              blockedDays={blockedDays}
            />
          </>
        ) : (
          <View style={styles.monthWrap}>
            <MonthGrid
              month={month}
              selected={selected}
              onSelectDay={selectDay}
              onChangeMonth={setMonth}
              summaries={summaries}
              blocked={blocked}
            />
          </View>
        )}

        {isLive && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionPrimary]}
              onPress={() => navigation.navigate('NewAppointment', { date: ymd(selected) })}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <FontAwesome name="plus" size={14} color={Colors.white} />
              <Text style={styles.actionPrimaryText}>{t('scheduler.newAppointment')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.actionSecondary]}
              onPress={() => navigation.navigate('TimeOff', { date: ymd(selected) })}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <FontAwesome name="ban" size={14} color={Colors.primary} />
              <Text style={styles.actionSecondaryText}>{t('scheduler.blockTime')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {mode === 'day' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>

            {dayBlocks.map(({ block, allDay, start, end }) => (
              <View key={block.id} style={styles.blockBanner}>
                <FontAwesome name="ban" size={15} color={Colors.textMedium} />
                <View style={styles.blockInfo}>
                  <Text style={styles.blockTitle}>
                    {allDay
                      ? t('scheduler.blockedAllDay')
                      : t('scheduler.blockedWindow', {
                          start: formatTime(start, locale),
                          // A block running to midnight ends "at" the next day's 00:00.
                          end: formatTime(new Date(Math.min(end.getTime(), startOfDay(start).getTime() + DAY_MS - 60_000)), locale),
                        })}
                  </Text>
                  {block.reason ? <Text style={styles.blockReason}>{block.reason}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => confirmUnblock(block)} accessibilityRole="button" accessibilityLabel={t('scheduler.unblock')}>
                  <Text style={styles.unblockText}>{t('scheduler.unblock')}</Text>
                </TouchableOpacity>
              </View>
            ))}

            {dayItems.length === 0 ? (
              <View style={styles.empty}>
                <FontAwesome name="calendar-o" size={40} color={Colors.textLight} />
                <Text style={styles.emptyTitle}>{t('scheduler.noAppointments')}</Text>
                {isLive && <Text style={styles.emptyHint}>{t('scheduler.noAppointmentsHint')}</Text>}
              </View>
            ) : (
              dayItems.map(({ appointment, start, end }, i) => {
                const roster = rosterFor(appointment);
                const counterpart = { id: roster?.id ?? appointment.patientId, name: appointment.patientName ?? appointment.doctor };
                return (
                  <ScheduleCard
                    key={appointment.id}
                    appointment={appointment}
                    start={start}
                    end={end}
                    colorIndex={i}
                    onDetails={() => navigation.navigate('AppointmentDetails', { appointment })}
                    onCall={
                      CALLABLE.includes(appointment.status)
                        ? () =>
                            navigation.navigate(appointment.type === 'Video Visit' ? 'VideoCall' : 'AudioCall', {
                              doctor: counterpart,
                              appointmentId: appointment.id,
                            })
                        : undefined
                    }
                    onCallUnavailable={() => Alert.alert('', t('scheduler.callUnavailable'))}
                    onMessage={() => navigation.navigate('Chat', { doctor: counterpart })}
                    onNotes={roster ? () => navigation.navigate('MedicalNotes', { patient: roster, appointment }) : undefined}
                    onAccept={appointment.status === 'pending_approval' ? () => respond(appointment, 'accept') : undefined}
                    onDecline={appointment.status === 'pending_approval' ? () => respond(appointment, 'decline') : undefined}
                    deciding={decision.isPending && decidingId === appointment.id}
                  />
                );
              })
            )}

            {isLive && timeOff.length > 0 && (
              <TouchableOpacity style={styles.manageLink} onPress={() => navigation.navigate('TimeOff')} accessibilityRole="button">
                <Text style={styles.manageText}>{t('scheduler.manageBlocked')}</Text>
                <FontAwesome name="chevron-right" size={11} color={Colors.primary} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    paddingHorizontal: 20, paddingBottom: 18, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  headerTitle: { fontSize: 30, fontWeight: '800', color: Colors.white, fontFamily: 'Poppins_700Bold' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3,
    backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: Colors.white, fontWeight: '800' },
  avatarBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },

  modeRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, padding: 4 },
  modeBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 13 },
  modeBtnActive: { backgroundColor: Colors.surface },
  modeText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.85)', fontFamily: 'Poppins_600SemiBold' },
  modeTextActive: { color: Colors.primary, fontFamily: 'Poppins_700Bold' },

  body: { flex: 1 },
  monthRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 6,
  },
  monthHeading: { fontSize: 15, fontWeight: '600', color: Colors.textDark, letterSpacing: 0.3, fontFamily: 'Poppins_600SemiBold' },
  todayLink: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  monthWrap: { paddingTop: 18 },

  actionRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 44, borderRadius: 22,
  },
  actionPrimary: { backgroundColor: Colors.primary },
  actionSecondary: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary },
  actionPrimaryText: { fontSize: 14, fontWeight: '700', color: Colors.white, fontFamily: 'Poppins_600SemiBold' },
  actionSecondaryText: { fontSize: 14, fontWeight: '700', color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },

  section: { paddingHorizontal: 16, paddingTop: 22 },
  sectionTitle: { fontSize: 19, fontWeight: '800', color: Colors.textDark, marginBottom: 14, fontFamily: 'Poppins_700Bold' },

  blockBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.field, borderRadius: 16, padding: 14, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderGray, borderStyle: 'dashed',
  },
  blockInfo: { flex: 1 },
  blockTitle: { fontSize: 14, fontWeight: '600', color: Colors.textMedium, fontFamily: 'Poppins_600SemiBold' },
  blockReason: { fontSize: 12.5, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  unblockText: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  empty: { alignItems: 'center', paddingVertical: 36 },
  emptyTitle: { fontSize: 15, color: Colors.textMedium, marginTop: 12, fontFamily: 'Poppins_500Medium' },
  emptyHint: { fontSize: 13, color: Colors.textGray, marginTop: 4, fontFamily: 'Poppins_400Regular' },

  manageLink: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', gap: 6, paddingVertical: 10 },
  manageText: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});
