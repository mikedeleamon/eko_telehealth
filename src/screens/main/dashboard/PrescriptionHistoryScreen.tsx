import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { usePrescriptions } from '../../../hooks/queries';
import type { Prescription, PatientSummary } from '../../../api/types';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * A patient's medication record. Current medications (active prescriptions) are
 * shown separately from the historical trail (completed / discontinued), and a
 * doctor can write a new prescription from the bottom action.
 */
export default function PrescriptionHistoryScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const patient = route.params?.patient as PatientSummary | undefined;
  const { data: prescriptions = [], isRefetching, refetch } = usePrescriptions(patient?.id ?? '');

  if (!patient) {
    return (
      <View style={styles.container}>
        <EkoHeader title={t('prescriptions.title')} onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('patients.patientNotFound')}</Text>
        </View>
      </View>
    );
  }

  const current = prescriptions.filter((p) => p.status === 'active');
  const history = prescriptions.filter((p) => p.status !== 'active');

  return (
    <View style={styles.container}>
      <EkoHeader title={t('prescriptions.title')} onBack={() => navigation.goBack()} />

      <View style={styles.patientBar}>
        <View style={styles.patientAvatar}>
          <FontAwesome name="user" size={15} color={Colors.primary} />
        </View>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientMeta}>{patient.age} {t('patients.yearsShort')} · {t(`options.gender.${patient.gender}`, { defaultValue: patient.gender })}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />}
      >
        {/* Current medications */}
        <View style={styles.sectionHead}>
          <FontAwesome name="medkit" size={14} color={Colors.primary} />
          <Text style={styles.sectionTitle}>{t('prescriptions.currentMedications')}</Text>
          {current.length > 0 ? <Text style={styles.sectionCount}>{current.length}</Text> : null}
        </View>
        {current.length === 0 ? (
          <Text style={styles.sectionEmpty}>{t('prescriptions.noCurrent')}</Text>
        ) : (
          current.map((p) => <PrescriptionCard key={p.id} rx={p} />)
        )}

        {/* Historical prescriptions */}
        <View style={[styles.sectionHead, { marginTop: 22 }]}>
          <FontAwesome name="history" size={14} color={Colors.textGray} />
          <Text style={styles.sectionTitle}>{t('prescriptions.history')}</Text>
          {history.length > 0 ? <Text style={styles.sectionCount}>{history.length}</Text> : null}
        </View>
        {history.length === 0 ? (
          <Text style={styles.sectionEmpty}>{t('prescriptions.noHistory')}</Text>
        ) : (
          history.map((p) => <PrescriptionCard key={p.id} rx={p} muted />)
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <EkoButton
          title={t('prescriptions.addPrescription')}
          variant="primary"
          onPress={() => navigation.navigate('AddPrescription', { patient })}
        />
      </View>
    </View>
  );
}

const STATUS_META: Record<string, { labelKey: string; color: (c: ThemeColors) => string }> = {
  active: { labelKey: 'prescriptions.statusActive', color: (c) => c.green },
  completed: { labelKey: 'prescriptions.statusCompleted', color: (c) => c.textGray },
  discontinued: { labelKey: 'prescriptions.statusDiscontinued', color: (c) => c.red },
};

function PrescriptionCard({ rx, muted }: { rx: Prescription; muted?: boolean }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const meta = STATUS_META[rx.status] ?? STATUS_META.active;
  const statusColor = meta.color(Colors);

  return (
    <View style={[styles.card, muted && styles.cardMuted]}>
      <View style={styles.cardTop}>
        <View style={styles.pillIcon}>
          <FontAwesome name="flask" size={15} color={Colors.primary} />
        </View>
        <View style={styles.cardHeadText}>
          <Text style={styles.drug}>
            {rx.drug} <Text style={styles.strength}>{rx.strength}</Text>
          </Text>
          <Text style={styles.formRoute}>{rx.form} · {rx.route}</Text>
        </View>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '1A' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{t(meta.labelKey)}</Text>
        </View>
      </View>

      <View style={styles.detailGrid}>
        <Detail label={t('prescriptions.frequency')} value={rx.frequency} />
        <Detail label={t('prescriptions.duration')} value={rx.duration} />
        <Detail label={t('prescriptions.quantity')} value={rx.quantity} />
        <Detail label={t('prescriptions.refills')} value={rx.refills} />
      </View>

      {rx.instructions ? (
        <View style={styles.instructions}>
          <FontAwesome name="info-circle" size={12} color={Colors.textGray} style={{ marginTop: 2 }} />
          <Text style={styles.instructionsText}>{rx.instructions}</Text>
        </View>
      ) : null}

      <View style={styles.cardFoot}>
        <Text style={styles.footMeta}>{rx.doctorName}</Text>
        <Text style={styles.footMeta}>{rx.datePrescribed}</Text>
      </View>
    </View>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <View style={styles.detailItem}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },

  patientBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.borderGray,
  },
  patientAvatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  patientName: { fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  patientMeta: { fontSize: 12, color: Colors.textGray, marginLeft: 8, fontFamily: 'Poppins_400Regular' },

  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },

  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  sectionCount: {
    fontSize: 12, color: Colors.primary, fontWeight: '700', overflow: 'hidden',
    backgroundColor: Colors.primaryFaded, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 1,
    fontFamily: 'Poppins_600SemiBold',
  },
  sectionEmpty: { fontSize: 13, color: Colors.textGray, marginBottom: 4, fontFamily: 'Poppins_400Regular' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardMuted: { opacity: 0.9 },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  pillIcon: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardHeadText: { flex: 1 },
  drug: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  strength: { fontSize: 13, color: Colors.textMedium, fontFamily: 'Poppins_500Medium' },
  formRoute: { fontSize: 12, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, marginLeft: 8 },
  statusText: { fontSize: 11, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },

  detailGrid: {
    flexDirection: 'row', flexWrap: 'wrap', marginTop: 14,
    borderTopWidth: 1, borderTopColor: Colors.borderGray, paddingTop: 12,
  },
  detailItem: { width: '50%', marginBottom: 10 },
  detailLabel: { fontSize: 11, color: Colors.textGray, marginBottom: 2, fontFamily: 'Poppins_400Regular' },
  detailValue: { fontSize: 13, color: Colors.textDark, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  instructions: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.bgGray, borderRadius: 10, padding: 10, marginBottom: 12,
  },
  instructionsText: { flex: 1, fontSize: 12, color: Colors.textMedium, lineHeight: 18, fontFamily: 'Poppins_400Regular' },

  cardFoot: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: Colors.borderGray, paddingTop: 10,
  },
  footMeta: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },

  empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: Colors.textGray, marginTop: 12, fontFamily: 'Poppins_600SemiBold' },

  footer: { paddingHorizontal: 16, paddingTop: 10, backgroundColor: Colors.bgLight },
});
