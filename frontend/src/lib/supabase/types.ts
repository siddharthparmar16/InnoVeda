export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
  organization: string;
  tier: string;
  created_at: string;
  updated_at: string;
}

export interface ResearchSession {
  id: string;
  user_id: string;
  title: string;
  query: string;
  jurisdiction: string;
  verdict?: string | null;
  verdict_color?: string | null;
  status?: string;
  created_at: string;
}

export interface DatabaseBookmark {
  id: string;
  user_id: string;
  title: string;
  regime: string;
  verdict: string;
  verdict_color: string;
  summary: string;
  query: string;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile;
        Insert: Partial<UserProfile> & { id: string; email: string };
        Update: Partial<UserProfile>;
      };
      research_sessions: {
        Row: ResearchSession;
        Insert: Omit<ResearchSession, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<ResearchSession>;
      };
      bookmarks: {
        Row: DatabaseBookmark;
        Insert: Omit<DatabaseBookmark, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<DatabaseBookmark>;
      };
    };
  };
}
