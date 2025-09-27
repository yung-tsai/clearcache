import { useEffect } from 'react';
import { useUserBadges } from '@/hooks/useStreaks';
import { useToast } from '@/hooks/use-toast';

export const BadgeNotification = () => {
  const { data: userBadges = [] } = useUserBadges();
  const { toast } = useToast();

  useEffect(() => {
    // Check for recently earned badges (within last 10 seconds)
    const recentBadges = userBadges.filter(ub => {
      const earnedAt = new Date(ub.earned_at);
      const now = new Date();
      const timeDiff = now.getTime() - earnedAt.getTime();
      return timeDiff <= 10000; // 10 seconds
    });

    recentBadges.forEach(ub => {
      if (ub.badge) {
        toast({
          title: "🎉 Badge Earned!",
          description: (
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{ub.badge.icon}</span>
              <div>
                <p className="font-semibold">{ub.badge.name}</p>
                <p className="text-sm text-muted-foreground">{ub.badge.description}</p>
              </div>
            </div>
          ),
          duration: 5000,
        });
      }
    });
  }, [userBadges, toast]);

  return null; // This component doesn't render anything visible
};

export default BadgeNotification;