"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Moon, Sun, Globe, Shield, LogOut, Check, Cpu, Database, Sparkles, ExternalLink } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import AuthGate from '@/components/AuthGate';

export default function SettingsPage() {
  const { theme, toggleTheme, isDark, setTheme } = useTheme();
  const { user, profile, signOut, openAuthModal, isConfigured, isLoading } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [modelEngine, setModelEngine] = useState('DeepSeek R1 + Deterministic Hybrid');
  const [signedOut, setSignedOut] = useState(false);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ textAlign: 'center', color: 'var(--accent-gold)' }}>
          <div style={{ width: '36px', height: '36px', margin: '0 auto 1.25rem auto', border: '2px solid rgba(201, 168, 106, 0.2)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.88rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Verifying Researcher Clearance...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGate 
        title="Settings & Cloud Status Locked" 
        subtitle="Researcher Clearance Required" 
        description="To configure statutory preferences, API engines, and audit synchronization, please sign in with your researcher credentials." 
      />
    );
  }

  const handleSignOut = async () => {
    await signOut();
    setSignedOut(true);
    setTimeout(() => setSignedOut(false), 3000);
  };

  return (
    <div 
      style={{ 
        minHeight: 'calc(100vh - 64px)', 
        padding: '2.5rem 3.5rem 5rem', 
        maxWidth: '860px', 
        margin: '0 auto',
        boxSizing: 'border-box'
      }}
    >
      {/* Back Link */}
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          textDecoration: 'none',
          marginBottom: '1.5rem',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-gold)'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <ArrowLeft size={14} />
        <span>Back to Research</span>
      </Link>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div 
          style={{ 
            fontSize: '0.7rem', 
            letterSpacing: '0.18em', 
            fontWeight: 700, 
            color: 'var(--accent-gold)', 
            textTransform: 'uppercase',
            marginBottom: '0.4rem'
          }}
        >
          PREFERENCES
        </div>
        <h1 
          style={{ 
            fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
            fontSize: '2.4rem', 
            fontWeight: 500, 
            color: 'var(--text-primary)', 
            letterSpacing: '-0.01em',
            margin: 0
          }}
        >
          Settings
        </h1>
      </div>

      {/* Settings Boxes Stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Appearance Box */}
        <div className="luxury-card" style={{ padding: '1.75rem 2rem' }}>
          <div 
            style={{ 
              fontSize: '0.68rem', 
              letterSpacing: '0.16em', 
              fontWeight: 700, 
              color: 'var(--accent-gold)', 
              textTransform: 'uppercase',
              marginBottom: '1.25rem'
            }}
          >
            APPEARANCE
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {isDark ? <Moon size={16} style={{ color: 'var(--accent-gold)' }} /> : <Sun size={16} style={{ color: 'var(--accent-amber)' }} />}
                <span>{isDark ? 'Night Archive (Dark Mode)' : 'Day Archive (Light Mode)'}</span>
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {isDark ? 'Currently using ultra-deep obsidian noir dark research environment' : 'Currently using royal alabaster light research environment'}
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={toggleTheme}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              style={{
                width: '52px',
                height: '28px',
                borderRadius: '999px',
                background: isDark ? 'var(--accent-gold)' : '#cbd5e1',
                border: 'none',
                position: 'relative',
                cursor: 'pointer',
                transition: 'background 0.25s'
              }}
            >
              <div 
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: isDark ? 'var(--bg-primary)' : '#ffffff',
                  position: 'absolute',
                  top: '3px',
                  left: isDark ? '26px' : '3px',
                  transition: 'left 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px'
                }}
              >
                {isDark ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </div>

        {/* Research Preferences Box */}
        <div className="luxury-card" style={{ padding: '1.75rem 2rem' }}>
          <div 
            style={{ 
              fontSize: '0.68rem', 
              letterSpacing: '0.16em', 
              fontWeight: 700, 
              color: 'var(--accent-gold)', 
              textTransform: 'uppercase',
              marginBottom: '1.25rem'
            }}
          >
            RESEARCH
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Default Language
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Language used for statutory verdicts and research responses
              </div>
            </div>

            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.45rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="English">English</option>
              <option value="हिंदी">हिंदी (Hindi)</option>
              <option value="मराठी">मराठी (Marathi)</option>
              <option value="संस्कृतम्">संस्कृतम् (Sanskrit)</option>
              <option value="தமிழ்">தமிழ் (Tamil)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                Statutory Reasoning Engine
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                Verification chain combining deterministic statutory rules and LLM validation
              </div>
            </div>

            <select
              value={modelEngine}
              onChange={(e) => setModelEngine(e.target.value)}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.45rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="DeepSeek R1 + Deterministic Hybrid">DeepSeek R1 + Deterministic (Default)</option>
              <option value="Gemini 2.5 Pro Fallback">Gemini 2.5 Pro Fallback Chain</option>
              <option value="Local Air-Gapped Sandbox">Local Air-Gapped Sandbox (Offline)</option>
            </select>
          </div>
        </div>

        {/* Supabase Cloud Database Box */}
        <div className="luxury-card" style={{ padding: '1.75rem 2rem' }}>
          <div 
            style={{ 
              fontSize: '0.68rem', 
              letterSpacing: '0.16em', 
              fontWeight: 700, 
              color: 'var(--accent-gold)', 
              textTransform: 'uppercase',
              marginBottom: '1.25rem'
            }}
          >
            SUPABASE CLOUD DATABASE
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px', 
                  borderRadius: '10px', 
                  background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
                  border: '1px solid var(--border-highlight)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent-gold)'
                }}
              >
                <Database size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  PostgreSQL & Auth State
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {isConfigured 
                    ? 'Connected to live Supabase project. Real-time RLS active.' 
                    : 'Running in Local Sandbox mode. Add keys to .env.local for live cloud sync.'}
                </div>
              </div>
            </div>

            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.45rem', 
                padding: '0.4rem 0.85rem', 
                borderRadius: '999px',
                fontSize: '0.76rem',
                fontWeight: 600,
                background: isConfigured ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: isConfigured ? 'var(--accent-emerald)' : '#f59e0b',
                border: isConfigured ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConfigured ? 'var(--accent-emerald)' : '#f59e0b' }} />
              <span>{isConfigured ? 'Supabase Connected' : 'Sandbox Fallback'}</span>
            </div>
          </div>

          <div 
            style={{ 
              background: 'var(--bg-secondary)', 
              borderRadius: '8px', 
              padding: '0.85rem 1rem', 
              fontSize: '0.8rem', 
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Database Schema:</span>
              <strong style={{ color: 'var(--text-primary)' }}>profiles, research_sessions, bookmarks</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SQL Migration:</span>
              <span style={{ color: 'var(--accent-gold)' }}>frontend/supabase/schema.sql</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Environment Target:</span>
              <span style={{ color: 'var(--text-primary)' }}>frontend/.env.local</span>
            </div>
          </div>
        </div>

        {/* Account Box */}
        <div className="luxury-card" style={{ padding: '1.75rem 2rem' }}>
          <div 
            style={{ 
              fontSize: '0.68rem', 
              letterSpacing: '0.16em', 
              fontWeight: 700, 
              color: 'var(--accent-gold)', 
              textTransform: 'uppercase',
              marginBottom: '1.25rem'
            }}
          >
            AUTHENTICATED RESEARCHER ACCOUNT
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.98rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                {profile || user ? 'Active Research Session' : 'Guest Mode'}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                {profile || user ? (
                  <>
                    Logged in as <strong style={{ color: 'var(--accent-gold)' }}>{profile?.full_name || user?.email}</strong>
                  </>
                ) : (
                  'Sign in with Google to synchronize research history and statutory bookmarks across devices'
                )}
              </div>
            </div>

            {profile || user ? (
              <button
                onClick={handleSignOut}
                style={{
                  background: signedOut ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-glass-hover)',
                  border: signedOut ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                  color: signedOut ? 'var(--accent-emerald)' : 'var(--text-primary)',
                  padding: '0.5rem 1.4rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  transition: 'all 0.2s'
                }}
              >
                {signedOut ? (
                  <>
                    <Check size={14} />
                    <span>Session Cleared</span>
                  </>
                ) : (
                  <>
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={openAuthModal}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '8px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign In with Google</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
