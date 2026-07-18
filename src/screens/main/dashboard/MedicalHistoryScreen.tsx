import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useAuth } from '../../../context/AuthContext';
import { useMedicalNotes } from '../../../hooks/queries';
import type { MedicalNote, PatientSummary } from '../../../api/types';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * The patient's shared visit history: every SOAP note from every doctor
 * treating them. Notes by the logged-in doctor are editable; the rest open
 * read-only.
 */
export default function MedicalHistoryScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { user } = useAuth();
  const patient = route.params?.patient as PatientSummary | undefined;
  const { data: notes = [], isRefetching, refetch } = useMedicalNotes(patient?.id ?? '');

  if (!patient) {
    return (
      <View style={styles.container}>
        <EkoHeader title={t('patients.medicalHistory')} onBack={() => navigation.goBack()} />
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{t('patients.patientNotFound')}</Text>
        </View>
      </View>
    );
  }

  const renderNote = ({ item }: { item: MedicalNote }) => {
    const mine = item.doctorId === user?.id;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('MedicalNotes', { patient, note: item })}
      >
        <View style={styles.cardTop}>
          <View style={styles.dateChip}>
            <FontAwesome name="calendar" size={11} color={Colors.primary} />
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
          {mine ? (
            <View style={styles.youPill}>
              <Text style={styles.youPillText}>{t('patients.you')}</Text>
            </View>
          ) : (
            <View style={styles.lockRow}>
              <FontAwesome name="lock" size={11} color={Colors.textGray} />
              <Text style={styles.lockText}>{t('patients.readOnly')}</Text>
            </View>
          )}
        </View>

        <Text style={styles.doctorName}>{item.doctorName}</Text>
        <Text style={styles.doctorSpecialty}>{item.doctorSpecialty}</Text>

        <View style={styles.divider} />

        <View style={styles.reasonRow}>
          <FontAwesome name="stethoscope" size={13} color={Colors.textGray} style={styles.reasonIcon} />
          <Text style={styles.reasonText} numberOfLines={2}>{item.reason}</Text>
        </View>

        {item.visitType ? (
          <Text style={styles.visitType}>{item.visitType}</Text>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('patients.medicalHistory')} onBack={() => navigation.goBack()} />

      <View style={styles.patientBar}>
        <View style={styles.patientAvatar}>
          <FontAwesome name="user" size={15} color={Colors.primary} />
        </View>
        <Text style={styles.patientName}>{patient.name}</Text>
        <Text style={styles.patientMeta}>{patient.age} {t('patients.yearsShort')} · {t(`options.gender.${patient.gender}`, { defaultValue: patient.gender })}</Text>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <FontAwesome name="folder-open-o" size={44} color={Colors.textLight} />
            <Text style={styles.emptyText}>{t('patients.noVisitNotes')}</Text>
            <Text style={styles.emptySub}>{t('patients.notesWillAppear', { name: patient.name.split(' ')[0] })}</Text>
          </View>
        }
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <EkoButton
          title={t('patients.addMedicalNotes')}
          variant="accent"
          onPress={() => navigation.navigate('MedicalNotes', { patient })}
        />
      </View>
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
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  dateChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryFaded, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  dateText: { fontSize: 12, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
  youPill: {
    backgroundColor: Colors.accent, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  youPillText: { fontSize: 11, color: Colors.white, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  lockRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  lockText: { fontSize: 11, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },

  doctorName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold' },
  doctorSpecialty: { fontSize: 12, color: Colors.textGray, marginTop: 1, fontFamily: 'Poppins_400Regular' },

  divider: { height: 1, backgroundColor: Colors.borderGray, marginVertical: 10 },

  reasonRow: { flexDirection: 'row', alignItems: 'flex-start' },
  reasonIcon: { width: 20, marginTop: 2 },
  reasonText: { flex: 1, fontSize: 13, color: Colors.textMedium, lineHeight: 19, fontFamily: 'Poppins_500Medium' },
  visitType: { fontSize: 11, color: Colors.textGray, marginTop: 6, marginLeft: 20, fontFamily: 'Poppins_400Regular' },

  empty: { alignItems: 'center', marginTop: 70, paddingHorizontal: 32 },
  emptyText: { fontSize: 16, color: Colors.textGray, marginTop: 12, fontFamily: 'Poppins_600SemiBold' },
  emptySub: {
    fontSize: 13, color: Colors.textLight, textAlign: 'center',
    marginTop: 6, lineHeight: 19, fontFamily: 'Poppins_400Regular',
  },

  footer: {
    paddingHorizontal: 16, paddingTop: 10,
    backgroundColor: Colors.bgLight,
  },
});
