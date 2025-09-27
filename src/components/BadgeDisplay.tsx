import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useUserBadges, useAllBadges } from '@/hooks/useStreaks';
import { Lock, Trophy } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const BadgeDisplay: React.FC = () => {
  const { data: userBadges = [], isLoading: loadingUserBadges } = useUserBadges();
  const { data: allBadges = [], isLoading: loadingAllBadges } = useAllBadges();

  if (loadingUserBadges || loadingAllBadges) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="w-5 h-5" />
            <span>Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg p-4 space-y-2">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded mx-auto"></div>
                  <div className="h-3 bg-muted-foreground/20 rounded"></div>
                  <div className="h-2 bg-muted-foreground/20 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5" />
          <span>Achievements</span>
          <Badge variant="secondary" className="ml-auto">
            {userBadges.length}/{allBadges.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {allBadges.map((badge) => {
            const userBadge = userBadges.find(ub => ub.badge_id === badge.id);
            const isEarned = !!userBadge;

            return (
              <div
                key={badge.id}
                className={`relative p-4 rounded-lg border transition-all hover:scale-105 ${
                  isEarned 
                    ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-900/20 dark:to-yellow-800/20 dark:border-yellow-700' 
                    : 'bg-muted/50 border-muted-foreground/20'
                }`}
              >
                {/* Badge Icon */}
                <div className="text-center mb-2">
                  <div className={`text-2xl mb-1 ${isEarned ? '' : 'grayscale opacity-50'}`}>
                    {badge.icon}
                  </div>
                  {!isEarned && (
                    <Lock className="w-4 h-4 text-muted-foreground mx-auto absolute top-2 right-2" />
                  )}
                </div>

                {/* Badge Info */}
                <div className="text-center space-y-1">
                  <h4 className={`font-semibold text-sm ${isEarned ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {badge.name}
                  </h4>
                  <p className={`text-xs ${isEarned ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                    {badge.description}
                  </p>
                  
                  {/* Requirement */}
                  <div className="pt-1">
                    <Badge 
                      variant={isEarned ? "default" : "outline"} 
                      className="text-xs"
                    >
                      {badge.requirement_type === 'streak' 
                        ? `${badge.requirement_value} day streak` 
                        : `${badge.requirement_value} entries`
                      }
                    </Badge>
                  </div>

                  {/* Earned Date */}
                  {isEarned && userBadge && (
                    <p className="text-xs text-muted-foreground pt-1">
                      Earned {formatDistanceToNow(new Date(userBadge.earned_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default BadgeDisplay;