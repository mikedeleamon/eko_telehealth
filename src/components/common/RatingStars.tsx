import React from 'react';
import { View, StyleSheet } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

interface Props {
  rating: number;
  size?: number;
  color?: string;
}

export default function RatingStars({ rating, size = 14, color = '#FFC107' }: Props) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <FontAwesome
          key={star}
          name={star <= Math.floor(rating) ? 'star' : star - 0.5 <= rating ? 'star-half-o' : 'star-o'}
          size={size}
          color={color}
          style={styles.star}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
});
