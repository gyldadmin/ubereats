export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  rating: number | null;
  url: string | null;
  image_url: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateRestaurantInput {
  name: string;
  rating?: number;
  url?: string;
  image_url?: string;
  address?: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  rating?: number;
  url?: string;
  image_url?: string;
  address?: string;
}

export interface RestaurantFilters {
  name?: string;
  rating?: number;
  address?: string;
} 