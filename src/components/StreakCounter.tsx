import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserStreaks } from '@/hooks/useStreaks';
import { Flame, Trophy, Calendar } from 'lucide-react';

const StreakCounter: React.FC = () => {
  const { data: streaks, isLoading } = useUserStreaks();

  if (isLoading) {
    return (
      <Card className="w-full max-w-md bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 animate-pulse">
            <div className="w-12 h-12 bg-muted rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-6 bg-muted rounded w-16"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streaks?.current_streak || 0;
  const longestStreak = streaks?.longest_streak || 0;
  const totalEntries = streaks?.total_entries || 0;

  return (
    <Card className="w-full max-w-md bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Current Streak */}
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-orange-500/20 rounded-full">
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Streak</p>
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-foreground">{currentStreak}</span>
                <span className="text-sm text-muted-foreground">days</span>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-between pt-4 border-t border-border/50">
            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Best</p>
                <p className="text-sm font-semibold">{longestStreak}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{totalEntries}</p>
              </div>
            </div>
          </div>

          {/* Motivational Message */}
          <div className="pt-2">
            {currentStreak === 0 && (
              <Badge variant="outline" className="text-xs">
                Start your streak today! ✨
              </Badge>
            )}
            {currentStreak > 0 && currentStreak < 7 && (
              <Badge variant="secondary" className="text-xs">
                Keep it up! {7 - currentStreak} days to Week Warrior 🔥
              </Badge>
            )}
            {currentStreak >= 7 && currentStreak < 30 && (
              <Badge variant="default" className="text-xs">
                Amazing! {30 - currentStreak} days to Dedication 💪
              </Badge>
            )}
            {currentStreak >= 30 && (
              <Badge variant="default" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500">
                Incredible dedication! 👑
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCounter;