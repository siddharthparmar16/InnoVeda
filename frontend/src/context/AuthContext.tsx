"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile } from '@/lib/supabase/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'signin' | 'signup';
  openAuthModal: (mode?: 'signin' | 'signup' | any) => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInDemoUser: () => void;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
}

const defaultDemoProfile: UserProfile = {
  id: 'demo-researcher-001',
  email: 'researcher.ayush@gov.in',
  full_name: 'Dr. Mantra Parmar',
  avatar_url: null,
  role: 'Senior Patent Examiner & TKDL Statutory Specialist',
  organization: 'Ministry of Ayush & Traditional Knowledge Digital Library',
  tier: 'Tier 1 Clearance',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');

  // Fetch or construct profile from Supabase
  const loadProfile = async (currentUser: User) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'Researcher',
        avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
        role: 'Lead IP Analyst',
        organization: 'Ayurveda Intellectual Property & TKDL Research Cell',
        tier: 'Tier 1 Clearance',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (data && !error) {
        setProfile(data as UserProfile);
      } else {
        // Create initial profile if trigger has delay
        const initialProfile: UserProfile = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || 'Researcher',
          avatar_url: currentUser.user_metadata?.avatar_url || currentUser.user_metadata?.picture || null,
          role: 'Lead IP Analyst',
          organization: 'Ayurveda Intellectual Property & TKDL Research Cell',
          tier: 'Tier 1 Clearance',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await supabase.from('profiles').upsert(initialProfile);
        setProfile(initialProfile);
      }
    } catch (err) {
      console.error('Error fetching user profile from Supabase:', err);
    }
  };

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!isSupabaseConfigured || !supabase) {
      // Check if developer previously logged in as demo
      const savedDemo = localStorage.getItem('ip_sakti_demo_session');
      if (savedDemo === 'true') {
        setProfile(defaultDemoProfile);
      }
      setIsLoading(false);
      return;
    }

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        setUser(session.user);
        loadProfile(session.user);
      }
      setIsLoading(false);
    });

    // Listen to Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user) {
          setUser(newSession.user);
          await loadProfile(newSession.user);
        } else {
          setUser(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const openAuthModal = (mode?: 'signin' | 'signup' | any) => {
    if (mode === 'signup' || mode === 'signin') {
      setAuthModalMode(mode);
    } else {
      setAuthModalMode('signin');
    }
    setIsAuthModalOpen(true);
  };
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signInWithGoogle = async () => {
    const supabase = getSupabaseClient();
    if (!isSupabaseConfigured || !supabase) {
      return { 
        error: new Error("Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local") 
      };
    }

    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectOrigin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      console.error('Supabase Google OAuth error:', err);
      return { error: err };
    }
  };

  const signInDemoUser = () => {
    localStorage.setItem('ip_sakti_demo_session', 'true');
    setProfile(defaultDemoProfile);
    closeAuthModal();
  };

  const signOut = async () => {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem('ip_sakti_demo_session');
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const updateProfile = async (data: Partial<UserProfile>): Promise<boolean> => {
    if (!profile) return false;

    const updated = { ...profile, ...data, updated_at: new Date().toISOString() };
    setProfile(updated);

    const supabase = getSupabaseClient();
    if (supabase && user) {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
      return !error;
    }

    return true;
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        isConfigured: isSupabaseConfigured,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInDemoUser,
        signOut,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
