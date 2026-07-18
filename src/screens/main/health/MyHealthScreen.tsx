import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import { MY_CHART_ITEMS } from '../../../constants';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const ICON_COLORS = ['#F97653', '#5A5DED', '#00CAAE', '#FF7043', '#7C4DFF', '#0097A7', '#E91E63', '#43A047'];

export default function MyHealthScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const openItem = (label: string) => {
    if (label === 'Appointments') navigation.navigate('AppointmentsTab');
    else if (label === 'Find Care') navigation.navigate('HomeTab');
    else navigation.navigate('PatientOverview');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.title}>{t('account.myHealth')}</Text>
        <Text style={styles.sub}>{t('health.summaryAtGlance')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {MY_CHART_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, { backgroundColor: ICON_COLORS[i % ICON_COLORS.length] + '22' }]}
              onPress={() => openItem(item.label)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={t(`options.myChart.${item.label}`)}
            >
              <View style={[styles.iconCircle, { backgroundColor: ICON_COLORS[i % ICON_COLORS.length] }]}>
                <FontAwesome name={item.icon as any} size={22} color={Colors.white} />
              </View>
              <Text style={styles.cardLabel}>{t(`options.myChart.${item.label}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>{t('health.recentActivity')}</Text>
        {['Blood pressure: 120/80 mmHg', 'Heart rate: 72 bpm', 'Weight: 165 lbs'].map((item) => (
          <View key={item} style={styles.activityRow}>
            <FontAwesome name="circle" size={8} color={Colors.success} style={styles.bullet} />
            <Text style={styles.activityText}>{item}</Text>
            <Text style={styles.activityTime}>{t('health.today')}</Text>
          </View>
        ))}

        <TouchableOpacity style={styles.viewMoreBtn} onPress={() => navigation.navigate('PatientOverview')} accessibilityRole="button" accessibilityLabel={t('health.viewFullChart')}>
          <Text style={styles.viewMoreText}>{t('health.viewFullChart')}</Text>
          <FontAwesome name="chevron-right" size={12} color={Colors.primary} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  header: {
    backgroundColor: Colors.primary, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20,
    borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.white, marginBottom: 4 },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.75)' },
  content: { padding: 16, paddingBottom: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  card: {
    width: '47%', borderRadius: 16, padding: 16, alignItems: 'center',
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  iconCircle: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  cardLabel: { fontSize: 13, fontWeight: '600', color: Colors.textDark, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  activityRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, borderRadius: 12,
    padding: 14, marginBottom: 8, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 4, elevation: 1,
  },
  bullet: { marginRight: 10 },
  activityText: { flex: 1, fontSize: 14, color: Colors.textDark },
  activityTime: { fontSize: 12, color: Colors.textGray },
  viewMoreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryFaded, borderRadius: 12, padding: 14, marginTop: 8,
  },
  viewMoreText: { fontSize: 14, fontWeight: '600', color: Colors.primary, marginRight: 6 },
});
