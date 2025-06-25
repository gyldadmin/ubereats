import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Props interface for the StarRating component
interface StarRatingProps {
  rating: number | null;
  maxStars?: number;
  starSize?: number;
  starColor?: string;
  emptyStarColor?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  starSize = 18,
  starColor = '#FFD700',
  emptyStarColor = '#E0E0E0',
}) => {
  // Handle null or invalid ratings
  if (rating === null || rating < 0) {
    return (
      <View style={styles.container}>
        {/* Show all empty stars for no rating */}
        {Array.from({ length: maxStars }, (_, index) => (
          <MaterialCommunityIcons
            key={index}
            name="star-outline"
            size={starSize}
            color={emptyStarColor}
            style={styles.star}
          />
        ))}
      </View>
    );
  }

  // Ensure rating doesn't exceed maxStars
  const clampedRating = Math.min(rating, maxStars);

  // Calculate full stars and fractional part
  const fullStars = Math.floor(clampedRating);
  const fractionalPart = clampedRating - fullStars;
  const emptyStars = maxStars - Math.ceil(clampedRating);

  return (
    <View style={styles.container}>
      {/* Render full stars */}
      {Array.from({ length: fullStars }, (_, index) => (
        <MaterialCommunityIcons
          key={`full-${index}`}
          name="star"
          size={starSize}
          color={starColor}
          style={styles.star}
        />
      ))}

      {/* Render fractional star if needed */}
      {fractionalPart > 0 && (
        <View style={styles.fractionalStarContainer}>
          {/* Empty star as background */}
          <MaterialCommunityIcons
            name="star-outline"
            size={starSize}
            color={emptyStarColor}
            style={[styles.star, styles.fractionalStarBackground]}
          />
          {/* Filled star with clipped width */}
          <MaterialCommunityIcons
            name="star"
            size={starSize}
            color={starColor}
            style={[
              styles.star,
              styles.fractionalStarFill,
              { width: starSize * fractionalPart }
            ]}
          />
        </View>
      )}

      {/* Render empty stars */}
      {Array.from({ length: emptyStars }, (_, index) => (
        <MaterialCommunityIcons
          key={`empty-${index}`}
          name="star-outline"
          size={starSize}
          color={emptyStarColor}
          style={styles.star}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    marginRight: 2,
  },
  fractionalStarContainer: {
    position: 'relative',
    marginRight: 2,
  },
  fractionalStarBackground: {
    position: 'absolute',
    margin: 0,
  },
  fractionalStarFill: {
    overflow: 'hidden',
    margin: 0,
  },
});

export default StarRating; 