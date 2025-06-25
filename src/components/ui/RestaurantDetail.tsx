import React from 'react';
import { View, StyleSheet, Image, Linking, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Restaurant } from '../../types/restaurant';
import StarRating from './StarRating';
import { colors, spacing, typography, layout, shadows, globalStyles } from '../../styles';

interface RestaurantDetailProps {
  restaurant: Restaurant;
}

const RestaurantDetail: React.FC<RestaurantDetailProps> = ({ restaurant }) => {
  const handleWebsitePress = async () => {
    if (!restaurant.url) return;
    
    try {
      const supported = await Linking.canOpenURL(restaurant.url);
      if (supported) {
        await Linking.openURL(restaurant.url);
      } else {
        Alert.alert('Error', 'Unable to open website');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open website');
    }
  };

  // Check if rating is below 4.5
  if (restaurant.rating && restaurant.rating < 4.5) {
    return (
      <View style={styles.lowRatingContainer}>
        <Text style={styles.lowRatingMessage}>
          This restaurant isn't worth going to because it's rating is so low
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Restaurant Image */}
      {restaurant.image_url && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: restaurant.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Restaurant Name */}
      {restaurant.name && (
        <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
          {restaurant.name}
        </Text>
      )}

      {/* Rating Section */}
      {restaurant.rating && (
        <View style={styles.ratingContainer}>
          <StarRating rating={restaurant.rating} starSize={20} />
          <Text style={styles.ratingText}>
            {restaurant.rating.toFixed(1)} stars
          </Text>
        </View>
      )}

      {/* Address */}
      {restaurant.address && (
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Address</Text>
          <Text style={styles.addressText} numberOfLines={3} ellipsizeMode="tail">
            {restaurant.address}
          </Text>
        </View>
      )}

      {/* Website Button */}
      {restaurant.url && (
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleWebsitePress}
            style={styles.websiteButton}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Visit Website
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    lineHeight: 34,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  addressContainer: {
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  buttonContainer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  websiteButton: {
    backgroundColor: colors.primary,
    borderRadius: layout.borderRadius.sm,
    ...shadows.button.default,
  },
  buttonContent: {
    paddingVertical: spacing.xs,
  },
  buttonLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.inverse,
  },
  lowRatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  lowRatingMessage: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    fontStyle: 'italic',
  },
});

export default RestaurantDetail; 