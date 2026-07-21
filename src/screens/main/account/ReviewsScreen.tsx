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
import { useReviews, useReviewSummary, useSubmitReview } from '../../../hooks/queries';
import { useTranslation } from '../../../i18n/useTranslation';
import type { Review, ReviewSummary } from '../../../api/types';

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
  const [myTitle, setMyTitle] = useState('');
  const [myReview, setMyReview] = useState('');

  // With a doctor param this is that doctor's public reviews (+ write form);
  // opened bare (doctor settings menu) it lists all published reviews.
  const { data: reviews = [] } = useReviews(doctor?.name);
  const { data: summary } = useReviewSummary(doctor?.name);
  const submitMutation = useSubmitReview();

  const submitReview = async () => {
    if (myRating === 0) return Alert.alert('', t('reviews.selectRating'));
    if (!myReview.trim()) return Alert.alert('', t('reviews.enterReview'));
    try {
      await submitMutation.mutateAsync({
        subject: doctor.name,
        rating: myRating,
        text: myReview.trim(),
        title: myTitle.trim() || undefined,
      });
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
        renderItem={({ item }) => <ReviewCard review={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={<SummaryHeader summary={summary} count={reviews.length} />}
        ListEmptyComponent={<Text style={styles.empty}>{t('reviews.noReviews')}</Text>}
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
                style={styles.titleInput}
                placeholder={t('reviews.reviewTitlePlaceholder')}
                placeholderTextColor={Colors.textGray}
                accessibilityLabel={t('reviews.reviewTitle')}
                value={myTitle}
                onChangeText={setMyTitle}
                maxLength={80}
              />
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

/** App Store-style summary: big average on the left, distribution bars on the right. */
function SummaryHeader({ summary, count }: { summary?: ReviewSummary; count: number }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  if (!summary || summary.total === 0) return null;

  const maxCount = Math.max(1, ...summary.distribution);
  // Rows run 5★ (top) down to 1★ (bottom), matching the App Store.
  const rows = [5, 4, 3, 2, 1];

  return (
    <View style={styles.summary}>
      <View style={styles.summaryLeft}>
        <Text style={styles.avgNumber}>{summary.average.toFixed(1)}</Text>
        <Text style={styles.avgOutOf}>{t('reviews.outOf5')}</Text>
        <Text style={styles.avgCount}>{t('reviews.ratingsCount', { count: summary.total })}</Text>
      </View>
      <View style={styles.summaryRight}>
        {rows.map((star) => {
          const c = summary.distribution[star - 1];
          return (
            <View key={star} style={styles.distRow}>
              <View style={styles.distStars}>
                {Array.from({ length: star }).map((_, i) => (
                  <FontAwesome key={i} name="star" size={8} color={Colors.textGray} style={styles.distStar} />
                ))}
              </View>
              <View style={styles.distTrack}>
                <View style={[styles.distFill, { width: `${(c / maxCount) * 100}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** A single review card with a "…more" expander and a comments count. */
function ReviewCard({ review }: { review: Review }) {
  const Colors = useTheme();
  const styles = makeStyles(Colors);
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [truncatable, setTruncatable] = useState(false);

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTop}>
        <Text style={styles.reviewCardTitle} numberOfLines={1}>{review.title ?? review.author}</Text>
        <Text style={styles.reviewDate}>{review.date}</Text>
      </View>

      <View style={styles.reviewMetaRow}>
        <RatingStars rating={review.rating} size={13} />
        <View style={styles.metaRight}>
          {review.verified ? (
            <Text style={styles.verified} numberOfLines={1}>
              {t('reviews.verifiedPatient')} | {review.author}{'  '}
            </Text>
          ) : (
            <Text style={styles.metaAuthor} numberOfLines={1}>{review.author}{'  '}</Text>
          )}
          {review.verified ? <FontAwesome name="lock" size={12} color={Colors.primary} /> : null}
        </View>
      </View>

      <Text
        style={styles.reviewText}
        numberOfLines={expanded ? undefined : 3}
        onTextLayout={(e) => {
          if (!expanded && e.nativeEvent.lines.length > 3) setTruncatable(true);
        }}
      >
        {review.text}
      </Text>
      {truncatable ? (
        <TouchableOpacity onPress={() => setExpanded((v) => !v)} accessibilityRole="button">
          <Text style={styles.moreLink}>{expanded ? t('reviews.less') : `…${t('reviews.more')}`}</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.commentsRow}>
        <FontAwesome name="comments-o" size={15} color={Colors.textMedium} />
        <Text style={styles.commentsText}>{t('reviews.comments', { count: review.comments ?? 0 })}</Text>
      </View>
    </View>
  );
}

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgLight },
  list: { padding: 16, paddingBottom: 24 },
  empty: { textAlign: 'center', color: Colors.textGray, marginTop: 24, fontSize: 14 },

  // Summary header
  summary: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingHorizontal: 4 },
  summaryLeft: { width: 120 },
  avgNumber: { fontSize: 56, fontWeight: '800', color: Colors.textDark, lineHeight: 60, fontFamily: 'Poppins_700Bold' },
  avgOutOf: { fontSize: 14, color: Colors.textMedium, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  avgCount: { fontSize: 13, color: Colors.textGray, marginTop: 2, fontFamily: 'Poppins_400Regular' },
  summaryRight: { flex: 1, justifyContent: 'center' },
  distRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  distStars: { flexDirection: 'row', width: 56, justifyContent: 'flex-end' },
  distStar: { marginLeft: 1 },
  distTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: Colors.borderGray, marginLeft: 8, overflow: 'hidden' },
  distFill: { height: 6, borderRadius: 3, backgroundColor: Colors.primary },

  // Review card
  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 14,
    shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 6, elevation: 1,
  },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  reviewCardTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: Colors.textDark, marginRight: 10, fontFamily: 'Poppins_700Bold' },
  reviewDate: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  reviewMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  metaRight: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginLeft: 10 },
  verified: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  metaAuthor: { fontSize: 12, color: Colors.textGray, fontFamily: 'Poppins_400Regular' },
  reviewText: { fontSize: 14, color: Colors.textMedium, lineHeight: 20, fontFamily: 'Poppins_400Regular' },
  moreLink: { fontSize: 13, color: Colors.accent, fontWeight: '600', marginTop: 4, fontFamily: 'Poppins_600SemiBold' },
  commentsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  commentsText: { fontSize: 13, color: Colors.textDark, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  // Write review
  writeReview: { backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginTop: 8 },
  writeTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12, fontFamily: 'Poppins_700Bold' },
  starRow: { flexDirection: 'row', marginBottom: 14 },
  starBtn: { marginRight: 6 },
  titleInput: {
    borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: 12, paddingHorizontal: 12, height: 46,
    fontSize: 14, color: Colors.textDark, marginBottom: 12, fontFamily: 'Poppins_400Regular',
  },
  reviewInput: {
    borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: 12, padding: 12,
    fontSize: 14, color: Colors.textDark, minHeight: 100, textAlignVertical: 'top', marginBottom: 16,
  },
});
