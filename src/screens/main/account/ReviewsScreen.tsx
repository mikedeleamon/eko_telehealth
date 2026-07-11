import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Colors } from '../../../constants/Colors';
import EkoHeader from '../../../components/common/EkoHeader';
import RatingStars from '../../../components/common/RatingStars';
import EkoButton from '../../../components/common/EkoButton';

interface Props {
  navigation: NativeStackNavigationProp<any>;
  route: RouteProp<any>;
}

const MOCK_REVIEWS = [
  { id: '1', author: 'Jane D.', rating: 5, text: 'Excellent doctor! Very thorough and caring.', date: 'Nov 20, 2024' },
  { id: '2', author: 'Mark S.', rating: 4, text: 'Great experience overall. Short wait time.', date: 'Nov 15, 2024' },
  { id: '3', author: 'Alice M.', rating: 5, text: 'Highly recommend! Very knowledgeable and professional.', date: 'Oct 30, 2024' },
];

export default function ReviewsScreen({ navigation, route }: Props) {
  const { doctor } = route.params ?? {};
  const [myRating, setMyRating] = useState(0);
  const [myReview, setMyReview] = useState('');

  const submitReview = () => {
    if (myRating === 0) return Alert.alert('', 'Please select a rating.');
    if (!myReview.trim()) return Alert.alert('', 'Please enter your review.');
    Alert.alert('Thank you!', 'Your review has been submitted.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
  };

  return (
    <View style={styles.container}>
      <EkoHeader title="Reviews" onBack={() => navigation.goBack()} />
      <FlatList
        data={MOCK_REVIEWS}
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
          <View style={styles.writeReview}>
            <Text style={styles.writeTitle}>Write a Review</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => setMyRating(s)}>
                  <FontAwesome name={s <= myRating ? 'star' : 'star-o'} size={32} color="#FFC107" style={styles.starBtn} />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor={Colors.textGray}
              value={myReview}
              onChangeText={setMyReview}
              multiline
              numberOfLines={4}
            />
            <EkoButton title="Submit Review" variant="accent" onPress={submitReview} />
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  writeReview: { backgroundColor: Colors.white, borderRadius: 14, padding: 16, marginTop: 8 },
  writeTitle: { fontSize: 16, fontWeight: '700', color: Colors.textDark, marginBottom: 12 },
  starRow: { flexDirection: 'row', marginBottom: 14 },
  starBtn: { marginRight: 6 },
  reviewInput: {
    borderWidth: 1.5, borderColor: Colors.borderGray, borderRadius: 12, padding: 12,
    fontSize: 14, color: Colors.textDark, minHeight: 100, textAlignVertical: 'top', marginBottom: 16,
  },
});
