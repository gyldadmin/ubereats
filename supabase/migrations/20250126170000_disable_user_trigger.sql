-- Migration: Temporarily disable user satellite trigger for testing
-- Date: 2025-01-26 17:00:00
-- Description: Disable user satellite trigger to test if it's blocking account creation

-- Drop only the user satellite trigger (keep others active)
DROP TRIGGER IF EXISTS trigger_create_user_satellites ON auth.users;
