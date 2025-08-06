-- Migration: Disable RLS on mentor_satellites table for database triggers
-- Date: 2025-01-26 24:00:00
-- Description: Disable RLS on mentor_satellites to allow triggers to work

ALTER TABLE mentor_satellites DISABLE ROW LEVEL SECURITY;