import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeatureFlag, Profile } from '@/lib/database.types';
import MacWindow from '@/components/MacWindow';

export default function AdminPanel() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlag[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load feature flags
      const { data: flags, error: flagsError } = await supabase
        .from('feature_flags')
        .select('*')
        .order('key');

      if (flagsError) throw flagsError;

      // Load profiles (admin view)
      const { data: profileData, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          user_id,
          role,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      setFeatureFlags(flags || []);
      setProfiles(profileData || []);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast({
        title: 'Error',
        description: 'Could not load admin data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatureFlag = async (key: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('feature_flags')
        .update({ enabled })
        .eq('key', key);

      if (error) throw error;

      setFeatureFlags(flags => 
        flags.map(flag => 
          flag.key === key ? { ...flag, enabled } : flag
        )
      );

      toast({
        title: 'Feature Flag Updated',
        description: `${key} is now ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating feature flag:', error);
      toast({
        title: 'Error',
        description: 'Could not update feature flag',
        variant: 'destructive',
      });
    }
  };

  const filteredProfiles = profiles.filter(profile => 
    !searchEmail || profile.user_id.toLowerCase().includes(searchEmail.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-sm font-mono">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Feature Flags */}
        <MacWindow title="Feature Flags">
          <div className="p-6">
            <div className="space-y-4">
              {featureFlags.map((flag) => (
                <div key={flag.key} className="flex items-center justify-between p-4 border border-black bg-white">
                  <div>
                    <h3 className="font-mono font-bold text-sm">{flag.key}</h3>
                    {flag.notes && (
                      <p className="text-xs font-mono text-muted-foreground">{flag.notes}</p>
                    )}
                  </div>
                  <Switch
                    checked={flag.enabled}
                    onCheckedChange={(enabled) => toggleFeatureFlag(flag.key, enabled)}
                  />
                </div>
              ))}
            </div>
          </div>
        </MacWindow>

        {/* User Management */}
        <MacWindow title="User Management">
          <div className="p-6">
            <div className="mb-4">
              <Input
                placeholder="Search by user ID or email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              {filteredProfiles.map((profile) => (
                <div key={profile.user_id} className="flex items-center justify-between p-4 border border-black bg-white">
                  <div>
                    <div className="font-mono font-bold text-sm">{profile.user_id}</div>
                    <div className="text-xs font-mono text-muted-foreground">
                      Role: {profile.role} • Created: {new Date(profile.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mac-button text-xs"
                    disabled
                  >
                    Manage (TODO)
                  </Button>
                </div>
              ))}
            </div>

            {filteredProfiles.length === 0 && (
              <div className="text-center py-8 text-sm font-mono text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </MacWindow>
      </div>
    </div>
  );
}