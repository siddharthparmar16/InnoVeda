"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  Search, 
  Scale, 
  Sprout, 
  Tag, 
  Globe, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const knowledgeDomains = [
  {
    id: 'patents',
    title: 'Patents',
    subtitle: 'Patentability & protection',
    description: 'Indian Patent Act 1970 Sections 3(p), 3(d), 3(e) prior art vetting and eligibility assessment.',
    icon: Scale,
    query: 'Indian Patent Act Section 3(p) criteria for Ayurvedic formulation patentability'
  },
  {
    id: 'ayurveda',
    title: 'Ayurveda',
    subtitle: 'Formulations & knowledge',
    description: 'TKDL cross-referencing, Classical Ayurvedic texts, botanical taxonomy and prior disclosures.',
    icon: Sprout,
    query: 'Ayurvedic formulations containing Withania somnifera and prior art defense'
  },
  {
    id: 'gi_tags',
    title: 'GI Tags',
    subtitle: 'Geographical Indications',
    description: 'Geographical Indications of Goods Act 1999 registration, community rights and enforcement.',
    icon: Tag,
    query: 'Process and requirements for obtaining a Geographical Indication (GI) tag in India'
  },
  {
    id: 'international_ip',
    title: 'International IP',
    subtitle: 'WIPO, TRIPS & global regimes',
    description: 'Multilateral treaties, CBD / Nagoya Protocol ABS compliance, EPO & USPTO defensive tactics.',
    icon: Globe,
    query: 'WIPO and TRIPS provisions regarding traditional knowledge protection and biopiracy prevention'
  }
];

const suggestedQueries = [
  {
    text: "Can I patent an Ayurvedic formulation in India?",
    category: "Indian Patent Law",
    query: "Can I patent an Ayurvedic formulation in India under Section 3(p) of the Patents Act?"
  },
  {
    text: "What is WIPO's position on traditional knowledge?",
    category: "International Regimes",
    query: "What is WIPO's formal position and treaty framework on traditional knowledge?"
  },
  {
    text: "What is the process for obtaining a GI tag?",
    category: "GI Protection",
    query: "What is the legal process and statutory requirements for obtaining a GI tag in India?"
  }
];

