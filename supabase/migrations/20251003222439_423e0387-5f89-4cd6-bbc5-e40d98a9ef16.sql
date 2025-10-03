-- Add background preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN background_preference JSONB 
DEFAULT '{"type": "pattern", "value": "swatch"}'::jsonb;

-- Add a comment to document the structure
COMMENT ON COLUMN public.profiles.background_preference IS 'Stores user background preference as JSON: {"type": "pattern" | "color", "value": "pattern-name" | "#hexcolor"}';