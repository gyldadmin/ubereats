-- Add color column to learning_topic table
-- This migration adds a color field for medieval-themed hex colors to be displayed on shields

-- Add color column as TEXT UNIQUE
ALTER TABLE public.learning_topic 
ADD COLUMN IF NOT EXISTS color TEXT UNIQUE;

-- Add comment explaining the color field
COMMENT ON COLUMN public.learning_topic.color IS 'Hex color code for medieval-themed shield display (e.g., #8B4513 for saddle brown)';

-- Create index for color field since it will be queried frequently for display
CREATE INDEX IF NOT EXISTS idx_learning_topic_color ON public.learning_topic(color);

-- Update existing learning topics with medieval-themed colors
-- Colors chosen to be visible on white/beige backgrounds and evoke medieval heraldry

-- Product Practice topics (rich jewel tones)
UPDATE public.learning_topic 
SET color = '#8B0000' -- Dark red
WHERE label = 'Influencing stakeholders';

UPDATE public.learning_topic 
SET color = '#191970' -- Midnight blue
WHERE label = 'Discovery interviews';

UPDATE public.learning_topic 
SET color = '#8B4513' -- Saddle brown
WHERE label = 'Process design';

UPDATE public.learning_topic 
SET color = '#2F4F4F' -- Dark slate gray
WHERE label = 'Organizing your team';

UPDATE public.learning_topic 
SET color = '#800080' -- Purple
WHERE label = 'Product storytelling';

UPDATE public.learning_topic 
SET color = '#B8860B' -- Dark goldenrod
WHERE label = 'Product positioning';

-- Growth topics (earthy tones)
UPDATE public.learning_topic 
SET color = '#556B2F' -- Dark olive green
WHERE label = 'Pricing and packaging';

UPDATE public.learning_topic 
SET color = '#A0522D' -- Sienna
WHERE label = 'Engagement';

UPDATE public.learning_topic 
SET color = '#8B008B' -- Dark magenta
WHERE label = 'Growth systems';

UPDATE public.learning_topic 
SET color = '#CD853F' -- Peru
WHERE label = 'Activation';

-- Product Craft topics (deep blues and greens)
UPDATE public.learning_topic 
SET color = '#4682B4' -- Steel blue
WHERE label = 'Feature crafting';

UPDATE public.learning_topic 
SET color = '#228B22' -- Forest green
WHERE label = 'Behavioral design';

UPDATE public.learning_topic 
SET color = '#6B8E23' -- Olive drab
WHERE label = '0 to 1';

UPDATE public.learning_topic 
SET color = '#9932CC' -- Dark orchid
WHERE label = 'Product Polish';

-- Product Strategy topics (royal colors)
UPDATE public.learning_topic 
SET color = '#483D8B' -- Dark slate blue
WHERE label = 'Product-market fit expansion';

UPDATE public.learning_topic 
SET color = '#D2691E' -- Chocolate
WHERE label = 'Trust and safety';

UPDATE public.learning_topic 
SET color = '#DC143C' -- Crimson
WHERE label = 'AI Native Products';

UPDATE public.learning_topic 
SET color = '#B22222' -- Fire brick
WHERE label = 'Feature strategy';

UPDATE public.learning_topic 
SET color = '#4B0082' -- Indigo
WHERE label = 'Platform / infrastructure';

UPDATE public.learning_topic 
SET color = '#800000' -- Maroon
WHERE label = 'Competitive Strategy'; 