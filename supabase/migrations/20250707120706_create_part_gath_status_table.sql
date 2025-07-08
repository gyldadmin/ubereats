-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create part_gath_status table with lookup values for participation gathering status
-- Public read access, admin-only write access
CREATE TABLE public.part_gath_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    label TEXT NOT NULL UNIQUE
);

-- Add comment to table
COMMENT ON TABLE public.part_gath_status IS 'Lookup table for participation gathering status labels with public read access and admin-only write access';
COMMENT ON COLUMN public.part_gath_status.label IS 'Status label for participation in gatherings (e.g., yes, no, waitlist)';

-- Create index on label for efficient queries
CREATE INDEX idx_part_gath_status_label ON public.part_gath_status(label);

-- Enable Row Level Security
ALTER TABLE public.part_gath_status ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_part_gath_status_updated_at
    BEFORE UPDATE ON public.part_gath_status
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Note: Using existing is_admin() function from foundation migration

-- RLS Policies

-- READ POLICY: Public access - anyone can read participation gathering status data
CREATE POLICY "part_gath_status_select_public" ON public.part_gath_status
    FOR SELECT
    USING (true);

-- WRITE POLICIES: Admin-only access for insert, update, delete

-- INSERT POLICY: Only admins can insert new participation gathering status records
CREATE POLICY "part_gath_status_insert_admin" ON public.part_gath_status
    FOR INSERT
    WITH CHECK (public.is_admin());

-- UPDATE POLICY: Only admins can update participation gathering status records
CREATE POLICY "part_gath_status_update_admin" ON public.part_gath_status
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- DELETE POLICY: Only admins can delete participation gathering status records
CREATE POLICY "part_gath_status_delete_admin" ON public.part_gath_status
    FOR DELETE
    USING (public.is_admin());

-- Insert seed data for participation gathering status labels
INSERT INTO public.part_gath_status (label) VALUES
    ('yes'),
    ('no'),
    ('waitlist'); 