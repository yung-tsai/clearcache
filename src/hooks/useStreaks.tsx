import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMockAuth } from '@/components/MockAuthProvider';
import type { UserStreaks, Badge, UserBadge } from '@/lib/database.types';

// Hook to get auth from either real or mock provider
const useCurrentAuth = () => {
  try {
    return useMockAuth();
  } catch {
    return useAuth();
  }
};

export function useUserStreaks() {
  const { user } = useCurrentAuth();

  return useQuery({
    queryKey: ['user-streaks', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserStreaks | null;
    },
    enabled: !!user?.id,
  });
}

export function useUserBadges() {
  const { user } = useCurrentAuth();

  return useQuery({
    queryKey: ['user-badges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badges (*)
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data.map(item => ({
        ...item,
        badge: item.badges as Badge
      }));
    },
    enabled: !!user?.id,
  });
}

export function useAllBadges() {
  return useQuery({
    queryKey: ['all-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('requirement_value', { ascending: true });

      if (error) throw error;
      return data as Badge[];
    },
  });
}

// Hook to refresh streak and badge data (used when entries are created)
export function useRefreshStreaks() {
  const queryClient = useQueryClient();
  const { user } = useCurrentAuth();

  return () => {
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ['user-streaks', user.id] });
      queryClient.invalidateQueries({ queryKey: ['user-badges', user.id] });
    }
  };
}