-- Migration: Create triggers for automatic satellite table creation
-- Date: 2025-01-26 15:00:00
-- Description: Automatically creates satellite table records when main table records are created

-- Function to create gathering satellite records
CREATE OR REPLACE FUNCTION create_gathering_satellites()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO gathering_displays (gathering_id, created_at, updated_at)
    VALUES (NEW.id, NOW(), NOW());
    
    INSERT INTO gathering_other (
        gathering, 
        plus_guests, 
        hold_autoreminders,
        created_at, 
        updated_at
    ) VALUES (
        NEW.id, 
        0, 
        false, 
        NOW(), 
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for gatherings
DROP TRIGGER IF EXISTS trigger_create_gathering_satellites ON gatherings;
CREATE TRIGGER trigger_create_gathering_satellites
    AFTER INSERT ON gatherings
    FOR EACH ROW
    EXECUTE FUNCTION create_gathering_satellites();

-- Function to create mentor satellite records
CREATE OR REPLACE FUNCTION create_mentor_satellites()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO mentor_satellites (
        mentor_id, 
        full_name,
        created_at, 
        updated_at
    ) VALUES (
        NEW.id, 
        'New Mentor', 
        NOW(), 
        NOW()
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for mentors
DROP TRIGGER IF EXISTS trigger_create_mentor_satellites ON mentors;
CREATE TRIGGER trigger_create_mentor_satellites
    AFTER INSERT ON mentors
    FOR EACH ROW
    EXECUTE FUNCTION create_mentor_satellites();
