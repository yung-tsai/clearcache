import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import logomark from '@/assets/cc-logomark.png';
import streaksIcon from '@/assets/streaks.png';

interface StreakData {
  current_streak: number;
  longest_streak: number;
  total_entries: number;
  last_entry_date: string | null;
}

interface StreakDisplayProps {
  variant?: 'compact' | 'full';
}

export default function StreakDisplay({ variant = 'full' }: StreakDisplayProps) {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [weeklyEntries, setWeeklyEntries] = useState(0);
  const [monthlyEntries, setMonthlyEntries] = useState(0);
  const [loading, setLoading] = useState(true);
  const [animatedBars, setAnimatedBars] = useState<Set<number>>(new Set());
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStreakData();
      loadPeriodCounts();
    } else {
      // Show sample data when no user is logged in (for development)
      setStreakData({
        current_streak: 5,
        longest_streak: 12,
        total_entries: 27,
        last_entry_date: new Date().toISOString().split('T')[0]
      });
      setWeeklyEntries(3);
      setMonthlyEntries(15);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Trigger sequential animations after component mounts and data is loaded
    if (!loading) {
      const streakCount = 4;
      
      // Start animations sequentially from top to bottom
      for (let i = 0; i < streakCount; i++) {
        setTimeout(() => {
          setAnimatedBars(prev => new Set([...prev, i]));
        }, i * 700);
      }
    }
  }, [loading]);

  const loadStreakData = async () => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading streak data:', error);
        return;
      }

      setStreakData(data || {
        current_streak: 0,
        longest_streak: 0,
        total_entries: 0,
        last_entry_date: null
      });
    } catch (error) {
      console.error('Error loading streak data:', error);
    }
  };

  const loadPeriodCounts = async () => {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Weekly entries
      const { count: weekCount } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', startOfWeek.toISOString());

      // Monthly entries
      const { count: monthCount } = await supabase
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user?.id)
        .gte('created_at', startOfMonth.toISOString());

      setWeeklyEntries(weekCount || 0);
      setMonthlyEntries(monthCount || 0);
    } catch (error) {
      console.error('Error loading period counts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4">
        <div className="text-sm font-mono text-gray-500">Loading streaks...</div>
      </div>
    );
  }

  const streaks = [
    {
      title: 'Daily',
      value: streakData?.current_streak || 0,
      max: Math.max(streakData?.longest_streak || 7, 7),
      unit: 'Days',
      isRecord: false
    },
    {
      title: 'Weekly',
      value: weeklyEntries,
      max: 7,
      unit: 'Days',
      isRecord: false
    },
    {
      title: 'Monthly',
      value: monthlyEntries,
      max: 30,
      unit: 'Days',
      isRecord: false
    },
    {
      title: 'All Time',
      value: streakData?.longest_streak || 0,
      max: streakData?.longest_streak || 1,
      unit: 'Days',
      isRecord: true
    }
  ];

  return (
    <div className="bg-white p-8 w-full h-full overflow-auto">
      {/* Top section with logo and How it works - aligned with table columns */}
      <div className="grid grid-cols-[2fr_2fr_3fr] gap-4 mb-8 items-start">
        {/* Logomark in first column */}
        <img 
          src={logomark} 
          alt="Clear Cache" 
          className="w-32 h-32"
        />
        
        {/* How it works section starting in Days column */}
        <div className="col-span-2">
          <h2 className="font-chicago text-2xl mb-4">How it works</h2>
          <div className="space-y-2 font-sans text-base">
            <p>
              <span className="font-semibold">Daily:</span> Days you've written journal entries in a row.
            </p>
            <p>
              <span className="font-semibold">Weekly:</span> Entries written this week (out of 7).
            </p>
            <p>
              <span className="font-semibold">Monthly:</span> Entries written this month (out of 30).
            </p>
            <p>
              <span className="font-semibold">All Time:</span> Your longest daily streak.
            </p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border-t border-b border-black">
        {/* Table headers */}
        <div className="grid grid-cols-[2fr_2fr_3fr] gap-4 py-3 border-b border-black">
          <div className="font-chicago text-xl">Streaks</div>
          <div className="font-chicago text-xl">Days</div>
          <div className="font-chicago text-xl">Progress</div>
        </div>

        {/* Table rows */}
        {streaks.map((streak, index) => {
          const percentage = streak.isRecord ? 100 : (streak.value / streak.max) * 100;
          const animatedPercentage = animatedBars.has(index) ? percentage : 0;
          
          return (
            <div 
              key={streak.title}
              className={`grid grid-cols-[2fr_2fr_3fr] gap-4 py-4 items-center ${
                index < streaks.length - 1 ? 'border-b border-gray-300' : ''
              }`}
            >
              {/* Streaks column */}
              <div className="flex items-center gap-2">
                <img 
                  src={streaksIcon} 
                  alt="" 
                  className="w-5 h-5"
                />
                <span className="font-condensed font-semibold text-xl">
                  {streak.title}
                </span>
              </div>

              {/* Days column */}
              <div className="font-sans text-lg">
                {streak.value}/{streak.max} {streak.unit}
              </div>

              {/* Progress column */}
              <div className="w-full">
                <Progress 
                  value={animatedPercentage}
                  className="h-4 mac-progress w-full"
                  style={{
                    transition: 'all 5s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}