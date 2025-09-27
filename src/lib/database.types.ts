export type Role = 'user' | 'admin';

export interface Profile {
  user_id: string;
  role: Role;
  created_at: string;
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

export interface UserStreaks {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_entry_date: string | null;
  total_entries: number;
  created_at: string;
  updated_at: string;
}

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  requirement_type: 'streak' | 'total_entries';
  requirement_value: number;
  created_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
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
      user_streaks: {
        Row: UserStreaks;
        Insert: {
          user_id: string;
          current_streak?: number;
          longest_streak?: number;
          last_entry_date?: string | null;
          total_entries?: number;
        };
        Update: {
          current_streak?: number;
          longest_streak?: number;
          last_entry_date?: string | null;
          total_entries?: number;
        };
      };
      badges: {
        Row: Badge;
        Insert: {
          key: string;
          name: string;
          description: string;
          icon: string;
          requirement_type: 'streak' | 'total_entries';
          requirement_value: number;
        };
        Update: {
          name?: string;
          description?: string;
          icon?: string;
          requirement_type?: 'streak' | 'total_entries';
          requirement_value?: number;
        };
      };
      user_badges: {
        Row: UserBadge;
        Insert: {
          user_id: string;
          badge_id: string;
        };
        Update: {
          earned_at?: string;
        };
      };
    };
  };
};