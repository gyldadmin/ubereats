-- Add guest and reminder fields to gathering_other table
-- This migration adds plus_guests (for +1, +2 allowances) and hold_autoreminders (to disable auto-reminders)

-- Add the new columns with defaults
ALTER TABLE gathering_other 
ADD COLUMN plus_guests INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN hold_autoreminders BOOLEAN DEFAULT false NOT NULL;

-- Add check constraint to ensure plus_guests is non-negative
ALTER TABLE gathering_other 
ADD CONSTRAINT chk_gathering_other_plus_guests_non_negative 
CHECK (plus_guests >= 0);

-- Create indexes for filtering queries
CREATE INDEX idx_gathering_other_plus_guests ON gathering_other(plus_guests);
CREATE INDEX idx_gathering_other_hold_autoreminders ON gathering_other(hold_autoreminders);

-- Update existing records to have the default values (safe since we set NOT NULL with defaults)
-- This ensures all existing data has the proper default values
UPDATE gathering_other 
SET plus_guests = 0 
WHERE plus_guests IS NULL;

UPDATE gathering_other 
SET hold_autoreminders = false 
WHERE hold_autoreminders IS NULL;

-- Add helpful comments
COMMENT ON COLUMN gathering_other.plus_guests IS 'Number of additional guests allowed (+1, +2, etc.). 0 means no additional guests allowed.';
COMMENT ON COLUMN gathering_other.hold_autoreminders IS 'Whether to disable automatic reminders for this gathering. false = send reminders, true = hold reminders.';

-- Verification: Check that columns were added successfully with proper defaults
-- To verify, you can run: SELECT column_name, data_type, column_default, is_nullable FROM information_schema.columns WHERE table_name = 'gathering_other' AND column_name IN ('plus_guests', 'hold_autoreminders'); 