export default function HomePage() {
  const router = useRouter();
  const { user, profile, openAuthModal } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [searchQuery, setSearchQuery] = useState('');
  const [bottomQuery, setBottomQuery] = useState('');

  const handleSearch = (query: string) => {
    if (!query.trim()) return;
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    router.push(`/dashboard?query=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div 
      style={{ 
        minHeight: 'calc(100vh - 64px)', 
        padding: '3rem 3.5rem 6rem', 
        maxWidth: '1280px', 
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box'
      }}
    >
      {/* Central Emblem */}
      <div 
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          border: '1.5px solid var(--border-highlight)',
          background: 'radial-gradient(circle, var(--accent-gold-glow) 0%, var(--bg-card) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)',
          marginBottom: '1.5rem'
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="var(--accent-gold-glow)" />
          <circle cx="12" cy="12" r="3.5" stroke="var(--accent-gold-light)" strokeWidth="1.2" />
        </svg>
      </div>

      {/* Domain Category Ribbon */}
      <div 
        style={{ 
          fontSize: '0.72rem', 
          letterSpacing: '0.22em', 
          fontWeight: 700, 
          color: 'var(--gold)', 
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
          textAlign: 'center'
        }}
      >
        AYURVEDA • INTELLECTUAL PROPERTY • REGULATION
      </div>

      {/* Main Hero Title */}
      <h1 
        style={{ 
          fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
          fontSize: '3.2rem', 
          fontWeight: 500, 
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          textAlign: 'center',
          margin: '0 0 1rem 0',
          lineHeight: 1.15
        }}
      >
        What will you research today?
      </h1>

      {/* Subtitle */}
      <p 
        style={{ 
          fontSize: '1.05rem', 
          color: 'var(--text-secondary)', 
          maxWidth: '680px', 
          textAlign: 'center', 
          lineHeight: 1.6,
          margin: '0 0 2.5rem 0',
          fontWeight: 400
        }}
      >
        Explore intellectual property, traditional knowledge, Ayurvedic formulations and regulatory frameworks through source-cited AI research.
      </p>

      {/* Main Search Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSearch(searchQuery);
        }}
        style={{
          width: '100%',
          maxWidth: '780px',
          position: 'relative',
          marginBottom: '3.5rem'
        }}
      >
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '999px',
            padding: '0.5rem 0.65rem 0.5rem 1.4rem',
            boxShadow: 'var(--shadow-elevation)',
            transition: 'border-color 0.25s, box-shadow 0.25s'
          }}
        >
          <Search size={19} style={{ color: 'var(--text-muted)', marginRight: '0.85rem', flexShrink: 0 }} />
          <input 
            type="text"
            placeholder="Ask a legal or regulatory question..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.02rem',
              padding: '0.45rem 0'
            }}
          />
          <button 
            type="submit"
            className="btn-gold"
            style={{
              padding: '0.7rem 1.6rem',
              borderRadius: '999px',
              fontSize: '0.92rem',
              fontWeight: 600,
              flexShrink: 0,
              cursor: 'pointer'
            }}
          >
            <span>Research</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </form>

      {/* Section: KNOWLEDGE DOMAINS */}
      <div style={{ width: '100%', maxWidth: '1040px', marginBottom: '3rem' }}>
        <div 
          style={{ 
            fontSize: '0.7rem', 
            letterSpacing: '0.18em', 
            fontWeight: 700, 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase',
            marginBottom: '1rem',
            paddingLeft: '0.25rem'
          }}
        >
          KNOWLEDGE DOMAINS
        </div>

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', 
            gap: '1.25rem' 
          }}
        >
          {knowledgeDomains.map((domain) => {
            const Icon = domain.icon;
            return (
              <div
                key={domain.id}
                onClick={() => handleSearch(domain.query)}
                className="luxury-card"
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div 
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(201, 168, 106, 0.12)',
                    border: '1px solid rgba(201, 168, 106, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--gold)'
                  }}
                >
                  <Icon size={19} />
                </div>

                <div>
                  <h3 
                    style={{ 
                      fontSize: '1.05rem', 
                      fontWeight: 600, 
                      color: 'var(--text-primary)', 
                      margin: '0 0 0.25rem 0',
                      fontFamily: "var(--font-serif), Georgia, serif"
                    }}
                  >
                    {domain.title}
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {domain.subtitle}
                  </div>
                </div>

                <div 
                  style={{ 
                    fontSize: '0.78rem', 
                    color: 'var(--text-muted)', 
                    lineHeight: 1.45,
                    marginTop: 'auto'
                  }}
                >
                  {domain.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section: SUGGESTED RESEARCH */}
      <div style={{ width: '100%', maxWidth: '1040px', marginBottom: '3.5rem' }}>
        <div 
          style={{ 
            fontSize: '0.7rem', 
            letterSpacing: '0.18em', 
            fontWeight: 700, 
            color: 'var(--text-muted)', 
            textTransform: 'uppercase',
            marginBottom: '1rem',
            paddingLeft: '0.25rem'
          }}
        >
          SUGGESTED RESEARCH
        </div>

        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: '1.25rem' 
          }}
        >
          {suggestedQueries.map((item, index) => (
            <div
              key={index}
              onClick={() => handleSearch(item.query)}
              className="luxury-card"
              style={{
                padding: '1.4rem 1.5rem',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '130px'
              }}
            >
              <div>
                <span style={{ color: 'var(--gold)', fontSize: '1.4rem', fontFamily: 'Georgia, serif', lineHeight: 1 }}>
                  “
                </span>
                <p 
                  style={{ 
                    fontSize: '0.94rem', 
                    color: 'var(--text-primary)', 
                    fontWeight: 500, 
                    lineHeight: 1.5,
                    margin: '0.35rem 0 1rem 0' 
                  }}
                >
                  {item.text}
                </p>
              </div>

              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.35rem', 
                  fontSize: '0.78rem', 
                  fontWeight: 600, 
                  color: 'var(--gold)',
                  letterSpacing: '0.04em'
                }}
              >
                <span>RESEARCH</span>
                <ArrowRight size={13} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Statutory Studio Callout Banner */}
      <div 
        style={{
          width: '100%',
          maxWidth: '1040px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-gold)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          marginBottom: '3rem',
          boxShadow: 'var(--shadow-elevation)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div 
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'rgba(201, 168, 106, 0.15)',
              border: '1px solid rgba(201, 168, 106, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              flexShrink: 0
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 
              style={{ 
                margin: '0 0 0.25rem 0', 
                fontSize: '1.05rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                fontFamily: "var(--font-serif), Georgia, serif"
              }}
            >
              Full Statutory Intelligence Studio
            </h4>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Multi-regime statutory rule engine, deterministic Section 3(p)/3(d) validation, and citation vault.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="btn-gold"
          style={{
            padding: '0.65rem 1.4rem',
            fontSize: '0.88rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
        >
          <span>Open Studio</span>
          <ChevronRight size={16} />
        </Link>
      </div>

      {/* Bottom Floating Quick Search Bar & Disclaimer */}
      <div 
        style={{ 
          width: '100%', 
          maxWidth: '820px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: '0.75rem' 
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(bottomQuery);
          }}
          style={{ width: '100%' }}
        >
          <div 
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '999px',
              padding: '0.4rem 0.5rem 0.4rem 1.25rem',
              backdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow-elevation)'
            }}
          >
            <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '0.75rem' }} />
            <input 
              type="text"
              placeholder="Ask about patents, GI tags, traditional knowledge..."
              value={bottomQuery}
              onChange={(e) => setBottomQuery(e.target.value)}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.9rem'
              }}
            />
            <button 
              type="submit"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                padding: '0.45rem 1.25rem',
                borderRadius: '999px',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(201, 168, 106, 0.2)';
                e.currentTarget.style.borderColor = 'rgba(201, 168, 106, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-elevated)';
                e.currentTarget.style.borderColor = 'var(--border-color)';
              }}
            >
              Ask
            </button>
          </div>
        </form>

        <p 
          style={{ 
            fontSize: '0.74rem', 
            color: 'var(--text-muted)', 
            textAlign: 'center', 
            margin: 0,
            lineHeight: 1.4 
          }}
        >
          InnoVeda provides informational guidance only and is not a substitute for professional legal advice.
        </p>
      </div>
    </div>
  );
}
