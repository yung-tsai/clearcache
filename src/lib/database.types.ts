export interface BackgroundPreference {
  type: 'pattern' | 'color';
  value: string;
}

export interface Profile {
  user_id: string;
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