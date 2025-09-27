-- Create user_streaks table to track writing streaks
CREATE TABLE public.user_streaks (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_entry_date DATE,
  total_entries INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_streaks
CREATE POLICY "Users can view their own streaks" 
ON public.user_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streaks" 
ON public.user_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streaks" 
ON public.user_streaks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'streak', 'total_entries', 'consecutive_days'
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for badges (public read access)
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone" 
ON public.badges 
FOR SELECT 
USING (true);

-- Create user_badges table to track earned badges
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_badges
CREATE POLICY "Users can view their own badges" 
ON public.user_badges 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges" 
ON public.user_badges 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add trigger for user_streaks updated_at
CREATE TRIGGER update_user_streaks_updated_at
BEFORE UPDATE ON public.user_streaks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial badges
INSERT INTO public.badges (key, name, description, icon, requirement_type, requirement_value) VALUES
('first_entry', 'First Entry', 'Write your first journal entry', '📝', 'total_entries', 1),
('week_warrior', 'Week Warrior', 'Maintain a 7-day writing streak', '🔥', 'streak', 7),
('dedication', 'Dedication', 'Maintain a 30-day writing streak', '💪', 'streak', 30),
('century_club', 'Century Club', 'Write 100 journal entries', '💯', 'total_entries', 100),
('consistency_king', 'Consistency King', 'Maintain a 100-day writing streak', '👑', 'streak', 100),
('prolific_writer', 'Prolific Writer', 'Write 500 journal entries', '📚', 'total_entries', 500);

-- Function to update user streaks when a new entry is created
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update streaks when entries are created
CREATE TRIGGER on_entry_created
  AFTER INSERT ON public.entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streaks();

-- Function to check and award badges
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to check badges when streaks are updated
CREATE TRIGGER on_streak_updated
  AFTER INSERT OR UPDATE ON public.user_streaks
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_award_badges();