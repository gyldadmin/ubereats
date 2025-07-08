-- Foundation Database Schema Migration
-- Created: 2025-07-03 08:32:58
-- Description: Complete database schema recreation - consolidates all previous migrations into current state
-- This migration recreates the entire Gyld database structure including all tables, relationships, 
-- indexes, RLS policies, functions, and initial data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- ============================================================================
-- LOOKUP/REFERENCE TABLES (Admin-managed, publicly readable)
-- ============================================================================

-- User status lookup table
CREATE TABLE user_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Metro areas
CREATE TABLE metro (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Neighborhoods (linked to metros)
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL,
    metro UUID REFERENCES metro(id)
);

-- Gyld types
CREATE TABLE gyld_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE,
    job TEXT,
    "@" TEXT
);

-- Activity types
CREATE TABLE activity_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Knowledge domains
CREATE TABLE knowledge_domain (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Role types
CREATE TABLE role_type (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Employers
CREATE TABLE employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT,
    li_url TEXT NOT NULL UNIQUE
);

-- ============================================================================
-- USER MANAGEMENT TABLES (Multi-tier user system)
-- ============================================================================

-- Forward declare tables for foreign key references
-- (These will be created later but need forward references)

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

-- ============================================================================
-- ROLE/CLASSIFICATION TABLES
-- ============================================================================

-- Candidates
CREATE TABLE candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID UNIQUE REFERENCES auth.users(id)
);

-- Nominations
CREATE TABLE nominations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID UNIQUE REFERENCES auth.users(id) NOT NULL
);

-- Mentors
CREATE TABLE mentors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID UNIQUE REFERENCES auth.users(id) NOT NULL
);

-- ============================================================================
-- GUILD/ORGANIZATION TABLES
-- ============================================================================

-- Main gyld/guild table
CREATE TABLE gyld (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL UNIQUE,
    metro UUID[],
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    gyld_type UUID REFERENCES gyld_type(id),
    organizer UUID[] DEFAULT '{}'
);

-- ============================================================================
-- EVENT/GATHERING SYSTEM
-- ============================================================================

-- Gatherings/events
CREATE TABLE gatherings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    title TEXT,
    address TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    image TEXT
);

-- Gathering participation
CREATE TABLE participation_gatherings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    gathering_id UUID NOT NULL REFERENCES gatherings(id)
);

-- ============================================================================
-- EXPERIENCE/ACTIVITY SYSTEM
-- ============================================================================

-- Experiences
CREATE TABLE experiences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- SATELLITE/EXTENSION TABLES
-- ============================================================================

-- Candidate satellites
CREATE TABLE candidate_satellites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    candidate_id UUID UNIQUE REFERENCES candidates(id) NOT NULL
);

-- Gathering satellites
CREATE TABLE gathering_satellites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gathering_id UUID UNIQUE REFERENCES gatherings(id) NOT NULL
);

-- Gathering mentoring satellites
CREATE TABLE gathering_mentoring_satellites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gathering_id UUID UNIQUE REFERENCES gatherings(id) NOT NULL
);

-- Experience satellites
CREATE TABLE experience_satellites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    experience_id UUID UNIQUE REFERENCES experiences(id) NOT NULL
);

-- Mentor satellites
CREATE TABLE mentor_satellites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    mentor_id UUID UNIQUE NOT NULL REFERENCES mentors(id)
);

-- ============================================================================
-- NOTIFICATION SYSTEM
-- ============================================================================

-- Notification types lookup
CREATE TABLE notification_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type_name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Messages for all communication channels
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('push', 'email', 'sms')),
    notification_type_id UUID REFERENCES notification_types(id),
    title TEXT,
    body TEXT NOT NULL,
    sender TEXT,
    subject TEXT,
    from_phone TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'sent', 'delivered', 'failed', 'opened', 'cancelled')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    push_token TEXT,
    email_address TEXT,
    phone_number TEXT,
    deep_link_data JSONB,
    notification_style TEXT DEFAULT 'simple' CHECK (notification_style IN ('simple', 'with_sender')),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    external_id TEXT,
    ttl_seconds INTEGER,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    template_id TEXT,
    template_data JSONB,
    reply_to_email TEXT,
    reply_to_name TEXT,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    bounce_type TEXT,
    bounce_reason TEXT
);

