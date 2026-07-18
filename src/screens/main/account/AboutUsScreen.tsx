import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

export default function AboutUsScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.aboutUs')} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.logoArea}>
          <FontAwesome name="heartbeat" size={56} color={Colors.primary} />
          <Text style={styles.appName}>{t('common.appName')}</Text>
          <Text style={styles.version}>{t('about.version', { version: '1.0.0' })}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('about.ourMission')}</Text>
          <Text style={styles.cardText}>{t('about.missionBody')}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('about.whatWeOffer')}</Text>
          {[
            t('about.offer1'),
            t('about.offer2'),
            t('about.offer3'),
            t('about.offer4'),
            t('about.offer5'),
          ].map((item) => (
            <View key={item} style={styles.featureRow}>
              <FontAwesome name="check-circle" size={14} color={Colors.success} />
              <Text style={styles.featureText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('about.contactUs')}</Text>
          <Text style={styles.cardText}>{t('about.contactBody')}</Text>
        </View>

        <Text style={styles.copyright}>{t('about.copyright')}</Text>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  content: { padding: 20, paddingBottom: 40 },
  logoArea: { alignItems: 'center', marginBottom: 24, paddingVertical: 20 },
  appName: { fontSize: 26, fontWeight: '900', color: Colors.textDark, marginTop: 10 },
  version: { fontSize: 13, color: Colors.textGray, marginTop: 4 },
  card: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 14, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 10 },
  cardText: { fontSize: 14, color: Colors.textMedium, lineHeight: 21 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  featureText: { fontSize: 14, color: Colors.textMedium, marginLeft: 10 },
  copyright: { textAlign: 'center', fontSize: 12, color: Colors.textGray, marginTop: 8 },
});
