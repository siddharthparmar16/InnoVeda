"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { Search, Languages, Leaf, Mic, MicOff, Sparkles, ChevronDown, ChevronUp, Globe, FlaskConical, Target, Lightbulb, Check, X } from 'lucide-react';
import { detectLanguage, getLanguageDisplayName } from '@/lib/nlp/language-detector';
import { resolveBotanicalEntities } from '@/lib/domain-engine/botanical-resolver';
import { normalizeQueryText, VERNACULAR_SYNONYMS } from '@/lib/domain-engine/transliteration-normalizer';
import { SupportedLanguage, Jurisdiction } from '@/types/domain';

export interface PanelPrefill {
  text: string;
  nonce: number;
}

interface AdvancedInputPanelProps {
  initialQuery?: string;
  language: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  jurisdiction: Jurisdiction;
  onAnalyze: (enrichedQuery: string, meta: { ingredients: string[]; intendedUse: string; targetMarket: string }) => void;
  isProcessing: boolean;
  onVoiceToggle: () => void;
  isListening: boolean;
  /** One-click demo scenarios populate the textarea (nonce changes = refill). */
  prefill?: PanelPrefill | null;
}

const INTENDED_USE_OPTIONS = [
  'Joint pain / Arthritis (Sandhivata)',
  'Wound healing',
  'Cough & respiratory',
  'Digestive / Metabolic',
  'Skin / Dermatological',
  'Immunity / Rasayana',
  'Diabetes / Prameha',
  'Other (custom)'
];

const TARGET_MARKETS: { value: string; label: string }[] = [
  { value: 'INDIA', label: '🇮🇳 India — Patents Act + BDA 2023' },
  { value: 'INTERNATIONAL', label: '🌐 International — WIPO GRATK 2024' },
  { value: 'USPTO', label: '🇺🇸 United States (USPTO)' },
  { value: 'EPO', label: '🇪🇺 Europe (EPO)' },
];

