import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadStreakData();
      loadPeriodCounts();
    }
  }, [user]);

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
    return <div className="text-sm font-mono text-muted-foreground">Loading streaks...</div>;
  }

  const streaks = [
    {
      title: 'Current Streak',
      value: streakData?.current_streak || 0,
      max: Math.max(streakData?.longest_streak || 7, 7),
      unit: 'days',
      icon: Zap,
      color: 'text-orange-600'
    },
    {
      title: 'Weekly Goal',
      value: weeklyEntries,
      max: 7,
      unit: 'entries',
      icon: Target,
      color: 'text-blue-600'
    },
    {
      title: 'Monthly Challenge',
      value: monthlyEntries,
      max: 30,
      unit: 'entries',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'All Time Best',
      value: streakData?.longest_streak || 0,
      max: streakData?.longest_streak || 1,
      unit: 'days',
      icon: Trophy,
      color: 'text-purple-600',
      isRecord: true
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="space-y-2">
        {streaks.slice(0, 2).map((streak) => {
          const Icon = streak.icon;
          const percentage = streak.isRecord ? 100 : (streak.value / streak.max) * 100;
          
          return (
            <div key={streak.title} className="flex items-center gap-3">
              <Icon className={`w-4 h-4 ${streak.color}`} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-mono">{streak.title}</span>
                  <Badge variant="secondary" className="text-xs">
                    {streak.value} {streak.unit}
                  </Badge>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {streaks.map((streak) => {
        const Icon = streak.icon;
        const percentage = streak.isRecord ? 100 : (streak.value / streak.max) * 100;
        
        return (
          <Card key={streak.title} className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-mono flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${streak.color}`} />
                  {streak.title}
                </CardTitle>
                <Badge variant="secondary" className="font-mono">
                  {streak.value}/{streak.max}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={percentage} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>{streak.value} {streak.unit}</span>
                  <span>{Math.round(percentage)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}