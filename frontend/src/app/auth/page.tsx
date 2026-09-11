"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Lock, 
  Mail, 
  User as UserIcon, 
  Building2, 
  Scale, 
  FileCheck2, 
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Compass
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();
  const { 
    user, 
    profile, 
    signInWithGoogle, 
    signInDemoUser, 
    isConfigured, 
    isLoading: authLoading 
  } = useAuth();

  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [organization, setOrganization] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (user || profile) {
      router.push('/dashboard');
    }
  }, [user, profile, router]);

  const handleGoogleAuth = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage("Please enter your full researcher name.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (!isConfigured) {
        // Fallback demo login when Supabase is unconfigured
        setTimeout(() => {
          signInDemoUser();
          setLoading(false);
          router.push('/dashboard');
        }, 600);
        return;
      }

      const { getSupabaseClient } = await import('@/lib/supabase/client');
      const supabase = getSupabaseClient();
      if (!supabase) {
        signInDemoUser();
        setLoading(false);
        router.push('/dashboard');
        return;
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              full_name: fullName.trim(),
              organization: organization.trim() || 'Ayurveda Intellectual Property Cell'
            }
          }
        });
        if (error) throw error;
        setSuccessMessage("Verification link sent to your email. Please check your inbox.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim()
        });
        if (error) throw error;
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoAccess = () => {
    signInDemoUser();
    router.push('/dashboard');
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        width: '100%', 
        display: 'flex', 
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background ambient lighting */}
      <div 
        style={{
          position: 'absolute',
          top: '-20%',
          right: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />
      <div 
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* Left Prestige Brand Banner (hidden on mobile) */}
      <div 
        style={{
          flex: '1 1 45%',
          borderRight: '1px solid var(--border-color)',
          background: 'radial-gradient(ellipse at center, var(--bg-card) 0%, var(--bg-primary) 100%)',
          padding: '4rem 5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
        className="auth-hero-pane"
      >
        <div>
          {/* Top Return Link & Logo */}
          <Link 
            href="/landing" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.88rem',
              marginBottom: '3.5rem',
              transition: 'color 0.2s'
            }}
          >
            <ChevronLeft size={18} />
            <span>Return to Landing Page</span>
          </Link>

          {/* Emblem & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
            <div 
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '14px',
                background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
                border: '1.5px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <ShieldCheck size={26} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div>
              <div 
                style={{ 
                  fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
                  fontSize: '1.3rem', 
                  fontWeight: 700, 
                  letterSpacing: '0.04em',
                  color: 'var(--text-primary)' 
                }}
              >
                IP-SAKTI SAHAYAK
              </div>
              <div 
                style={{ 
                  fontSize: '0.72rem', 
                  color: 'var(--accent-gold)', 
                  letterSpacing: '0.14em', 
                  textTransform: 'uppercase', 
                  fontWeight: 600 
                }}
              >
                National Statutory Intelligence Engine
              </div>
            </div>
          </div>

          <h2 
            style={{ 
              fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
              fontSize: '2.2rem',
              lineHeight: 1.25,
              fontWeight: 600,
              marginBottom: '1.25rem',
              color: 'var(--text-primary)'
            }}
          >
            Empowering rigorous defense of India&apos;s ancient medicinal heritage.
          </h2>

          <p 
            style={{ 
              fontSize: '1rem', 
              lineHeight: 1.7, 
              color: 'var(--text-secondary)',
              maxWidth: '480px',
              marginBottom: '3rem'
            }}
          >
            Instant clearance checks across Indian Patent Act Section 3(p), 3(d), 3(e), 450,000+ TKDL prior art records, and WIPO Traditional Knowledge Treaties.
          </p>

          {/* Three Assurance Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '440px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(201, 168, 106, 0.12)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Scale size={15} style={{ color: 'var(--accent-gold)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Section 3(p) Pre-emption</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Avoid unpatentability objections before filing your provisional application.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <FileCheck2 size={15} style={{ color: 'var(--accent-emerald)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>TKDL Citation Concordance</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Full alignment with Charaka, Sushruta, and Ayurvedic Formulary of India.</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Compass size={15} style={{ color: 'var(--accent-blue)' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>Global Export Viability</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>Pre-empt EPO Article 54 and USPTO 35 U.S.C. 102 prior art citations.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info in left pane */}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', paddingTop: '2.5rem' }}>
          National AYUSH IPR Mission • Autonomous Statutory Intelligence Suite
        </div>
      </div>

      {/* Right Interaction Form Pane */}
      <div 
        style={{
          flex: '1 1 55%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '3rem 2.5rem',
          position: 'relative',
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ width: '100%', maxWidth: '440px' }}>
          
          {/* Mobile Back Link */}
          <Link 
            href="/landing" 
            style={{ 
              display: 'none', 
              alignItems: 'center', 
              gap: '0.4rem', 
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              marginBottom: '1.5rem'
            }}
            className="auth-mobile-back"
          >
            <ChevronLeft size={16} /> Return to Landing Page
          </Link>

          {/* Form Header */}
          <div style={{ marginBottom: '2rem' }}>
            <div 
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                padding: '0.35rem 0.85rem', 
                borderRadius: '999px', 
                background: 'var(--bg-elevated)', 
                border: '1px solid var(--border-gold)',
                fontSize: '0.72rem',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '1rem'
              }}
            >
              <Sparkles size={12} />
              <span>Researcher Portal Access</span>
            </div>

            <h1 
              style={{ 
                fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
                fontSize: '1.9rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: '0 0 0.5rem 0'
              }}
            >
              {mode === 'signin' ? 'Sign In to Your Workspace' : 'Create Researcher Account'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {mode === 'signin' 
                ? 'Enter your institutional credentials or authenticate via Google.' 
                : 'Join researchers, attorneys, and patent examiners protecting Indian IP.'}
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div 
            style={{
              display: 'flex',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '4px',
              marginBottom: '1.75rem'
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: '7px',
                background: mode === 'signin' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'signin' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: mode === 'signin' ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: mode === 'signin' ? 'var(--shadow-glow)' : 'none',
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
                setSuccessMessage(null);
              }}
              style={{
                flex: 1,
                padding: '0.65rem',
                border: 'none',
                borderRadius: '7px',
                background: mode === 'signup' ? 'var(--bg-card)' : 'transparent',
                color: mode === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: mode === 'signup' ? 600 : 500,
                fontSize: '0.88rem',
                cursor: 'pointer',
                boxShadow: mode === 'signup' ? 'var(--shadow-glow)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              Sign Up
            </button>
          </div>

          {/* Error / Success Notifications */}
          {errorMessage && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: '9px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.85rem 1rem',
                borderRadius: '9px',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: 'var(--accent-emerald)',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleAuth}
            disabled={loading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.85rem',
              padding: '0.85rem',
              borderRadius: '10px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: 'var(--shadow-elevation)',
              transition: 'border-color 0.2s, transform 0.15s',
              marginBottom: '1.25rem'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Divider */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              margin: '1.25rem 0', 
              color: 'var(--text-muted)',
              fontSize: '0.78rem'
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span>OR VIA INSTITUTIONAL EMAIL</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {mode === 'signup' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Full Legal / Researcher Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <UserIcon size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="e.g. Dr. Ramesh Vaidya"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        borderRadius: '9px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                    Affiliated Institution / Research Firm
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Building2 size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="e.g. Central Council for Research in Ayurvedic Sciences"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem 0.75rem 2.6rem',
                        borderRadius: '9px',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  placeholder="researcher@ayush.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: '9px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Master Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: '9px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.85rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dark) 100%)',
                color: 'var(--text-primary-inverse)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: 'var(--shadow-glow)',
                transition: 'transform 0.15s, opacity 0.2s'
              }}
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>{mode === 'signin' ? 'Sign In to Portal' : 'Register Researcher Account'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Instant Demo Sandbox Access */}
          <div 
            style={{
              marginTop: '1.75rem',
              padding: '1rem',
              borderRadius: '10px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-gold)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.65rem' }}>
              Exploring or presenting at SIH 2026?
            </div>
            <button
              type="button"
              onClick={handleQuickDemoAccess}
              style={{
                background: 'transparent',
                border: '1px dashed var(--border-highlight)',
                borderRadius: '8px',
                padding: '0.5rem 1rem',
                color: 'var(--accent-gold)',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.2s'
              }}
            >
              <KeyRound size={14} />
              <span>Continue as Senior Patent Examiner (Demo)</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
