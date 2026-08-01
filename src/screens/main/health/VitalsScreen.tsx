import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import VitalsEditModal from '../../../components/health/VitalsEditModal';
import { useBiometrics, useSaveBiometrics } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { PatientBiometrics } from '../../../api/types';
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/**
 * The patient's own vitals — the one piece of the retired My Health page that
 * had no other entry point. Reads and writes the same biometrics record a
 * doctor edits from PatientProfileScreen, through the same shared modal.
 */
export default function VitalsScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: biometrics, isLoading } = useBiometrics();
  const saveBiometrics = useSaveBiometrics();
  const [editing, setEditing] = useState(false);

  const rows: { label: string; value?: string }[] = [
    { label: t('health.bloodPressure'), value: biometrics?.bloodPressure },
    { label: t('health.heartRate'), value: biometrics?.heartRate },
    { label: t('health.temperature'), value: biometrics?.temperature },
    { label: t('health.weight'), value: biometrics?.weight },
    { label: t('health.height'), value: biometrics?.height },
    { label: t('health.bmi'), value: biometrics?.bmi },
  ].filter((r) => !!r.value);

  const save = async (input: PatientBiometrics) => {
    try {
      await saveBiometrics.mutateAsync(input);
      setEditing(false);
    } catch (err) {
      Alert.alert(
        t('health.couldNotSaveVitals'),
        err instanceof Error ? err.message : t('common.somethingWentWrong'),
      );
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('health.vitals')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {rows.length === 0 ? (
            <View style={styles.center}>
              <FontAwesome name="heartbeat" size={40} color={Colors.textGray} />
              <Text style={styles.emptyText}>{t('health.noVitalsYet')}</Text>
            </View>
          ) : (
            <>
              {rows.map((row) => (
                <View key={row.label} style={styles.row}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowValue}>{row.value}</Text>
                </View>
              ))}
              {!!biometrics?.recordedAt && (
                <Text style={styles.recordedAt}>
                  {t('health.lastRecorded', { date: biometrics.recordedAt })}
                </Text>
              )}
            </>
          )}

          <EkoButton
            title={t('health.updateVitals')}
            variant="primary"
            onPress={() => setEditing(true)}
            style={styles.updateBtn}
          />
        </ScrollView>
      )}

      <VitalsEditModal
        visible={editing}
        initial={biometrics}
        saving={saveBiometrics.isPending}
        onSave={save}
        onClose={() => setEditing(false)}
      />
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, paddingHorizontal: 32 },
  emptyText: { fontSize: 13, color: Colors.textMedium, marginTop: 14, textAlign: 'center', lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  list: { padding: 20, paddingBottom: TAB_BAR_SPACE },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderGray,
  },
  rowLabel: { fontSize: 14, color: Colors.textMedium, fontFamily: 'Poppins_400Regular' },
  rowValue: { fontSize: 15, color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  recordedAt: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },

  updateBtn: { marginTop: 20 },
});
