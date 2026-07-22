import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useAuth } from '../../../context/AuthContext';
import { useCreateAppointment, useCurrencies, useDependents } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { convertFeeDisplay } from '../../../utils/format';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const TYPES = [
  { label: 'Video Visit', icon: 'video-camera' },
  { label: 'Clinic Visit', icon: 'hospital-o' },
  { label: 'Home Visit', icon: 'home' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * DoctorOverview's calendar passes the selected day as {day, date, month,
 * year}; the appointments contract wants a display string ("Mon, Jun 29,
 * 2026" — the shape the backend seeds).
 */
function toDateLabel(date: unknown): string {
  if (typeof date === 'string') return date;
  if (date && typeof date === 'object' && 'date' in date && 'month' in date && 'year' in date) {
    const d = date as { date: number; month: number; year: number };
    const day = new Date(d.year, d.month, d.date);
    return `${WEEKDAYS[day.getDay()]}, ${MONTHS[day.getMonth()]} ${day.getDate()}, ${day.getFullYear()}`;
  }
  return '';
}

export default function CreateAppointmentScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { doctor, slot, date, type } = route.params ?? {};
  // Home Visit is an admin-granted privilege (task 2.3) — only offered for
  // doctors certified for it. The backend enforces this too (routes/
  // appointments.ts), so this is UX, not the actual gate.
  const availableTypes = doctor?.canProvideInHome ? TYPES : TYPES.filter((opt) => opt.label !== 'Home Visit');
  const [selectedType, setSelectedType] = useState(
    availableTypes.some((t) => t.label === type) ? type : 'Video Visit'
  );
  const createAppointment = useCreateAppointment();
  const loading = createAppointment.isPending;
  const { user } = useAuth();
  const { data: currencies = [] } = useCurrencies();
  // Display-only conversion (task 2.4) — the request itself is always sent
  // and priced in the doctor's own NGN fee; this is just a "≈" preview.
  const convertedFee = doctor?.fee
    ? convertFeeDisplay(doctor.fee, user?.preferredCurrency ?? 'NGN', currencies)
    : null;
  const { data: dependents = [] } = useDependents();
  // null = booking for yourself (the default).
  const [dependentId, setDependentId] = useState<string | null>(null);

  /**
   * Sends a REQUEST — the doctor has to accept before any payment is taken,
   * so this no longer routes straight to checkout.
   */
  const handleConfirm = async () => {
    if (!doctor?.id) return Alert.alert('', t('appointments.pickDoctor'));
    if (!slot) return Alert.alert('', t('appointments.pickSlot'));
    try {
      const appointment = await createAppointment.mutateAsync({
        doctorId: doctor.id,
        date: toDateLabel(date),
        time: slot,
        type: selectedType,
        ...(dependentId ? { dependentId } : {}),
      });
      navigation.navigate('AppointmentConfirmed', { doctor, appointment });
    } catch (err) {
      Alert.alert(t('appointments.couldNotSendRequest'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('appointments.createAppointmentTitle')} onBack={() => navigation.goBack()} />
      <ScrollView style={styles.body} contentContainerStyle={styles.content}>
        <View style={styles.doctorCard}>
          <View style={styles.avatar}>
            <FontAwesome name="user-md" size={30} color={Colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{doctor?.name ?? 'Doctor'}</Text>
            <Text style={styles.spec}>{doctor?.specialty ?? ''}</Text>
          </View>
          <Text style={styles.fee}>{doctor?.fee ?? ''}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Row icon="calendar" label={t('confirmed.date')} value={date ? `${date.day}, ${date.date}` : t('appointments.selectedDatePlaceholder')} />
          <Row icon="clock-o" label={t('confirmed.time')} value={slot ?? t('appointments.selectedSlotPlaceholder')} />
        </View>

        {/* Only shown when the account actually has dependents — this is what
            makes the API's dependentId param reachable. */}
        {dependents.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>{t('appointments.whoForVisit')}</Text>
            <View style={styles.forRow}>
              <TouchableOpacity
                style={[styles.forChip, dependentId === null && styles.forChipActive]}
                onPress={() => setDependentId(null)}
              >
                <Text style={[styles.forChipText, dependentId === null && styles.forChipTextActive]}>{t('appointments.myself')}</Text>
              </TouchableOpacity>
              {dependents.map((d) => (
                <TouchableOpacity
                  key={d.id}
                  style={[styles.forChip, dependentId === d.id && styles.forChipActive]}
                  onPress={() => setDependentId(d.id)}
                >
                  <Text style={[styles.forChipText, dependentId === d.id && styles.forChipTextActive]}>
                    {d.firstName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>{t('appointments.appointmentTypeLabel')}</Text>
        <View style={styles.typeRow}>
          {availableTypes.map((opt) => (
            <TouchableOpacity
              key={opt.label}
              style={[styles.typeBtn, selectedType === opt.label && styles.typeBtnActive]}
              onPress={() => setSelectedType(opt.label)}
              accessibilityRole="radio"
              accessibilityState={{ selected: selectedType === opt.label }}
            >
              <FontAwesome
                name={opt.icon as any}
                size={22}
                color={selectedType === opt.label ? Colors.white : Colors.primary}
              />
              <Text style={[styles.typeText, selectedType === opt.label && styles.typeTextActive]}>
                {t(`options.appointmentType.${opt.label}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.feeRow}>
          <Text style={styles.feeLabel}>{t('appointments.consultationFee')}</Text>
          <View style={styles.feeValueCol}>
            <Text style={styles.feeValue}>{doctor?.fee ?? '$0'}</Text>
            {convertedFee ? <Text style={styles.feeConverted}>≈ {convertedFee}</Text> : null}
          </View>
        </View>

        <EkoButton title={t('appointments.requestAppointment')} variant="accent" onPress={handleConfirm} loading={loading} style={styles.btn} />
      </ScrollView>
    </View>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.row}>
      <FontAwesome name={icon as any} size={15} color={Colors.primary} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  body: { flex: 1 },
  content: { padding: 20 },
  doctorCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryFaded,
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark },
  spec: { fontSize: 13, color: Colors.textMedium, marginTop: 2 },
  fee: { fontSize: 18, fontWeight: '800', color: Colors.primary },
  summaryCard: {
    backgroundColor: Colors.bgLight, borderRadius: 14, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.borderGray,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.borderGray },
  rowIcon: { width: 24 },
  rowLabel: { flex: 1, fontSize: 14, color: Colors.textMedium },
  rowValue: { fontSize: 14, fontWeight: '600', color: Colors.textDark },
  sectionLabel: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },

  forRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  forChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.surface,
  },
  forChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  forChipText: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, fontFamily: 'Poppins_600SemiBold' },
  forChipTextActive: { color: Colors.white },

  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  typeBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.primary, backgroundColor: Colors.surface,
  },
  typeBtnActive: { backgroundColor: Colors.primary },
  typeText: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: 6, textAlign: 'center' },
  typeTextActive: { color: Colors.white },
  feeRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.bgLight, borderRadius: 12, padding: 16, marginBottom: 24,
  },
  feeLabel: { fontSize: 15, color: Colors.textMedium, fontWeight: '500' },
  feeValueCol: { alignItems: 'flex-end' },
  feeValue: { fontSize: 20, fontWeight: '800', color: Colors.primary },
  feeConverted: { fontSize: 12, color: Colors.textGray, marginTop: 2 },
  btn: {},
});
