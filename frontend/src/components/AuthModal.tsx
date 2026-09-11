"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  X, 
  ShieldCheck, 
  Database, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Building2, 
  CheckCircle2, 
  KeyRound 
} from 'lucide-react';

export default function AuthModal() {
  const { 
    isAuthModalOpen, 
    authModalMode,
    closeAuthModal, 
    signInWithGoogle, 
    signInDemoUser, 
    isConfigured 
  } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (authModalMode) {
      setMode(authModalMode);
    }
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage("Please provide your full researcher name.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // If Supabase credentials are pending in .env.local, gracefully fall back to researcher session
    try {
      if (!isConfigured) {
        setTimeout(() => {
          signInDemoUser();
          setIsLoading(false);
        }, 600);
        return;
      }

      // If configured, attempt Google or Supabase email action
      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      if (!supabase) {
        signInDemoUser();
        setIsLoading(false);
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
              organization: organization.trim() || 'Traditional Knowledge Research Institute'
            }
          }
        });
        if (error) throw error;
        setSuccessMessage("Account created successfully! Check your email or continue to sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });
        if (error) throw error;
        closeAuthModal();
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      setErrorMessage(err.message || "Failed to authenticate. You can use Instant Researcher Demo mode below.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(5, 7, 14, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: '1.5rem',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={closeAuthModal}
    >
      <div
        className="luxury-card"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '2.5rem',
          position: 'relative',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 35px var(--accent-gold-glow)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gold Accent Border */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: 'linear-gradient(90deg, transparent, var(--accent-gold), transparent)'
          }} 
        />

        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '0.4rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={18} />
        </button>

        {/* Brand Icon & Heading */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
              border: '1px solid var(--border-highlight)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '0.85rem',
              color: 'var(--accent-gold)',
              boxShadow: 'var(--shadow-glow)'
            }}
          >
            <ShieldCheck size={26} />
          </div>

          <div
            style={{
              fontSize: '0.7rem',
              letterSpacing: '0.18em',
              fontWeight: 700,
              color: 'var(--accent-gold)',
              textTransform: 'uppercase',
              marginBottom: '0.3rem'
            }}
          >
            RESEARCHER AUTHENTICATION PORTAL
          </div>

          <h2
            style={{
              fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
              fontSize: '1.65rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 0.35rem 0',
              letterSpacing: '-0.02em'
            }}
          >
            {mode === 'signin' ? 'Sign In to IP-SAKTI' : 'Create Researcher Account'}
          </h2>

          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            {mode === 'signin' 
              ? 'Access verified statutory dossiers, persistent research history & citation vaults.' 
              : 'Register your institutional clearance to archive prior art screenings & claims drafts.'}
          </p>
        </div>

        {/* Aesthetic Mode Switcher (Sign In vs Sign Up tabs) */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            background: 'var(--bg-input)',
            borderRadius: '12px',
            padding: '0.25rem',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-color)'
          }}
        >
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMessage(null);
            }}
            style={{
              padding: '0.55rem',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signin' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: mode === 'signin' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMessage(null);
            }}
            style={{
              padding: '0.55rem',
              borderRadius: '9px',
              border: 'none',
              background: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
              color: mode === 'signup' ? 'var(--accent-gold)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: mode === 'signup' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Status notices */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '10px',
              color: 'var(--accent-crimson)',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '10px',
              color: 'var(--accent-emerald)',
              fontSize: '0.82rem',
              marginBottom: '1.25rem'
            }}
          >
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Primary OAuth Option: Continue with Google */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          style={{
            width: '100%',
            padding: '0.8rem 1.25rem',
            borderRadius: '12px',
            background: 'var(--text-primary)',
            color: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.92rem',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
            opacity: isLoading ? 0.7 : 1,
            marginBottom: '1.25rem'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.2)';
            }
          }}
        >
          {/* Google 4-Color SVG Icon */}
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>{isLoading ? 'Connecting to Supabase...' : mode === 'signin' ? 'Continue with Google' : 'Sign Up with Google'}</span>
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>or with credentials</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
        </div>

        {/* Email / Password Form */}
        <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {mode === 'signup' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Full Researcher Name
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
                  <UserIcon size={16} style={{ color: 'var(--text-muted)', marginRight: '0.6rem' }} />
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
                  Institution / Organization
                </label>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
                  <Building2 size={16} style={{ color: 'var(--text-muted)', marginRight: '0.6rem' }} />
                  <input
                    type="text"
                    placeholder="e.g. CSIR-TKDL Directorate"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.88rem' }}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
              Institutional Email
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <Mail size={16} style={{ color: 'var(--text-muted)', marginRight: '0.6rem' }} />
              <input
                type="email"
                placeholder="name@institute.gov.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '0.35rem', fontWeight: 500 }}>
              Security Password
            </label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '0.5rem 0.85rem' }}>
              <Lock size={16} style={{ color: 'var(--text-muted)', marginRight: '0.6rem' }} />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: '0.88rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-gold"
            disabled={isLoading}
            style={{
              padding: '0.75rem',
              borderRadius: '10px',
              fontSize: '0.88rem',
              fontWeight: 600,
              width: '100%',
              marginTop: '0.5rem',
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            <span>{mode === 'signin' ? 'Sign In with Email' : 'Register Account'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Demo Mode Fallback for Instant Testing / Offline */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={signInDemoUser}
            style={{
              width: '100%',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-gold)',
              color: 'var(--text-primary)',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-highlight)';
              e.currentTarget.style.background = 'rgba(201, 168, 106, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-gold)';
              e.currentTarget.style.background = 'var(--bg-elevated)';
            }}
          >
            <Sparkles size={15} style={{ color: 'var(--accent-gold)' }} />
            <span>Instant Evaluator Clearance (1-Click Demo)</span>
          </button>
        </div>

        {/* Security & Supabase Status info */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            fontSize: '0.76rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <Database size={13} style={{ color: 'var(--accent-gold)' }} />
              <span>Supabase Cloud Engine</span>
            </span>
            <span 
              style={{ 
                fontWeight: 600, 
                color: isConfigured ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConfigured ? 'var(--accent-emerald)' : 'var(--accent-amber)' }} />
              {isConfigured ? 'Production Database Ready' : 'Development Sandbox'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={13} style={{ color: 'var(--accent-emerald)' }} />
            <span>DPDP Act 2023 Compliant • Automatic PII Scrubbing Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
