import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import MedicalNotes from '../../../components/medical/MedicalNotes';
import { useAddMedicalNote, useAddNoteAmendment, useUpdateMedicalNote } from '../../../hooks/queries';
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
  const addAmendment = useAddNoteAmendment(patient?.id ?? '');
  // Track which button is mid-flight so only its spinner shows.
  const [pending, setPending] = useState<'draft' | 'final' | null>(null);

  // A draft (existing note that isn't final) is updated in place; a brand-new
  // record is created. Both paths carry the status set by the form.
  const persist = async (input: MedicalNoteInput, which: 'draft' | 'final') => {
    setPending(which);
    try {
      if (note && (note.status ?? 'final') !== 'final') {
        await updateNote.mutateAsync({ noteId: note.id, input });
      } else {
        await addNote.mutateAsync(input);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        which === 'draft' ? t('patients.couldNotSaveDraft') : t('patients.couldNotSaveNote'),
        err instanceof Error ? err.message : t('common.somethingWentWrong'),
      );
    } finally {
      setPending(null);
    }
  };

  const handleSave = (input: MedicalNoteInput) => persist(input, 'final');
  const handleSaveDraft = (input: MedicalNoteInput) => persist(input, 'draft');

  // Records are immutable — a saved record can only be amended, never edited.
  const handleAddAmendment = async (text: string) => {
    if (!note) return;
    try {
      return await addAmendment.mutateAsync({ noteId: note.id, text });
    } catch (err) {
      Alert.alert(t('patients.couldNotSaveAmendment'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader
        title={note ? t('patients.visitNotes') : t('patients.addMedicalNotes')}
        onBack={() => navigation.goBack()}
      />
      {patient ? (
        <MedicalNotes
          patient={patient}
          note={note}
          onSave={handleSave}
          saving={pending === 'final'}
          onSaveDraft={handleSaveDraft}
          savingDraft={pending === 'draft'}
          onAddAmendment={handleAddAmendment}
          amendmentSaving={addAmendment.isPending}
        />
      ) : null}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
});
