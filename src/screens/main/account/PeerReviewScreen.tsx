import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import RatingStars from '../../../components/common/RatingStars';
import { useDoctors } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { Doctor } from '../../../api/types';
import { TAB_BAR_SPACE } from '../../../constants/layout';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const PEER_COLORS = ['#2D2EFF', '#F21D31', '#F4920F', '#5200FE'];

/**
 * Request a paid 2nd opinion (BRD 1.4) from any provider on the platform —
 * reuses the normal booking pipeline end to end (CreateAppointmentScreen,
 * with isPeerReview: true), just a dedicated entry point framed around
 * getting a second opinion rather than picking "my doctor."
 */
export default function PeerReviewScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { data: doctors, isLoading } = useDoctors();

  const request = (doctor: Doctor) => {
    // DoctorOverview is the slot-picker — a peer review still needs a real
    // slot, same as any other visit, and forwards this flag into CreateAppointment.
    navigation.navigate('DoctorOverview', { doctor, initialTab: 'schedule', isPeerReview: true });
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.peerReviews')} onBack={() => navigation.goBack()} />
      <Text style={styles.intro}>{t('peerReview.intro')}</Text>
      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : (
        <FlatList
          data={doctors ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View style={[styles.card, { borderLeftColor: PEER_COLORS[index % PEER_COLORS.length] }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.badge, { backgroundColor: PEER_COLORS[index % PEER_COLORS.length] }]}>
                  <Text style={styles.badgeText}>{item.name[0]}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.specialty}>{item.specialty}</Text>
                </View>
                <RatingStars rating={item.rating} size={12} />
              </View>
              <TouchableOpacity
                style={styles.requestBtn}
                onPress={() => request(item)}
                accessibilityRole="button"
                accessibilityLabel={t('peerReview.requestButton', { name: item.name })}
              >
                <Text style={styles.requestBtnText}>{t('peerReview.requestButton', { name: item.name })}</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  intro: { fontSize: 13, color: Colors.textGray, lineHeight: 19, padding: 16, paddingBottom: 0 },
  loader: { marginTop: 40 },
  list: { padding: 16, paddingBottom: TAB_BAR_SPACE },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  badgeText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  specialty: { fontSize: 12, color: Colors.textGray },
  requestBtn: { backgroundColor: Colors.primaryFaded, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  requestBtnText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
