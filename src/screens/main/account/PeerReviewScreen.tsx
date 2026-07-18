import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import RatingStars from '../../../components/common/RatingStars';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
}

const PEER_COLORS = ['#2D2EFF', '#F21D31', '#F4920F', '#5200FE'];

const PEER_DATA = [
  { id: '1', name: 'Dr. James Williams', specialty: 'Cardiology', rating: 4.8, comment: 'Excellent diagnostic skills and very patient-centered.' },
  { id: '2', name: 'Dr. Linda Park', specialty: 'Neurology', rating: 4.9, comment: 'Outstanding clinician and collaborator.' },
  { id: '3', name: 'Dr. Robert Kim', specialty: 'Orthopedics', rating: 4.7, comment: 'Very thorough and detail-oriented.' },
  { id: '4', name: 'Dr. Sophia Turner', specialty: 'Pediatrics', rating: 5.0, comment: 'Incredible with patients, especially children.' },
];

export default function PeerReviewScreen({ navigation }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  return (
    <View style={styles.container}>
      <EkoHeader title={t('account.peerReviews')} onBack={() => navigation.goBack()} />
      <FlatList
        data={PEER_DATA}
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
            <Text style={styles.comment}>"{item.comment}"</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  list: { padding: 16 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 12,
    borderLeftWidth: 4, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  badgeText: { fontSize: 18, fontWeight: '800', color: Colors.white },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  specialty: { fontSize: 12, color: Colors.textGray },
  comment: { fontSize: 14, color: Colors.textMedium, fontStyle: 'italic', lineHeight: 20 },
});
