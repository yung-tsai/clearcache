-- Drop existing profile_self_read policy
DROP POLICY IF EXISTS "profile_self_read" ON profiles;

-- Remove role column from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- Update handle_new_user function to not set role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate simplified profile_self_read policy
CREATE POLICY "profile_self_read" ON profiles
  FOR SELECT USING (auth.uid() = user_id);