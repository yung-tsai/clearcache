-- Create a test user in auth.users for development/testing
-- This is safe because it's only for testing and uses a clearly fake email
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '12345678-1234-1234-1234-123456789012',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'test@example.com',
  '$2a$10$DUMMY_HASH_FOR_TESTING_ONLY', -- Dummy password hash
  now(),
  null,
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING; -- Don't insert if already exists

-- Also create the corresponding profile
INSERT INTO public.profiles (user_id, role) 
VALUES ('12345678-1234-1234-1234-123456789012', 'user')
ON CONFLICT (user_id) DO NOTHING;