import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Platform, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { usePatientDocuments } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import { formatFileSize } from '../../../utils/pickMedia';
import type { PatientSummary } from '../../../api/types';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

/**
 * A treating provider's view of what the patient uploaded about their
 * condition (SOW 1.6) — photos of a rash or an injury, a report from another
 * clinic, with whatever the patient wrote alongside it.
 *
 * Read-only by design. These are the patient's own words and pictures, not a
 * clinical record the provider authors; the provider's response belongs in a
 * visit note. The backend returns only category 'condition', so the patient's
 * ID and insurance scans in the same store never appear here.
 */
export default function PatientUploadsScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const patient = route.params?.patient as PatientSummary | undefined;
  const { data: uploads = [], isLoading } = usePatientDocuments(patient?.id);

  return (
    <View style={styles.container}>
      <EkoHeader title={t('uploads.patientUploads')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={uploads}
          keyExtractor={(d) => d.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={patient ? <Text style={styles.note}>{patient.name}</Text> : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <FontAwesome name="camera" size={40} color={Colors.textLight} />
              <Text style={styles.emptyText}>{t('uploads.patientUploadsEmpty')}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isImage = item.mimeType.startsWith('image/');
            return (
              <View style={styles.card}>
                {isImage && item.url ? (
                  <Image source={{ uri: item.url }} style={styles.preview} resizeMode="cover" accessibilityIgnoresInvertColors />
                ) : (
                  <View style={styles.previewFallback}>
                    <FontAwesome name={isImage ? 'picture-o' : 'file-text-o'} size={26} color={Colors.primary} />
                  </View>
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  {!!item.description && <Text style={styles.cardDesc}>{item.description}</Text>}
                  <Text style={styles.cardMeta}>
                    {formatFileSize(item.sizeBytes)} · {item.uploadedAt}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: 24, flexGrow: 1 },
  note: { fontSize: 13, color: Colors.textGray, marginBottom: 14, fontFamily: 'Poppins_500Medium' },

  empty: { alignItems: 'center', marginTop: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 14, color: Colors.textGray, textAlign: 'center', marginTop: 12, lineHeight: 20, fontFamily: 'Poppins_400Regular' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 12, overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  // Full-width preview rather than a thumbnail: the point of a condition
  // photo is that the provider can actually look at it.
  preview: { width: '100%', height: 190, backgroundColor: Colors.field },
  previewFallback: {
    width: '100%', height: 96, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center',
  },
  cardBody: { padding: 14 },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_600SemiBold' },
  cardDesc: { fontSize: 13, color: Colors.textMedium, marginTop: 4, lineHeight: 19, fontFamily: 'Poppins_400Regular' },
  cardMeta: { fontSize: 11.5, color: Colors.textGray, marginTop: 6, fontFamily: 'Poppins_400Regular' },
});
