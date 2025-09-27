-- Ensure RLS is enabled on key tables
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Dev policies to allow anon access for a specific test user UUID
DO $$ BEGIN
  -- Entries policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'entries' AND policyname = 'Dev anon can manage test user entries'
  ) THEN
    CREATE POLICY "Dev anon can manage test user entries"
    ON public.entries
    FOR ALL
    TO anon
    USING (user_id = '12345678-1234-1234-1234-123456789012'::uuid)
    WITH CHECK (user_id = '12345678-1234-1234-1234-123456789012'::uuid);
  END IF;

  -- user_streaks select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_streaks' AND policyname = 'Dev anon can view test user streaks'
  ) THEN
    CREATE POLICY "Dev anon can view test user streaks"
    ON public.user_streaks
    FOR SELECT
    TO anon
    USING (user_id = '12345678-1234-1234-1234-123456789012'::uuid);
  END IF;

  -- user_badges select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_badges' AND policyname = 'Dev anon can view test user badges'
  ) THEN
    CREATE POLICY "Dev anon can view test user badges"
    ON public.user_badges
    FOR SELECT
    TO anon
    USING (user_id = '12345678-1234-1234-1234-123456789012'::uuid);
  END IF;
END $$;