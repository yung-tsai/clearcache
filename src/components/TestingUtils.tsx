import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMockAuth } from '@/components/MockAuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useRefreshStreaks } from '@/hooks/useStreaks';

// Hook to get auth from either real or mock provider
const useCurrentAuth = () => {
  try {
    return useMockAuth();
  } catch {
    return useAuth();
  }
};

const TestingUtils: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useCurrentAuth();
  const { toast } = useToast();
  const refreshStreaks = useRefreshStreaks();

  const createTestEntries = async (count: number) => {
    if (!user?.id) return;
    
    setIsCreating(true);
    
    try {
      const entries = [];
      for (let i = 0; i < count; i++) {
        entries.push({
          user_id: user.id,
          title: `Test Entry ${i + 1}`,
          content: `This is test entry number ${i + 1}. Created for testing the streak and badge system.`,
        });
      }

      const { error } = await supabase
        .from('entries')
        .insert(entries);

      if (error) throw error;

      // Refresh streaks and badges
      refreshStreaks();

      toast({
        title: 'Success!',
        description: `Created ${count} test entries`,
      });
    } catch (error) {
      console.error('Error creating test entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to create test entries',
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const clearAllEntries = async () => {
    if (!user?.id) return;
    
    if (!confirm('Are you sure you want to delete ALL your entries? This cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Also clear streak data
      await supabase
        .from('user_streaks')
        .delete()
        .eq('user_id', user.id);

      // Clear badges
      await supabase
        .from('user_badges')
        .delete()
        .eq('user_id', user.id);

      refreshStreaks();

      toast({
        title: 'Cleared',
        description: 'All entries, streaks, and badges cleared',
      });
    } catch (error) {
      console.error('Error clearing entries:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear entries',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-sm">🧪 Testing Utils</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-xs text-muted-foreground mb-3">
          Quick tools to test the streak and badge system
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => createTestEntries(1)}
            disabled={isCreating}
          >
            +1 Entry
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => createTestEntries(5)}
            disabled={isCreating}
          >
            +5 Entries
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={() => createTestEntries(10)}
            disabled={isCreating}
          >
            +10 Entries
          </Button>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={() => createTestEntries(100)}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? 'Creating...' : '+100 Entries (Century Club!)'}
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={clearAllEntries}
          className="w-full"
        >
          Clear All Data
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestingUtils;