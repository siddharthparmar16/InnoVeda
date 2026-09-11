"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  BookOpen, 
  ExternalLink, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AuthGate from '@/components/AuthGate';

interface SourceDoc {
  id: string;
  title: string;
  tag: string;
  domain: string;
  status: string;
  docCount: string;
  description: string;
  keySections: string[];
  lastUpdated: string;
}

const sourceList: SourceDoc[] = [
  {
    id: 'ipa_1970',
    title: 'Indian Patent Act, 1970',
    tag: 'NATIONAL • INDIA',
    domain: 'Patent Law',
    status: 'Indexed',
    docCount: '162 Sections, 4 Schedules',
    description: 'Primary Indian statutory code governing patentability, non-patentable subject matter, and traditional knowledge exclusion.',
    keySections: ['Section 3(p) - Traditional knowledge exclusion', 'Section 3(d) - Incremental efficacy requirement', 'Section 3(e) - Mere admixture prohibition', 'Section 10(4)(ii)(D) - Mandatory biological material disclosure'],
    lastUpdated: 'Amended 2005 & Patent Rules 2024'
  },
  {
    id: 'tkdl',
    title: 'Traditional Knowledge Digital Library',
    tag: 'INDIA',
    domain: 'Traditional Knowledge',
    status: 'Indexed',
    docCount: '450,000+ Formulations',
    description: 'Digital repository translating classical Ayurvedic, Unani, Siddha, and Sowa-Rigpa texts into IPC-compatible prior art search entries.',
    keySections: ['Ayurvedic Formulary of India (AFI)', 'Charaka Samhita formulation prior art', 'Sushruta Samhita surgical references', 'Ashtanga Hridaya compound preparations'],
    lastUpdated: 'Live Access Agreement DB'
  },
  {
    id: 'wipo_tk',
    title: 'WIPO Traditional Knowledge Resources',
    tag: 'INTERNATIONAL',
    domain: 'Traditional Knowledge',
    status: 'Indexed',
    docCount: 'IGC Treaties & Toolkits',
    description: 'World Intellectual Property Organization Intergovernmental Committee on Intellectual Property and Genetic Resources, Traditional Knowledge and Folklore.',
    keySections: ['WIPO Diplomatic Conference 2024 Treaty on Genetic Resources', 'Defensive Protection Database Toolkits', 'Model Provisions for National Laws'],
    lastUpdated: 'Geneva Treaty May 2024'
  },
  {
    id: 'trips',
    title: 'TRIPS Agreement',
    tag: 'INTERNATIONAL',
    domain: 'International IP',
    status: 'Indexed',
    docCount: 'WTO Multilateral Code',
    description: 'Agreement on Trade-Related Aspects of Intellectual Property Rights standards, patent exceptions, and biodiversity linkages.',
    keySections: ['Article 27.1 - Patentable Subject Matter', 'Article 27.2 - Public Order & Morality', 'Article 27.3(b) - Plants, Animals & Biological Processes', 'Article 29 - Disclosure Conditions'],
    lastUpdated: 'WTO Doha Declaration Align'
  },
  {
    id: 'gi_act',
    title: 'Geographical Indications Framework',
    tag: 'NATIONAL',
    domain: 'GI Protection',
    status: 'Indexed',
    docCount: 'GI Registry Bulletins',
    description: 'Geographical Indications of Goods (Registration and Protection) Act, 1999 defending community origin and terroir certifications.',
    keySections: ['Section 2(e) - Definition of Geographical Indication', 'Section 9 - Prohibition of Certain Marks', 'Section 21 - Exclusive Rights of Authorized Users', 'Section 22 - Infringement & Passing-Off Protection'],
    lastUpdated: 'Updated Registry Gazette'
  },
  {
    id: 'ayurvedic_reg',
    title: 'Ayurvedic Regulatory Resources',
    tag: 'INDIA',
    domain: 'Ayurveda',
    status: 'Indexed',
    docCount: 'Pharmacopoeial Standards',
    description: 'Ayurvedic Pharmacopoeia of India (API) standards, Ministry of AYUSH regulatory circulars, and Drugs & Cosmetics Act Chapter IVA.',
    keySections: ['Drugs & Cosmetics Act 1940 (Section 33EE)', 'Ayurvedic Pharmacopoeia of India (API Parts I & II)', 'Schedule T - Good Manufacturing Practices (GMP)', 'AYUSH Guidelines for Clinical Evidence'],
    lastUpdated: 'AYUSH Pharmacopoeia Commission'
  }
];

