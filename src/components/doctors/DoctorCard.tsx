import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { useTheme, type ThemeColors } from '../../theme';
import { useTranslation } from '../../i18n/useTranslation';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  location: string;
  fee: string;
  available: boolean;
  nextAvailable?: string;
  avatar: null | string;
}

interface Props {
  doctor: Doctor;
  onPress: () => void;
  onChat?: () => void;
  cardColor?: string;
}

const VISIT_TAG_KEYS = ['Video Visit', 'Home Visit', 'Clinic Visit'];

export default function DoctorCard({ doctor, onPress, onChat, cardColor = Colors.cardColors[0] }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const availabilityText = doctor.available ? t('doctors.availableNow') : t('doctors.unavailable');
  const cardLabel = `${doctor.name}. ${doctor.specialty}. ${t('a11y.rating', { rating: doctor.rating })}. ${availabilityText}`;
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardColor }]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={cardLabel}
    >
      <View style={styles.row}>
        {/* Avatar circle */}
        <View style={styles.avatar}>
          <FontAwesome name="user-md" size={26} color={Colors.primary} />
          {doctor.available ? <View style={styles.onlineDot} /> : null}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>{doctor.name}</Text>
          <Text style={styles.specialty} numberOfLines={1}>{doctor.specialty}</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map(s => (
              <FontAwesome
                key={s}
                name={s <= Math.floor(doctor.rating) ? 'star' : 'star-o'}
                size={11}
                color="#F59E0B"
              />
            ))}
            <Text style={styles.reviewCount}>  {doctor.rating} ({doctor.reviews})</Text>
          </View>

          <Text style={styles.meta} numberOfLines={1}>
            <FontAwesome name="map-marker" size={11} color={Colors.textGray} />
            {'  '}{doctor.location}
          </Text>
        </View>

        {/* Chat button */}
        <TouchableOpacity
          style={styles.chatBtn}
          onPress={onChat}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel={t('doctors.message')}
        >
          <FontAwesome name="comment" size={15} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Visit type pills */}
      <View style={styles.tags}>
        {VISIT_TAG_KEYS.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{t(`options.appointmentType.${tag}`)}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: {
    borderRadius: 20, padding: 16, marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: 'rgba(39, 42, 58, 0.12)',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },

  avatar: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
    borderWidth: 2, borderColor: Colors.primaryFaded,
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2, borderColor: Colors.white,
  },

  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: Colors.textDark, fontFamily: 'Poppins_700Bold', marginBottom: 2 },
  specialty: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular', marginBottom: 5 },

  stars: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  reviewCount: { fontSize: 11, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },

  meta: { fontSize: 11, color: Colors.textGray, fontFamily: 'Poppins_400Regular', marginBottom: 2 },

  chatBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 4,
    backgroundColor: Colors.surface, borderRadius: 20,
  },
  tagText: { fontSize: 11, color: Colors.textMedium, fontWeight: '500', fontFamily: 'Poppins_500Medium' },
});
