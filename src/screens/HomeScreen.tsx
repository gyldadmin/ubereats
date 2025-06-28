import React from 'react';
import { ScreenLayout } from '../components/ui';
import RestaurantList from '../components/features/restaurants/RestaurantList';

export default function HomeScreen() {
  return (
    <ScreenLayout>
      <RestaurantList />
    </ScreenLayout>
  );
} 