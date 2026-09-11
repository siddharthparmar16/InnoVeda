"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, Globe, CheckCircle2, Info, ArrowRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthGate from '@/components/AuthGate';

const comparisonData = [
  {
    topic: 'Patentability',
    india: 'Indian Patent Act 1970 Sections 3(p), 3(d), 3(e). Strict absolute bar against traditional knowledge and mere admixtures.',
    international: 'TRIPS Article 27.1, EPC Article 52. Standard novelty, non-obviousness, and industrial applicability without explicit traditional knowledge exclusion bar.',
    status: 'Strict Divergence'
  },
  {
    topic: 'Traditional Knowledge',
    india: 'Defensive TKDL integration at Patent Office level + National Biodiversity Authority (NBA) approval required for biological resource patents.',
    international: 'WIPO IGC draft treaties, voluntary registries, and bilateral access and benefit-sharing (ABS) mechanisms.',
    status: 'Harmonizing'
  },
  {
    topic: 'GI Protection',
    india: 'Geographical Indications of Goods Act 1999 provides robust protection for community rights, terroir, and registered authorized users.',
    international: 'TRIPS Article 22-24, Lisbon Agreement and Geneva Act (2015) for international appellations of origin.',
    status: 'Standardized'
  },
  {
    topic: 'Mandatory Disclosure',
    india: 'Mandatory under Section 10(4)(ii)(D) to declare source and geographical origin of biological material. Non-disclosure is ground for revocation (Sec 64).',
    international: 'Framework dependent. New WIPO Treaty (May 2024) mandates disclosure of genetic resources in patent applications worldwide.',
    status: 'Landmark Accord'
  }
];

export default function CompareRegimesPage() {
  const { user, profile, isLoading } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);

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
        title="Comparative Regimes Locked" 
        subtitle="Regime Comparison Clearance Required"
        description="Cross-jurisdictional statutory divergence analysis between Indian Patent Act and international regimes requires authenticated researcher credentials." 
      />
    );
  }

  return (
    <div 
      style={{ 
        minHeight: 'calc(100vh - 64px)', 
        padding: '2.5rem 2rem 5rem', 
        maxWidth: '1400px', 
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

      {/* Title */}
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
          COMPARATIVE RESEARCH
        </div>
        <h1 
          style={{ 
            fontFamily: "var(--font-serif), 'Cinzel', Georgia, serif", 
            fontSize: '2.4rem', 
            fontWeight: 500, 
            color: 'var(--text-primary)', 
            letterSpacing: '-0.01em',
            margin: '0 0 0.5rem 0'
          }}
        >
          Compare Regimes
        </h1>
        <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
          Compare how intellectual property concepts are approached across jurisdictions.
        </p>
      </div>

      {/* Top Two Jurisdiction Cards */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '2.5rem' 
        }}
      >
        {/* India Card */}
        <div
          className="luxury-card"
          style={{
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1.5px solid var(--border-highlight)',
            boxShadow: 'var(--shadow-glass)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <span 
              style={{ 
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: '1.4rem', 
                fontWeight: 700, 
                color: 'var(--accent-gold)' 
              }}
            >
              IN
            </span>
            <span 
              style={{ 
                fontSize: '0.68rem', 
                letterSpacing: '0.14em', 
                fontWeight: 700, 
                color: 'var(--accent-emerald)', 
                background: 'rgba(16, 185, 129, 0.1)', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '999px' 
              }}
            >
              PRIMARY JURISDICTION
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            NATIONAL
          </div>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: '1.5rem', color: 'var(--text-primary)', margin: '0.2rem 0 0.75rem 0' }}>
            India
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            Indian patent, GI and traditional knowledge framework governed by Patents Act 1970, TKDL prior art library and National Biodiversity Authority.
          </p>
        </div>

        {/* International Card */}
        <div
          className="luxury-card"
          style={{
            padding: '2rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div 
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: 'rgba(59, 130, 246, 0.15)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'var(--accent-blue)' 
              }}
            >
              <Globe size={18} />
            </div>
            <span 
              style={{ 
                fontSize: '0.68rem', 
                letterSpacing: '0.14em', 
                fontWeight: 700, 
                color: 'var(--accent-blue)', 
                background: 'rgba(59, 130, 246, 0.1)', 
                padding: '0.2rem 0.6rem', 
                borderRadius: '999px' 
              }}
            >
              MULTILATERAL
            </span>
          </div>

          <div style={{ fontSize: '0.72rem', letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            INTERNATIONAL
          </div>
          <h2 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: '1.5rem', color: 'var(--text-primary)', margin: '0.2rem 0 0.75rem 0' }}>
            WIPO / TRIPS
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
            International intellectual property frameworks, WIPO Intergovernmental Committee protocols, TRIPS Article 27 exceptions, and the Nagoya Protocol.
          </p>
        </div>
      </div>

      {/* Comparative Table */}
      <div 
        className="luxury-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          marginBottom: '3rem'
        }}
      >
        <div 
          style={{ 
            display: 'grid', 
            gridTemplateColumns: '1.2fr 2fr 2fr', 
            padding: '1.1rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--bg-sidebar)',
            fontSize: '0.74rem',
            letterSpacing: '0.12em',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--text-muted)'
          }}
        >
          <div>Topic</div>
          <div style={{ color: 'var(--accent-gold)' }}>IN India</div>
          <div style={{ color: 'var(--accent-blue)' }}>International (WIPO/TRIPS)</div>
        </div>

        {comparisonData.map((row, idx) => (
          <div
            key={idx}
            onClick={() => setSelectedTopic(selectedTopic === idx ? null : idx)}
            style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 2fr 2fr',
              padding: '1.5rem 1.75rem',
              borderBottom: idx === comparisonData.length - 1 ? 'none' : '1px solid var(--border-color)',
              background: selectedTopic === idx ? 'var(--accent-gold-glow)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
          >
            <div>
              <div 
                style={{ 
                  fontFamily: "var(--font-serif), Georgia, serif", 
                  fontSize: '1.05rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  marginBottom: '0.35rem'
                }}
              >
                {row.topic}
              </div>
              <span 
                style={{ 
                  fontSize: '0.7rem', 
                  padding: '0.15rem 0.5rem', 
                  borderRadius: '999px',
                  background: 'var(--bg-glass-hover)',
                  color: 'var(--text-secondary)',
                  fontWeight: 500
                }}
              >
                {row.status}
              </span>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55, paddingRight: '1.5rem' }}>
              {row.india}
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
              {row.international}
            </div>
          </div>
        ))}
      </div>

      {/* CTA to research under chosen regime */}
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '1.25rem 2rem' 
        }}
      >
        <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 500 }}>
          Need to audit a specific claim against both Indian and International standards?
        </span>
        <Link
          href="/dashboard"
          className="btn-gold"
          style={{ padding: '0.6rem 1.4rem', fontSize: '0.86rem', fontWeight: 600 }}
        >
          <span>Launch Comparative Audit</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
