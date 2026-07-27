import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useVisitNotes } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { PatientVisitNote } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/**
 * The patient's own record of past visits.
 *
 * Shows the parts of a provider's note that were written to be acted on — why
 * they came, what was diagnosed, what to do next. The clinician's raw
 * subjective/objective/assessment body is deliberately not part of this
 * payload at all (see PatientVisitNote), so there is nothing here to
 * accidentally reveal.
 */
export default function VisitNotesScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: notes, isLoading } = useVisitNotes();

  const renderNote = ({ item }: { item: PatientVisitNote }) => {
    const diagnoses = [item.primaryDiagnosis, ...(item.secondaryDiagnoses ?? [])].filter(Boolean) as string[];
    return (
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.cardHeadText}>
            <Text style={styles.doctor}>{item.doctorName}</Text>
            <Text style={styles.specialty}>
              {item.doctorSpecialty}
              {item.visitType ? ` · ${t(`options.appointmentType.${item.visitType}`, { defaultValue: item.visitType })}` : ''}
            </Text>
          </View>
          <Text style={styles.date}>{item.date}</Text>
        </View>

        <Text style={styles.label}>{t('visitNotes.reason')}</Text>
        <Text style={styles.body}>{item.reason}</Text>

        {diagnoses.length > 0 && (
          <>
            <Text style={styles.label}>{t('visitNotes.diagnosis')}</Text>
            <View style={styles.chips}>
              {diagnoses.map((d, i) => (
                <View key={`${item.id}-dx-${i}`} style={[styles.chip, i === 0 && styles.chipPrimary]}>
                  <Text style={[styles.chipText, i === 0 && styles.chipTextPrimary]}>{d}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {!!item.plan && (
          <>
            <Text style={styles.label}>{t('visitNotes.plan')}</Text>
            <Text style={styles.body}>{item.plan}</Text>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('visitNotes.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : !notes || notes.length === 0 ? (
        <View style={styles.center}>
          <FontAwesome name="file-text-o" size={40} color={Colors.textGray} />
          <Text style={styles.emptyTitle}>{t('visitNotes.emptyTitle')}</Text>
          <Text style={styles.emptyBody}>{t('visitNotes.emptyBody')}</Text>
        </View>
      ) : (
        <FlatList
          data={notes}
          keyExtractor={(n) => n.id}
          renderItem={renderNote}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<Text style={styles.footnote}>{t('visitNotes.footnote')}</Text>}
        />
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, color: Colors.textDark, marginTop: 14, fontFamily: 'Poppins_600SemiBold' },
  emptyBody: { fontSize: 13, color: Colors.textMedium, marginTop: 6, textAlign: 'center', lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  list: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  cardHeadText: { flex: 1, paddingRight: 10 },
  doctor: { fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  specialty: { fontSize: 12, color: Colors.textMedium, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  date: { fontSize: 12, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },

  label: {
    fontSize: 11, color: Colors.textMedium, marginTop: 10, marginBottom: 4,
    letterSpacing: 0.4, textTransform: 'uppercase', fontFamily: 'Poppins_600SemiBold',
  },
  body: { fontSize: 14, color: Colors.textDark, lineHeight: 21, fontFamily: 'Poppins_400Regular' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: Colors.bgLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  chipPrimary: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primaryFaded },
  chipText: { fontSize: 12, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },
  chipTextPrimary: { color: Colors.primary, fontFamily: 'Poppins_600SemiBold' },

  footnote: {
    fontSize: 12, color: Colors.textMedium, lineHeight: 18, marginTop: 6,
    textAlign: 'center', fontFamily: 'Poppins_400Regular',
  },
});
