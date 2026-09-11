"use client";
import React, { useMemo, useState } from 'react';
import {
  X, ShieldCheck, ExternalLink, Copy, Check, Fingerprint,
  Scale, BookOpen, Gavel, FileSearch, Database, Landmark, ScrollText,
} from 'lucide-react';
import {
  EvidenceSpan,
  RetrievalPack,
  StatutoryCitation,
} from '@/types/domain';

/** SHA-256 via WebCrypto (async). Returns lowercase hex. */
async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hashBindingInput(c: StatutoryCitation): string {
  return `${c.act_title}|${c.citation_code}|${c.text_snippet}|${c.version_tag ?? ''}`;
}

/** Renders canonical text with evidence spans highlighted + numbered. */
function SpannedText({ text, spans }: { text: string; spans?: EvidenceSpan[] }) {
  const clean = useMemo(() => {
    if (!spans || spans.length === 0) return null;
    const valid = spans
      .filter((s) => s.start >= 0 && s.end <= text.length && s.end > s.start)
      .sort((a, b) => a.start - b.start);
    // Drop overlaps, keep first
    const merged: typeof valid = [];
    for (const s of valid) {
      if (merged.some((e) => s.start < e.end && s.end > e.start)) continue;
      merged.push(s);
    }
    return merged;
  }, [text, spans]);

  if (!clean || clean.length === 0) {
    return <span>{text}</span>;
  }

  const parts: React.ReactNode[] = [];
  let cursor = 0;
  clean.forEach((s, i) => {
    if (s.start > cursor) {
      parts.push(
        <span key={`t${i}`} style={{ opacity: 0.75 }}>
          {text.slice(cursor, s.start)}
        </span>
      );
    }
    parts.push(
      <mark
        key={`m${i}`}
        style={{
          background: 'rgba(16, 185, 129, 0.22)',
          borderBottom: '2px solid var(--accent-emerald)',
          borderRadius: '3px',
          padding: '0.1rem 0.15rem',
          color: 'var(--text-primary)',
        }}
      >
        {text.slice(s.start, s.end)}
        <sup
          style={{
            fontSize: '0.6rem',
            background: 'var(--accent-emerald)',
            color: 'var(--text-primary-inverse)',
            borderRadius: '999px',
            padding: '0 0.25rem',
            marginLeft: '0.25rem',
            fontWeight: 800,
          }}
        >
          {i + 1}
        </sup>
      </mark>
    );
    cursor = s.end;
  });
  if (cursor < text.length) {
    parts.push(
      <span key="tail" style={{ opacity: 0.75 }}>
        {text.slice(cursor)}
      </span>
    );
  }
  return <>{parts}</>;
}

function ScoreBadge({ score }: { score?: number }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = score >= 0.5 ? '#6ee7b7' : score >= 0.25 ? '#fcd34d' : '#93c5fd';
  return (
    <span
      title="Track-B hybrid relevance score"
      style={{
        fontSize: '0.7rem', fontWeight: 700, color,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: '999px', padding: '0.15rem 0.5rem',
      }}
    >
      relevance {(pct)}%
    </span>
  );
}

export interface VaultSelection {
  citation: StatutoryCitation;
  claimTitle: string;
  claimDescription: string;
  stepId?: string;
}

interface Props {
  selection: VaultSelection;
  retrievalPack?: RetrievalPack;
  onClose: () => void;
}

