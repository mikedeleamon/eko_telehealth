import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, StatusBar, Platform, Alert,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import {
  useAppointmentDecision,
  useConversations,
  useDoctorAgenda,
  usePracticeAppointments,
  useProviderState,
} from '../../../hooks/queries';
import Cross from '../../../components/common/Cross';
import EkoButton from '../../../components/common/EkoButton';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const STATUS_META: Record<string, { color: string; icon: string; tint: string | null }> = {
  confirmed: { color: Colors.blue, icon: 'check-circle', tint: null },
  cancelled: { color: Colors.red, icon: 'times-circle', tint: Colors.cardColors[3] },
  rescheduled: { color: '#7C4DFF', icon: 'dot-circle-o', tint: null },
  pending: { color: Colors.orange, icon: 'clock-o', tint: Colors.cardColors[0] },
};

export default function DashboardScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');

  const firstName = user?.firstName ?? 'Doctor';
  const { data: provider } = useProviderState();
  // Until an application is approved there's no doctors profile, so the
  // practice queries would all return empty — don't fire them.
  const isLive = provider?.state === 'live';
  const { data: conversations = [] } = useConversations();
  const { data: agenda = [] } = useDoctorAgenda(isLive);
  const { data: practiceAppointments = [] } = usePracticeAppointments(isLive);
  const decision = useAppointmentDecision();
  const unreadCount = conversations.reduce((n, c) => n + c.unread, 0);
  const remaining = agenda.length;

  // Real requests: appointments this doctor hasn't answered yet.
  const allRequests = practiceAppointments.filter((a) => a.status === 'pending_approval');

  // Search filters both lists by patient name. On doctor-scoped rows the
  // counterparty name lives in `doctor` (requests) / `name` (agenda).
  const query = search.trim().toLowerCase();
  const requests = query
    ? allRequests.filter((a) => a.doctor.toLowerCase().includes(query))
    : allRequests;
  const filteredAgenda = query
    ? agenda.filter((a) => a.name.toLowerCase().includes(query))
    : agenda;

  const respond = (id: string, name: string, decide: 'accept' | 'decline') => {
    decision.mutate(
      { id, decision: decide },
      {
        onError: (err) =>
          Alert.alert(
            decide === 'accept' ? t('dashboard.couldNotAccept') : t('dashboard.couldNotDecline'),
            err instanceof Error ? err.message : t('dashboard.couldNotActionRequest', { action: decide, name }),
          ),
      },
    );
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" />

      {/* Purple gradient header */}
      <LinearGradient
        colors={[Colors.gradientStart, Colors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <Cross size={150} opacity={0.09} rotation={14} style={{ top: -50, right: -36 }} />
        <Cross size={90} opacity={0.07} rotation={-12} style={{ bottom: 10, left: -28 }} />
        <Cross size={64} opacity={0.06} rotation={18} style={{ bottom: -16, left: 110 }} />
        <Cross size={48} opacity={0.06} rotation={-16} style={{ top: 8, right: 150 }} />
        <Cross size={40} opacity={0.05} rotation={22} style={{ top: 70, right: 90 }} />
        <Cross size={34} opacity={0.05} rotation={-18} style={{ bottom: 64, right: 30 }} />
        <Cross size={28} opacity={0.05} rotation={24} style={{ top: 96, left: 24 }} />

        {/* Top icon row */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Messages')}>
            <FontAwesome name="comment" size={19} color={Colors.white} />
            {unreadCount > 0 && (
              <View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.avatarBtn} onPress={() => navigation.navigate('SettingsTab')}>
            <FontAwesome name="user-md" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>{t('dashboard.welcomeName', { name: firstName })}</Text>
        <Text style={styles.subtitle}>{t('dashboard.patientsRemaining', { count: remaining })}</Text>
        <Text style={styles.subtitle}>{t('dashboard.checkDocumentation')}</Text>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={15} color={Colors.textGray} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('common.search')}
            placeholderTextColor={Colors.textGray}
            accessibilityLabel={t('common.search')}
            value={search}
            onChangeText={setSearch}
          />
          <View style={styles.searchDivider} />
          <TouchableOpacity onPress={() => navigation.navigate('PatientsTab')}>
            <FontAwesome name="sliders" size={16} color={Colors.textGray} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* A Doctor account isn't bookable until an admin approves its
            application, so say so rather than showing an empty practice. */}
        {provider && !isLive && (
          <View style={styles.section}>
            <View style={styles.onboardCard}>
              <FontAwesome
                name={provider.state === 'pending' ? 'hourglass-half' : provider.state === 'rejected' ? 'times-circle' : 'id-card-o'}
                size={28}
                color={Colors.primary}
              />
              <Text style={styles.onboardTitle}>
                {provider.state === 'pending'
                  ? t('dashboard.appUnderReview')
                  : provider.state === 'rejected'
                    ? t('dashboard.appNotApproved')
                    : t('dashboard.finishSetup')}
              </Text>
              <Text style={styles.onboardText}>
                {provider.state === 'pending'
                  ? t('dashboard.pendingText', { date: provider.application?.submittedAt ?? t('dashboard.recently') })
                  : provider.state === 'rejected'
                    ? t('dashboard.rejectedText')
                    : t('dashboard.noneText')}
              </Text>
              {(provider.state === 'none' || provider.state === 'rejected') && (
                <EkoButton
                  title={t('dashboard.applyNow')}
                  variant="primary"
                  onPress={() => navigation.navigate('ProviderApply')}
                  style={styles.onboardBtn}
                />
              )}
            </View>
          </View>
        )}

        {/* Requests */}
        {isLive && (
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('dashboard.requests')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SchedulerTab')}>
              <Text style={styles.viewAll}>{t('dashboard.viewList')}</Text>
            </TouchableOpacity>
          </View>

          {requests.length === 0 ? (
            <Text style={styles.emptyRequests}>{query.length > 0 ? t('dashboard.noMatchesFor', { query: search.trim() }) : t('dashboard.noPendingRequests')}</Text>
          ) : (
            requests.map((req, i) => (
              <View key={req.id} style={[styles.requestCard, { backgroundColor: Colors.cardColors[i % 2 === 0 ? 0 : 1] }]}>
                <View style={styles.reqAvatar}>
                  <FontAwesome name="user" size={22} color={Colors.primary} />
                </View>
                <View style={styles.reqInfo}>
                  <Text style={styles.reqName}>{req.doctor}</Text>
                  <Text style={styles.reqReason}>{req.date} · {req.time} · {req.type}</Text>
                </View>
                <View style={styles.reqActions}>
                  <TouchableOpacity
                    style={[styles.reqBtn, styles.acceptBtn]}
                    onPress={() => respond(req.id, req.doctor, 'accept')}
                    accessibilityRole="button"
                    accessibilityLabel={t('dashboard.accept')}
                  >
                    <Text style={styles.acceptText}>{t('dashboard.accept')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reqBtn, styles.declineBtn]}
                    onPress={() => respond(req.id, req.doctor, 'decline')}
                    accessibilityRole="button"
                    accessibilityLabel={t('dashboard.decline')}
                  >
                    <Text style={styles.declineText}>{t('dashboard.decline')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
        )}

        {/* Today's Appointment */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>{t('dashboard.todaysAppointment')}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SchedulerTab')}>
              <Text style={styles.viewAll}>{t('dashboard.viewList')}</Text>
            </TouchableOpacity>
          </View>

          {filteredAgenda.length === 0 && query.length > 0 ? (
            <Text style={styles.emptyRequests}>{t('dashboard.noMatchesFor', { query: search.trim() })}</Text>
          ) : null}
          {filteredAgenda.map((appt) => {
            const meta = STATUS_META[appt.status] ?? STATUS_META.confirmed;
            return (
              <TouchableOpacity
                key={appt.id}
                style={[styles.apptRow, meta.tint ? { backgroundColor: meta.tint } : null]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('SchedulerTab')}
              >
                <View style={styles.apptAvatar}>
                  <FontAwesome name="user" size={18} color={Colors.primary} />
                </View>
                <View style={styles.apptInfo}>
                  <Text style={styles.apptName}>{appt.name}</Text>
                  <Text style={styles.apptType}>{appt.type.toUpperCase()}</Text>
                </View>
                <View style={styles.apptTimeWrap}>
                  <FontAwesome name={meta.icon as any} size={14} color={meta.color} />
                  <Text style={styles.apptTime}>  {appt.time}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    paddingHorizontal: 20, paddingBottom: 22, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
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

  greeting: { fontSize: 30, fontWeight: '800', color: Colors.white, marginBottom: 8, fontFamily: 'Poppins_700Bold' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 21, fontFamily: 'Poppins_400Regular' },
  subtitleBold: { fontWeight: '700', color: Colors.white, fontFamily: 'Poppins_700Bold' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16,
    paddingHorizontal: 14, height: 50, gap: 10, marginTop: 18,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  searchDivider: { width: 1, height: 18, backgroundColor: Colors.borderGray },

  body: { flex: 1 },
  section: { paddingHorizontal: 16, paddingTop: 20 },

  onboardCard: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 20, alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(39, 42, 58, 0.10)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 10,
      },
      android: { elevation: 3 },
    }),
  },
  onboardTitle: {
    fontSize: 16, fontWeight: '700', color: Colors.textDark,
    marginTop: 12, marginBottom: 6, textAlign: 'center', fontFamily: 'Poppins_700Bold',
  },
  onboardText: {
    fontSize: 13, color: Colors.textGray, textAlign: 'center',
    lineHeight: 20, fontFamily: 'Poppins_400Regular',
  },
  onboardBtn: { marginTop: 16, alignSelf: 'stretch' },
  emptyRequests: {
    fontSize: 13, color: Colors.textGray, paddingVertical: 12,
    fontFamily: 'Poppins_400Regular',
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  viewAll: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  // Requests
  requestCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 18, padding: 12, marginBottom: 12,
  },
  reqAvatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  reqReason: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  reqActions: { gap: 8 },
  reqBtn: { borderRadius: 18, paddingHorizontal: 22, paddingVertical: 8, alignItems: 'center', minWidth: 96 },
  acceptBtn: { backgroundColor: Colors.green },
  declineBtn: { backgroundColor: Colors.red },
  acceptText: { fontSize: 13, fontWeight: '700', color: Colors.white, fontFamily: 'Poppins_600SemiBold' },
  declineText: { fontSize: 13, fontWeight: '700', color: Colors.white, fontFamily: 'Poppins_600SemiBold' },

  // Today's appointment rows
  apptRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 12, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  apptAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  apptInfo: { flex: 1 },
  apptName: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  apptType: { fontSize: 10, color: Colors.textGray, marginTop: 2, letterSpacing: 0.5, fontFamily: 'Poppins_400Regular' },
  apptTimeWrap: { flexDirection: 'row', alignItems: 'center' },
  apptTime: { fontSize: 12, color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },
});
