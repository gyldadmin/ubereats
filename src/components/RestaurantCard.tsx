import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Restaurant } from '../../types/restaurant';
import StarRating from './ui/StarRating';
import { colors, spacing, typography, layout, shadows } from '../styles';

// Props interface for the component
interface RestaurantCardProps {
  restaurant: Restaurant;
  onPress?: () => void;
  isLiked?: boolean;
  onLike?: () => void;
}

// RestaurantCard component that accepts a restaurant prop
const RestaurantCard: React.FC<RestaurantCardProps> = ({ 
  restaurant, 
  onPress, 
  isLiked = false, 
  onLike 
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.touchable}>
      <Card style={styles.card}>
        {/* Display restaurant image using image_url from the database */}
        <Card.Cover 
          source={{ uri: restaurant.image_url || 'https://picsum.photos/400/300?random=1' }} 
          style={styles.cover} 
        />
        
        {/* Like button positioned over the image */}
        {onLike && (
          <TouchableOpacity 
            style={styles.likeButton} 
            onPress={onLike}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? colors.interactive.like : colors.interactive.likeInactive}
            />
          </TouchableOpacity>
        )}
        
        <Card.Content style={styles.content}>
          {/* Restaurant name from database */}
          <Title style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {restaurant.name}
          </Title>
          
          {/* Rating display with multiple stars */}
          <View style={styles.ratingContainer}>
            <StarRating rating={restaurant.rating} starSize={16} />
            <Paragraph style={styles.ratingText}>
              {restaurant.rating ? `(${restaurant.rating.toFixed(1)})` : '(No rating)'}
            </Paragraph>
          </View>
          
          {/* Restaurant address from database */}
          <Paragraph style={styles.address} numberOfLines={1} ellipsizeMode="tail">
            {restaurant.address || 'Address not available'}
          </Paragraph>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    width: layout.components.card.width,
    alignSelf: 'center',
    marginVertical: spacing.layout.cardVertical,
  },
  card: {
    borderRadius: layout.components.card.borderRadius,
    ...shadows.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  cover: {
    height: layout.components.card.imageHeight,
    borderTopLeftRadius: layout.components.card.borderRadius,
    borderTopRightRadius: layout.components.card.borderRadius,
  },
  likeButton: {
    position: 'absolute',
    top: spacing.lg,
    right: spacing.md,
    backgroundColor: colors.transparent.white,
    borderRadius: layout.components.likeButton.borderRadius,
    width: layout.components.likeButton.width,
    height: layout.components.likeButton.height,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    zIndex: 1,
  },
  content: {
    padding: spacing.component.padding,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  ratingText: {
    marginLeft: spacing.component.gap - 2,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  address: {
    fontSize: typography.sizes.sm,
    color: colors.text.quaternary,
  },
});

export default RestaurantCard; 