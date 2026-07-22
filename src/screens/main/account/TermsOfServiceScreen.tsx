import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useContentBlock } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

/** Admin-editable via the CMS (task 2.2) — see backend content_blocks 'terms_of_service'. */
export default function TermsOfServiceScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: block, isLoading } = useContentBlock('terms_of_service');

  return (
    <View style={styles.container}>
      <EkoHeader title={t('settings.termsOfService')} onBack={() => navigation.goBack()} />
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.body}>{block?.body ?? ''}</Text>
        </ScrollView>
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  content: { padding: 20, paddingBottom: 40 },
  loader: { marginTop: 40 },
  body: { fontSize: 14, color: Colors.textMedium, lineHeight: 22 },
});
