-- Add sound_preferences column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN sound_preferences jsonb DEFAULT jsonb_build_object(
  'masterVolume', 0.5,
  'sounds', jsonb_build_object(
    'window', jsonb_build_object('enabled', true),
    'keyboard', jsonb_build_object('enabled', true),
    'login', jsonb_build_object('enabled', true),
    'buttonClick', jsonb_build_object('enabled', true)
  )
);