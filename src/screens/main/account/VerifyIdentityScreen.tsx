import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import EkoButton from '../../../components/common/EkoButton';
import { useGovId, useSubmitGovId } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Government-ID verification (not a booking gate — purely a trust signal).
 * One document, admin-reviewed: submit → pending → verified/rejected, with
 * rejected allowing resubmission.
 */
export default function VerifyIdentityScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: govId, isLoading } = useGovId();
  const submit = useSubmitGovId();
  const [picking, setPicking] = useState(false);

  const pickAndSubmit = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (res.canceled || !res.assets?.length) return;
      const a = res.assets[0];
      const size = a.size ?? 0;
      if (size > MAX_BYTES) {
        Alert.alert(t('account.couldNotUploadId'), t('account.idTooLarge'));
        return;
      }
      setPicking(true);
      await submit.mutateAsync({ uri: a.uri, name: a.name, mimeType: a.mimeType ?? 'application/octet-stream', size });
    } catch (err) {
      Alert.alert(t('account.couldNotUploadId'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    } finally {
      setPicking(false);
    }
  };

  const uploading = picking || submit.isPending;
  const status = govId?.status ?? 'none';

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.verifyIdentity')} onBack={() => navigation.goBack()} />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <View style={styles.body}>
          <View style={[styles.iconCircle, status === 'verified' && styles.iconCircleVerified]}>
            <FontAwesome
              name={status === 'verified' ? 'check' : status === 'rejected' ? 'exclamation' : 'id-card'}
              size={30}
              color={status === 'verified' ? Colors.green : Colors.primary}
            />
          </View>

          <Text style={styles.title}>
            {status === 'verified'
              ? t('account.idVerified')
              : status === 'pending'
                ? t('account.idPending')
                : status === 'rejected'
                  ? t('account.idRejected')
                  : t('account.idNotSubmitted')}
          </Text>
          <Text style={styles.sub}>
            {status === 'verified'
              ? t('account.idVerifiedBody')
              : status === 'pending'
                ? t('account.idPendingBody')
                : status === 'rejected'
                  ? t('account.idRejectedBody')
                  : t('account.idNotSubmittedBody')}
          </Text>

          {govId?.fileName && (
            <View style={styles.fileRow}>
              <FontAwesome name="paperclip" size={14} color={Colors.textGray} />
              <Text style={styles.fileName} numberOfLines={1}>{govId.fileName}</Text>
            </View>
          )}

          {(status === 'none' || status === 'rejected') && (
            <EkoButton
              title={uploading ? t('account.uploadingId') : t('account.uploadId')}
              variant="primary"
              onPress={pickAndSubmit}
              loading={uploading}
              style={styles.btn}
            />
          )}
        </View>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  loader: { marginTop: 60 },
  body: { flex: 1, paddingHorizontal: 28, paddingTop: 40, alignItems: 'center' },

  iconCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primaryFaded,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  iconCircleVerified: { backgroundColor: `${Colors.green}20` },
  title: {
    fontSize: 20, fontWeight: '700', color: Colors.textDark,
    marginBottom: 10, fontFamily: 'Poppins_700Bold', textAlign: 'center',
  },
  sub: {
    fontSize: 14, color: Colors.textGray, textAlign: 'center',
    marginBottom: 20, lineHeight: 21, fontFamily: 'Poppins_400Regular',
  },

  fileRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.field, borderRadius: 12, paddingHorizontal: 14, height: 44,
    marginBottom: 24, maxWidth: '100%',
  },
  fileName: { fontSize: 13, color: Colors.textDark, fontFamily: 'Poppins_400Regular' },

  btn: { width: '100%', marginTop: 8 },
});
