-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create person table with public read and write access
CREATE TABLE public.person (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add comment to table
COMMENT ON TABLE public.person IS 'Person table with full public read and write access';

-- Enable Row Level Security
ALTER TABLE public.person ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_person_updated_at
    BEFORE UPDATE ON public.person
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- READ POLICY: Public access - anyone can read person data
CREATE POLICY "person_select_public" ON public.person
    FOR SELECT
    USING (true);

-- WRITE POLICIES: Public access - anyone can insert, update, delete

-- INSERT POLICY: Anyone can insert new person records
CREATE POLICY "person_insert_public" ON public.person
    FOR INSERT
    WITH CHECK (true);

-- UPDATE POLICY: Anyone can update person records
CREATE POLICY "person_update_public" ON public.person
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- DELETE POLICY: Anyone can delete person records
CREATE POLICY "person_delete_public" ON public.person
    FOR DELETE
    USING (true); 