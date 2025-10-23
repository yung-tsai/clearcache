export interface BackgroundPreference {
  type: 'pattern' | 'color';
  value: string;
}

export interface ScanlinePreference {
  enabled: boolean;
  intensity: 'light' | 'medium' | 'heavy' | 'extra-heavy' | 'maximum' | 'custom';
  density: number;
  customIntensity: number;
}

export interface Profile {
  user_id: string;
  created_at: string;
  background_preference?: BackgroundPreference;
  scanline_preferences?: ScanlinePreference;
}

export interface Entry {
  id: string;
  user_id: string;
  title: string | null;
  content: string | null;
  transcript: string | null;
  audio_path: string | null;
  created_at: string;
  updated_at: string;
}


export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          user_id: string;
        };
        Update: {
          background_preference?: BackgroundPreference;
        };
      };
      entries: {
        Row: Entry;
        Insert: {
          user_id: string;
          title?: string | null;
          content?: string | null;
          transcript?: string | null;
          audio_path?: string | null;
        };
        Update: {
          title?: string | null;
          content?: string | null;
          transcript?: string | null;
          audio_path?: string | null;
        };
      };
    };
  };
};