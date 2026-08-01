import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import SheetModal from '../../../components/common/SheetModal';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useAppointments, useDocuments, useRemoveDocument, useUploadDocument } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { ACTIVE_STATUSES } from '../../../api/types';
import { FileTooLargeError, formatFileSize, pickDocument, pickPhoto } from '../../../utils/pickMedia';
import type { PickedFile, StoredDocument } from '../../../api/types';
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * A patient's pictures and documents of a medical condition (SOW/BRD 1.6).
 *
 * Distinct from two things that already existed and each covered part of this:
 * DocumentsScreen is the PROVIDER's credential store (license, board
 * certification), and a lab attachment is a report filed against a specific
 * test with a specimen and a reference range. A photo of a rash is neither.
 *
 * An upload can be tied to a visit — the picker below lists the patient's open
 * appointments — or just live on their record. Either way their treating
 * providers can see it on the chart; nothing else in this store can.
 *
 * `route.params.appointmentId` pre-selects a visit, which is how the flow
 * reached from Appointment Details lands on the right one.
 */
export default function ConditionUploadsScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();

  const { data: uploads = [], isLoading } = useDocuments('condition');
  const { data: appointments = [] } = useAppointments();
  const upload = useUploadDocument();
  const removeUpload = useRemoveDocument();

  const openVisits = appointments.filter((a) => ACTIVE_STATUSES.includes(a.status));

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [appointmentId, setAppointmentId] = useState<string | undefined>(
    route.params?.appointmentId as string | undefined,
  );

  const resetForm = () => {
    setName('');
    setDescription('');
    setFile(null);
    setAppointmentId(route.params?.appointmentId as string | undefined);
  };

  /**
   * All three sources land in the same PickedFile shape. The camera and
   * library paths need a native module that a stale dev client may not have
   * linked yet — that failure is reported as "not available on this build"
   * rather than as a broken upload, and the file path still works.
   */
  const choose = async (source: 'camera' | 'library' | 'file') => {
    try {
      const picked = source === 'file' ? await pickDocument() : await pickPhoto(source);
      if (!picked) return;
      setFile(picked);
      if (!name.trim()) setName(picked.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      if (err instanceof FileTooLargeError) {
        Alert.alert(t('uploads.couldNotAttach'), t('documents.tooLarge'));
        return;
      }
      Alert.alert(t('uploads.couldNotAttach'), err instanceof Error ? err.message : t('documents.pickFailed'));
    }
  };

  const submit = async () => {
    if (!file) return Alert.alert('', t('documents.fileRequired'));
    try {
      await upload.mutateAsync({
        name: name.trim() || file.name,
        category: 'condition',
        file,
        appointmentId,
        description: description.trim() || undefined,
      });
      setFormOpen(false);
      resetForm();
    } catch (err) {
      Alert.alert(t('uploads.couldNotAttach'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const confirmRemove = (item: StoredDocument) => {
    Alert.alert(t('uploads.removeTitle'), t('documents.removeConfirm', { name: item.name }), [
      { text: t('documents.cancel'), style: 'cancel' },
      {
        text: t('documents.remove'),
        style: 'destructive',
        onPress: () =>
          removeUpload.mutate(item.id, {
            onError: (err) =>
              Alert.alert(t('documents.couldNotRemove'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
          }),
      },
    ]);
  };

  const visitLabel = (id?: string | null) => {
    const visit = appointments.find((a) => a.id === id);
    return visit ? `${visit.doctor} · ${visit.date}` : undefined;
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('uploads.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={uploads}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.note}>{t('uploads.note')}</Text>}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="camera" size={40} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>{t('uploads.empty')}</Text>
              <Text style={styles.emptyHint}>{t('uploads.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isImage = item.mimeType.startsWith('image/');
            const visit = visitLabel(item.appointmentId);
            return (
              <View style={styles.card}>
                {isImage && item.url ? (
                  <Image source={{ uri: item.url }} style={styles.thumb} accessibilityIgnoresInvertColors />
                ) : (
                  <View style={styles.thumbFallback}>
                    <FontAwesome name={isImage ? 'picture-o' : 'file-text-o'} size={20} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                  {!!item.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                  )}
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {formatFileSize(item.sizeBytes)} · {item.uploadedAt}
                  </Text>
                  {!!visit && (
                    <View style={styles.visitTag}>
                      <FontAwesome name="calendar" size={10} color={Colors.primary} />
                      <Text style={styles.visitTagText} numberOfLines={1}>{visit}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  onPress={() => confirmRemove(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityRole="button"
                  accessibilityLabel={t('documents.remove')}
                >
                  <FontAwesome name="trash-o" size={18} color={Colors.red} />
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}

      <View style={styles.footer}>
        <EkoButton title={t('uploads.add')} variant="primary" onPress={() => setFormOpen(true)} />
      </View>

      <SheetModal visible={formOpen} onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFormOpen(false)}>
            <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>{t('uploads.newTitle')}</Text>

              <View style={styles.sourceRow}>
                <SourceBtn icon="camera" label={t('uploads.takePhoto')} onPress={() => choose('camera')} />
                <SourceBtn icon="picture-o" label={t('uploads.choosePhoto')} onPress={() => choose('library')} />
                <SourceBtn icon="file-o" label={t('uploads.chooseFile')} onPress={() => choose('file')} />
              </View>

              {!!file && (
                <View style={styles.picked}>
                  <FontAwesome name="check-circle" size={15} color={Colors.green} />
                  <Text style={styles.pickedText} numberOfLines={1}>
                    {file.name} · {formatFileSize(file.size)}
                  </Text>
                </View>
              )}

              <Text style={styles.fieldLabel}>{t('uploads.nameLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('uploads.namePlaceholder')}
                placeholderTextColor={Colors.textGray}
                value={name}
                onChangeText={setName}
                accessibilityLabel={t('uploads.nameLabel')}
              />

              <Text style={styles.fieldLabel}>{t('uploads.descriptionLabel')}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder={t('uploads.descriptionPlaceholder')}
                placeholderTextColor={Colors.textGray}
                value={description}
                onChangeText={setDescription}
                multiline
                accessibilityLabel={t('uploads.descriptionLabel')}
              />

              {/* Optional: an upload can belong to a visit, or just to the chart. */}
              {openVisits.length > 0 && (
                <>
                  <Text style={styles.fieldLabel}>{t('uploads.forVisit')}</Text>
                  <View style={styles.chipRow}>
                    <TouchableOpacity
                      style={[styles.chip, !appointmentId && styles.chipActive]}
                      onPress={() => setAppointmentId(undefined)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: !appointmentId }}
                    >
                      <Text style={[styles.chipText, !appointmentId && styles.chipTextActive]}>{t('uploads.noVisit')}</Text>
                    </TouchableOpacity>
                    {openVisits.map((visit) => {
                      const active = appointmentId === visit.id;
                      return (
                        <TouchableOpacity
                          key={visit.id}
                          style={[styles.chip, active && styles.chipActive]}
                          onPress={() => setAppointmentId(visit.id)}
                          accessibilityRole="radio"
                          accessibilityState={{ selected: active }}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                            {visit.doctor} · {visit.date}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              <EkoButton
                title={upload.isPending ? t('documents.uploading') : t('uploads.save')}
                variant="primary"
                onPress={submit}
                loading={upload.isPending}
                style={styles.sheetSubmit}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SheetModal>
    </View>
  );
}

function SourceBtn({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  return (
    <TouchableOpacity style={styles.sourceBtn} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <FontAwesome name={icon as any} size={20} color={Colors.primary} />
      <Text style={styles.sourceLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  note: { fontSize: 12, color: Colors.textGray, marginBottom: 14, lineHeight: 17, fontFamily: 'Poppins_400Regular' },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginTop: 14, fontFamily: 'Poppins_700Bold' },
  emptyHint: { fontSize: 13, color: Colors.textGray, textAlign: 'center', marginTop: 6, lineHeight: 19, fontFamily: 'Poppins_400Regular' },

  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 12, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  thumb: { width: 54, height: 54, borderRadius: 12, marginRight: 12, backgroundColor: Colors.field },
  thumbFallback: {
    width: 54, height: 54, borderRadius: 12, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1, marginRight: 10 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  cardDesc: { fontSize: 12.5, color: Colors.textMedium, marginTop: 2, lineHeight: 17, fontFamily: 'Poppins_400Regular' },
  cardMeta: { fontSize: 11.5, color: Colors.textGray, marginTop: 3, fontFamily: 'Poppins_400Regular' },
  visitTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  visitTagText: { fontSize: 11, color: Colors.primary, fontFamily: 'Poppins_500Medium', flexShrink: 1 },

  footer: { paddingBottom: TAB_BAR_SPACE, padding: 16, backgroundColor: Colors.bgLight, borderTopWidth: 1, borderTopColor: Colors.borderGray },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 16, fontFamily: 'Poppins_700Bold' },

  sourceRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  sourceBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.field, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1.5, borderColor: Colors.borderGray, borderStyle: 'dashed',
  },
  sourceLabel: { fontSize: 11.5, color: Colors.textMedium, textAlign: 'center', fontFamily: 'Poppins_500Medium' },

  picked: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryFaded, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  pickedText: { flex: 1, fontSize: 13, color: Colors.textDark, fontFamily: 'Poppins_500Medium' },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 8, fontFamily: 'Poppins_600SemiBold' },
  input: {
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 50,
    fontSize: 14, color: Colors.textDark, marginBottom: 16, fontFamily: 'Poppins_400Regular',
  },
  textArea: { height: 88, paddingTop: 14, textAlignVertical: 'top' },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, maxWidth: '100%',
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.bgLight,
  },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },

  sheetSubmit: { width: '100%' },
});
