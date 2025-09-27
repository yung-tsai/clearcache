import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Calendar, Target, Zap, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

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
  const [animateProgress, setAnimateProgress] = useState(false);
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
    // Trigger animation after component mounts and data is loaded
    if (!loading) {
      const timer = setTimeout(() => setAnimateProgress(true), 100);
      return () => clearTimeout(timer);
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
      title: 'Current Streak',
      value: streakData?.current_streak || 0,
      max: Math.max(streakData?.longest_streak || 7, 7),
      unit: 'days',
      icon: Zap,
      description: 'Days in a row'
    },
    {
      title: 'Weekly Goal',
      value: weeklyEntries,
      max: 7,
      unit: 'entries',
      icon: Target,
      description: 'This week'
    },
    {
      title: 'Monthly Challenge',
      value: monthlyEntries,
      max: 30,
      unit: 'entries',
      icon: Calendar,
      description: 'This month'
    },
    {
      title: 'All Time Best',
      value: streakData?.longest_streak || 0,
      max: streakData?.longest_streak || 1,
      unit: 'days',
      icon: Trophy,
      description: 'Personal record',
      isRecord: true
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-3">
        {streaks.slice(0, 2).map((streak, index) => {
          const Icon = streak.icon;
          const percentage = streak.isRecord ? 100 : (streak.value / streak.max) * 100;
          const animatedPercentage = animateProgress ? percentage : 0;
          
          return (
            <div 
              key={streak.title} 
              className="animate-fade-in"
              style={{ animationDelay: `${index * 600}ms` }}
            >
              {/* Mac-style two-column layout */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-mono text-gray-900">{streak.title}</span>
                </div>
                <span className="text-sm font-mono text-gray-600">
                  {streak.value}/{streak.max}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Progress 
                    value={animatedPercentage} 
                    className="h-2 mac-progress"
                    style={{
                      transition: 'all 2s cubic-bezier(0.4, 0, 0.2, 1)',
                      transitionDelay: `${index * 400}ms`
                    }}
                  />
                </div>
                <span className="text-xs font-mono text-gray-500 min-w-[40px] text-right">
                  {Math.round(percentage)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
      {/* Mac-style header */}
      <div className="border-b border-gray-200 px-4 py-3">
        <h3 className="text-sm font-mono text-gray-900">Journal Streaks</h3>
      </div>
      
      {/* Content area */}
      <div className="p-4 space-y-4">
        {streaks.map((streak, index) => {
          const Icon = streak.icon;
          const percentage = streak.isRecord ? 100 : (streak.value / streak.max) * 100;
          const animatedPercentage = animateProgress ? percentage : 0;
          
          return (
            <div 
              key={streak.title}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 800}ms` }}
            >
              {/* Two-column Mac layout: Text | Progress Bar */}
              <div className="grid grid-cols-2 gap-4 items-center">
                {/* Left column: Text info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-mono text-gray-900">{streak.title}</span>
                  </div>
                  <div className="text-xs font-mono text-gray-500">{streak.description}</div>
                  <div className="text-lg font-mono text-gray-900">
                    {streak.value} <span className="text-sm text-gray-500">{streak.unit}</span>
                  </div>
                </div>
                
                {/* Right column: Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-500">Progress</span>
                    <span className="text-xs font-mono text-gray-600">
                      {streak.value}/{streak.max}
                    </span>
                  </div>
                  <Progress 
                    value={animatedPercentage}
                    className="h-3 mac-progress"
                    style={{
                      transition: 'all 2.5s cubic-bezier(0.4, 0, 0.2, 1)',
                      transitionDelay: `${index * 600}ms`
                    }}
                  />
                  <div className="text-right">
                    <span className="text-xs font-mono text-gray-500">
                      {Math.round(percentage)}% complete
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Separator line between items (except last) */}
              {index < streaks.length - 1 && (
                <hr className="mt-4 border-gray-200" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}