-- Scheduled notifications for long-term scheduling
CREATE TABLE scheduled_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'cancelled', 'failed')),
    delivery_method TEXT NOT NULL CHECK (delivery_method IN ('push', 'email', 'sms')),
    notification_type_id UUID REFERENCES notification_types(id),
    title TEXT,
    body TEXT NOT NULL,
    sender TEXT,
    notification_style TEXT DEFAULT 'simple' CHECK (notification_style IN ('simple', 'with_sender')),
    deep_link_data JSONB,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high')),
    ttl_seconds INTEGER,
    processed_at TIMESTAMP WITH TIME ZONE,
    message_id UUID REFERENCES messages(id),
    error_message TEXT
);

-- ============================================================================
-- LEGACY/EXAMPLE TABLE (from original example)
-- ============================================================================

-- Restaurants (example table from initial development)
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

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- User table indexes
CREATE INDEX idx_users_public_user_id ON users_public(user_id);
CREATE INDEX idx_users_public_candidate ON users_public(candidate);
CREATE INDEX idx_users_public_employer ON users_public(employer);
CREATE INDEX idx_users_public_gyld ON users_public(gyld);
CREATE INDEX idx_users_public_nomination ON users_public(nomination);
CREATE INDEX idx_users_public_first ON users_public(first);
CREATE INDEX idx_users_public_full_name ON users_public(full_name);
CREATE INDEX idx_users_public_list ON users_public(list);

CREATE INDEX idx_users_internal_user_id ON users_internal(user_id);
CREATE INDEX idx_users_internal_neighborhood ON users_internal(neighborhood);
CREATE INDEX idx_users_internal_start_field ON users_internal(start_field);
CREATE INDEX idx_users_internal_proflink ON users_internal(proflink);
CREATE INDEX idx_users_internal_activity_type ON users_internal USING GIN(activity_type);
CREATE INDEX idx_users_internal_knowledge_domain ON users_internal USING GIN(knowledge_domain);
CREATE INDEX idx_users_internal_role_interest ON users_internal USING GIN(role_interest);
CREATE INDEX idx_users_internal_notification_preferences ON users_internal USING GIN(notification_preferences);

CREATE INDEX idx_users_private_user_id ON users_private(user_id);
CREATE INDEX idx_users_private_onboard_status ON users_private(onboard_status);
CREATE UNIQUE INDEX idx_users_private_customer_id ON users_private(customer_ID);
CREATE INDEX idx_users_private_cc_active ON users_private(cc_active);
CREATE INDEX idx_users_private_founding_member ON users_private(founding_member);
CREATE INDEX idx_users_private_monthly_price ON users_private(monthly_price);
CREATE INDEX idx_users_private_notification_preferences ON users_private USING GIN(notification_preferences);

-- Lookup table indexes
CREATE INDEX idx_user_status_label ON user_status(label);
CREATE INDEX idx_metro_label ON metro(label);
CREATE INDEX idx_neighborhoods_label ON neighborhoods(label);
CREATE INDEX idx_neighborhoods_metro ON neighborhoods(metro);
CREATE INDEX idx_gyld_type_label ON gyld_type(label);
CREATE INDEX idx_activity_type_label ON activity_type(label);
CREATE INDEX idx_knowledge_domain_label ON knowledge_domain(label);
CREATE INDEX idx_role_type_label ON role_type(label);
CREATE INDEX idx_employers_li_url ON employers(li_url);

-- Role/classification table indexes
CREATE INDEX idx_candidates_user_id ON candidates(user_id);
CREATE INDEX idx_nominations_user_id ON nominations(user_id);
CREATE INDEX idx_mentors_user_id ON mentors(user_id);

