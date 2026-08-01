import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useMyConditions } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { PatientCondition } from '../../../api/types';
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/**
 * Read-only "My Conditions" — the patient's own problem list (spec §7.3).
 * Provider-authored only; the footer's "looks wrong" affordance opens the
 * existing support thread instead of letting the patient edit their own chart.
 */
export default function MyConditionsScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: conditions, isLoading } = useMyConditions();
  const [showResolved, setShowResolved] = useState(false);

  const { active, resolved } = useMemo(() => {
    const list = conditions ?? [];
    return {
      active: list.filter((c) => c.clinicalStatus !== 'resolved'),
      resolved: list.filter((c) => c.clinicalStatus === 'resolved'),
    };
  }, [conditions]);

  const reportWrong = (condition: PatientCondition) => {
    const name = condition.diagnosis.label ?? condition.diagnosis.description;
    navigation.navigate('ReportProblem', {
      prefillSubject: t('conditions.looksWrongSubject', { name }),
      prefillDescription: t('conditions.looksWrongBody', { name }),
    });
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('conditions.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : active.length === 0 && resolved.length === 0 ? (
        <View style={styles.center}>
          <FontAwesome name="list-alt" size={40} color={Colors.textGray} />
          <Text style={styles.emptyText}>{t('conditions.emptyState')}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {active.map((c) => (
            <ConditionCard key={c.id} condition={c} onReportWrong={() => reportWrong(c)} />
          ))}

          {resolved.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setShowResolved((v) => !v)}
                accessibilityRole="button"
                accessibilityState={{ expanded: showResolved }}
              >
                <Text style={styles.toggleText}>
                  {showResolved ? t('conditions.hideResolved') : t('conditions.showResolved')}
                </Text>
                <FontAwesome name={showResolved ? 'chevron-up' : 'chevron-down'} size={12} color={Colors.primary} />
              </TouchableOpacity>
              {showResolved &&
                resolved.map((c) => (
                  <ConditionCard key={c.id} condition={c} onReportWrong={() => reportWrong(c)} />
                ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ConditionCard({ condition, onReportWrong }: { condition: PatientCondition; onReportWrong: () => void }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const resolved = condition.clinicalStatus === 'resolved';

  return (
    <View style={[styles.card, resolved && styles.cardResolved]}>
      <Text style={styles.description}>{condition.diagnosis.label ?? condition.diagnosis.description}</Text>

      {!!condition.onsetDate && (
        <Text style={styles.meta}>{t('conditions.onsetDate')}: {condition.onsetDate}</Text>
      )}
      <Text style={styles.meta}>
        {condition.createdAt
          ? t('conditions.addedByOn', { name: condition.addedByName, date: condition.createdAt.slice(0, 10) })
          : t('conditions.addedBy', { name: condition.addedByName })}
      </Text>

      <View style={styles.footerRow}>
        <TouchableOpacity onPress={onReportWrong} accessibilityRole="button">
          <Text style={styles.wrongLink}>{t('conditions.looksWrong')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 13, color: Colors.textMedium, marginTop: 14, textAlign: 'center', lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  list: { padding: 20, paddingBottom: TAB_BAR_SPACE },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  cardResolved: { opacity: 0.65 },
  description: { fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  meta: { fontSize: 12, color: Colors.textGray, marginTop: 4, fontFamily: 'Poppins_400Regular' },

  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  wrongLink: { fontSize: 12, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, marginBottom: 4,
  },
  toggleText: { fontSize: 13, color: Colors.primary, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});
