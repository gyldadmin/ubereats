import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { ActivityIndicator, Text, Card } from 'react-native-paper';
import { supabase } from '../../../services/supabase';
import { Restaurant } from '../../../types/restaurant';
import RestaurantCard from './RestaurantCard';
import RestaurantSlider from '../../ui/RestaurantSlider';
import { colors, spacing, typography, layout, globalStyles } from '../../../styles';

const RestaurantList: React.FC = () => {
  // State management for restaurants data
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isSliderVisible, setIsSliderVisible] = useState(false);
  
  // Like state management - using Set for efficient lookup
  const [likedRestaurants, setLikedRestaurants] = useState<Set<string>>(new Set());

  // Fetch restaurants from Supabase database
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Starting restaurant fetch...');
      
      // Query Supabase for first 5 restaurants
      const { data, error, count } = await supabase
        .from('restaurants')
        .select('*', { count: 'exact' })
        .limit(5)
        .order('created_at', { ascending: false }); // Get newest first

      console.log('📊 Query result:', { data, error, count });

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log(`✅ Found ${data?.length || 0} restaurants`);
      
      // Update state with fetched data
      setRestaurants(data || []);
    } catch (error: any) {
      console.error('💥 Error fetching restaurants:', error);
      setError(error.message || 'Failed to load restaurants');
      Alert.alert('Error', `Failed to load restaurants: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch restaurants when component mounts
  useEffect(() => {
    fetchRestaurants();
  }, []);

  // Handle restaurant card press
  const handleRestaurantPress = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsSliderVisible(true);
  };

  // Handle slider close
  const handleCloseSlider = () => {
    setIsSliderVisible(false);
    setTimeout(() => setSelectedRestaurant(null), 300); // Delay to allow animation
  };

  // Like functionality
  const toggleLike = (restaurantId: string) => {
    setLikedRestaurants(prevLiked => {
      const newLiked = new Set(prevLiked);
      if (newLiked.has(restaurantId)) {
        newLiked.delete(restaurantId);
        console.log(`❤️ Unliked restaurant: ${restaurantId}`);
      } else {
        newLiked.add(restaurantId);
        console.log(`💖 Liked restaurant: ${restaurantId}`);
      }
      return newLiked;
    });
  };

  // Check if restaurant is liked
  const isRestaurantLiked = (restaurantId: string): boolean => {
    return likedRestaurants.has(restaurantId);
  };

  // Loading state
  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading restaurants...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Card style={styles.errorCard}>
          <Card.Content>
            <Text style={styles.errorText}>❌ Error loading restaurants</Text>
            <Text style={styles.errorDetail}>{error}</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Empty state
  if (restaurants.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Card style={styles.emptyCard}>
          <Card.Content>
            <Text style={styles.emptyText}>🍽️ No restaurants found</Text>
            <Text style={styles.emptyDetail}>Try adding some restaurants to your database</Text>
          </Card.Content>
        </Card>
      </View>
    );
  }

  // Main render - list of restaurants
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Restaurants</Text>
          <Text style={styles.headerSubtitle}>
            Found {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
            {likedRestaurants.size > 0 && ` • ${likedRestaurants.size} liked`}
          </Text>
        </View>

        {/* Restaurant Cards */}
        <View style={styles.listContainer}>
          {restaurants.map((restaurant) => (
            <RestaurantCard 
              key={restaurant.id} 
              restaurant={restaurant}
              onPress={() => handleRestaurantPress(restaurant)}
              isLiked={isRestaurantLiked(restaurant.id)}
              onLike={() => toggleLike(restaurant.id)}
            />
          ))}
        </View>

        {/* Footer spacer */}
        <View style={styles.footer} />
      </ScrollView>

      {/* Restaurant Slider - Outside ScrollView for proper positioning */}
      <RestaurantSlider
        restaurant={selectedRestaurant}
        isVisible={isSliderVisible}
        onClose={handleCloseSlider}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...globalStyles.container,
  },
  scrollView: {
    ...globalStyles.scrollContainer,
  },
  contentContainer: {
    ...globalStyles.contentContainer,
  },
  centerContainer: {
    ...globalStyles.centerContainer,
  },
  header: {
    ...globalStyles.header,
  },
  headerTitle: {
    ...globalStyles.headerTitle,
  },
  headerSubtitle: {
    ...globalStyles.headerSubtitle,
  },
  listContainer: {
    ...globalStyles.listContainer,
  },
  footer: {
    height: spacing.layout.footerHeight,
  },
  loadingText: {
    ...globalStyles.loadingText,
  },
  errorCard: {
    width: '90%',
    elevation: layout.elevation.md,
  },
  errorText: {
    ...globalStyles.errorText,
  },
  errorDetail: {
    ...globalStyles.errorDetail,
  },
  emptyCard: {
    width: '90%',
    elevation: layout.elevation.md,
  },
  emptyText: {
    ...globalStyles.emptyText,
  },
  emptyDetail: {
    ...globalStyles.emptyDetail,
  },
});

export default RestaurantList; 