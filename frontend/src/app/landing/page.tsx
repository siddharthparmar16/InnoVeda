"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  Scale, 
  BookOpen, 
  Search, 
  Layers, 
  Globe, 
  FileCheck2, 
  CheckCircle2, 
  ChevronRight, 
  Compass, 
  ExternalLink,
  Lock,
  Zap,
  Award,
  Database,
  Feather,
  TrendingUp,
  LogIn,
  UserPlus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function LandingPage() {
  const router = useRouter();
  const { user, profile, openAuthModal } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const isAuthenticated = Boolean(user || profile);

  const [activeTab, setActiveTab] = useState<'section3p' | 'tkdl' | 'trips'>('section3p');

  const handleCta = (mode: 'signin' | 'signup') => {
    if (isAuthenticated) {
      router.push('/dashboard');
    } else {
      router.push(`/auth?mode=${mode}`);
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        width: '100%', 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)',
        overflowX: 'hidden',
        position: 'relative'
      }}
    >
      {/* ── Ambient Background Glows ────────────────────────────────────────── */}
      <div 
        style={{
          position: 'absolute',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: '1200px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at top, var(--accent-gold-glow) 0%, transparent 70%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      {/* ── Top Floating Navigation Header ───────────────────────────────────── */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'var(--bg-glass)',
          borderBottom: '1px solid var(--border-color)',
          transition: 'all 0.25s'
        }}
      >
        <div
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          {/* Brand Logo & National Seal */}
          <Link 
            href="/landing" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.85rem', 
              textDecoration: 'none', 
              color: 'inherit' 
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
                border: '1.5px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-glow)'
              }}
            >
              <ShieldCheck size={22} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div>
              <div 
                style={{ 
                  fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
                  fontSize: '1.18rem', 
                  fontWeight: 700, 
                  letterSpacing: '0.04em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.1
                }}
              >
                IP-SAKTI SAHAYAK
              </div>
              <div 
                style={{ 
                  fontSize: '0.68rem', 
                  color: 'var(--accent-gold)', 
                  letterSpacing: '0.12em', 
                  textTransform: 'uppercase', 
                  fontWeight: 600 
                }}
              >
                National Ayurveda IP Defense
              </div>
            </div>
          </Link>

          {/* Center Navigation Links */}
          <nav 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '2rem',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: 'var(--text-secondary)'
            }}
            className="landing-desktop-nav"
          >
            <a href="#capabilities" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
              Capabilities
            </a>
            <a href="#how-it-works" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
              How It Works
            </a>
            <a href="#statutory-framework" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
              Statutory Matrix
            </a>
            <a href="#case-studies" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>
              TKDL Defense
            </a>
          </nav>

          {/* Right CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAuthenticated ? (
              <button
                onClick={() => router.push('/dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.65rem 1.35rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dark) 100%)',
                  color: 'var(--text-primary-inverse)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-glow)'
                }}
              >
                <span>Launch Workspace</span>
                <ArrowRight size={15} />
              </button>
            ) : (
              <>
                <button
                  onClick={() => handleCta('signin')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.6rem 1.15rem',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    fontWeight: 600,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <LogIn size={15} style={{ color: 'var(--accent-gold)' }} />
                  <span>Sign In</span>
                </button>

                <button
                  onClick={() => handleCta('signup')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.35rem',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dark) 100%)',
                    color: 'var(--text-primary-inverse)',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-glow)',
                    transition: 'transform 0.15s, box-shadow 0.2s'
                  }}
                >
                  <UserPlus size={15} />
                  <span>Get Started</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero Section ────────────────────────────────────────────────────── */}
      <section 
        style={{ 
          maxWidth: '1440px', 
          margin: '0 auto', 
          padding: '4.5rem 2rem 5rem', 
          position: 'relative', 
          zIndex: 1,
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: '980px', margin: '0 auto' }}>
          
          {/* Prestige Pill Badge */}
          <div 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.4rem 1.15rem',
              borderRadius: '999px',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-gold)',
              boxShadow: 'var(--shadow-glow)',
              marginBottom: '1.75rem'
            }}
          >
            <div 
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid var(--border-highlight)'
              }}
            >
              <Sparkles size={11} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <span 
              style={{ 
                fontSize: '0.74rem', 
                letterSpacing: '0.16em', 
                fontWeight: 700, 
                color: 'var(--gold)', 
                textTransform: 'uppercase'
              }}
            >
              Ministry of Ayush &amp; Smart India Hackathon 2026 Innovation
            </span>
          </div>

          {/* Grand Headline */}
          <h1 
            style={{ 
              fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
              fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              margin: '0 0 1.25rem 0',
              lineHeight: 1.15
            }}
          >
            Defending Ancient Wisdom With Modern Statutory Intelligence.
          </h1>

          {/* Subtitle */}
          <p 
            style={{ 
              fontSize: 'clamp(1.05rem, 1.8vw, 1.25rem)', 
              color: 'var(--text-secondary)', 
              maxWidth: '820px', 
              margin: '0 auto 2.75rem auto',
              lineHeight: 1.7,
              fontWeight: 400
            }}
          >
            A mission-grade intellectual property platform cross-referencing <strong style={{ color: 'var(--text-primary)' }}>450,000+ TKDL citations</strong>, Indian Patent Act Sections 3(p), 3(d), 3(e), and WIPO/CBD treaties to pre-empt biopiracy and safeguard Ayurvedic innovations.
          </p>

          {/* Primary & Secondary CTAs */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '1.25rem',
              flexWrap: 'wrap',
              marginBottom: '3.5rem'
            }}
          >
            <button
              onClick={() => handleCta('signup')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.95rem 2.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dark) 100%)',
                color: 'var(--text-primary-inverse)',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.2s'
              }}
            >
              <span>{isAuthenticated ? 'Enter Research Workspace' : 'Start Free Institutional Trial'}</span>
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => handleCta('signin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.95rem 2rem',
                borderRadius: '12px',
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-gold)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glass)',
                transition: 'all 0.2s'
              }}
            >
              <LogIn size={18} style={{ color: 'var(--accent-gold)' }} />
              <span>Researcher Sign In</span>
            </button>
          </div>

          {/* Trust Stat Ticker */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              padding: '1.75rem 2.5rem',
              borderRadius: '16px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-elevation)'
            }}
          >
            <div>
              <div style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                450,000+
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                TKDL Classical Formulations Indexed
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                100%
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Section 3(p) Non-Patentability Screening
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                4 Major
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Jurisdictions Covered (IN, EPO, US, WIPO)
              </div>
            </div>

            <div>
              <div style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '2rem', fontWeight: 700, color: 'var(--accent-gold-light)' }}>
                Zero
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Hallucinated Citations (Dual Audit Engine)
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Feature Showcase: Dual-Pane Architectural Preview ────────────────── */}
      <section 
        id="capabilities"
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '4rem 2rem 6rem',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div 
            style={{ 
              fontSize: '0.76rem', 
              color: 'var(--accent-gold)', 
              fontWeight: 700, 
              letterSpacing: '0.14em', 
              textTransform: 'uppercase',
              marginBottom: '0.65rem'
            }}
          >
            Architectural Supremacy
          </div>
          <h2 
            style={{ 
              fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
              fontSize: '2.4rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 1rem 0'
            }}
          >
            Built for Patent Examiners, Litigators, and Formulators
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '680px', margin: '0 auto', fontSize: '1rem', lineHeight: 1.6 }}>
            Every query is cross-examined by a hybrid pipeline combining deterministic Indian Patent Act heuristics with DeepSeek R1 reasoning and RAG citation grounding.
          </p>
        </div>

        {/* 3 Core Capability Cards */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '2rem',
            marginBottom: '4rem'
          }}
        >
          {/* Card 1 */}
          <div 
            className="luxury-card"
            style={{
              padding: '2.5rem 2rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-elevation)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
          >
            <div>
              <div 
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(201, 168, 106, 0.12)',
                  border: '1px solid var(--border-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  color: 'var(--accent-gold)'
                }}
              >
                <Scale size={24} />
              </div>

              <h3 
                style={{ 
                  fontFamily: "var(--font-serif), 'Cinzel', serif", 
                  fontSize: '1.35rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem' 
                }}
              >
                Section 3(p) Statutory Clearance
              </h3>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Determine patent eligibility in milliseconds. Rigorously tests formulations against the statutory bar: <em>&ldquo;an invention which in effect is traditional knowledge... is not an invention&rdquo;</em>.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-gold)', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Deterministic Rule-Chain Vetting</span>
              <CheckCircle2 size={16} />
            </div>
          </div>

          {/* Card 2 */}
          <div 
            className="luxury-card"
            style={{
              padding: '2.5rem 2rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-elevation)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
          >
            <div>
              <div 
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  color: 'var(--accent-emerald)'
                }}
              >
                <BookOpen size={24} />
              </div>

              <h3 
                style={{ 
                  fontFamily: "var(--font-serif), 'Cinzel', serif", 
                  fontSize: '1.35rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem' 
                }}
              >
                Classical Samhita Concordance
              </h3>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Automatic multi-lingual Sanskrit transliteration (Devanagari, IAST, English) matching herbs against Charaka Samhita, Bhavaprakasha, and the Ayurvedic Formulary of India.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>450k+ Prior Art Concordance</span>
              <CheckCircle2 size={16} />
            </div>
          </div>

          {/* Card 3 */}
          <div 
            className="luxury-card"
            style={{
              padding: '2.5rem 2rem',
              borderRadius: '16px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-elevation)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              transition: 'transform 0.2s, border-color 0.2s'
            }}
          >
            <div>
              <div 
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: 'rgba(59, 130, 246, 0.12)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  color: 'var(--accent-blue)'
                }}
              >
                <Globe size={24} />
              </div>

              <h3 
                style={{ 
                  fontFamily: "var(--font-serif), 'Cinzel', serif", 
                  fontSize: '1.35rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  marginBottom: '0.75rem' 
                }}
              >
                WIPO &amp; Nagoya ABS Defense
              </h3>

              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Screen formulations for mandatory National Biodiversity Authority (NBA Section 3/6) approvals and WIPO Diplomatic Treaty disclosure triggers before international filings.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', fontSize: '0.85rem', fontWeight: 600 }}>
              <span>Multilateral Treaty Compliance</span>
              <CheckCircle2 size={16} />
            </div>
          </div>
        </div>

        {/* Visual Workflow Split Deck */}
        <div 
          style={{
            borderRadius: '20px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold)',
            boxShadow: 'var(--shadow-elevation)',
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))'
          }}
        >
          {/* Left: Interactive Details */}
          <div style={{ padding: '3.5rem 3rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '0.85rem' }}>
              Statutory Prior Art Engine
            </div>

            <h3 style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '1.8rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '1rem', lineHeight: 1.25 }}>
              How IP-SAKTI Sahayak Solves Section 3(p) Fatal Objections
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Over 78% of Ayurvedic patent filings are rejected by the Indian Patent Office due to Section 3(p) and 3(e) traditional knowledge citations. Our platform equips inventors with actionable defensive carving routes.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Extraction Novelty &amp; Synergistic Bioavailability Claims</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Botanical Binomial Normalization (Withania somnifera, Curcuma longa)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Automated Form 1, Form 2, and NBA clearance checklists</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>Exportable Statutory Memos with Verifiable Citations</span>
              </div>
            </div>

            <div style={{ marginTop: '2.5rem' }}>
              <button
                onClick={() => handleCta('signup')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '10px',
                  background: 'var(--text-primary)',
                  color: 'var(--bg-primary)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-glass)'
                }}
              >
                <span>Try a Live Formulation Query</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Right: Illustration Plate */}
          <div 
            style={{ 
              position: 'relative', 
              minHeight: '380px',
              background: 'radial-gradient(ellipse at center, var(--bg-elevated) 0%, var(--bg-primary) 100%)',
              borderLeft: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
          >
            <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '340px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-gold)' }}>
              <Image
                src="/statutory_legal_analysis.jpg"
                alt="Statutory Legal Analysis"
                fill
                style={{ objectFit: 'cover' }}
              />
              <div 
                style={{
                  position: 'absolute',
                  bottom: '1rem',
                  left: '1rem',
                  right: '1rem',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  background: 'var(--bg-glass)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid var(--border-gold)',
                  fontSize: '0.82rem',
                  color: 'var(--text-primary)'
                }}
              >
                <div style={{ fontWeight: 700, color: 'var(--accent-gold)' }}>Section 3(p) Defense Dossier</div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Automated Statutory Opinion generation with zero citation hallucinations</div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* ── Statutory Framework Matrix ───────────────────────────────────────── */}
      <section 
        id="statutory-framework"
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '4rem 2rem 6rem',
          borderTop: '1px solid var(--border-color)',
          boxSizing: 'border-box'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.76rem', color: 'var(--accent-gold)', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '0.65rem' }}>
            Comprehensive Jurisdictional Matrix
          </div>
          <h2 style={{ fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", fontSize: '2.4rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Unified Defense Across 4 Global Frameworks
          </h2>
        </div>

        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}
        >
          {/* Box 1: India */}
          <div 
            style={{
              padding: '2rem',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-elevation)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-gold)' }} />
              <h4 style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '1.15rem', margin: 0 }}>India (IP Office)</h4>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>• Patents Act 1970 Sec 3(p) — Traditional Knowledge</li>
              <li>• Section 3(d) — Mere discovery &amp; new forms</li>
              <li>• Section 3(e) — Mere admixture &amp; synergism proof</li>
              <li>• Biological Diversity Act 2002 (NBA Form III)</li>
            </ul>
          </div>

          {/* Box 2: EPO */}
          <div 
            style={{
              padding: '2rem',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-elevation)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-blue)' }} />
              <h4 style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '1.15rem', margin: 0 }}>Europe (EPO)</h4>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>• EPC Article 54 — Novelty vs. TKDL prior art</li>
              <li>• EPC Article 56 — Problem-Solution Approach</li>
              <li>• EU Regulation 511/2014 — Nagoya ABS Compliance</li>
              <li>• Formal Opposition &amp; Third-Party Observations</li>
            </ul>
          </div>

          {/* Box 3: USPTO */}
          <div 
            style={{
              padding: '2rem',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-elevation)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
              <h4 style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '1.15rem', margin: 0 }}>United States (USPTO)</h4>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>• 35 U.S.C. 102 — Prior Art &amp; Public Use Bar</li>
              <li>• 35 U.S.C. 103 — Obviousness / KSR standard</li>
              <li>• 37 CFR 1.290 — Preissuance Submissions</li>
              <li>• Re-examination filings against biopiracy patents</li>
            </ul>
          </div>

          {/* Box 4: WIPO & CBD */}
          <div 
            style={{
              padding: '2rem',
              borderRadius: '14px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-elevation)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--accent-amber)' }} />
              <h4 style={{ fontFamily: "var(--font-serif), 'Cinzel', serif", fontSize: '1.15rem', margin: 0 }}>WIPO &amp; Multilateral</h4>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li>• WIPO Diplomatic Treaty on IP &amp; Genetic Resources</li>
              <li>• CBD Nagoya Protocol on Access &amp; Benefit Sharing</li>
              <li>• TRIPS Article 27.3(b) Traditional Knowledge Defense</li>
              <li>• Paris Convention Priority &amp; Defensive Publication</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Call to Action Banner ────────────────────────────────────────────── */}
      <section 
        style={{
          maxWidth: '1440px',
          margin: '0 auto 6rem',
          padding: '0 2rem',
          boxSizing: 'border-box'
        }}
      >
        <div 
          style={{
            padding: '4rem 3rem',
            borderRadius: '24px',
            background: 'radial-gradient(ellipse at top, var(--bg-card) 0%, var(--bg-primary) 100%)',
            border: '1.5px solid var(--border-gold)',
            boxShadow: 'var(--shadow-glow)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div 
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
              border: '1px solid var(--border-highlight)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              color: 'var(--accent-gold)'
            }}
          >
            <ShieldCheck size={32} />
          </div>

          <h2 
            style={{ 
              fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif",
              fontSize: 'clamp(2rem, 3.5vw, 2.8rem)',
              fontWeight: 600,
              color: 'var(--text-primary)',
              margin: '0 0 1rem 0'
            }}
          >
            Ready to Safeguard Your Formulation?
          </h2>

          <p 
            style={{ 
              color: 'var(--text-secondary)', 
              maxWidth: '640px', 
              margin: '0 auto 2.5rem auto',
              fontSize: '1.05rem',
              lineHeight: 1.6
            }}
          >
            Join Indian patent attorneys, AYUSH research institutes, and university researchers deploying rigorous statutory intelligence before filing.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleCta('signup')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.9rem 2.25rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, var(--accent-gold-dark) 100%)',
                color: 'var(--text-primary-inverse)',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.98rem',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.2s'
              }}
            >
              <span>Create Researcher Account</span>
              <ArrowRight size={17} />
            </button>

            <button
              onClick={() => handleCta('signin')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.9rem 2rem',
                borderRadius: '12px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: '0.98rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <LogIn size={17} style={{ color: 'var(--accent-gold)' }} />
              <span>Sign In with Existing ID</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer 
        style={{
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          padding: '3rem 2rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}
      >
        <div 
          style={{
            maxWidth: '1440px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <ShieldCheck size={20} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>IP-SAKTI Sahayak</span>
            <span>• Ministry of Ayush / SIH 2026 Smart Statutory Defense</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--text-secondary)' }}>
            <Link href="/library" style={{ color: 'inherit', textDecoration: 'none' }}>Library</Link>
            <Link href="/compare" style={{ color: 'inherit', textDecoration: 'none' }}>Comparative Law</Link>
            <Link href="/bookmarks" style={{ color: 'inherit', textDecoration: 'none' }}>Saved Dossiers</Link>
            <Link href="/settings" style={{ color: 'inherit', textDecoration: 'none' }}>Statutory Engines</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
