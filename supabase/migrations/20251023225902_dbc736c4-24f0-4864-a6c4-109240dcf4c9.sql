-- Add scanline preferences to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS scanline_preferences JSONB DEFAULT '{"enabled": true, "intensity": "medium", "density": 2, "customIntensity": 0.08}'::jsonb;