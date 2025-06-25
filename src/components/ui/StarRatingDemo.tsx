import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import StarRating from './StarRating';

// Demo component to showcase different star ratings
const StarRatingDemo: React.FC = () => {
  const ratings = [0, 1, 1.5, 2.3, 3, 3.7, 4.2, 4.5, 4.8, 5, null];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Star Rating Examples</Text>
      {ratings.map((rating, index) => (
        <View key={index} style={styles.ratingRow}>
          <StarRating rating={rating} starSize={20} />
          <Text style={styles.ratingLabel}>
            {rating !== null ? rating.toFixed(1) : 'No rating'}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
    minWidth: 80,
  },
});

export default StarRatingDemo; 