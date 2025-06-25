import React from 'react';
import { View, StyleSheet } from 'react-native';
import RestaurantList from '../components/features/restaurants/RestaurantList';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <RestaurantList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
}); 