-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create restaurants table
CREATE TABLE restaurants (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    rating NUMERIC(2,1) CHECK (rating >= 0 AND rating <= 5),
    url TEXT,
    image_url TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own restaurants
CREATE POLICY "Users can view their own restaurants" ON restaurants
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert restaurants for themselves
CREATE POLICY "Users can insert their own restaurants" ON restaurants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own restaurants
CREATE POLICY "Users can update their own restaurants" ON restaurants
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own restaurants
CREATE POLICY "Users can delete their own restaurants" ON restaurants
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_restaurants_updated_at
    BEFORE UPDATE ON restaurants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 