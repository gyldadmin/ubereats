-- Migration: Disable RLS for database triggers
-- Date: 2025-01-26 22:00:00
-- Description: Disable RLS on satellite tables to allow triggers to work

ALTER TABLE gathering_other DISABLE ROW LEVEL SECURITY;
ALTER TABLE gathering_displays DISABLE ROW LEVEL SECURITY;