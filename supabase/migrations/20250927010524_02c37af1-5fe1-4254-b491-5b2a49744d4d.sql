-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.update_user_streaks()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert user streak data
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_entry_date, total_entries)
  VALUES (
    NEW.user_id,
    1,
    1,
    CURRENT_DATE,
    1
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_entries = user_streaks.total_entries + 1,
    current_streak = CASE
      -- If last entry was yesterday, increment streak
      WHEN user_streaks.last_entry_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
      -- If last entry was today, keep current streak
      WHEN user_streaks.last_entry_date = CURRENT_DATE THEN user_streaks.current_streak
      -- Otherwise, reset streak to 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE
        WHEN user_streaks.last_entry_date = CURRENT_DATE - INTERVAL '1 day' THEN user_streaks.current_streak + 1
        WHEN user_streaks.last_entry_date = CURRENT_DATE THEN user_streaks.current_streak
        ELSE 1
      END
    ),
    last_entry_date = CURRENT_DATE,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  badge_record RECORD;
BEGIN
  -- Check all badges for this user
  FOR badge_record IN 
    SELECT b.* FROM public.badges b 
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_badges ub 
      WHERE ub.user_id = NEW.user_id AND ub.badge_id = b.id
    )
  LOOP
    -- Check if user meets badge requirements
    IF (badge_record.requirement_type = 'streak' AND NEW.current_streak >= badge_record.requirement_value) OR
       (badge_record.requirement_type = 'total_entries' AND NEW.total_entries >= badge_record.requirement_value) THEN
      -- Award the badge
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (NEW.user_id, badge_record.id)
      ON CONFLICT (user_id, badge_id) DO NOTHING;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;