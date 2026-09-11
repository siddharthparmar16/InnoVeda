"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  BookOpen, 
  Scale, 
  Bookmark, 
  Plus, 
  User, 
  Settings as SettingsIcon, 
  Moon, 
  Sun,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Clock,
  LogIn
} from 'lucide-react';

import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { getRecentResearchSessions } from '@/lib/supabase/database';

interface RecentItem {
  id: string;
  title: string;
  query: string;
  time: string;
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, profile, openAuthModal } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  const loadSessions = async () => {
    const sessions = await getRecentResearchSessions(user?.id, 6);
    if (sessions && sessions.length > 0) {
      const mapped: RecentItem[] = sessions.map((s, idx) => ({
        id: s.id,
        title: s.title,
        query: s.query,
        time: s.created_at 
          ? new Date(s.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) 
          : `${idx + 1}d ago`
      }));
      setRecentItems(mapped);
    } else {
      setRecentItems([]);
    }
  };

  useEffect(() => {
    loadSessions();

    const handleUpdate = () => {
      loadSessions();
    };

    window.addEventListener('session-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('session-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  const navItems = [
    {
      name: 'Source Library',
      href: '/library',
      icon: BookOpen,
      badge: '6 Sources'
    },
    {
      name: 'Compare Regimes',
      href: '/compare',
      icon: Scale,
      badge: 'IN vs WIPO'
    },
    {
      name: 'Bookmarked Research',
      href: '/bookmarks',
      icon: Bookmark,
      badge: '3'
    },
  ];

  return (
    <aside 
      className="app-sidebar"
      style={{
        width: '220px',
        minWidth: '220px',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 1rem',
        boxSizing: 'border-box',
        overflowY: 'auto',
        transition: 'background 0.25s ease, border-color 0.25s ease'
      }}
    >
      {/* Top Section: Branding + New Research + Nav */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Brand Header */}
        <Link 
          href="/" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.85rem', 
            textDecoration: 'none',
            padding: '0.35rem 0.5rem',
            borderRadius: '12px',
            transition: 'background 0.2s'
          }}
        >
          {/* Gold Emblem Seal */}
          <div 
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              border: '1.5px solid var(--border-highlight)',
              background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-glow)',
              flexShrink: 0
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="var(--accent-gold-glow)" />
              <circle cx="12" cy="12" r="3" stroke="var(--accent-gold-light)" strokeWidth="1.2" />
            </svg>
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span 
              style={{ 
                fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
                fontWeight: 700, 
                fontSize: '1.25rem', 
                letterSpacing: '0.02em',
                color: 'var(--text-primary)'
              }}
            >
              InnoVeda
            </span>
          </div>
        </Link>

        {/* Primary Action Button: + New Research */}
        <button
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal();
              return;
            }
            router.push('/dashboard?new=true');
          }}
          className="btn-gold"
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            fontSize: '0.92rem',
            fontWeight: 600,
            letterSpacing: '0.01em',
            borderRadius: '12px'
          }}
        >
          <Plus size={18} strokeWidth={2.4} />
          <span>New Research</span>
        </button>

        {/* Navigation Group: RESEARCH */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <div 
            style={{ 
              fontSize: '0.68rem', 
              letterSpacing: '0.16em', 
              fontWeight: 700, 
              color: 'var(--text-muted)', 
              textTransform: 'uppercase',
              padding: '0.25rem 0.65rem',
              marginTop: '0.25rem'
            }}
          >
            RESEARCH
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <div
                key={item.name}
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal();
                    return;
                  }
                  router.push(item.href);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  borderRadius: '10px',
                  background: isActive ? 'var(--accent-gold-glow)' : 'transparent',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-glass-hover)';
                    e.currentTarget.style.color = 'var(--text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon 
                    size={17} 
                    style={{ 
                    color: isActive ? 'var(--accent-gold)' : 'var(--text-muted)',
                    transition: 'color 0.2s'
                  }} 
                />
                <span style={{ fontSize: '0.88rem', fontWeight: isActive ? 600 : 500 }}>
                  {item.name}
                </span>
              </div>
            </div>
          );
        })}
        </div>

        {/* Section: RECENT RESEARCH - Only shown when user has conducted research */}
        {recentItems.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginTop: '0.35rem' }}>
            <div 
              style={{ 
                fontSize: '0.68rem', 
                letterSpacing: '0.16em', 
                fontWeight: 700, 
                color: 'var(--text-muted)', 
                textTransform: 'uppercase',
                padding: '0.25rem 0.65rem'
              }}
            >
              RECENT RESEARCH
            </div>

            {recentItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal();
                    return;
                  }
                  router.push(`/dashboard?query=${encodeURIComponent(item.query)}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.55rem 0.75rem',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.84rem',
                  fontWeight: 500,
                  width: '100%',
                  transition: 'all 0.18s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--bg-glass-hover)';
                  e.currentTarget.style.color = 'var(--accent-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '190px' }}>
                  {item.title}
                </span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Section: Researcher Profile & Settings & Theme */}
      <div 
        style={{ 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '1rem',
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.45rem' 
        }}
      >
        {/* Researcher Info */}
        {profile || user ? (
          <div style={{ padding: '0.15rem 0.65rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Researcher
            </div>
            <div 
              style={{ 
                fontSize: '0.92rem', 
                fontWeight: 700, 
                color: 'var(--text-primary)',
                fontFamily: "var(--font-serif), Georgia, serif",
                marginTop: '0.1rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              {profile?.full_name || user?.email?.split('@')[0] || 'Researcher'}
            </div>
          </div>
        ) : (
          <div style={{ padding: '0.15rem 0.65rem' }}>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Researcher
            </div>
            <div 
              style={{ 
                fontSize: '0.9rem', 
                fontWeight: 600, 
                color: 'var(--text-secondary)',
                fontFamily: "var(--font-serif), Georgia, serif",
                marginTop: '0.1rem'
              }}
            >
              Guest Researcher
            </div>
          </div>
        )}

        {/* Profile Link */}
        <div
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal();
              return;
            }
            router.push('/profile');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            color: pathname === '/profile' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: pathname === '/profile' ? 'var(--accent-gold-glow)' : 'transparent',
            fontSize: '0.86rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/profile') {
              e.currentTarget.style.background = 'var(--bg-glass-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/profile') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <User size={16} style={{ color: 'var(--accent-gold)' }} />
          <span>Profile</span>
        </div>

        {/* Settings Link */}
        <div
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal();
              return;
            }
            router.push('/settings');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            color: pathname === '/settings' ? 'var(--text-primary)' : 'var(--text-secondary)',
            background: pathname === '/settings' ? 'var(--accent-gold-glow)' : 'transparent',
            fontSize: '0.86rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (pathname !== '/settings') {
              e.currentTarget.style.background = 'var(--bg-glass-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }
          }}
          onMouseLeave={(e) => {
            if (pathname !== '/settings') {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }
          }}
        >
          <SettingsIcon size={16} style={{ color: 'var(--accent-gold)' }} />
          <span>Settings</span>
        </div>

        {/* Night / Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Day Archive (Light Mode)" : "Switch to Night Archive (Dark Mode)"}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0.75rem',
            borderRadius: '8px',
            background: 'transparent',
            border: '1px solid transparent',
            color: 'var(--text-secondary)',
            fontSize: '0.86rem',
            fontWeight: 500,
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-glass-hover)';
            e.currentTarget.style.color = 'var(--text-primary)';
            e.currentTarget.style.borderColor = 'var(--border-color)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        >
          {isDark ? (
            <>
              <Moon size={16} style={{ color: 'var(--accent-gold)' }} />
              <span>Night Archive</span>
            </>
          ) : (
            <>
              <Sun size={16} style={{ color: 'var(--accent-amber)' }} />
              <span>Day Archive</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
