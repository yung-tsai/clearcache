export type Role = 'user' | 'admin';

export interface BackgroundPreference {
  type: 'pattern' | 'color';
  value: string;
}

export interface Profile {
  user_id: string;
  role: Role;
  created_at: string;
  background_preference?: BackgroundPreference;
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

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  notes?: string | null;
}

export interface UserOverride {
  user_id: string;
  key: string;
  enabled: boolean;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          user_id: string;
          role?: Role;
        };
        Update: {
          role?: Role;
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
      feature_flags: {
        Row: FeatureFlag;
        Insert: FeatureFlag;
        Update: {
          enabled?: boolean;
          notes?: string | null;
        };
      };
      user_feature_overrides: {
        Row: UserOverride;
        Insert: UserOverride;
        Update: {
          enabled?: boolean;
        };
      };
    };
  };
};