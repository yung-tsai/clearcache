import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ScanlinePreferences {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'heavy' | 'extra-heavy' | 'maximum' | 'custom';
  density: number; // 1-4
  customIntensity: number; // 0.0-0.20
}

const DEFAULT_PREFERENCES: ScanlinePreferences = {
  enabled: true,
  intensity: 'medium',
  density: 2,
  customIntensity: 0.08,
};

export const INTENSITY_MAP = {
  light: 0.03,
  medium: 0.05,
  heavy: 0.08,
  'extra-heavy': 0.12,
  maximum: 0.15,
  custom: 0.08, // default, overridden by customIntensity
};

export const useScanlineSettings = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<ScanlinePreferences>(DEFAULT_PREFERENCES);
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
        .select('scanline_preferences')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error loading scanline preferences:', error);
        setLoading(false);
        return;
      }

      if (data?.scanline_preferences) {
        setPreferences(data.scanline_preferences as ScanlinePreferences);
      }
      setLoading(false);
    };

    loadPreferences();
  }, [user]);

  // Auto-save preferences to Supabase
  const updatePreferences = async (newPreferences: Partial<ScanlinePreferences>) => {
    const updated = { ...preferences, ...newPreferences };
    setPreferences(updated);

    // Broadcast change event
    window.dispatchEvent(new CustomEvent('scanline-change', { detail: updated }));

    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ scanline_preferences: updated })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error saving scanline preferences:', error);
    }
  };

  const toggleScanlines = (enabled: boolean) => {
    updatePreferences({ enabled });
  };

  const setIntensity = (intensity: ScanlinePreferences['intensity']) => {
    updatePreferences({ intensity });
  };

  const setDensity = (density: number) => {
    updatePreferences({ density });
  };

  const setCustomIntensity = (customIntensity: number) => {
    updatePreferences({ customIntensity });
  };

  return {
    preferences,
    loading,
    toggleScanlines,
    setIntensity,
    setDensity,
    setCustomIntensity,
  };
};
