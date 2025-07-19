-- Migration: Add cleanup function and trigger for unsaved gatherings
-- This will automatically delete gatherings with "unsaved" status after 24 hours

-- Create cleanup function for unsaved gatherings
CREATE OR REPLACE FUNCTION cleanup_unsaved_gatherings()
RETURNS void AS $$
DECLARE
  gathering_ids UUID[];
BEGIN
  -- First, get the IDs of gatherings to be deleted
  SELECT ARRAY(
    SELECT id 
    FROM gatherings 
    WHERE gathering_status = (SELECT id FROM gathering_status WHERE label = 'unsaved')
    AND created_at < NOW() - INTERVAL '24 hours'
  ) INTO gathering_ids;
  
  -- Delete satellite records first to maintain referential integrity
  DELETE FROM gathering_displays 
  WHERE gathering_id = ANY(gathering_ids);
  
  DELETE FROM gathering_other 
  WHERE gathering = ANY(gathering_ids);
  
  -- Finally, delete the main gathering records
  DELETE FROM gatherings 
  WHERE gathering_status = (SELECT id FROM gathering_status WHERE label = 'unsaved')
  AND created_at < NOW() - INTERVAL '24 hours';
  
  -- Log the cleanup action
  RAISE LOG 'Cleaned up % unsaved gatherings and their satellites older than 24 hours', array_length(gathering_ids, 1);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for the cleanup function
GRANT EXECUTE ON FUNCTION cleanup_unsaved_gatherings() TO service_role;

-- Comment the function
COMMENT ON FUNCTION cleanup_unsaved_gatherings() IS 'Automatically deletes gatherings with unsaved status that are older than 24 hours to prevent database clutter from abandoned drafts';

-- Note: In production, you would set up a cron job to run this function hourly:
-- SELECT cron.schedule('cleanup-unsaved-gatherings', '0 * * * *', 'SELECT cleanup_unsaved_gatherings();');
-- For now, this function can be called manually or through application logic 