export default function LibraryPage() {
  const { user, profile, isLoading } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [selectedDoc, setSelectedDoc] = useState<SourceDoc | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredSources = sourceList.filter(s => 
    s.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.domain.toLowerCase().includes(filterQuery.toLowerCase()) ||
    s.tag.toLowerCase().includes(filterQuery.toLowerCase())
  );

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
        title="Statutory Source Library Locked" 
        subtitle="Repository Clearance Required"
        description="Access to full text Indian Patent Acts, TKDL formulary extracts, and WIPO diplomatic treaties is restricted to authenticated researchers." 
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

      {/* Header Info */}
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
          INNOVEDA KNOWLEDGE BASE
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
          Source Library
        </h1>
        <p style={{ fontSize: '0.98rem', color: 'var(--text-secondary)', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
          Browse the legal, regulatory and traditional-knowledge sources that support InnoVeda's research responses.
        </p>
      </div>

      {/* Search & Filter bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.65rem 1rem',
          maxWidth: '460px',
          marginBottom: '2rem'
        }}
      >
        <Search size={16} style={{ color: 'var(--text-muted)', marginRight: '0.75rem' }} />
        <input 
          type="text"
          placeholder="Filter sources by title, domain or tag..."
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          style={{
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.88rem',
            width: '100%'
          }}
        />
      </div>

      {/* Sources Grid */}
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem',
          marginBottom: '3rem'
        }}
      >
        {filteredSources.map((source) => (
          <div
            key={source.id}
            onClick={() => setSelectedDoc(source)}
            className="luxury-card"
            style={{
              padding: '1.75rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '210px'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <span 
                  style={{ 
                    fontSize: '0.66rem', 
                    letterSpacing: '0.14em', 
                    fontWeight: 700, 
                    color: 'var(--accent-gold)',
                    textTransform: 'uppercase'
                  }}
                >
                  {source.tag}
                </span>
                <span 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.35rem', 
                    fontSize: '0.72rem', 
                    color: 'var(--accent-emerald)',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    fontWeight: 600
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
                  {source.status}
                </span>
              </div>

              <h3 
                style={{ 
                  fontFamily: "var(--font-serif), Georgia, serif", 
                  fontSize: '1.25rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  margin: '0 0 0.35rem 0',
                  lineHeight: 1.3
                }}
              >
                {source.title}
              </h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '0.75rem' }}>
                {source.domain}
              </div>
            </div>

            <div 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-color)',
                paddingTop: '0.85rem',
                marginTop: '0.5rem'
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Source document
              </span>
              <span 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.3rem', 
                  fontSize: '0.82rem', 
                  fontWeight: 600, 
                  color: 'var(--accent-gold)' 
                }}
              >
                View details →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Source Grounded Answers Banner */}
      <div 
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-highlight)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-glass)'
        }}
      >
        <div 
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--accent-gold-glow)',
            border: '1px solid var(--border-highlight)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-gold)',
            flexShrink: 0
          }}
        >
          <Sparkles size={20} />
        </div>
        <div>
          <h4 
            style={{ 
              margin: '0 0 0.25rem 0', 
              fontSize: '1rem', 
              fontWeight: 600, 
              color: 'var(--text-primary)',
              fontFamily: "var(--font-serif), Georgia, serif"
            }}
          >
            Source grounded answers
          </h4>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            When the RAG backend is connected, retrieved documents will appear here as supporting evidence for AI responses.
          </p>
        </div>
      </div>

      {/* Details Modal */}
      {selectedDoc && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedDoc(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(16px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-highlight)',
              borderRadius: '20px',
              maxWidth: '640px',
              width: '100%',
              padding: '2rem',
              boxShadow: 'var(--shadow-glass)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setSelectedDoc(null)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'var(--bg-glass-hover)',
                border: 'none',
                color: 'var(--text-secondary)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>

            <span 
              style={{ 
                fontSize: '0.68rem', 
                letterSpacing: '0.16em', 
                fontWeight: 700, 
                color: 'var(--accent-gold)',
                textTransform: 'uppercase'
              }}
            >
              {selectedDoc.tag}
            </span>

            <h2 
              style={{ 
                fontFamily: "var(--font-serif), Georgia, serif", 
                fontSize: '1.6rem', 
                fontWeight: 600, 
                color: 'var(--text-primary)',
                margin: '0.4rem 0 0.5rem 0'
              }}
            >
              {selectedDoc.title}
            </h2>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              {selectedDoc.description}
            </p>

            <div style={{ background: 'var(--bg-sidebar)', borderRadius: '12px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-gold)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                Key Statutory Provisions / Corpus
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-primary)', fontSize: '0.85rem', lineHeight: 1.7 }}>
                {selectedDoc.keySections.map((sec, idx) => (
                  <li key={idx}>{sec}</li>
                ))}
              </ul>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>Indexed Volume: <strong style={{ color: 'var(--text-primary)' }}>{selectedDoc.docCount}</strong></span>
              <span>{selectedDoc.lastUpdated}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