export default function AdvancedInputPanel({
  language,
  onLanguageChange,
  jurisdiction,
  onAnalyze,
  isProcessing,
  onVoiceToggle,
  isListening: parentListening,
  prefill
}: AdvancedInputPanelProps) {
  const [query, setQuery] = useState('');
  const [ingredients, setIngredients] = useState('');
  const [intendedUse, setIntendedUse] = useState('');
  const [customUse, setCustomUse] = useState('');
  const [targetMarket, setTargetMarket] = useState<string>(jurisdiction);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);
  const [internalListening, setInternalListening] = useState(false);
  const isListening = parentListening || internalListening;

  // Live NLP derives
  const detectedLang: SupportedLanguage = useMemo(() => detectLanguage(query), [query]);
  const detectedNeedsSwitch = autoDetect && query.trim().length > 3 && detectedLang !== language;

  const normalizedPreview = useMemo(() => {
    if (!query.trim()) return '';
    return normalizeQueryText(query);
  }, [query]);

  const resolvedEntities = useMemo(() => {
    const combined = [query, ingredients].filter(Boolean).join(' ');
    if (!combined.trim()) return [];
    return resolveBotanicalEntities(combined);
  }, [query, ingredients]);

  const vernacularMappings = useMemo(() => {
    const lower = query.toLowerCase();
    const hits: { vernacular: string; canonical: string }[] = [];
    for (const [vernacular, sanskrit] of Object.entries(VERNACULAR_SYNONYMS)) {
      if (lower.includes(vernacular.toLowerCase()) && hits.length < 6) {
        // avoid duplicate canonical
        if (!hits.some(h => h.canonical === sanskrit)) hits.push({ vernacular, canonical: sanskrit });
      }
    }
    return hits;
  }, [query]);

  // Auto switch language when detection confident
  useEffect(() => {
    if (autoDetect && query.trim().length > 8 && detectedLang !== language) {
      // debounce a bit
      const t = setTimeout(() => onLanguageChange(detectedLang), 600);
      return () => clearTimeout(t);
    }
  }, [detectedLang, query]);

  // Demo-scenario prefill: populate the textarea (live NLP reacts instantly)
  useEffect(() => {
    if (prefill && prefill.text) {
      setQuery(prefill.text);
      setShowAdvanced(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill?.nonce]);

  // Keep target market in sync when the parent jurisdiction toggle changes
  useEffect(() => {
    setTargetMarket(jurisdiction);
  }, [jurisdiction]);

  const handleAnalyze = () => {
    const parts: string[] = [];
    if (query.trim()) parts.push(query.trim());
    if (ingredients.trim()) parts.push(`Ingredients: ${ingredients.trim()}.`);
    const finalUse = intendedUse === 'Other (custom)' ? customUse : intendedUse;
    if (finalUse.trim()) parts.push(`Intended use: ${finalUse.trim()}.`);
    if (targetMarket) parts.push(`Target market: ${targetMarket}.`);
    const enriched = parts.join(' ');
    onAnalyze(enriched || query, {
      ingredients: ingredients.split(',').map(s => s.trim()).filter(Boolean),
      intendedUse: finalUse,
      targetMarket
    });
  };

  const hasContent = query.trim().length > 3 || ingredients.trim().length > 2 || (intendedUse && intendedUse !== 'Other (custom)') || (intendedUse === 'Other (custom)' && customUse.trim().length > 2);
  const canSubmit = hasContent && !isProcessing;

  return (
    <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '20px', textAlign: 'left' }}>
      {/* Header row: Language auto-detect + NLP badges */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '999px', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Languages size={14} className="text-emerald" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--accent-emerald)' }}>ADVANCED INPUT &amp; NLP LAYER</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', border: '1px dashed var(--border-color)', borderRadius: '999px', padding: '0.2rem 0.6rem' }}>
            Bhashini-ready · TKDL-aware
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={autoDetect} onChange={e => setAutoDetect(e.target.checked)} style={{ accentColor: '#10b981' }} />
          Auto-detect & normalize (EN/HI/MR)
        </label>
      </div>

      {/* Main large textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={
            language === 'HI'
              ? 'विस्तार से लिखें — जैसे: मैं हल्दी (हरिद्रा) और काली मिर्च (मरिच) को जोड़ों के दर्द के लिए एक नए अनुपात में उपयोग करके पेटेंट करना चाहता हूँ… उद्देश्य, सामग्री और बाजार भी नीचे जोड़ें।'
              : language === 'MR'
              ? 'तपशीलवार लिहा — उदा. मला हळद (हरिद्रा) आणि मिरी (मरिच) यांचे नवीन प्रमाण वापरून सांधेदुखीसाठी पेटंट हवे आहे… उद्देश, घटक आणि बाजार खाली जोडा.'
              : 'Describe in detail — e.g., I want to patent a novel 3:1 ratio of Haridra (turmeric) and Maricha (black pepper) for joint pain with improved bioavailability… Add ingredients, intended use and market below.'
          }
          rows={5}
          style={{
            width: '100%',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1rem 3.2rem 1rem 1rem',
            color: 'var(--text-primary)',
            fontSize: '1.02rem',
            lineHeight: 1.6,
            outline: 'none',
            resize: 'vertical',
            fontFamily: 'inherit'
          }}
        />
        {/* Voice button inside textarea */}
        <button
          type="button"
          onClick={() => {
            // Prefer internal STT that directly appends to textarea
            const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SR) {
              if (internalListening) { setInternalListening(false); return; }
              const rec = new SR();
              rec.lang = language === 'HI' ? 'hi-IN' : language === 'MR' ? 'mr-IN' : 'en-IN';
              rec.continuous = false; rec.interimResults = false;
              rec.onstart = () => setInternalListening(true);
              rec.onresult = (e: any) => {
                const t = e.results[0][0].transcript;
                setQuery(prev => prev ? prev + ' ' + t : t);
                setInternalListening(false);
              };
              rec.onerror = () => setInternalListening(false);
              rec.onend = () => setInternalListening(false);
              rec.start();
            } else {
              onVoiceToggle();
            }
          }}
          title={isListening ? 'Stop listening' : 'Voice input (EN/HI/MR)'}
          style={{
            position: 'absolute', top: '0.75rem', right: '0.75rem',
            width: '38px', height: '38px', borderRadius: '50%',
            background: isListening ? 'rgba(239,68,68,0.18)' : 'var(--bg-input)',
            border: isListening ? '1px solid rgba(239,68,68,0.45)' : '1px solid var(--border-color)',
            color: isListening ? 'var(--accent-crimson)' : 'var(--text-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      </div>

      {/* Live NLP strip: detection + normalization + entity resolution */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginTop: '0.9rem' }}>
        {/* Language detection card */}
        <div style={{ background: detectedNeedsSwitch ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)', border: `1px solid ${detectedNeedsSwitch ? 'rgba(245,158,11,0.35)' : 'var(--border-color)'}`, borderRadius: '12px', padding: '0.75rem 0.85rem' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
            <Globe size={12} /> LANGUAGE DETECTION
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: detectedNeedsSwitch ? 'var(--accent-amber)' : 'var(--accent-blue)' }}>
              Detected: {getLanguageDisplayName(detectedLang)}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>· Selected: {getLanguageDisplayName(language)}</span>
            {detectedNeedsSwitch ? (
              <button onClick={() => onLanguageChange(detectedLang)} style={{ marginLeft: '0.25rem', fontSize: '0.7rem', padding: '0.2rem 0.55rem', borderRadius: '999px', background: 'var(--accent-amber)', color: 'var(--text-primary-inverse)', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                Switch to {detectedLang}
              </button>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.7rem', color: 'var(--accent-emerald)', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '999px', padding: '0.15rem 0.5rem' }}>
                <Check size={10} /> in sync
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', lineHeight: 1.4 }}>
            Script + lexical scoring across English / हिन्दी / मराठी.
          </div>
        </div>

        {/* Semantic normalization preview */}
        <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.75rem 0.85rem' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
            <Sparkles size={12} /> SEMANTIC NORMALIZATION
          </div>
          {query.trim() ? (
            <>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace', background: 'var(--bg-card)', borderRadius: '8px', padding: '0.45rem 0.6rem', wordBreak: 'break-word' }}>
                {normalizedPreview}
              </div>
              {vernacularMappings.length > 0 && (
                <div style={{ marginTop: '0.45rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {vernacularMappings.map(m => (
                    <span key={m.vernacular} style={{ fontSize: '0.7rem', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)', color: 'var(--accent-blue)', borderRadius: '999px', padding: '0.15rem 0.5rem' }}>
                      {m.vernacular} → {m.canonical}
                    </span>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Type to see IAST + vernacular → Sanskrit canonical mapping.</div>
          )}
        </div>
      </div>

      {/* Botanical & TKDL Entity Resolution strip */}
      <div style={{ marginTop: '0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ fontSize: '0.68rem', letterSpacing: '0.06em', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Leaf size={12} className="text-emerald" /> BOTANICAL & TKDL ENTITY RESOLUTION
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '999px', padding: '0.15rem 0.5rem' }}>
            Ontology: {resolvedEntities.length} {resolvedEntities.length === 1 ? 'entity' : 'entities'} mapped
          </span>
        </div>

        {resolvedEntities.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {resolvedEntities.map(ent => (
              <div key={ent.id || ent.sanskrit_name} style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(59,130,246,0.08))', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '0.6rem 0.75rem', minWidth: '210px', flex: '1 1 220px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {ent.sanskrit_name} <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{ent.matched_alias && ent.matched_alias !== ent.sanskrit_name ? `(${ent.matched_alias})` : ''}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontStyle: 'italic' }}>{ent.botanical_binomial}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{ent.english_common_name} · {ent.afi_reference || 'AFI/TKDL'}</div>
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.65rem', background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '999px', padding: '0.15rem 0.45rem', color: 'var(--text-secondary)' }}>
                    TKDL: {ent.afi_reference ? '✓ Indexed' : '—'}
                  </span>
                  {ent.biopiracy_precedent && (
                    <span style={{ fontSize: '0.65rem', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '999px', padding: '0.15rem 0.45rem', color: 'var(--accent-amber)' }}>
                      {ent.biopiracy_precedent.slice(0, 28)}…
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-input)', borderRadius: '10px', padding: '0.6rem 0.75rem', border: '1px dashed var(--border-color)' }}>
            <Lightbulb size={14} /> No botanical hit yet — try <em style={{ color: 'var(--text-primary)' }}>Haridra / Haldi / हळद</em>, <em style={{ color: 'var(--text-primary)' }}>Maricha / Kali Mirch</em>, <em style={{ color: 'var(--text-primary)' }}>Guduchi / Giloy</em>, etc.
          </div>
        )}
      </div>

      {/* Smart Input Form: collapsible structured fields */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        style={{
          marginTop: '0.9rem',
          width: '100%',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: showAdvanced ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${showAdvanced ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '12px', padding: '0.7rem 0.9rem', cursor: 'pointer', color: 'var(--text-primary)'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <FlaskConical size={16} className="text-emerald" />
          Smart Input Form — optional structured fields
          <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', borderRadius: '999px', padding: '0.15rem 0.45rem' }}>
            improves retrieval precision
          </span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {showAdvanced ? <>Hide <ChevronUp size={14} /></> : <>Add details <ChevronDown size={14} /></>}
        </span>
      </button>

      {showAdvanced && (
        <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <Leaf size={12} /> INGREDIENTS (comma-separated)
            </label>
            <input
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              placeholder="e.g., Haridra, Maricha, Guduchi — or हल्दी, काली मिर्च"
              style={{
                width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '10px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
              }}
            />
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Auto-mapped to Latin binomials above.</div>
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <Target size={12} /> INTENDED USE
            </label>
            <select
              value={intendedUse}
              onChange={e => setIntendedUse(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '10px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: '#0f172a' }}>Select use-case…</option>
              {INTENDED_USE_OPTIONS.map(o => (
                <option key={o} value={o} style={{ background: '#0f172a' }}>{o}</option>
              ))}
            </select>
            {intendedUse === 'Other (custom)' && (
              <input
                value={customUse}
                onChange={e => setCustomUse(e.target.value)}
                placeholder="Describe custom intended use…"
                style={{
                  marginTop: '0.5rem', width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                  borderRadius: '10px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none'
                }}
              />
            )}
          </div>

          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.4rem' }}>
              <Globe size={12} /> TARGET MARKET
            </label>
            <select
              value={targetMarket}
              onChange={e => setTargetMarket(e.target.value)}
              style={{
                width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border-color)',
                borderRadius: '10px', padding: '0.6rem 0.75rem', color: 'var(--text-primary)', fontSize: '0.88rem', outline: 'none', cursor: 'pointer'
              }}
            >
              {TARGET_MARKETS.map(m => (
                <option key={m.value} value={m.value} style={{ background: '#0f172a' }}>{m.label}</option>
              ))}
            </select>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Drives jurisdiction diff & NBA / WIPO checks.</div>
          </div>
        </div>
      )}

      {/* Action row */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="btn-conic" style={{ borderRadius: '999px' }}>
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.85rem 1.9rem', borderRadius: '999px', fontWeight: 700,
              background: canSubmit ? 'var(--bg-primary)' : 'var(--bg-elevated)',
              color: canSubmit ? 'var(--text-primary-inverse, white)' : 'var(--text-muted)',
              border: 'none', cursor: canSubmit ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 8px 24px rgba(16,185,129,0.18)' : 'none',
              opacity: canSubmit ? 1 : 0.7
            }}
          >
            <Search size={16} />
            {isProcessing ? 'Analyzing…' : language === 'HI' ? 'विश्लेषण करें' : language === 'MR' ? 'विश्लेषण करा' : 'Analyze Intent'}
          </button>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Structured fields are optional but improve §3(p)/BDA accuracy.
        </span>
        {(query || ingredients) && (
          <button
            onClick={() => { setQuery(''); setIngredients(''); setIntendedUse(''); setCustomUse(''); }}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-secondary)', borderRadius: '999px', padding: '0.4rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <X size={12} /> Clear
          </button>
        )}
      </div>
    </div>
  );
}
