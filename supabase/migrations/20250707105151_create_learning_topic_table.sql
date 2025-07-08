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

-- Create learning_topic table
CREATE TABLE learning_topic (
    -- Standard fields
    id UUID PRIMARY KEY UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    -- Custom fields
    label TEXT NOT NULL UNIQUE,
    knowledge_domain UUID[] NOT NULL,
    gyld_type UUID[] NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_learning_topic_label ON learning_topic(label);
CREATE INDEX idx_learning_topic_knowledge_domain ON learning_topic USING GIN(knowledge_domain);
CREATE INDEX idx_learning_topic_gyld_type ON learning_topic USING GIN(gyld_type);

-- Enable Row Level Security
ALTER TABLE learning_topic ENABLE ROW LEVEL SECURITY;

-- Note: Using existing is_admin() function from foundation migration

-- RLS Policy: Public read access
-- Anyone can read learning topic data (will be shown on open internet)
CREATE POLICY "learning_topic_select_policy" ON learning_topic
    FOR SELECT
    USING (true);

-- RLS Policy: Admin-only write access
-- Only app admins, Supabase admin, and app workflows can insert records
CREATE POLICY "learning_topic_insert_policy" ON learning_topic
    FOR INSERT
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Admin-only update access
-- Only app admins, Supabase admin, and app workflows can update records
CREATE POLICY "learning_topic_update_policy" ON learning_topic
    FOR UPDATE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    )
    WITH CHECK (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- RLS Policy: Admin-only delete access
-- Only app admins, Supabase admin, and app workflows can delete records
CREATE POLICY "learning_topic_delete_policy" ON learning_topic
    FOR DELETE
    USING (
        public.is_admin() OR 
        auth.role() = 'service_role'
    );

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_learning_topic_updated_at
    BEFORE UPDATE ON learning_topic
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert seed data for learning topics
-- All topics have gyld_type fc5edc35-3f93-4157-a827-3001182aa0b2
-- Product Practice topics (knowledge_domain: 40a39925-1601-47b3-8408-6f4bd6419a50)
INSERT INTO learning_topic (label, knowledge_domain, gyld_type) VALUES
    ('Influencing stakeholders', ARRAY['40a39925-1601-47b3-8408-6f4bd6419a50']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Discovery interviews', ARRAY['40a39925-1601-47b3-8408-6f4bd6419a50']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Process design', ARRAY['40a39925-1601-47b3-8408-6f4bd6419a50']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Organizing your team', ARRAY['40a39925-1601-47b3-8408-6f4bd6419a50']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Product storytelling', ARRAY['40a39925-1601-47b3-8408-6f4bd6419a50']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Product positioning', ARRAY['40a39925-1601-47b3-8408-6f4bd6419a50']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]);

-- Growth topics (knowledge_domain: 87c403e7-4085-4c52-88a8-c0f9e5401dc8)
INSERT INTO learning_topic (label, knowledge_domain, gyld_type) VALUES
    ('Pricing and packaging', ARRAY['87c403e7-4085-4c52-88a8-c0f9e5401dc8']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Engagement', ARRAY['87c403e7-4085-4c52-88a8-c0f9e5401dc8']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Growth systems', ARRAY['87c403e7-4085-4c52-88a8-c0f9e5401dc8']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Activation', ARRAY['87c403e7-4085-4c52-88a8-c0f9e5401dc8']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]);

-- Product Craft topics (knowledge_domain: e3e52e7e-e5f2-48d0-9b65-7fce7689c292)
INSERT INTO learning_topic (label, knowledge_domain, gyld_type) VALUES
    ('Feature crafting', ARRAY['e3e52e7e-e5f2-48d0-9b65-7fce7689c292']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Behavioral design', ARRAY['e3e52e7e-e5f2-48d0-9b65-7fce7689c292']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('0 to 1', ARRAY['e3e52e7e-e5f2-48d0-9b65-7fce7689c292']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Product Polish', ARRAY['e3e52e7e-e5f2-48d0-9b65-7fce7689c292']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]);

-- Product Strategy topics (knowledge_domain: 3a235aa1-986f-4985-835c-f8ac4c8482c2)
INSERT INTO learning_topic (label, knowledge_domain, gyld_type) VALUES
    ('Product-market fit expansion', ARRAY['3a235aa1-986f-4985-835c-f8ac4c8482c2']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Trust and safety', ARRAY['3a235aa1-986f-4985-835c-f8ac4c8482c2']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('AI Native Products', ARRAY['3a235aa1-986f-4985-835c-f8ac4c8482c2']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Feature strategy', ARRAY['3a235aa1-986f-4985-835c-f8ac4c8482c2']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Platform / infrastructure', ARRAY['3a235aa1-986f-4985-835c-f8ac4c8482c2']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]),
    ('Competitive Strategy', ARRAY['3a235aa1-986f-4985-835c-f8ac4c8482c2']::UUID[], ARRAY['fc5edc35-3f93-4157-a827-3001182aa0b2']::UUID[]);

-- Grant appropriate permissions
GRANT SELECT ON learning_topic TO anon, authenticated;
GRANT ALL ON learning_topic TO service_role;

-- Add helpful comments to the table
COMMENT ON TABLE learning_topic IS 'Learning topics with knowledge domain and gyld type classifications, public read access and admin-only write access';
COMMENT ON COLUMN learning_topic.label IS 'Learning topic label (e.g., Influencing stakeholders, Pricing and packaging, etc.)';
COMMENT ON COLUMN learning_topic.knowledge_domain IS 'Array of knowledge domain IDs that this learning topic belongs to';
COMMENT ON COLUMN learning_topic.gyld_type IS 'Array of gyld type IDs that this learning topic is associated with'; 