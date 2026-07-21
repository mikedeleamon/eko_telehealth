import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoTextField from '../../../components/common/EkoTextField';
import EkoButton from '../../../components/common/EkoButton';
import { useComplaints, useSubmitComplaint } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { Complaint, ComplaintCategory } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const CATEGORIES: ComplaintCategory[] = ['billing', 'appointment', 'provider', 'technical', 'other'];

/**
 * Report a Problem — shared by both patient and doctor accounts (reached
 * from SettingsScreen, which both AccountStack and SettingsStack register).
 * A trackable alternative to the static "Contact Us" text on AboutUsScreen:
 * a report here goes to the admin queue and the filer sees its resolution.
 */
export default function ReportProblemScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: complaints = [], isLoading } = useComplaints();
  const submitComplaint = useSubmitComplaint();

  const [category, setCategory] = useState<ComplaintCategory>('other');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const submit = async () => {
    if (subject.trim().length < 2) return Alert.alert('', t('report.valSubject'));
    if (description.trim().length < 10) return Alert.alert('', t('report.valDescription'));
    try {
      await submitComplaint.mutateAsync({ category, subject: subject.trim(), description: description.trim() });
      setSubject('');
      setDescription('');
      Alert.alert(t('report.submittedTitle'), t('report.submittedBody'));
    } catch (err) {
      Alert.alert(t('report.couldNotSubmit'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('report.title')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>{t('report.intro')}</Text>

        <Text style={styles.chipLabel}>{t('report.categoryLabel')}</Text>
        <View style={styles.chipRow}>
          {CATEGORIES.map((cat) => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setCategory(cat)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`report.category.${cat}`)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <EkoTextField
          label={t('report.subject')}
          placeholder={t('report.subjectPlaceholder')}
          value={subject}
          onChangeText={setSubject}
        />

        <Text style={styles.fieldLabel}>{t('report.description')}</Text>
        <TextInput
          style={styles.descriptionInput}
          placeholder={t('report.descriptionPlaceholder')}
          placeholderTextColor={Colors.textGray}
          value={description}
          onChangeText={setDescription}
          multiline
          accessibilityLabel={t('report.description')}
        />

        <EkoButton title={t('report.submit')} variant="accent" onPress={submit} loading={submitComplaint.isPending} style={styles.btn} />

        <Text style={styles.historyTitle}>{t('report.myReports')}</Text>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={styles.loader} />
        ) : complaints.length === 0 ? (
          <View style={styles.empty}>
            <FontAwesome name="file-text-o" size={36} color={Colors.textLight} />
            <Text style={styles.emptyText}>{t('report.noReports')}</Text>
          </View>
        ) : (
          complaints.map((c) => <ReportCard key={c.id} complaint={c} />)
        )}
      </ScrollView>
    </View>
  );
}

function ReportCard({ complaint }: { complaint: Complaint }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const statusColor =
    complaint.status === 'pending' ? Colors.orange : complaint.status === 'resolved' ? Colors.green : Colors.textGray;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardSubject} numberOfLines={1}>{complaint.subject}</Text>
        <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{t(`report.status.${complaint.status}`)}</Text>
        </View>
      </View>
      <Text style={styles.cardMeta}>{t(`report.category.${complaint.category}`)} · {complaint.submittedAt}</Text>
      <Text style={styles.cardDescription} numberOfLines={3}>{complaint.description}</Text>
      {complaint.resolutionNote && (
        <View style={styles.resolutionBox}>
          <Text style={styles.resolutionLabel}>{t('report.resolutionNote')}</Text>
          <Text style={styles.resolutionText}>{complaint.resolutionNote}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 20, paddingBottom: 40 },
  intro: {
    fontSize: 13, color: Colors.textGray, lineHeight: 20,
    marginBottom: 20, fontFamily: 'Poppins_400Regular',
  },
  chipLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 8, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.surface,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500' },
  chipTextActive: { color: Colors.white },
  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.textMedium,
    marginBottom: 6, marginLeft: 2, fontFamily: 'Poppins_600SemiBold',
  },
  descriptionInput: {
    borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: 12, padding: 12,
    fontSize: 14, color: Colors.textDark, backgroundColor: Colors.field,
    minHeight: 100, textAlignVertical: 'top', marginBottom: 16, fontFamily: 'Poppins_400Regular',
  },
  btn: { marginTop: 4, marginBottom: 8 },

  historyTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.textDark,
    marginTop: 24, marginBottom: 12, fontFamily: 'Poppins_700Bold',
  },
  loader: { marginTop: 20 },
  empty: { alignItems: 'center', marginTop: 20 },
  emptyText: { fontSize: 13, color: Colors.textGray, marginTop: 10, fontFamily: 'Poppins_400Regular' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardSubject: { flex: 1, fontSize: 14, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  statusText: { fontSize: 11, fontWeight: '700', fontFamily: 'Poppins_600SemiBold' },
  cardMeta: { fontSize: 11, color: Colors.textGray, marginTop: 4, fontFamily: 'Poppins_400Regular' },
  cardDescription: { fontSize: 13, color: Colors.textMedium, marginTop: 8, lineHeight: 18, fontFamily: 'Poppins_400Regular' },
  resolutionBox: {
    backgroundColor: Colors.primaryFaded, borderRadius: 10, padding: 10, marginTop: 10,
  },
  resolutionLabel: { fontSize: 11, fontWeight: '700', color: Colors.primary, marginBottom: 2, fontFamily: 'Poppins_600SemiBold' },
  resolutionText: { fontSize: 12, color: Colors.textDark, lineHeight: 17, fontFamily: 'Poppins_400Regular' },
});
