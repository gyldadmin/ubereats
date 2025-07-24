-- Migration: Create user system tables
-- Date: 2025-07-07 14:38:00 
-- Description: Creates metro, neighborhoods, nominations, and all user tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Metro areas table (no dependencies)
CREATE TABLE metro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Neighborhoods table (references metro)
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL,
    metro UUID REFERENCES metro(id)
);

-- Nominations table (references auth.users)
CREATE TABLE nominations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID UNIQUE REFERENCES auth.users(id) NOT NULL
);

-- Public user profiles (publicly readable)
CREATE TABLE users_public (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first TEXT NOT NULL DEFAULT '',
    full_name TEXT NOT NULL DEFAULT '',
    title TEXT,
    list INTEGER,
    profpic TEXT,
    blurb TEXT,
    candidate UUID REFERENCES candidates(id),
    employer UUID REFERENCES employers(id),
    gyld UUID REFERENCES gyld(id),
    nomination UUID REFERENCES nominations(id)
);

-- Internal user data (active users only)
CREATE TABLE users_internal (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    user_status TEXT,
    activity_type UUID[],
    proflink TEXT,
    knowledge_domain UUID[],
    neighborhood UUID REFERENCES neighborhoods(id),
    start_field TIMESTAMPTZ,
    role_interest UUID[],
    phone_number TEXT,
    notification_preferences JSONB DEFAULT '{}'
);

-- Private user data (owners and admins only)  
CREATE TABLE users_private (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    onboard_status INTEGER DEFAULT 0,
    customer_ID TEXT UNIQUE,
    monthly_price NUMERIC,
    cc_active BOOLEAN DEFAULT false,
    founding_member BOOLEAN DEFAULT false,
    notification_preferences JSONB DEFAULT '{}'
);

-- Create indexes for all tables
CREATE INDEX idx_metro_label ON metro(label);
CREATE INDEX idx_neighborhoods_label ON neighborhoods(label);
CREATE INDEX idx_neighborhoods_metro ON neighborhoods(metro);
CREATE INDEX idx_nominations_user_id ON nominations(user_id);
CREATE INDEX idx_users_public_user_id ON users_public(user_id);
CREATE INDEX idx_users_public_gyld ON users_public(gyld);
CREATE INDEX idx_users_internal_user_id ON users_internal(user_id);
CREATE INDEX idx_users_internal_user_status ON users_internal(user_status);
CREATE INDEX idx_users_private_user_id ON users_private(user_id);

-- Add RLS to all tables
ALTER TABLE metro ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_private ENABLE ROW LEVEL SECURITY;

-- Metro RLS policies
CREATE POLICY "Metro areas can be read by anyone" ON metro FOR SELECT USING (true);
CREATE POLICY "Metro areas can be modified by admins" ON metro FOR ALL USING (public.is_admin());

-- Neighborhoods RLS policies  
CREATE POLICY "Neighborhoods can be read by anyone" ON neighborhoods FOR SELECT USING (true);
CREATE POLICY "Neighborhoods can be modified by admins" ON neighborhoods FOR ALL USING (public.is_admin());

-- Nominations RLS policies
CREATE POLICY "Nominations can be read by admins and self" ON nominations 
    FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Nominations can be modified by admins" ON nominations FOR ALL USING (public.is_admin());

-- Users_public RLS policies
CREATE POLICY "Public user profiles can be read by anyone" ON users_public FOR SELECT USING (true);
CREATE POLICY "Public user profiles can be modified by admins and self" ON users_public 
    FOR ALL USING (public.is_admin() OR auth.uid() = user_id);

-- Users_internal RLS policies  
CREATE POLICY "Internal user data can be read by admins and self" ON users_internal
    FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Internal user data can be modified by admins and self" ON users_internal
    FOR ALL USING (public.is_admin() OR auth.uid() = user_id);

-- Users_private RLS policies
CREATE POLICY "Private user data can be read by admins and self" ON users_private
    FOR SELECT USING (public.is_admin() OR auth.uid() = user_id);
CREATE POLICY "Private user data can be modified by admins and self" ON users_private
    FOR ALL USING (public.is_admin() OR auth.uid() = user_id);

-- Add triggers to update updated_at columns
CREATE TRIGGER metro_updated_at_trigger
    BEFORE UPDATE ON metro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER neighborhoods_updated_at_trigger
    BEFORE UPDATE ON neighborhoods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER nominations_updated_at_trigger  
    BEFORE UPDATE ON nominations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_public_updated_at_trigger
    BEFORE UPDATE ON users_public FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_internal_updated_at_trigger
    BEFORE UPDATE ON users_internal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER users_private_updated_at_trigger
    BEFORE UPDATE ON users_private FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 