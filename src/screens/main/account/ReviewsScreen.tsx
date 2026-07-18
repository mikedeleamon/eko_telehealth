import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import { useTheme, type ThemeColors } from '../../../theme';
import EkoHeader from '../../../components/common/EkoHeader';
import RatingStars from '../../../components/common/RatingStars';
import EkoButton from '../../../components/common/EkoButton';
import { useReviews, useSubmitReview } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

export default function ReviewsScreen({ navigation, route }: Props) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const { doctor } = route.params ?? {};
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');

  // With a doctor param this is that doctor's public reviews (+ write form);
  // opened bare (doctor settings menu) it lists all published reviews.
  const { data: reviews = [] } = useReviews(doctor?.name);
  const submitMutation = useSubmitReview();

  const submitReview = async () => {
    if (myRating === 0) return Alert.alert('', t('reviews.selectRating'));
    if (!myReview.trim()) return Alert.alert('', t('reviews.enterReview'));
    try {
      await submitMutation.mutateAsync({ subject: doctor.name, rating: myRating, text: myReview.trim() });
      Alert.alert(t('reviews.thankYou'), t('reviews.reviewSubmittedBody'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert(t('reviews.couldNotSubmitReview'), err instanceof Error ? err.message : t('common.somethingWentWrong'));
    }
  };

  return (
    <View style={styles.container}>
      <EkoHeader title={t('reviews.title')} onBack={() => navigation.goBack()} />
      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={[styles.reviewCard, { backgroundColor: Colors.cardColors[index % Colors.cardColors.length] }]}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewInitial}>{item.author[0]}</Text>
              </View>
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewAuthor}>{item.author}</Text>
                <Text style={styles.reviewDate}>{item.date}</Text>
              </View>
              <RatingStars rating={item.rating} size={13} />
            </View>
            <Text style={styles.reviewText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListFooterComponent={
          // Writing needs a subject — only offered when opened for a doctor.
          !doctor ? null : (
          <View style={styles.writeReview}>
            <Text style={styles.writeTitle}>{t('reviews.writeReview')}</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setMyRating(s)} accessibilityRole="button" accessibilityLabel={t('a11y.rating', { rating: s })}>
                  <FontAwesome name={s <= myRating ? 'star' : 'star-o'} size={32} color="#FFC107" style={styles.starBtn} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder={t('reviews.reviewPlaceholder')}
              placeholderTextColor={Colors.textGray}
              accessibilityLabel={t('reviews.writeReview')}
              value={myReview}
              onChangeText={setMyReview}
              multiline
              numberOfLines={4}
            />
            <EkoButton title={t('reviews.submitReview')} variant="accent" onPress={submitReview} loading={submitMutation.isPending} />
          </View>
          )
        }
      />
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  list: { padding: 16, paddingBottom: 24 },
  reviewCard: { borderRadius: 14, padding: 14, marginBottom: 12, shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 2 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  reviewInitial: { fontSize: 16, fontWeight: '700', color: Colors.white },
  reviewMeta: { flex: 1 },
  reviewAuthor: { fontSize: 14, fontWeight: '700', color: Colors.textDark },
  reviewDate: { fontSize: 11, color: Colors.textGray },
  reviewText: { fontSize: 14, color: Colors.textMedium, lineHeight: 20 },
  writeReview: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginTop: 8 },
  writeTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  starRow: { flexDirection: 'row', marginBottom: 14 },
  starBtn: { marginRight: 6 },
  reviewInput: {
    borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: 12, padding: 12,
    fontSize: 14, color: Colors.textDark, minHeight: 100, textAlignVertical: 'top', marginBottom: 16,
  },
});