export default function CitationVaultDrawer({ selection, retrievalPack, onClose }: Props) {
  const { citation: c, claimTitle, claimDescription } = selection;
  const [copied, setCopied] = useState(false);
  const [verifyState, setVerifyState] = useState<'idle' | 'verifying' | 'match' | 'mismatch' | 'error'>('idle');

  const isHardcoded = (selection.stepId ?? '').startsWith('hardcoded-');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(c.sha256_hash ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — no-op */
    }
  };

  const handleVerify = async () => {
    setVerifyState('verifying');
    try {
      const recomputed = await sha256Hex(hashBindingInput(c));
      setVerifyState(recomputed === (c.sha256_hash ?? '').toLowerCase() ? 'match' : 'mismatch');
    } catch {
      setVerifyState('error');
    }
  };

  const spans = c.evidence_spans ?? [];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        background: 'rgba(2, 6, 23, 0.65)', backdropFilter: 'blur(3px)',
        display: 'flex', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(560px, 94vw)', height: '100%', overflowY: 'auto',
          background: 'var(--bg-card)',
          borderLeft: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-elevated)',
          padding: '1.5rem',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', color: 'var(--accent-emerald)', background: 'rgba(45, 122, 91, 0.12)', border: '1px solid rgba(45, 122, 91, 0.3)', borderRadius: '999px', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                <ShieldCheck size={11} /> CITATION VAULT
              </span>
              {isHardcoded && (
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-amber)', background: 'rgba(184, 126, 30, 0.12)', border: '1px solid rgba(184, 126, 30, 0.35)', borderRadius: '999px', padding: '0.2rem 0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Gavel size={11} /> HARDCODED
                </span>
              )}
              <ScoreBadge score={c.retrieval_score} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.35 }}>
              {c.act_title} ({c.citation_code})
            </h3>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {c.heading}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', borderRadius: '10px', width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <X size={16} />
          </button>
        </div>

        {/* 1. Claim → evidence mapping */}
        <div style={{ background: 'rgba(43, 108, 176, 0.08)', border: '1px solid rgba(43, 108, 176, 0.22)', borderRadius: '12px', padding: '0.9rem', marginBottom: '0.9rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
            <FileSearch size={12} /> AI CLAIM → SUPPORTING SPAN
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>{claimTitle}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>{claimDescription}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', marginTop: '0.5rem' }}>
            Supported by {spans.length > 0 ? <strong>span{spans.length > 1 ? 's' : ''} {spans.map((_, i) => i + 1).join(', ')}</strong> : 'full text'} in the canonical section below.
          </div>
        </div>

        {/* 2. Span-highlighted canonical text */}
        <div style={{ background: 'var(--bg-elevated)', padding: '1.1rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-emerald)', fontFamily: 'Georgia, serif', lineHeight: 1.8, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.9rem' }}>
          <SpannedText text={c.text_snippet} spans={spans} />
          {c.explanation && (
            <div style={{ marginTop: '0.9rem', fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', fontFamily: 'inherit' }}>
              <strong>Statutory meaning:</strong> {c.explanation}
            </div>
          )}
        </div>

        {/* 3. Provenance + hash */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.9rem', marginBottom: '0.9rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.55rem' }}>
            <Fingerprint size={12} /> CRYPTOGRAPHIC PROVENANCE
          </div>
          <div style={{ display: 'grid', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            <div><strong style={{ color: 'var(--text-primary)' }}>Authority:</strong> {c.authority ?? '—'}</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Version:</strong> {c.version_tag ?? '—'}</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Gazette ref:</strong> {c.gazette_ref ?? '—'}</div>
            <div><strong style={{ color: 'var(--text-primary)' }}>Retrieval:</strong> {c.retrieval_method ?? 'unverified'}{c.retrieval_score != null ? ` · relevance ${Math.round(c.retrieval_score * 100)}%` : ''}</div>
          </div>
          <div style={{ marginTop: '0.6rem', background: 'var(--bg-card)', borderRadius: '8px', padding: '0.6rem', border: '1px dashed var(--border-color)' }}>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.25rem' }}>SHA-256 (act | code | canonical text | version)</div>
            <div style={{ fontSize: '0.72rem', fontFamily: 'ui-monospace, monospace', color: 'var(--accent-emerald)', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {c.sha256_hash ?? 'UNVERIFIED'}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.55rem', flexWrap: 'wrap' }}>
              <button onClick={handleCopy} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.7rem', borderRadius: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy hash'}
              </button>
              <button onClick={handleVerify} disabled={verifyState === 'verifying'} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', padding: '0.35rem 0.7rem', borderRadius: '8px', background: 'rgba(45, 122, 91, 0.12)', border: '1px solid rgba(45, 122, 91, 0.3)', color: 'var(--accent-emerald)', cursor: 'pointer' }}>
                <ShieldCheck size={13} /> {verifyState === 'verifying' ? 'Verifying…' : 'Verify hash'}
              </button>
              {verifyState === 'match' && <span style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', alignSelf: 'center' }}>✓ Text matches pinned version</span>}
              {verifyState === 'mismatch' && <span style={{ fontSize: '0.75rem', color: 'var(--accent-crimson)', alignSelf: 'center' }}>⚠ Hash mismatch — text drift detected</span>}
              {verifyState === 'error' && <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', alignSelf: 'center' }}>Verification unavailable in this browser</span>}
            </div>
          </div>
          {c.source_url && (
            <a href={c.source_url} target="_blank" rel="noreferrer" style={{ marginTop: '0.6rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-blue)', background: 'rgba(43, 108, 176, 0.1)', border: '1px solid rgba(43, 108, 176, 0.25)', borderRadius: '10px', padding: '0.5rem 0.85rem', textDecoration: 'none' }}>
              <ExternalLink size={14} /> {c.source_label ?? 'Open official source'}
            </a>
          )}
        </div>

        {/* 4. Retrieval pack */}
        {retrievalPack && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.9rem' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.07em', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.55rem' }}>
              <Database size={12} /> TRACK-B HYBRID RETRIEVAL · {retrievalPack.took_ms}ms
            </div>

            {retrievalPack.case_law.length > 0 && (
              <div style={{ marginBottom: '0.7rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                  <Landmark size={12} /> CASE LAW ({retrievalPack.case_law.length})
                </div>
                {retrievalPack.case_law.map((h) => (
                  <div key={h.doc_id} style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '0.55rem 0.65rem', marginBottom: '0.4rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{h.citation_code} · relevance {Math.round(h.score * 100)}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>{h.snippet}…</div>
                    {h.source_url && (
                      <a href={h.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.3rem' }}>
                        {h.source_label ?? 'Official source'} <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {retrievalPack.guidelines.length > 0 && (
              <div style={{ marginBottom: '0.7rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                  <ScrollText size={12} /> GUIDELINES ({retrievalPack.guidelines.length})
                </div>
                {retrievalPack.guidelines.map((h) => (
                  <div key={h.doc_id} style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '0.55rem 0.65rem', marginBottom: '0.4rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{h.title}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{h.citation_code} · relevance {Math.round(h.score * 100)}%</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>{h.snippet}…</div>
                    {h.source_url && (
                      <a href={h.source_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.72rem', color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.3rem' }}>
                        {h.source_label ?? 'Official source'} <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {retrievalPack.statutes.length > 0 && (
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.35rem' }}>
                  <BookOpen size={12} /> STATUTORY SECTIONS ({retrievalPack.statutes.length})
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {retrievalPack.statutes.map((h) => (
                    <span key={h.doc_id} title={h.title} style={{ fontSize: '0.7rem', background: 'rgba(45, 122, 91, 0.08)', border: '1px solid rgba(45, 122, 91, 0.2)', color: 'var(--accent-emerald)', borderRadius: '999px', padding: '0.2rem 0.55rem' }}>
                      {h.citation_code} · {Math.round(h.score * 100)}%
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.7rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              <Scale size={12} /> Hybrid lexical + botanical + jurisdiction scoring over the statutory corpus, case law & guidelines.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
