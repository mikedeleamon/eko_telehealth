import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, StatusBar, Platform, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { ACTIVE_STATUSES } from '../../../api/types';
import { useAppointmentDecision, useAppointments, usePracticeAppointments } from '../../../hooks/queries';
import AppointmentCard from '../../../components/appointments/AppointmentCard';
import Cross from '../../../components/common/Cross';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function AppointmentsScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { isDoctor } = useAuth();
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  const { data: appointments = [] } = useAppointments();
  const { data: practiceAppointments = [] } = usePracticeAppointments(isDoctor);
  const decision = useAppointmentDecision();

  // Doctors read their own practice list; patients read theirs. Both come back
  // in the same shape, with `doctor` holding the counterparty's name.
  const source = isDoctor ? practiceAppointments : appointments;
  // Anything still live (requested / awaiting payment / confirmed) belongs in
  // Upcoming; everything terminal is History. Matching status === tab directly
  // would drop cancelled and declined rows out of both tabs entirely.
  const data = source.filter((a) =>
    tab === 'upcoming' ? ACTIVE_STATUSES.includes(a.status) : !ACTIVE_STATUSES.includes(a.status),
  );

  const respond = (id: string, decide: 'accept' | 'decline') => {
    const label = decide === 'accept' ? t('appointments.accept') : t('appointments.decline');
    Alert.alert(
      decide === 'accept' ? t('appointments.acceptRequestTitle') : t('appointments.declineRequestTitle'),
      decide === 'accept' ? t('appointments.acceptRequestBody') : t('appointments.declineRequestBody'), [
      { text: t('appointments.backAction'), style: 'cancel' },
      {
        text: label,
        style: decide === 'decline' ? 'destructive' : 'default',
        onPress: async () => {
          try {
            await decision.mutateAsync({ id, decision: decide });
          } catch (err) {
            Alert.alert(decide === 'accept' ? t('appointments.couldNotAccept') : t('appointments.couldNotDecline'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
          }
        },
      },
    ]);
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
        <Cross size={130} opacity={0.09} rotation={14} style={{ top: -40, right: -18 }} />
        <Cross size={84} opacity={0.07} rotation={-12} style={{ bottom: -24, left: 40 }} />
        <Cross size={58} opacity={0.06} rotation={18} style={{ top: -12, left: -16 }} />
        <Cross size={46} opacity={0.06} rotation={-16} style={{ bottom: 44, right: 96 }} />
        <Cross size={36} opacity={0.05} rotation={22} style={{ top: 14, right: 90 }} />
        <Cross size={30} opacity={0.05} rotation={12} style={{ top: 60, left: -8 }} />
        <Cross size={26} opacity={0.05} rotation={-18} style={{ bottom: 12, left: 24 }} />
        <Cross size={22} opacity={0.04} rotation={14} style={{ top: 4, right: 170 }} />
        <Cross size={20} opacity={0.04} rotation={-12} style={{ bottom: 56, right: 24 }} />
        <Text style={styles.headerTitle}>{t('appointments.title')}</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setTab('upcoming')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'upcoming' }}
          >
            <Text style={[styles.tabBtnText, tab === 'upcoming' && styles.tabBtnTextActive]}>{t('appointments.upcoming')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'past' && styles.tabBtnActive]}
            onPress={() => setTab('past')}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'past' }}
          >
            <Text style={[styles.tabBtnText, tab === 'past' && styles.tabBtnTextActive]}>{t('appointments.history')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AppointmentCard
            appointment={item}
            onPress={() => navigation.navigate('AppointmentDetails', { appointment: item })}
            // Accept/Decline only make sense on a request the doctor hasn't
            // answered yet.
            showActions={isDoctor && item.status === 'pending_approval'}
            onAccept={() => respond(item.id, 'accept')}
            onDecline={() => respond(item.id, 'decline')}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="calendar-o" size={48} color={Colors.textLight} />
            <Text style={styles.emptyText}>{tab === 'upcoming' ? t('appointments.noUpcomingShort') : t('appointments.noPastShort')}</Text>
            {tab === 'upcoming' && !isDoctor && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('HomeTab')}
                accessibilityRole="button"
                accessibilityLabel={t('appointments.findADoctorBtn')}
              >
                <Text style={styles.emptyBtnText}>{t('appointments.findADoctorBtn')}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },

  header: {
    paddingHorizontal: 20, paddingBottom: 20, overflow: 'hidden',
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
    ...Platform.select({
      ios: { shadowColor: Colors.gradientStart, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  headerTitle: {
    fontSize: 26, fontWeight: '800', color: Colors.white,
    marginBottom: 16, fontFamily: 'Poppins_700Bold',
  },

  tabRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16, padding: 4,
  },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 13 },
  tabBtnActive: { backgroundColor: Colors.surface },
  tabBtnText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.8)', fontFamily: 'Poppins_600SemiBold' },
  tabBtnTextActive: { color: Colors.primary, fontFamily: 'Poppins_700Bold' },

  list: { padding: 16, paddingBottom: 24 },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: Colors.textGray, marginTop: 12, marginBottom: 16, fontFamily: 'Poppins_400Regular' },
  emptyBtn: {
    backgroundColor: Colors.primary, borderRadius: 24,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white, fontFamily: 'Poppins_700Bold' },
});
