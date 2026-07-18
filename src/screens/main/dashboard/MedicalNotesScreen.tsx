import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import MedicalNotes from '../../../components/medical/MedicalNotes';
import { useAddMedicalNote, useUpdateMedicalNote } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { MedicalNote as MedicalNoteType, MedicalNoteInput, PatientSummary } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * Route wrapper around the MedicalNotes form: owns the mutations and
 * navigation so the form component stays purely about SOAP entry.
 */
export default function MedicalNotesScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const patient = route.params?.patient as PatientSummary;
  const note = route.params?.note as MedicalNoteType | undefined;
  const addNote = useAddMedicalNote(patient?.id ?? '');
  const updateNote = useUpdateMedicalNote(patient?.id ?? '');
  const saving = addNote.isPending || updateNote.isPending;

  const handleSave = async (input: MedicalNoteInput) => {
    try {
      if (note) {
        await updateNote.mutateAsync({ noteId: note.id, input });
      } else {
        await addNote.mutateAsync(input);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(t('patients.couldNotSaveNote'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader
        title={note ? t('patients.visitNotes') : t('patients.addMedicalNotes')}
        onBack={() => navigation.goBack()}
      />
      {patient ? (
        <MedicalNotes patient={patient} note={note} onSave={handleSave} saving={saving} />
      ) : null}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
});