-- Gyld table indexes
CREATE INDEX idx_gyld_name ON gyld(name);
CREATE INDEX idx_gyld_metro ON gyld USING GIN(metro);
CREATE INDEX idx_gyld_user_id ON gyld(user_id);
CREATE INDEX idx_gyld_gyld_type ON gyld(gyld_type);
CREATE INDEX idx_gyld_organizer ON gyld USING GIN(organizer);

-- Gathering table indexes
CREATE INDEX idx_participation_gatherings_user_id ON participation_gatherings(user_id);
CREATE INDEX idx_participation_gatherings_gathering_id ON participation_gatherings(gathering_id);

-- Satellite table indexes
CREATE INDEX idx_candidate_satellites_candidate_id ON candidate_satellites(candidate_id);
CREATE INDEX idx_gathering_satellites_gathering_id ON gathering_satellites(gathering_id);
CREATE INDEX idx_gathering_mentoring_satellites_gathering_id ON gathering_mentoring_satellites(gathering_id);
CREATE INDEX idx_experience_satellites_experience_id ON experience_satellites(experience_id);
CREATE INDEX idx_mentor_satellites_mentor_id ON mentor_satellites(mentor_id);

-- Notification system indexes
CREATE INDEX idx_notification_types_type_name ON notification_types(type_name);
CREATE INDEX idx_notification_types_is_active ON notification_types(is_active);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_delivery_method ON messages(delivery_method);
CREATE INDEX idx_messages_scheduled_for ON messages(scheduled_for);
CREATE INDEX idx_messages_notification_type ON messages(notification_type_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_messages_template_id ON messages(template_id);
CREATE INDEX idx_messages_email_address ON messages(email_address);
CREATE INDEX idx_messages_bounce_type ON messages(bounce_type);
CREATE INDEX idx_scheduled_notifications_user_id ON scheduled_notifications(user_id);
CREATE INDEX idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for);
CREATE INDEX idx_scheduled_notifications_status ON scheduled_notifications(status);

-- ============================================================================
-- SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM users_internal 
        WHERE user_id = auth.uid() 
        AND user_status = 'admin'
    );
$$;

-- Function to check if current user is active
CREATE OR REPLACE FUNCTION is_current_user_active()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM users_internal 
        WHERE user_id = auth.uid() 
        AND (user_status = 'active' OR user_status = 'admin')
    );
$$;

-- Function to check if user owns a candidate record
CREATE OR REPLACE FUNCTION owns_candidate(candidate_uuid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM candidates 
        WHERE id = candidate_uuid 
        AND user_id = auth.uid()
    );
$$;

