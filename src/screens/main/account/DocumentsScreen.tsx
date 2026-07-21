import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useDocuments, useRemoveDocument, useUploadDocument } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { DocumentCategory, PickedFile, StoredDocument } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const CATEGORIES: DocumentCategory[] = ['license', 'certification', 'government-id', 'insurance', 'other'];
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const CATEGORY_ICON: Record<DocumentCategory, string> = {
  license: 'id-badge',
  certification: 'certificate',
  'government-id': 'id-card-o',
  insurance: 'shield',
  other: 'file-o',
};

/** "482 KB" / "1.2 MB" from a byte count. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: documents = [], isLoading } = useDocuments();
  const uploadDoc = useUploadDocument();
  const removeDoc = useRemoveDocument();

  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('license');
  const [file, setFile] = useState<PickedFile | null>(null);

  const resetForm = () => {
    setName('');
    setCategory('license');
    setFile(null);
  };

  const pickFile = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      const size = a.size ?? 0;
      if (size > MAX_BYTES) {
        Alert.alert(t('documents.couldNotUpload'), t('documents.tooLarge'));
        return;
      }
      setFile({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/octet-stream', size });
      // Default the title to the file name (sans extension) if empty.
      if (!name.trim()) setName(a.name.replace(/\.[^.]+$/, ''));
    } catch {
      Alert.alert(t('documents.couldNotUpload'), t('documents.pickFailed'));
    }
  };

  const submit = async () => {
    if (!name.trim()) return Alert.alert('', t('documents.nameRequired'));
    if (!file) return Alert.alert('', t('documents.fileRequired'));
    try {
      await uploadDoc.mutateAsync({ name: name.trim(), category, file });
      setFormOpen(false);
      resetForm();
    } catch (err) {
      Alert.alert(t('documents.couldNotUpload'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  const confirmRemove = (doc: StoredDocument) => {
    Alert.alert(t('documents.removeTitle'), t('documents.removeConfirm', { name: doc.name }), [
      { text: t('documents.cancel'), style: 'cancel' },
      {
        text: t('documents.remove'),
        style: 'destructive',
        onPress: () =>
          removeDoc.mutate(doc.id, {
            onError: (err) =>
              Alert.alert(t('documents.couldNotRemove'), err instanceof Error ? err.message : t('common.somethingWentWrong')),
          }),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('documents.title')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.note}>{t('documents.verifiedNote')}</Text>}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="folder-open-o" size={40} color={Colors.textLight} />
              <Text style={styles.emptyTitle}>{t('documents.empty')}</Text>
              <Text style={styles.emptyHint}>{t('documents.emptyHint')}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.docCard}>
              <View style={styles.docIcon}>
                <FontAwesome name={CATEGORY_ICON[item.category] as any} size={18} color={Colors.primary} />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.docMeta} numberOfLines={1}>
                  {t(`documents.categories.${item.category}`)} · {formatSize(item.sizeBytes)} · {item.uploadedAt}
                </Text>
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
          )}
        />
      )}

      <View style={styles.footer}>
        <EkoButton title={t('documents.upload')} variant="primary" onPress={() => setFormOpen(true)} />
      </View>

      {/* Add-document sheet */}
      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setFormOpen(false)}>
            <TouchableOpacity style={styles.sheet} activeOpacity={1} onPress={() => {}}>
              <View style={styles.grabber} />
              <Text style={styles.sheetTitle}>{t('documents.newDocument')}</Text>

              <Text style={styles.fieldLabel}>{t('documents.nameLabel')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('documents.namePlaceholder')}
                placeholderTextColor={Colors.textGray}
                value={name}
                onChangeText={setName}
                accessibilityLabel={t('documents.nameLabel')}
              />

              <Text style={styles.fieldLabel}>{t('documents.category')}</Text>
              <View style={styles.chipRow}>
                {CATEGORIES.map((c) => {
                  const active = category === c;
                  return (
                    <TouchableOpacity
                      key={c}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setCategory(c)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{t(`documents.categories.${c}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.filePicker} onPress={pickFile} accessibilityRole="button">
                <FontAwesome name="paperclip" size={16} color={Colors.primary} />
                <Text style={styles.fileText} numberOfLines={1}>
                  {file ? `${file.name} · ${formatSize(file.size)}` : t('documents.chooseFile')}
                </Text>
                {file ? <FontAwesome name="check-circle" size={16} color={Colors.green} /> : <FontAwesome name="chevron-right" size={13} color={Colors.textGray} />}
              </TouchableOpacity>

              <EkoButton
                title={uploadDoc.isPending ? t('documents.uploading') : t('documents.save')}
                variant="primary"
                onPress={submit}
                loading={uploadDoc.isPending}
                style={styles.sheetSubmit}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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

  docCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  docIcon: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  docInfo: { flex: 1, marginRight: 10 },
  docName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  docMeta: { fontSize: 12, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },

  footer: { padding: 16, backgroundColor: Colors.bgLight, borderTopWidth: 1, borderTopColor: Colors.borderGray },

  overlay: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, paddingBottom: 36,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderGray, marginBottom: 16 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: Colors.textDark, marginBottom: 16, fontFamily: 'Poppins_700Bold' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMedium, marginBottom: 8, fontFamily: 'Poppins_600SemiBold' },
  input: {
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 50,
    fontSize: 14, color: Colors.textDark, marginBottom: 16, fontFamily: 'Poppins_400Regular',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.borderGray, backgroundColor: Colors.bgLight,
  },
  chipActive: { backgroundColor: Colors.primaryFaded, borderColor: Colors.primary },
  chipText: { fontSize: 13, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
  chipTextActive: { color: Colors.primary, fontWeight: '700' },
  filePicker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 54,
    borderWidth: 1.5, borderColor: Colors.borderGray, borderStyle: 'dashed', marginBottom: 20,
  },
  fileText: { flex: 1, fontSize: 14, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },
  sheetSubmit: { width: '100%' },
});
