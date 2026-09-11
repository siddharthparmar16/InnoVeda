"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Globe, ChevronDown, Moon, Sun, ShieldCheck, User, Bookmark, Settings as SettingsIcon, LogOut, Sparkles, ArrowRight, Clock } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { applyGoogleTranslate } from '@/lib/google-translate';
import { SupportedLanguage } from '@/types/domain';
import { getRecentResearchSessions } from '@/lib/supabase/database';
import { ResearchSession } from '@/lib/supabase/types';

export default function AppTopHeader() {
  const router = useRouter();
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, profile, openAuthModal, signOut } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [regime, setRegime] = useState('All Regimes');
  const [language, setLanguage] = useState<SupportedLanguage>('EN');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSessions = async () => {
    try {
      const list = await getRecentResearchSessions(user?.id, 20);
      setSessions(list || []);
    } catch {
      setSessions([]);
    }
  };

  useEffect(() => {
    loadSessions();
    const handleUpdate = () => loadSessions();
    window.addEventListener('session-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('session-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  // Restore language from googtrans cookie on mount
  useEffect(() => {
    try {
      const cookieVal = document.cookie
        .split('; ')
        .find(row => row.startsWith('googtrans='))
        ?.split('=')?.[1];
      if (cookieVal) {
        const parts = cookieVal.split('/');
        const gtCode = parts[parts.length - 1];
        const langMap: Record<string, SupportedLanguage> = {
          hi: 'HI', mr: 'MR', sa: 'SA', en: 'EN',
        };
        const restored = langMap[gtCode];
        if (restored) setLanguage(restored);
      }
    } catch { /* ignore */ }
  }, []);

  const handleLanguageSelect = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setTimeout(() => {
      try { applyGoogleTranslate(newLang); } catch { /* ignore */ }
    }, 150);
  };

  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'MP';
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Researcher';
  const displayEmail = profile?.email || user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const initials = getInitials(displayName, displayEmail);

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        width: '100%',
        transition: 'background 0.25s ease, border-color 0.25s ease'
      }}
    >
      {/* Left: Archive Context Title */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span 
          style={{ 
            fontSize: '0.66rem', 
            letterSpacing: '0.18em', 
            textTransform: 'uppercase', 
            fontWeight: 700, 
            color: 'var(--accent-gold)' 
          }}
        >
          INTELLIGENT RESEARCH ARCHIVE
        </span>
        <span 
          style={{ 
            fontSize: '0.96rem', 
            fontWeight: 600, 
            color: 'var(--text-primary)',
            letterSpacing: '-0.01em',
            fontFamily: "var(--font-serif), Georgia, serif"
          }}
        >
          Ayurveda IP & Regulatory Guidance
        </span>
      </div>

      {/* Right Controls: Search Sessions, Regimes, Language, Theme, Status, Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Search sessions */}
        <div ref={searchContainerRef} style={{ position: 'relative' }}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const q = searchQuery.trim();
              if (!q) return;
              if (!isAuthenticated) {
                setSearchOpen(false);
                openAuthModal();
                return;
              }
              const matches = sessions.filter(s => 
                s.title.toLowerCase().includes(q.toLowerCase()) || 
                s.query.toLowerCase().includes(q.toLowerCase())
              );
              const target = matches.length > 0 ? matches[0].query : q;
              setSearchOpen(false);
              setSearchQuery('');
              router.push(`/dashboard?query=${encodeURIComponent(target)}`);
            }}
            style={{ 
              display: 'flex', 
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: searchOpen ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
              borderRadius: '999px',
              padding: '0.35rem 0.85rem',
              transition: 'all 0.2s',
              width: searchOpen ? '260px' : '190px',
              boxShadow: searchOpen ? '0 0 12px var(--accent-gold-glow)' : 'none'
            }}
          >
            <Search size={14} style={{ color: searchOpen ? 'var(--accent-gold)' : 'var(--text-muted)', marginRight: '0.5rem', flexShrink: 0 }} />
            <input 
              type="text" 
              placeholder="Search sessions..."
              value={searchQuery}
              onFocus={() => {
                setSearchOpen(true);
                loadSessions();
              }}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearchOpen(false);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                width: '100%'
              }}
            />
          </form>

          {/* Floating Dropdown for Sessions */}
          {searchOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: '340px',
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border-highlight)',
                borderRadius: '12px',
                boxShadow: 'var(--shadow-glass)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                padding: '0.5rem',
                zIndex: 100,
                maxHeight: '340px',
                overflowY: 'auto'
              }}
            >
              {searchQuery.trim() && (
                <div
                  onClick={() => {
                    const q = searchQuery.trim();
                    setSearchOpen(false);
                    if (!isAuthenticated) {
                      openAuthModal();
                      return;
                    }
                    setSearchQuery('');
                    router.push(`/dashboard?query=${encodeURIComponent(q)}`);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: 'var(--accent-gold-glow)',
                    color: 'var(--accent-gold)',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    marginBottom: '0.4rem',
                    border: '1px dashed var(--accent-gold)'
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Research claim: "{searchQuery}"
                  </span>
                  <ArrowRight size={14} style={{ flexShrink: 0, marginLeft: '0.5rem' }} />
                </div>
              )}

              <div 
                style={{ 
                  fontSize: '0.65rem', 
                  letterSpacing: '0.14em', 
                  textTransform: 'uppercase', 
                  color: 'var(--text-muted)', 
                  fontWeight: 700,
                  padding: '0.25rem 0.6rem' 
                }}
              >
                {searchQuery.trim() ? 'Matching Sessions' : 'Recent Research Sessions'}
              </div>

              {(() => {
                const q = searchQuery.trim().toLowerCase();
                const filtered = q
                  ? sessions.filter(s => s.title.toLowerCase().includes(q) || s.query.toLowerCase().includes(q))
                  : sessions;

                if (filtered.length === 0) {
                  return (
                    <div style={{ padding: '0.85rem 0.6rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {searchQuery.trim() ? 'No matching prior sessions. Press Enter to research claim.' : 'No previous research sessions.'}
                    </div>
                  );
                }

                return filtered.slice(0, 8).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setSearchOpen(false);
                      if (!isAuthenticated) {
                        openAuthModal();
                        return;
                      }
                      setSearchQuery('');
                      router.push(`/dashboard?query=${encodeURIComponent(s.query)}`);
                    }}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.2rem',
                      padding: '0.5rem 0.65rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                      marginBottom: '0.2rem'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {s.title}
                      </span>
                      {s.verdict && (
                        <span 
                          style={{ 
                            fontSize: '0.62rem', 
                            fontWeight: 700, 
                            padding: '0.15rem 0.4rem', 
                            borderRadius: '4px',
                            background: s.verdict_color ? `${s.verdict_color}22` : 'rgba(245, 158, 11, 0.15)',
                            color: s.verdict_color || '#f59e0b',
                            flexShrink: 0
                          }}
                        >
                          {s.verdict.includes('BARRED') ? 'BARRED' : 'PATENTABLE'}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.query}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
        </div>

        {/* Regimes Dropdown */}
        <div style={{ position: 'relative' }}>
          <select
            value={regime}
            onChange={(e) => setRegime(e.target.value)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.35rem 1.75rem 0.35rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="All Regimes">All Regimes (Global)</option>
            <option value="India Only">India (IPA 1970)</option>
            <option value="WIPO Only">WIPO / Genetic Resources</option>
            <option value="US/EPO Only">USPTO & EPO Only</option>
          </select>
          <ChevronDown 
            size={12} 
            style={{ 
              position: 'absolute', 
              right: '0.65rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none',
              color: 'var(--text-muted)' 
            }} 
          />
        </div>

        {/* Language Selector */}
        <div style={{ position: 'relative' }}>
          <select
            value={language}
            onChange={(e) => handleLanguageSelect(e.target.value as SupportedLanguage)}
            style={{
              appearance: 'none',
              WebkitAppearance: 'none',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.35rem 1.75rem 0.35rem 2rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="EN">English</option>
            <option value="HI">हिन्दी (Hindi)</option>
            <option value="MR">मराठी (Marathi)</option>
            <option value="SA">संस्कृतम् (Sanskrit)</option>
          </select>
          <Globe 
            size={12} 
            style={{ 
              position: 'absolute', 
              left: '0.65rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none',
              color: 'var(--accent-gold)' 
            }} 
          />
          <ChevronDown 
            size={12} 
            style={{ 
              position: 'absolute', 
              right: '0.65rem', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              pointerEvents: 'none',
              color: 'var(--text-muted)' 
            }} 
          />
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-highlight)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isDark ? (
            <Sun size={16} style={{ color: 'var(--accent-amber)' }} />
          ) : (
            <Moon size={16} style={{ color: 'var(--accent-gold)' }} />
          )}
        </button>

        {/* Status indicator */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.35rem 0.75rem',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '999px',
            fontSize: '0.74rem',
            fontWeight: 600,
            color: 'var(--accent-emerald)'
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', boxShadow: '0 0 8px var(--accent-emerald)' }} />
          <span>Statutory AI Ready</span>
        </div>

        {/* Authentication & User Section */}
        {profile || user ? (
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
                border: '1.5px solid var(--border-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
                padding: 0,
                overflow: 'hidden',
                boxShadow: 'var(--shadow-glow)'
              }}
              title={`Logged in as ${displayName}`}
            >
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  referrerPolicy="no-referrer"
                />
              ) : (
                initials
              )}
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '42px',
                  width: '240px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-highlight)',
                  borderRadius: '14px',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5), 0 0 20px var(--accent-gold-glow)',
                  padding: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem',
                  zIndex: 100
                }}
              >
                {/* User Header */}
                <div style={{ padding: '0.5rem 0.75rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayEmail}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: 'var(--accent-gold)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '0.3rem' }}>
                    {profile?.role || 'Lead IP Analyst'}
                  </div>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <User size={15} style={{ color: 'var(--accent-gold)' }} />
                  <span>Researcher Profile</span>
                </Link>

                <Link
                  href="/bookmarks"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Bookmark size={15} style={{ color: 'var(--accent-gold)' }} />
                  <span>Bookmarked Patents</span>
                </Link>

                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-glass-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <SettingsIcon size={15} style={{ color: 'var(--accent-gold)' }} />
                  <span>Settings & Cloud Status</span>
                </Link>

                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0' }} />

                <button
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await signOut();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    color: 'var(--accent-crimson)',
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <LogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={() => openAuthModal('signin')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'transparent',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-highlight)';
                e.currentTarget.style.color = 'var(--accent-gold)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
            >
              <span>Sign In</span>
            </button>

            <button
              onClick={() => openAuthModal('signup')}
              className="btn-gold"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.95rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span>Sign Up</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
