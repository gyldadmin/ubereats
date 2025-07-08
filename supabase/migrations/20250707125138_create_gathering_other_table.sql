-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create gathering_other table as a 1:1 satellite table for gatherings
-- Public read access, active user write access
CREATE TABLE public.gathering_other (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    gathering UUID UNIQUE NOT NULL REFERENCES public.gatherings(id),
    cap INTEGER,
    payment_amount NUMERIC(7,2),
    payment_for TEXT,
    payment_to_member BOOLEAN,
    payment_venmo TEXT,
    scribe UUID REFERENCES auth.users(id),
    potluck BOOLEAN,
    recruitment BOOLEAN,
    signup_question TEXT,
    remote BOOLEAN,
    location_tbd BOOLEAN,
    description_tbd BOOLEAN,
    host_message TEXT,
    host_subject TEXT
);

-- Add comments to table and columns
COMMENT ON TABLE public.gathering_other IS 'Satellite table for gatherings with 1:1 relationship containing additional gathering metadata and configuration';
COMMENT ON COLUMN public.gathering_other.gathering IS 'Unique reference to gatherings table - 1:1 relationship';
COMMENT ON COLUMN public.gathering_other.cap IS 'Maximum number of participants allowed for this gathering';
COMMENT ON COLUMN public.gathering_other.payment_amount IS 'Price of gathering in USD (supports up to $99,999.99)';
COMMENT ON COLUMN public.gathering_other.payment_for IS 'Description of what the payment is for';
COMMENT ON COLUMN public.gathering_other.payment_to_member IS 'Whether payment goes to a member vs the organization';
COMMENT ON COLUMN public.gathering_other.payment_venmo IS 'Venmo handle or details for payment';
COMMENT ON COLUMN public.gathering_other.scribe IS 'User responsible for documenting this gathering';
COMMENT ON COLUMN public.gathering_other.potluck IS 'Whether this gathering is a potluck meal';
COMMENT ON COLUMN public.gathering_other.recruitment IS 'Whether this gathering is open to recruits/candidates';
COMMENT ON COLUMN public.gathering_other.signup_question IS 'Custom question to ask during sign-up';
COMMENT ON COLUMN public.gathering_other.remote IS 'Whether this gathering is conducted remotely';
COMMENT ON COLUMN public.gathering_other.location_tbd IS 'Whether the gathering location is to be determined';
COMMENT ON COLUMN public.gathering_other.description_tbd IS 'Whether the gathering description is to be determined';
COMMENT ON COLUMN public.gathering_other.host_message IS 'Custom message from the host';
COMMENT ON COLUMN public.gathering_other.host_subject IS 'Custom subject line from the host';

-- Create indexes for foreign key fields and frequently queried columns
CREATE INDEX idx_gathering_other_gathering ON public.gathering_other(gathering);
CREATE INDEX idx_gathering_other_scribe ON public.gathering_other(scribe);

-- Enable Row Level Security
ALTER TABLE public.gathering_other ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at field
CREATE TRIGGER update_gathering_other_updated_at
    BEFORE UPDATE ON public.gathering_other
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Note: Using existing is_active_user() function which checks if user is active or admin

-- RLS Policies

-- READ POLICY: Public access - anyone can read gathering_other data
CREATE POLICY "gathering_other_select_public" ON public.gathering_other
    FOR SELECT
    USING (true);

-- WRITE POLICIES: Active user access for insert, update, delete

-- INSERT POLICY: Only active users can insert new gathering_other records
CREATE POLICY "gathering_other_insert_active_users" ON public.gathering_other
    FOR INSERT
    WITH CHECK (public.is_active_user());

-- UPDATE POLICY: Only active users can update gathering_other records
CREATE POLICY "gathering_other_update_active_users" ON public.gathering_other
    FOR UPDATE
    USING (public.is_active_user())
    WITH CHECK (public.is_active_user());

-- DELETE POLICY: Only active users can delete gathering_other records
CREATE POLICY "gathering_other_delete_active_users" ON public.gathering_other
    FOR DELETE
    USING (public.is_active_user()); 