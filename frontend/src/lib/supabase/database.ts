import { getSupabaseClient, isSupabaseConfigured } from './client';
import { ResearchSession, DatabaseBookmark } from './types';

const LOCAL_STORAGE_SESSIONS_KEY = 'ip_sakti_local_sessions';
const LOCAL_STORAGE_BOOKMARKS_KEY = 'ip_sakti_local_bookmarks';

// ==========================================
// RESEARCH SESSIONS (Search & Audit History)
// ==========================================

export async function saveResearchSession(
  userId: string,
  sessionData: {
    title: string;
    query: string;
    jurisdiction: string;
    verdict?: string | null;
    verdict_color?: string | null;
  }
): Promise<ResearchSession | null> {
  const supabase = getSupabaseClient();
  const isRealUser = userId && userId !== 'guest' && !userId.startsWith('local-');

  if (isSupabaseConfigured && supabase && isRealUser) {
    try {
      const { data, error } = await supabase
        .from('research_sessions')
        .insert({
          user_id: userId,
          title: sessionData.title,
          query: sessionData.query,
          jurisdiction: sessionData.jurisdiction,
          verdict: sessionData.verdict,
          verdict_color: sessionData.verdict_color,
          status: 'COMPLETED'
        })
        .select()
        .single();

      if (!error && data) {
        return data as ResearchSession;
      }
    } catch (err) {
      console.error('Error saving research session to Supabase:', err);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing: ResearchSession[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY) || '[]'
      );
      const newSession: ResearchSession = {
        id: 'local-' + Date.now(),
        user_id: userId,
        title: sessionData.title,
        query: sessionData.query,
        jurisdiction: sessionData.jurisdiction,
        verdict: sessionData.verdict,
        verdict_color: sessionData.verdict_color,
        status: 'COMPLETED',
        created_at: new Date().toISOString()
      };
      existing.unshift(newSession);
      localStorage.setItem(LOCAL_STORAGE_SESSIONS_KEY, JSON.stringify(existing.slice(0, 30)));
      return newSession;
    } catch (e) {
      console.error('Error saving to localStorage:', e);
    }
  }

  return null;
}

export async function getRecentResearchSessions(
  userId?: string,
  limit: number = 6
): Promise<ResearchSession[]> {
  const supabase = getSupabaseClient();
  const isRealUser = userId && userId !== 'guest' && !userId.startsWith('local-');

  if (isSupabaseConfigured && supabase && isRealUser) {
    try {
      const { data, error } = await supabase
        .from('research_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return data as ResearchSession[];
      }
    } catch (err) {
      console.error('Error fetching research sessions from Supabase:', err);
    }
  }

  // Fallback to localStorage or default
  if (typeof window !== 'undefined') {
    try {
      const local: ResearchSession[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_SESSIONS_KEY) || '[]'
      );
      if (local.length > 0) return local.slice(0, limit);
    } catch (e) {
      console.error('Error reading localStorage sessions:', e);
    }
  }

  return [];
}

// ==========================================
// BOOKMARKS (Saved Patent Analyses & Citations)
// ==========================================

export async function getUserBookmarks(userId?: string): Promise<DatabaseBookmark[]> {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as DatabaseBookmark[];
      }
    } catch (err) {
      console.error('Error fetching bookmarks from Supabase:', err);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY);
      if (local) {
        return JSON.parse(local);
      }
    } catch (e) {
      console.error('Error reading bookmarks from localStorage:', e);
    }
  }

  return [];
}

export async function saveUserBookmark(
  userId: string,
  bookmarkData: {
    title: string;
    regime: string;
    verdict: string;
    verdict_color: string;
    summary: string;
    query: string;
  }
): Promise<DatabaseBookmark | null> {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .insert({
          user_id: userId,
          title: bookmarkData.title,
          regime: bookmarkData.regime,
          verdict: bookmarkData.verdict,
          verdict_color: bookmarkData.verdict_color,
          summary: bookmarkData.summary,
          query: bookmarkData.query
        })
        .select()
        .single();

      if (!error && data) {
        return data as DatabaseBookmark;
      }
    } catch (err) {
      console.error('Error saving bookmark to Supabase:', err);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing: DatabaseBookmark[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY) || '[]'
      );
      const newBm: DatabaseBookmark = {
        id: 'bm-' + Date.now(),
        user_id: userId,
        title: bookmarkData.title,
        regime: bookmarkData.regime,
        verdict: bookmarkData.verdict,
        verdict_color: bookmarkData.verdict_color,
        summary: bookmarkData.summary,
        query: bookmarkData.query,
        created_at: new Date().toISOString()
      };
      existing.unshift(newBm);
      localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(existing));
      return newBm;
    } catch (e) {
      console.error('Error saving bookmark to localStorage:', e);
    }
  }

  return null;
}

export async function deleteUserBookmark(userId: string, bookmarkId: string): Promise<boolean> {
  const supabase = getSupabaseClient();

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId)
        .eq('user_id', userId);

      if (!error) return true;
    } catch (err) {
      console.error('Error deleting bookmark from Supabase:', err);
    }
  }

  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    try {
      const existing: DatabaseBookmark[] = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_BOOKMARKS_KEY) || '[]'
      );
      const filtered = existing.filter(b => b.id !== bookmarkId);
      localStorage.setItem(LOCAL_STORAGE_BOOKMARKS_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      console.error('Error updating localStorage bookmarks:', e);
    }
  }

  return false;
}
