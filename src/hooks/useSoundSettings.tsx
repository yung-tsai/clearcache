import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SoundPreferences {
  masterVolume: number; // 0-1
  sounds: {
    windowClose: { enabled: boolean };
    keyboard: { enabled: boolean };
    login: { enabled: boolean };
    notification: { enabled: boolean };
    newEntry: { enabled: boolean };
  };
}

const DEFAULT_PREFERENCES: SoundPreferences = {
  masterVolume: 0.5,
  sounds: {
    windowClose: { enabled: true },
    keyboard: { enabled: false },
    login: { enabled: true },
    notification: { enabled: true },
    newEntry: { enabled: true },
  },
};

export const useSoundSettings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<SoundPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from Supabase
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('sound_preferences')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading sound preferences:', error);
        setLoading(false);
        return;
      }

      if (data?.sound_preferences) {
        const prefs = data.sound_preferences as any;
        
        // Migrate old sound keys to new structure
        const migratedSounds: SoundPreferences['sounds'] = {
          windowClose: prefs.sounds?.windowClose ?? prefs.sounds?.window ?? { enabled: true },
          keyboard: prefs.sounds?.keyboard ?? { enabled: false },
          login: prefs.sounds?.login ?? { enabled: true },
          notification: prefs.sounds?.notification ?? prefs.sounds?.buttonClick ?? { enabled: true },
          newEntry: prefs.sounds?.newEntry ?? { enabled: true },
        };

        const migratedPreferences: SoundPreferences = {
          masterVolume: prefs.masterVolume ?? 0.5,
          sounds: migratedSounds,
        };

        setPreferences(migratedPreferences);

        // Save migrated preferences back to database
        await supabase
          .from('profiles')
          .update({ sound_preferences: migratedPreferences })
          .eq('user_id', user.id);
      }
      setLoading(false);
    };

    loadPreferences();
  }, [user]);

  // Auto-save preferences to Supabase
  const updatePreferences = async (newPreferences: Partial<SoundPreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ sound_preferences: updated })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error saving sound preferences:', error);
    }
  };

  const setMasterVolume = (volume: number) => {
    updatePreferences({ masterVolume: volume });
  };

  const toggleSound = (soundType: keyof SoundPreferences['sounds'], enabled: boolean) => {
    updatePreferences({
      sounds: {
        ...preferences.sounds,
        [soundType]: { enabled },
      },
    });
  };

  return {
    preferences,
    loading,
    setMasterVolume,
    toggleSound,
  };
};
