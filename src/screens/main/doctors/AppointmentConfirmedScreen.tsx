import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoButton from '../../../components/common/EkoButton';
import { useAuth } from '../../../context/AuthContext';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * Terminal screen for the booking flow. It reports what actually happened,
 * which is usually a REQUEST awaiting the doctor's approval — not a confirmed
 * visit. Only a paid appointment ('upcoming') is genuinely confirmed.
 */
export default function AppointmentConfirmedScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { doctor, appointment } = route.params ?? {};
  const { isDoctor } = useAuth();
  const appointmentsTab = isDoctor ? 'SchedulerTab' : 'AppointmentsTab';
  const homeTab = isDoctor ? 'DashboardTab' : 'HomeTab';

  const isRequest = appointment?.status === 'pending_approval';
  const title = isRequest ? t('confirmed.requestSent') : t('confirmed.appointmentConfirmed');
  const sub = isRequest
    ? t('confirmed.requestSub', { doctor: doctor?.name ?? t('confirmed.theDoctor') })
    : t('confirmed.bookedSub');

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.gradientStart, Colors.gradientEnd]} style={styles.topGrad} />
      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <FontAwesome name={isRequest ? 'paper-plane' : 'check'} size={isRequest ? 36 : 44} color={Colors.white} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.sub}>{sub}</Text>

        <View style={styles.detailCard}>
          <DetailRow icon="user-md" label={t('confirmed.doctor')} value={doctor?.name ?? t('confirmed.doctor')} />
          <DetailRow icon="stethoscope" label={t('confirmed.specialty')} value={doctor?.specialty ?? ''} />
          <DetailRow icon="calendar" label={t('confirmed.date')} value={appointment?.date ?? ''} />
          <DetailRow icon="clock-o" label={t('confirmed.time')} value={appointment?.time ?? ''} />
          <DetailRow icon="tag" label={t('confirmed.type')} value={appointment?.type ?? ''} />
          <DetailRow icon="dollar" label={isRequest ? t('confirmed.feePayable') : t('confirmed.fee')} value={appointment?.fee ?? doctor?.fee ?? ''} last />
        </View>

        <EkoButton title={t('confirmed.viewAppointments')} variant="accent" onPress={() => navigation.navigate(appointmentsTab)} style={styles.primaryBtn} />
        <EkoButton title={t('confirmed.backToHome')} onPress={() => navigation.navigate(homeTab)} variant="outline" style={styles.secondaryBtn} />
      </View>
    </View>
  );
}

function DetailRow({ icon, label, value, last }: { icon: string; label: string; value: string; last?: boolean }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <FontAwesome name={icon as any} size={14} color={Colors.primary} style={styles.detailIcon} />
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  topGrad: { height: 180, position: 'absolute', top: 0, left: 0, right: 0 },
  content: { flex: 1, alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 },
  checkCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
    shadowColor: Colors.success, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  title: { fontSize: 28, fontWeight: '900', color: Colors.white, textAlign: 'center', marginBottom: 8, lineHeight: 36 },
  sub: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 32 },
  detailCard: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: 20, padding: 20,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 6,
    marginBottom: 24,
  },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  detailIcon: { width: 22 },
  detailLabel: { flex: 1, fontSize: 14, color: Colors.textGray },
  detailValue: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  primaryBtn: { width: '100%', marginBottom: 12 },
  secondaryBtn: { width: '100%' },
});
