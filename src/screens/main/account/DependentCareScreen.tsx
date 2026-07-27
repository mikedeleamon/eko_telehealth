import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useAppointments, useDoctors } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { Dependent, Doctor } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const STATUS_COLOR: Record<string, string> = {
  pending_approval: Colors.accent,
  pending_payment: Colors.accent,
  upcoming: Colors.primary,
  checked_in: Colors.green,
  declined: Colors.red,
  cancelled: Colors.red,
  no_show: Colors.red,
  past: Colors.textGray,
};

/**
 * A proxy's view of a dependent's care (BRD 1.2 "Proxies") — the visit
 * history for appointments booked on their behalf, plus the ability to
 * schedule a paid case conference with any doctor who's treated them.
 * There's no separate structured medical record for a dependent (visits
 * booked for them are recorded under the account holder's own record —
 * see schema.ts's dependentId doc comment) so this surfaces what's real and
 * available today: what's been booked, with whom, and when.
 */
export default function DependentCareScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const dependent = route.params?.dependent as Dependent | undefined;
  const { data: appointments, isLoading } = useAppointments();
  const { data: doctors } = useDoctors();

  const visits = (appointments ?? [])
    .filter((a) => a.dependentId === dependent?.id)
    .sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? ''));

  const careTeamIds = [...new Set(visits.map((v) => v.doctorId).filter((id): id is string => !!id))];
  const careTeam = careTeamIds
    .map((id) => (doctors ?? []).find((d) => d.id === id))
    .filter((d): d is Doctor => !!d);

  const requestCaseConference = (doctor: Doctor) => {
    // DoctorOverview is the slot-picker — forwards these flags into CreateAppointment once a slot is chosen.
    navigation.navigate('DoctorOverview', {
      doctor,
      initialTab: 'schedule',
      dependentId: dependent?.id,
      isCaseConference: true,
    });
  };

  if (!dependent) {
    return (
      <View style={styles.container}>
        <EkoHeader title={t('account.dependentCare')} onBack={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.dependentCareFor', { name: dependent.firstName })} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {careTeam.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>{t('account.careTeamTitle')}</Text>
              {careTeam.map((doc) => (
                <View key={doc.id} style={styles.careRow}>
                  <View style={styles.careInfo}>
                    <Text style={styles.careName}>{doc.name}</Text>
                    <Text style={styles.careSpecialty}>{doc.specialty}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.conferenceBtn}
                    onPress={() => requestCaseConference(doc)}
                    accessibilityRole="button"
                    accessibilityLabel={t('account.scheduleCaseConference')}
                  >
                    <Text style={styles.conferenceBtnText}>{t('account.scheduleCaseConference')}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          <Text style={styles.sectionTitle}>{t('account.visitHistory')}</Text>
          {visits.length === 0 ? (
            <View style={styles.empty}>
              <FontAwesome name="calendar-o" size={32} color={Colors.textLight} />
              <Text style={styles.emptyText}>{t('account.noVisitsForDependent', { name: dependent.firstName })}</Text>
            </View>
          ) : (
            visits.map((v) => (
              <View key={v.id} style={styles.visitRow}>
                <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[v.status] ?? Colors.textGray }]} />
                <View style={styles.visitInfo}>
                  <Text style={styles.visitDoctor}>
                    {v.doctor}
                    {v.isCaseConference ? ` · ${t('account.caseConferenceTag')}` : ''}
                  </Text>
                  <Text style={styles.visitMeta}>{v.date} · {v.time} · {t(`options.appointmentType.${v.type}`)}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  loader: { marginTop: 60 },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textGray, marginBottom: 10, marginTop: 8,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  careRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 8, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  careInfo: { flex: 1 },
  careName: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  careSpecialty: { fontSize: 12, color: Colors.textGray, marginTop: 1 },
  conferenceBtn: { backgroundColor: Colors.primaryFaded, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  conferenceBtnText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  visitRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 8, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 12 },
  visitInfo: { flex: 1 },
  visitDoctor: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  visitMeta: { fontSize: 12, color: Colors.textGray, marginTop: 2 },

  empty: { alignItems: 'center', marginTop: 24, paddingHorizontal: 24 },
  emptyText: { fontSize: 13, color: Colors.textGray, textAlign: 'center', marginTop: 10, lineHeight: 19 },
});
