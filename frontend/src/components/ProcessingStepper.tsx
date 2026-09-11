"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ShieldCheck, Languages, Leaf, Scale, Database, Gavel, Check, Loader2,
} from 'lucide-react';

interface Stage {
  id: string;
  label: string;
  detail: string;
  icon: React.ReactNode;
}

/**
 * Visual progression stepper: Search Input → Processing AI → Verdict Engine.
 * Each stage mirrors a real pipeline phase (DPDP scrub → NLP/ontology →
 * statutory brain → hybrid retrieval → verdict). Advances on a timer while
 * mounted; the parent unmounts it the moment the verdict arrives.
 */
const STAGES: Stage[] = [
  { id: 'input', label: 'Search Input', detail: 'Query captured + jurisdiction locked', icon: <Search size={15} /> },
  { id: 'dpdp', label: 'DPDP Scrub', detail: 'PII redaction under DPDP Act 2023', icon: <ShieldCheck size={15} /> },
  { id: 'nlp', label: 'NLP & Ontology', detail: 'EN/HI/MR detection → Latin binomials → TKDL map', icon: <Languages size={15} /> },
  { id: 'brain', label: 'Statutory Brain', detail: 'Hardcoded s.3(p) · BDA s.6 · GRATK Art.3 checks', icon: <Scale size={15} /> },
  { id: 'retrieval', label: 'Hybrid Retrieval', detail: 'Track-B statutes + case law + guidelines', icon: <Database size={15} /> },
  { id: 'verdict', label: 'Verdict Engine', detail: 'Classification · gaps · routes · vault', icon: <Gavel size={15} /> },
];

const LOG_LINES = [
  '✓ Scrubbing client identifiers under DPDP Act 2023...',
  '✓ Resolving Sanskrit & vernacular taxonomy (Curcuma longa, Piper nigrum)...',
  '✓ Evaluating Section 3(p) TK bar against AFI formulary...',
  '✓ Checking BDA s.6 NBA Form III + GRATK Art.3 disclosure...',
  '✓ Retrieving case law (Turmeric · Neem · Novartis) + guidelines...',
  '✓ Assembling classification, gap map & citation vault...',
];

export default function ProcessingStepper() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActive((a) => (a < STAGES.length - 1 ? a + 1 : a));
    }, 850);
    return () => clearInterval(t);
  }, []);

  const progress = ((active + 1) / STAGES.length) * 100;

  return (
    <div style={{ width: '100%', maxWidth: '640px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h3 className="text-gradient-animated" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
          Analyzing Statutory Corpus...
        </h3>
        <span style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
          {Math.round(progress)}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', borderRadius: '999px', background: 'var(--border-color)', overflow: 'hidden' }}>
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{ height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, var(--accent-emerald), var(--accent-blue))', boxShadow: '0 0 12px var(--accent-gold-glow)' }}
        />
      </div>

      {/* Stepper */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {STAGES.map((s, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.8rem',
                padding: '0.65rem 0.9rem', borderRadius: '12px',
                background: current ? 'rgba(16,185,129,0.08)' : done ? 'rgba(16,185,129,0.03)' : 'var(--bg-input)',
                border: current ? '1px solid rgba(16,185,129,0.3)' : '1px solid var(--border-color)',
                opacity: done || current ? 1 : 0.5,
              }}
            >
              <div style={{
                width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'rgba(16,185,129,0.2)' : current ? 'rgba(16,185,129,0.12)' : 'var(--bg-secondary)',
                color: done ? 'var(--accent-emerald)' : current ? 'var(--accent-emerald)' : 'var(--text-muted)',
                border: current ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border-color)',
              }}>
                {done ? <Check size={14} /> : current ? <Loader2 size={14} style={{ animation: 'spin 1.2s linear infinite' }} /> : s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: done || current ? 'var(--text-primary)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{String(i + 1).padStart(2, '0')}</span>
                  {s.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{s.detail}</div>
              </div>
              {current && (
                <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.12)', borderRadius: '999px', padding: '0.2rem 0.55rem' }}>
                  LIVE
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Live log feed */}
      <div style={{ color: 'var(--accent-emerald)', fontFamily: 'monospace', fontSize: '0.78rem', background: 'var(--bg-elevated)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.35rem', minHeight: '150px' }}>
        {LOG_LINES.slice(0, active + 1).map((line, i) => (
          <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {line}
          </motion.p>
        ))}
        {active >= STAGES.length - 1 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
            ✓ Verdict ready — rendering engine output...
          </motion.p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        <Leaf size={12} /> Pipeline: DPDP scrub → multilingual NLP → hardcoded brain → Track-B retrieval → verdict. No query text retained.
      </div>
    </div>
  );
}