-- Function to check if user is admin (alternative version)
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users_private 
        WHERE user_id = user_uuid 
        AND user_status = 'admin'
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Function to check if user is active (alternative version)
CREATE OR REPLACE FUNCTION is_active_user(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM users_private 
        WHERE user_id = user_uuid 
        AND (user_status = 'active' OR user_status = 'admin')
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE user_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE metro ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyld_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_domain ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_public ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE users_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE nominations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE gyld ENABLE ROW LEVEL SECURITY;
ALTER TABLE gatherings ENABLE ROW LEVEL SECURITY;
ALTER TABLE participation_gatherings ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_satellites ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_satellites ENABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_mentoring_satellites ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_satellites ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_satellites ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- LOOKUP TABLES (Public read, admin write)
-- user_status
CREATE POLICY "user_status_read_policy" ON user_status FOR SELECT USING (true);
CREATE POLICY "user_status_insert_policy" ON user_status FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "user_status_update_policy" ON user_status FOR UPDATE USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "user_status_delete_policy" ON user_status FOR DELETE USING (is_current_user_admin());

-- metro
CREATE POLICY "metro_read_public" ON metro FOR SELECT USING (true);
CREATE POLICY "metro_insert_admin" ON metro FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "metro_update_admin" ON metro FOR UPDATE USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "metro_delete_admin" ON metro FOR DELETE USING (is_current_user_admin());

-- neighborhoods
CREATE POLICY "neighborhoods_read_public" ON neighborhoods FOR SELECT USING (true);
CREATE POLICY "neighborhoods_insert_admin" ON neighborhoods FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "neighborhoods_update_admin" ON neighborhoods FOR UPDATE USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "neighborhoods_delete_admin" ON neighborhoods FOR DELETE USING (is_current_user_admin());

-- gyld_type
CREATE POLICY "gyld_type_read_public" ON gyld_type FOR SELECT USING (true);
CREATE POLICY "gyld_type_insert_admin" ON gyld_type FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "gyld_type_update_admin" ON gyld_type FOR UPDATE USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "gyld_type_delete_admin" ON gyld_type FOR DELETE USING (is_current_user_admin());

-- activity_type
CREATE POLICY "activity_type_read_public" ON activity_type FOR SELECT USING (true);
CREATE POLICY "activity_type_insert_admin" ON activity_type FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "activity_type_update_admin" ON activity_type FOR UPDATE USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "activity_type_delete_admin" ON activity_type FOR DELETE USING (is_current_user_admin());

-- knowledge_domain
CREATE POLICY "knowledge_domain_read_public" ON knowledge_domain FOR SELECT USING (true);
CREATE POLICY "knowledge_domain_insert_admin" ON knowledge_domain FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "knowledge_domain_update_admin" ON knowledge_domain FOR UPDATE USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "knowledge_domain_delete_admin" ON knowledge_domain FOR DELETE USING (is_current_user_admin());

-- role_type
CREATE POLICY "role_type_read_public" ON role_type FOR SELECT USING (true);
CREATE POLICY "role_type_insert_admin" ON role_type FOR INSERT WITH CHECK (is_current_user_admin());
CREATE POLICY "role_type_update_admin" ON role_type FOR UPDATE USING (is_current_user_admin()) WITH CHECK (is_current_user_admin());
CREATE POLICY "role_type_delete_admin" ON role_type FOR DELETE USING (is_current_user_admin());

-- employers (Public access)
CREATE POLICY "employer_read_public" ON employers FOR SELECT USING (true);
CREATE POLICY "employer_insert_public" ON employers FOR INSERT WITH CHECK (true);
CREATE POLICY "employer_update_public" ON employers FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "employer_delete_public" ON employers FOR DELETE USING (true);

-- USER TABLES
-- users_public (Public read, row owners + admins write)
CREATE POLICY "users_public_read_policy" ON users_public FOR SELECT USING (true);
CREATE POLICY "users_public_insert_policy" ON users_public FOR INSERT WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "users_public_update_policy" ON users_public FOR UPDATE USING (auth.uid() = user_id OR is_current_user_admin()) WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "users_public_delete_policy" ON users_public FOR DELETE USING (auth.uid() = user_id OR is_current_user_admin());

-- users_internal (Active users read, row owners + admins write)
CREATE POLICY "users_internal_read_policy" ON users_internal FOR SELECT USING (is_current_user_active());
CREATE POLICY "users_internal_insert_policy" ON users_internal FOR INSERT WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "users_internal_update_policy" ON users_internal FOR UPDATE USING (auth.uid() = user_id OR is_current_user_admin()) WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "users_internal_delete_policy" ON users_internal FOR DELETE USING (auth.uid() = user_id OR is_current_user_admin());

-- users_private (Row owners + admins only)
CREATE POLICY "users_private_read_policy" ON users_private FOR SELECT USING (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "users_private_insert_policy" ON users_private FOR INSERT WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "users_private_update_policy" ON users_private FOR UPDATE USING (auth.uid() = user_id OR is_current_user_admin()) WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "users_private_delete_policy" ON users_private FOR DELETE USING (auth.uid() = user_id OR is_current_user_admin());

-- ROLE/CLASSIFICATION TABLES (Public read, row owners write)
-- candidates
CREATE POLICY "candidates_read_policy" ON candidates FOR SELECT USING (true);
CREATE POLICY "candidates_insert_policy" ON candidates FOR INSERT WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "candidates_update_policy" ON candidates FOR UPDATE USING (auth.uid() = user_id OR is_current_user_admin()) WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "candidates_delete_policy" ON candidates FOR DELETE USING (auth.uid() = user_id OR is_current_user_admin());

-- nominations
CREATE POLICY "nominations_read_public" ON nominations FOR SELECT USING (true);
CREATE POLICY "nominations_insert_own" ON nominations FOR INSERT WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "nominations_update_own" ON nominations FOR UPDATE USING (auth.uid() = user_id OR is_current_user_admin()) WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "nominations_delete_own" ON nominations FOR DELETE USING (auth.uid() = user_id OR is_current_user_admin());

-- mentors (Public access)
CREATE POLICY "mentors_read_public" ON mentors FOR SELECT USING (true);
CREATE POLICY "mentors_insert_public" ON mentors FOR INSERT WITH CHECK (true);
CREATE POLICY "mentors_update_public" ON mentors FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "mentors_delete_public" ON mentors FOR DELETE USING (true);

-- GYLD TABLE (Public read, row owners write)
CREATE POLICY "gyld_read_public" ON gyld FOR SELECT USING (true);
CREATE POLICY "gyld_insert_owner" ON gyld FOR INSERT WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "gyld_update_owner" ON gyld FOR UPDATE USING (auth.uid() = user_id OR is_current_user_admin()) WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "gyld_delete_owner" ON gyld FOR DELETE USING (auth.uid() = user_id OR is_current_user_admin());

-- GATHERING TABLES
-- gatherings (Public read, authenticated users write)
CREATE POLICY "gatherings_public_read" ON gatherings FOR SELECT USING (true);
CREATE POLICY "gatherings_authenticated_users_insert" ON gatherings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "gatherings_authenticated_users_update" ON gatherings FOR UPDATE USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "gatherings_authenticated_users_delete" ON gatherings FOR DELETE USING (auth.uid() IS NOT NULL);

-- participation_gatherings (Public read, row owners write)
CREATE POLICY "participation_gatherings_read_public" ON participation_gatherings FOR SELECT USING (true);
CREATE POLICY "participation_gatherings_insert_own" ON participation_gatherings FOR INSERT WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "participation_gatherings_update_own" ON participation_gatherings FOR UPDATE USING (auth.uid() = user_id OR is_current_user_admin()) WITH CHECK (auth.uid() = user_id OR is_current_user_admin());
CREATE POLICY "participation_gatherings_delete_own" ON participation_gatherings FOR DELETE USING (auth.uid() = user_id OR is_current_user_admin());

-- EXPERIENCE TABLES (Public access)
CREATE POLICY "experiences_read_public" ON experiences FOR SELECT USING (true);
CREATE POLICY "experiences_insert_public" ON experiences FOR INSERT WITH CHECK (true);
CREATE POLICY "experiences_update_public" ON experiences FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "experiences_delete_public" ON experiences FOR DELETE USING (true);

-- SATELLITE TABLES
-- candidate_satellites (Public read, candidate owners write)
CREATE POLICY "candidate_satellites_read_public" ON candidate_satellites FOR SELECT USING (true);
CREATE POLICY "candidate_satellites_insert_own" ON candidate_satellites FOR INSERT WITH CHECK (owns_candidate(candidate_id) OR is_current_user_admin());
CREATE POLICY "candidate_satellites_update_own" ON candidate_satellites FOR UPDATE USING (owns_candidate(candidate_id) OR is_current_user_admin()) WITH CHECK (owns_candidate(candidate_id) OR is_current_user_admin());
CREATE POLICY "candidate_satellites_delete_own" ON candidate_satellites FOR DELETE USING (owns_candidate(candidate_id) OR is_current_user_admin());

-- gathering_satellites (Public read, active users write)
CREATE POLICY "gathering_satellites_read_public" ON gathering_satellites FOR SELECT USING (true);
CREATE POLICY "gathering_satellites_insert_active" ON gathering_satellites FOR INSERT WITH CHECK (is_current_user_active());
CREATE POLICY "gathering_satellites_update_active" ON gathering_satellites FOR UPDATE USING (is_current_user_active()) WITH CHECK (is_current_user_active());
CREATE POLICY "gathering_satellites_delete_active" ON gathering_satellites FOR DELETE USING (is_current_user_active());

-- gathering_mentoring_satellites (Public read, active users write)
CREATE POLICY "gathering_mentoring_satellites_read_public" ON gathering_mentoring_satellites FOR SELECT USING (true);
CREATE POLICY "gathering_mentoring_satellites_insert_active" ON gathering_mentoring_satellites FOR INSERT WITH CHECK (is_current_user_active());
CREATE POLICY "gathering_mentoring_satellites_update_active" ON gathering_mentoring_satellites FOR UPDATE USING (is_current_user_active()) WITH CHECK (is_current_user_active());
CREATE POLICY "gathering_mentoring_satellites_delete_active" ON gathering_mentoring_satellites FOR DELETE USING (is_current_user_active());

-- experience_satellites (Public access)
CREATE POLICY "experience_satellites_read_public" ON experience_satellites FOR SELECT USING (true);
CREATE POLICY "experience_satellites_insert_public" ON experience_satellites FOR INSERT WITH CHECK (true);
CREATE POLICY "experience_satellites_update_public" ON experience_satellites FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "experience_satellites_delete_public" ON experience_satellites FOR DELETE USING (true);

-- mentor_satellites (Public access)
CREATE POLICY "mentor_satellites_read_public" ON mentor_satellites FOR SELECT USING (true);
CREATE POLICY "mentor_satellites_insert_public" ON mentor_satellites FOR INSERT WITH CHECK (true);
CREATE POLICY "mentor_satellites_update_public" ON mentor_satellites FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "mentor_satellites_delete_public" ON mentor_satellites FOR DELETE USING (true);

-- NOTIFICATION SYSTEM
-- notification_types (Public read, authenticated write)
CREATE POLICY "notification_types_select_policy" ON notification_types FOR SELECT USING (true);
CREATE POLICY "notification_types_insert_policy" ON notification_types FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notification_types_update_policy" ON notification_types FOR UPDATE USING (auth.uid() IS NOT NULL);

-- messages (Users can see their own messages)
CREATE POLICY "messages_select_policy" ON messages FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY "messages_insert_policy" ON messages FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY "messages_update_policy" ON messages FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

-- scheduled_notifications (Users can see their own)
CREATE POLICY "scheduled_notifications_select_policy" ON scheduled_notifications FOR SELECT USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY "scheduled_notifications_insert_policy" ON scheduled_notifications FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);
CREATE POLICY "scheduled_notifications_update_policy" ON scheduled_notifications FOR UPDATE USING (user_id = auth.uid() OR auth.uid() IS NOT NULL);

-- RESTAURANTS (Example table - row owners only)
CREATE POLICY "Users can view their own restaurants" ON restaurants FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own restaurants" ON restaurants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own restaurants" ON restaurants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own restaurants" ON restaurants FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- CREATE TRIGGERS FOR UPDATED_AT COLUMNS
-- ============================================================================

-- Lookup/reference table triggers
CREATE TRIGGER update_user_status_updated_at BEFORE UPDATE ON user_status FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_metro_updated_at BEFORE UPDATE ON metro FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_neighborhoods_updated_at BEFORE UPDATE ON neighborhoods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gyld_type_updated_at BEFORE UPDATE ON gyld_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_activity_type_updated_at BEFORE UPDATE ON activity_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_knowledge_domain_updated_at BEFORE UPDATE ON knowledge_domain FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_type_updated_at BEFORE UPDATE ON role_type FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON employers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- User table triggers
CREATE TRIGGER update_users_public_updated_at BEFORE UPDATE ON users_public FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_internal_updated_at BEFORE UPDATE ON users_internal FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_private_updated_at BEFORE UPDATE ON users_private FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Role/classification table triggers
CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nominations_updated_at BEFORE UPDATE ON nominations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON mentors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Main content table triggers
CREATE TRIGGER update_gyld_updated_at BEFORE UPDATE ON gyld FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gatherings_updated_at BEFORE UPDATE ON gatherings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_participation_gatherings_updated_at BEFORE UPDATE ON participation_gatherings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experiences_updated_at BEFORE UPDATE ON experiences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Satellite table triggers
CREATE TRIGGER update_candidate_satellites_updated_at BEFORE UPDATE ON candidate_satellites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gathering_satellites_updated_at BEFORE UPDATE ON gathering_satellites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gathering_mentoring_satellites_updated_at BEFORE UPDATE ON gathering_mentoring_satellites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_experience_satellites_updated_at BEFORE UPDATE ON experience_satellites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_mentor_satellites_updated_at BEFORE UPDATE ON mentor_satellites FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notification system triggers
CREATE TRIGGER update_notification_types_updated_at BEFORE UPDATE ON notification_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_notifications_updated_at BEFORE UPDATE ON scheduled_notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Example table triggers
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for lookup tables (public read)
GRANT SELECT ON user_status TO anon, authenticated;
GRANT SELECT ON metro TO anon, authenticated;
GRANT SELECT ON neighborhoods TO anon, authenticated;
GRANT SELECT ON gyld_type TO anon, authenticated;
GRANT SELECT ON activity_type TO anon, authenticated;
GRANT SELECT ON knowledge_domain TO anon, authenticated;
GRANT SELECT ON role_type TO anon, authenticated;
GRANT ALL ON employers TO anon, authenticated;

-- Grant permissions for user tables
GRANT ALL ON users_public TO authenticated;
GRANT SELECT ON users_public TO anon;
GRANT ALL ON users_internal TO authenticated;
GRANT ALL ON users_private TO authenticated;

-- Grant permissions for role/classification tables
GRANT ALL ON candidates TO authenticated;
GRANT SELECT ON candidates TO anon;
GRANT ALL ON nominations TO authenticated;
GRANT SELECT ON nominations TO anon;
GRANT ALL ON mentors TO anon, authenticated;

-- Grant permissions for main content tables
GRANT ALL ON gyld TO authenticated;
GRANT SELECT ON gyld TO anon;
GRANT ALL ON gatherings TO authenticated;
GRANT SELECT ON gatherings TO anon;
GRANT ALL ON participation_gatherings TO authenticated;
GRANT SELECT ON participation_gatherings TO anon;
GRANT ALL ON experiences TO anon, authenticated;

-- Grant permissions for satellite tables
GRANT ALL ON candidate_satellites TO authenticated;
GRANT SELECT ON candidate_satellites TO anon;
GRANT ALL ON gathering_satellites TO authenticated;
GRANT SELECT ON gathering_satellites TO anon;
GRANT ALL ON gathering_mentoring_satellites TO authenticated;
GRANT SELECT ON gathering_mentoring_satellites TO anon;
GRANT ALL ON experience_satellites TO anon, authenticated;
GRANT ALL ON mentor_satellites TO anon, authenticated;

-- Grant permissions for notification system
GRANT ALL ON notification_types TO authenticated;
GRANT SELECT ON notification_types TO anon;
GRANT ALL ON messages TO authenticated;
GRANT ALL ON scheduled_notifications TO authenticated;

-- Grant permissions for example table
GRANT ALL ON restaurants TO authenticated;

-- ============================================================================
-- INSERT INITIAL/SEED DATA
-- ============================================================================

-- Insert initial user status values
INSERT INTO user_status (label) VALUES
    ('member'),
    ('associate member'),
    ('past member'),
    ('guest'),
    ('mentor'),
    ('admin')
ON CONFLICT (label) DO NOTHING;

-- Insert initial metro areas
INSERT INTO metro (label) VALUES
    ('Boston'),
    ('Seattle'),
    ('NYC'),
    ('Austin'),
    ('DC'),
    ('Chicago')
ON CONFLICT (label) DO NOTHING;

-- Insert initial gyld types
INSERT INTO gyld_type (label) VALUES
    ('Product Management'),
    ('Growth')
ON CONFLICT (label) DO NOTHING;

-- Insert initial activity types
INSERT INTO activity_type (label) VALUES
    ('Pro Bono Project'),
    ('Happy Hour'),
    ('Team'),
    ('Podcast Club'),
    ('Salon'),
    ('Course'),
    ('Coaching')
ON CONFLICT (label) DO NOTHING;

-- Insert initial knowledge domains
INSERT INTO knowledge_domain (label) VALUES
    ('AI'),
    ('edtech'),
    ('healthtech'),
    ('crypto'),
    ('growth'),
    ('craft')
ON CONFLICT (label) DO NOTHING;

-- Insert initial role types
INSERT INTO role_type (label) VALUES
    ('inductor'),
    ('salon host'),
    ('social host'),
    ('interviewer'),
    ('recruiter')
ON CONFLICT (label) DO NOTHING;

-- Insert initial notification types
INSERT INTO notification_types (type_name, display_name, description) VALUES
    ('salon_invitation', 'Salon Invitation', 'Invitation to join a salon or gathering'),
    ('event_reminder', 'Event Reminder', 'Reminder about upcoming events'),
    ('new_message', 'New Message', 'New message or conversation update'),
    ('welcome', 'Welcome', 'Welcome message for new users'),
    ('verification', 'Verification', 'Account verification notifications'),
    ('system_update', 'System Update', 'App updates and announcements'),
    ('activity_digest', 'Activity Digest', 'Summary of recent activity')
ON CONFLICT (type_name) DO NOTHING;

-- ============================================================================
-- ADD HELPFUL COMMENTS
-- ============================================================================

-- Table comments
COMMENT ON TABLE user_status IS 'User status lookup table with public read access, admin-only write access';
COMMENT ON TABLE metro IS 'Metropolitan areas lookup table';
COMMENT ON TABLE neighborhoods IS 'Neighborhoods linked to metro areas';
COMMENT ON TABLE gyld_type IS 'Types of guilds/gylds available';
COMMENT ON TABLE activity_type IS 'Types of activities that can be organized';
COMMENT ON TABLE knowledge_domain IS 'Knowledge domains for user expertise';
COMMENT ON TABLE role_type IS 'Types of roles users can have in the organization';
COMMENT ON TABLE employers IS 'Employer information with LinkedIn URLs';
COMMENT ON TABLE users_public IS 'Public user profile information that can be read by anyone on the internet';
COMMENT ON TABLE users_internal IS 'Internal user data accessible only to active users, editable by row owners';
COMMENT ON TABLE users_private IS 'Private user data accessible only to row owners and admins';
COMMENT ON TABLE candidates IS 'Candidates table with public read access, row owner write access';
COMMENT ON TABLE nominations IS 'User nominations with public read access, row owner write access';
COMMENT ON TABLE mentors IS 'Mentors with full public access';
COMMENT ON TABLE gyld IS 'Main guild/organization table with public read access, row owner write access';
COMMENT ON TABLE gatherings IS 'Public gatherings/events that anyone can view but only authenticated users can manage';
COMMENT ON TABLE participation_gatherings IS 'User participation in gatherings';
COMMENT ON TABLE experiences IS 'User experiences with full public access';
COMMENT ON TABLE notification_types IS 'Types of notifications available in the system';
COMMENT ON TABLE messages IS 'All communication messages (push, email, SMS)';
COMMENT ON TABLE scheduled_notifications IS 'Long-term scheduled notifications';
COMMENT ON TABLE restaurants IS 'Example table from initial development (can be removed in production)';

-- Column comments for key fields
COMMENT ON COLUMN gyld.gyld_type IS 'Reference to gyld_type table - defines the type/category of this gyld';
COMMENT ON COLUMN gyld.organizer IS 'Array of user IDs who are organizers for this gyld - references auth.users(id)';
COMMENT ON COLUMN users_internal.notification_preferences IS 'User notification preferences including push tokens, stored as JSONB for flexible structure';
COMMENT ON COLUMN users_private.notification_preferences IS 'User notification preferences stored as JSONB (channel overrides and message type preferences)';
COMMENT ON COLUMN messages.template_id IS 'SendGrid dynamic template ID used for this email';
COMMENT ON COLUMN messages.template_data IS 'JSON data passed to SendGrid template (body1, buttonurl, etc.)';

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- This completes the foundation database schema migration
-- All tables, indexes, RLS policies, functions, triggers, and initial data have been created
-- The database is now ready for Gyld application development 