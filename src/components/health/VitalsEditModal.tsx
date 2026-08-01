import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import SheetModal from '../common/SheetModal';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import EkoTextField from '../common/EkoTextField';
import EkoButton from '../common/EkoButton';
import { useTranslation } from '../../i18n/useTranslation';
import type { PatientBiometrics } from '../../api/types';

interface Props {
  visible: boolean;
  initial?: PatientBiometrics | null;
  saving: boolean;
  onSave: (input: PatientBiometrics) => void;
  onClose: () => void;
}

/**
 * Shared vitals-entry form — used identically by the patient's own
 * self-report (PatientOverviewScreen) and a doctor recording a roster patient's
 * vitals (PatientProfileScreen). Same 6 fields either way.
 */
export default function VitalsEditModal({ visible, initial, saving, onSave, onClose }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const [bloodPressure, setBloodPressure] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [temperature, setTemperature] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState('');

  useEffect(() => {
    if (visible) {
      setBloodPressure(initial?.bloodPressure ?? '');
      setHeartRate(initial?.heartRate ?? '');
      setTemperature(initial?.temperature ?? '');
      setWeight(initial?.weight ?? '');
      setHeight(initial?.height ?? '');
      setBmi(initial?.bmi ?? '');
    }
  }, [visible, initial]);

  const save = () => {
    onSave({
      bloodPressure: bloodPressure.trim() || undefined,
      heartRate: heartRate.trim() || undefined,
      temperature: temperature.trim() || undefined,
      weight: weight.trim() || undefined,
      height: height.trim() || undefined,
      bmi: bmi.trim() || undefined,
    });
  };

  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
          <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
            <View style={styles.grabber} />
            <Text style={styles.title}>{t('health.updateVitals')}</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <EkoTextField label={t('health.bloodPressure')} placeholder="120/80 mmHg" value={bloodPressure} onChangeText={setBloodPressure} />
              <EkoTextField label={t('health.heartRate')} placeholder="72 bpm" value={heartRate} onChangeText={setHeartRate} />
              <EkoTextField label={t('health.temperature')} placeholder="98.6°F" value={temperature} onChangeText={setTemperature} />
              <EkoTextField label={t('health.weight')} placeholder="165 lbs" value={weight} onChangeText={setWeight} />
              <EkoTextField label={t('health.height')} placeholder={"5'8\""} value={height} onChangeText={setHeight} />
              <EkoTextField label={t('health.bmi')} placeholder="24.1" value={bmi} onChangeText={setBmi} />
            </ScrollView>
            <EkoButton title={t('common.save')} variant="primary" onPress={save} loading={saving} style={styles.saveBtn} />
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SheetModal>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  flex: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36, maxHeight: '85%',
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 16, fontFamily: 'Poppins_700Bold' },
  saveBtn: { marginTop: 8 },
});
