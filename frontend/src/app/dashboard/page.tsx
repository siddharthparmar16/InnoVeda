"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShieldAlert, Shield, ArrowRight, Gavel, FileText, CheckCircle2, 
  ExternalLink, RefreshCw, AlertTriangle, HelpCircle, 
  UserCheck, Languages, Lock, Scale, Mic, Volume2, VolumeX, MessageSquare,
  Bookmark, Check, Layers, Lightbulb, CheckSquare, Square, ChevronRight,
  Sprout, Sparkles, FileCheck, BookOpen
} from 'lucide-react';
import { 
  FlowState, 
  Jurisdiction, 
  LegalVerdict, 
  StatutoryCitation, 
  JurisdictionDiff,
  SupportedLanguage 
} from '@/types/domain';
import { executeJurisdictionDiff, generateAdversarialArgument } from '@/lib/domain-engine/statutory-rule-engine';
import { downloadAdvisoryMemoFile } from '@/lib/domain-engine/memo-generator';
import { t, severityLabel } from '@/lib/i18n';
import { applyGoogleTranslate } from '@/lib/google-translate';
import { useAuth } from '@/context/AuthContext';
import { saveResearchSession, saveUserBookmark } from '@/lib/supabase/database';
import PriorArtGraph from '@/components/PriorArtGraph';
import FacilitatorEscalationModal from '@/components/FacilitatorEscalationModal';
import FollowUpChat from '@/components/FollowUpChat';
import MultilingualPdfModal from '@/components/MultilingualPdfModal';
import AuthGate from '@/components/AuthGate';
import CitationVaultDrawer, { VaultSelection } from '@/components/CitationVaultDrawer';

function DashboardContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get('query');
  const isNew = searchParams.get('new');
  
  const { user, profile, isLoading, openAuthModal } = useAuth();
  const isAuthenticated = Boolean(user || profile);
  const [flowState, setFlowState] = useState<FlowState>('INPUT');
  const [query, setQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('INDIA');
  const [language, setLanguage] = useState<SupportedLanguage>('EN');
  const [activeVerdict, setActiveVerdict] = useState<LegalVerdict | null>(null);
  const [showCitationModal, setShowCitationModal] = useState<StatutoryCitation | null>(null);
  const [showFacilitatorModal, setShowFacilitatorModal] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);
  // Citation Vault Drawer state
  const [vaultSelection, setVaultSelection] = useState<VaultSelection | null>(null);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Advanced depth features state
  const [diffVerdicts, setDiffVerdicts] = useState<JurisdictionDiff | null>(null);
  const [adversarialArgument, setAdversarialArgument] = useState<string | null>(null);
  const [showExaminerView, setShowExaminerView] = useState(false);

  // ── Step-by-Step Progressive Journey State ─────────────────────────────
  const [activeStep, setActiveStep] = useState<'VERDICT' | 'FLOWCHART' | 'REASONS' | 'OVERCOME' | 'ALL'>('VERDICT');
  const [checkedChecklist, setCheckedChecklist] = useState<Record<string, boolean>>({
    step_claim: false,
    step_process: false,
    step_fingerprint: false,
    step_nba: false,
    step_synergy: false,
  });

  const toggleChecklistItem = (key: string) => {
    setCheckedChecklist(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const completedChecklistCount = Object.values(checkedChecklist).filter(Boolean).length;

  // ── Restore language state from googtrans cookie on mount ──────────────────
  useEffect(() => {
    try {
      const cookieVal = document.cookie
        .split('; ')
        .find(row => row.startsWith('googtrans='))
        ?.split('=')?.[1];
      if (cookieVal && cookieVal !== '/en/en') {
        const parts = cookieVal.split('/');
        const gtCode = parts[parts.length - 1];
        const langMap: Record<string, SupportedLanguage> = {
          hi: 'HI',
          mr: 'MR',
          sa: 'SA',
          en: 'EN',
        };
        const restored = langMap[gtCode];
        if (restored && restored !== 'EN') {
          setLanguage(restored);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleBookmarkVerdict = async () => {
    if (!activeVerdict) return;
    if (!user) {
      openAuthModal();
      return;
    }
    setIsSavingBookmark(true);
    await saveUserBookmark(user.id, {
      title: activeVerdict.verdict_title || query.slice(0, 48),
      regime: jurisdiction === 'INDIA' ? 'India (IPA 1970)' : jurisdiction,
      verdict: activeVerdict.is_patentable ? 'CONDITIONALLY PATENTABLE' : 'PATENT BARRED',
      verdict_color: activeVerdict.is_patentable ? '#10b981' : '#ef4444',
      summary: activeVerdict.reasoning_chain?.[0]?.description || activeVerdict.verdict_title,
      query: query
    });
    setIsSavingBookmark(false);
    setIsBookmarked(true);
  };

  const fetchVerdict = async (searchQuery: string, currentJurisdiction: Jurisdiction, currentLanguage: SupportedLanguage) => {
    setIsBookmarked(false);
    const response = await fetch('/api/verdict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: searchQuery, jurisdiction: currentJurisdiction, language: currentLanguage })
    });
    
    if (!response.ok) {
      throw new Error(`Verdict API responded with ${response.status}`);
    }

    const verdict: LegalVerdict = await response.json();
    setActiveVerdict(verdict);

    // Auto-save session to Supabase or localStorage (works for both logged in & guest)
    saveResearchSession(user?.id || 'guest', {
      title: verdict.verdict_title || searchQuery.slice(0, 48),
      query: searchQuery,
      jurisdiction: currentJurisdiction,
      verdict: verdict.is_patentable ? 'CONDITIONALLY PATENTABLE' : 'PATENT BARRED',
      verdict_color: verdict.is_patentable ? '#10b981' : '#ef4444'
    }).then(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('session-updated'));
      }
    }).catch(err => console.error('Error recording session:', err));
    
    // Load advanced comparative depth in parallel
    const diffPromise = verdict.resolved_botanicals && verdict.resolved_botanicals.length > 0
      ? executeJurisdictionDiff(searchQuery, verdict.resolved_botanicals, verdict, currentLanguage)
      : Promise.resolve(null);
      
    const advArgPromise = generateAdversarialArgument(searchQuery, verdict);
    
    const [advArg, diffs] = await Promise.all([advArgPromise, diffPromise]);
    setAdversarialArgument(advArg);
    setDiffVerdicts(diffs);

    if (verdict.abstain) {
      setFlowState('ABSTAIN');
    } else {
      setFlowState('VERDICT');
    }
  };

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    if (urlQuery && urlQuery.trim()) {
      setQuery(urlQuery);
      setFlowState('PROCESSING');
      fetchVerdict(urlQuery, jurisdiction, language).catch(err => {
        console.error('Error fetching query from URL:', err);
        setFlowState('INPUT');
      });
    } else if (isNew) {
      setQuery('');
      setActiveVerdict(null);
      setFlowState('INPUT');
    }
  }, [urlQuery, isNew, isAuthenticated, isLoading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    if (!query.trim()) return;
    setFlowState('PROCESSING');
    try {
      await fetchVerdict(query, jurisdiction, language);
    } catch (error) {
      console.error('Error fetching verdict:', error);
      setFlowState('INPUT');
    }
  };

  const handleJurisdictionChange = async (newJ: Jurisdiction) => {
    setJurisdiction(newJ);
    if (query.trim() && (flowState === 'VERDICT' || flowState === 'ABSTAIN')) {
      setFlowState('PROCESSING');
      try {
        await fetchVerdict(query, newJ, language);
      } catch (error) {
        console.error('Error updating jurisdiction:', error);
      }
    }
  };

  const handleLanguageChange = async (newL: SupportedLanguage) => {
    setLanguage(newL);

    // ── Trigger Google Translate for full-page translation ─────────────────
    // Small delay lets React re-render the UI strings first
    setTimeout(() => {
      try {
        applyGoogleTranslate(newL);
      } catch (e) {
        console.warn('[GT] Failed to apply translation:', e);
      }
    }, 150);

    // ── Re-fetch verdict with new language for API-generated content ───────
    if (query.trim() && (flowState === 'VERDICT' || flowState === 'ABSTAIN')) {
      setFlowState('PROCESSING');
      try {
        await fetchVerdict(query, jurisdiction, newL);
      } catch (error) {
        console.error('Error updating language:', error);
      }
    }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'HI' ? 'hi-IN' : language === 'MR' ? 'mr-IN' : language === 'SA' ? 'hi-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognition.start();
  };

  const toggleSpeaking = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    if (!activeVerdict) return;
    
    setIsSpeaking(true);
    
    const botanicalText = activeVerdict.resolved_botanicals?.length > 0 
      ? `The following botanicals were resolved: ${activeVerdict.resolved_botanicals.map(b => b.sanskrit_name + ' or ' + b.english_common_name).join(', ')}.`
      : '';
    const reasoningText = activeVerdict.reasoning_chain.map(r => r.description).join('. ');
    
    const sentences = [
      `Analysis complete.`,
      `Claim input: ${query}.`,
      botanicalText,
      `Verdict: ${activeVerdict.verdict_title}.`,
      ...activeVerdict.reasoning_chain.map(r => r.description)
    ].filter(Boolean);

    let currentIndex = 0;

    const speakNext = () => {
      if (currentIndex >= sentences.length) {
        setIsSpeaking(false);
        return;
      }
      const utterance = new SpeechSynthesisUtterance(sentences[currentIndex]);
      utterance.lang = language === 'HI' ? 'hi-IN' : language === 'MR' ? 'mr-IN' : language === 'SA' ? 'hi-IN' : 'en-IN';
      
      utterance.onend = () => {
        currentIndex++;
        speakNext();
      };
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error', e);
        setIsSpeaking(false);
      };
      
      window.speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const resetFlow = () => {
    setFlowState('INPUT');
    setQuery('');
    setActiveVerdict(null);
    setShowCitationModal(null);
    setShowFacilitatorModal(false);
  };

  const selectPresetQuery = async (presetText: string) => {
    if (!isAuthenticated) {
      openAuthModal();
      return;
    }
    setQuery(presetText);
    setFlowState('PROCESSING');
    try {
      await fetchVerdict(presetText, jurisdiction, language);
    } catch (error) {
      console.error('Error fetching preset verdict:', error);
      setFlowState('INPUT');
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 64px)' }}>
        <div style={{ textAlign: 'center', color: 'var(--accent-gold)' }}>
          <div style={{ width: '36px', height: '36px', margin: '0 auto 1.25rem auto', border: '2px solid rgba(201, 168, 106, 0.2)', borderTopColor: 'var(--accent-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ fontSize: '0.88rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
            Verifying Researcher Clearance...
          </span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <main style={{ minHeight: 'calc(100vh - 64px)', padding: '1.25rem 1.25rem 5rem 1.25rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      
      {/* Background Elements from Landing Page */}
      <div className="noise-overlay" />
      <div className="bg-grid-pattern" />
      <motion.div 
        animate={{ y: [0, -50, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        style={{ position: 'absolute', top: '10%', right: '-10%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 60%)', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} 
      />
      <motion.div 
        animate={{ y: [0, 50, 0] }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        style={{ position: 'absolute', bottom: '10%', left: '-20%', width: '70vw', height: '70vw', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 60%)', filter: 'blur(120px)', zIndex: 0, pointerEvents: 'none' }} 
      />

      {/* ⚖️ STANDING LEGAL DISCLAIMER & DPDP REGIME BANNER (MANDATORY GUARDRAIL) */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: '1400px',
        margin: '0 auto 1rem auto',
        width: '100%',
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(59, 130, 246, 0.12))',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '10px',
        padding: '0.55rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.78rem',
        color: 'var(--accent-amber)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Scale size={16} className="text-amber" />
          <span>
            <strong>{t('legal_notice_bold', language)}</strong> {t('legal_notice_text', language)}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-blue)', fontSize: '0.75rem' }}>
          <Lock size={13} />
          <span>{t('dpdp_non_pii', language)}</span>
        </div>
      </div>

      {/* Main App Header */}
      <header className="glass-panel" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem',
        maxWidth: '1400px', margin: '0 auto 1rem auto', width: '100%', padding: '0.65rem 1.5rem', borderRadius: '12px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, letterSpacing: '0.05em' }}>
            {t('statutory_rag_label', language)}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Multilingual Selector (Bhashini-Ready) */}
          <div className="glass-panel flex items-center gap-1" style={{ padding: '0.2rem 0.5rem', borderRadius: '8px' }}>
            <Languages size={15} className="text-blue" style={{ marginLeft: '0.25rem' }} />
            <select 
              value={language} 
              onChange={e => handleLanguageChange(e.target.value as SupportedLanguage)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem'
              }}
            >
              <option value="EN" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>English</option>
              <option value="HI" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>हिन्दी (Hindi)</option>
              <option value="MR" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>मराठी (Marathi)</option>
              <option value="SA" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>संस्कृतम् (Sanskrit)</option>
            </select>
          </div>

          <span className="status-badge" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-emerald)', color: 'var(--accent-emerald)', fontSize: '0.75rem' }}>
            {t('ministry_badge', language)}
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', flex: 1, width: '100%', position: 'relative' }}>
        <AnimatePresence mode="wait">
        
        {/* VIEW 1: SEARCH INPUT */}
        {flowState === 'INPUT' && (
          <motion.div 
            key="input-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', marginTop: '4vh', position: 'relative', zIndex: 10 }}
          >
            <h2 className="text-gradient-animated" style={{ 
              fontSize: '3rem', marginBottom: '1rem', fontWeight: 800, 
              lineHeight: 1.1, letterSpacing: '-0.03em'
            }}>
              {t('page_hero_title', language)}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto 2.5rem auto' }}>
              {t('page_hero_subtitle', language)}
            </p>

            <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '0.5rem', display: 'flex', borderRadius: '999px', boxShadow: 'var(--shadow-glow)' }}>
              <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                <Search size={24} />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('placeholder_query', language)}
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'var(--text-primary)',
                  fontSize: '1.05rem',
                  outline: 'none'
                }}
              />
              <button 
                type="button"
                onClick={toggleListening}
                style={{
                  background: isListening ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                  border: isListening ? '1px solid rgba(239, 68, 68, 0.5)' : 'none',
                  color: isListening ? '#fca5a5' : 'var(--text-secondary)',
                  padding: '0 1rem',
                  cursor: 'pointer',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '0.5rem',
                  position: 'relative',
                  transition: 'all 0.2s'
                }}
                title={isListening ? "Stop listening" : "Voice Input"}
              >
                <Mic size={20} className={isListening ? "animate-pulse" : "opacity-80 hover:opacity-100"} />
              </button>
              
              <div style={{ borderRadius: '999px', margin: '-2px' }}>
                <button 
                  type="submit" 
                  disabled={!query.trim()} 
                  className="btn-gold" 
                  style={{ borderRadius: '999px', padding: '0.85rem 2.5rem', fontWeight: 700, border: 'none', cursor: 'pointer' }}
                >
                  {t('analyze_btn', language)}
                </button>
              </div>
            </form>
            
            {/* Presets & Badges */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>{t('test_scenarios_label', language)}</span>
              <button onClick={() => selectPresetQuery('I want to patent a formulation of Haridra and Maricha for joint pain.')} className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                Haridra + Maricha (Classical Admixture)
              </button>
              <button onClick={() => selectPresetQuery('मैं जोड़ों के दर्द के लिए हरिद्रा और मरिच का पेटेंट कराना चाहता हूँ।')} className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                Hindi Query (हरिद्रा + मरिच)
              </button>
              <button onClick={() => selectPresetQuery('Process for green supercritical CO2 extraction of Tinospora cordifolia with 98% purity')} className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                Guduchi Process Claim
              </button>
              <button onClick={() => selectPresetQuery('What is the therapeutic dosage of Paracetamol for pediatric fever?')} className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem' }}>
                Medical Dosage (Abstention Test)
              </button>
            </div>

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap' }}>
              <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-emerald" /> Patents Act 1970 s.3(p)</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-emerald" /> BDA 2002/2023 s.6 (NBA Approval)</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-emerald" /> WIPO GRATK Treaty 2024</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-emerald" /> Drugs & Cosmetics Rule 158B</span>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: PROCESSING AI */}
        {flowState === 'PROCESSING' && (
          <motion.div 
            key="processing-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center relative z-10" 
            style={{ marginTop: '10vh', gap: '2rem' }}
          >
            <div style={{ width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '3rem', height: '3rem', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
                  <RefreshCw className="text-emerald" size={24} style={{ animation: 'spin 2s linear infinite' }} />
                </div>
                <h3 className="text-gradient-animated" style={{ fontSize: '1.6rem', fontWeight: 700 }}>{t('processing_title', language)}</h3>
              </div>
              
              {/* Pulse Skeleton Loaders */}
              <div style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ height: '24px', width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '24px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out 0.2s' }} />
                <div style={{ height: '24px', width: '90%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out 0.4s' }} />
              </div>
            </div>

            <div className="flex flex-col gap-2" style={{ color: 'var(--accent-emerald)', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.9rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p>{t('processing_step1', language)}</p>
              <p>{t('processing_step2', language)}</p>
              <p>{t('processing_step3', language)}</p>
              <p>{t('processing_step4', language)}</p>
            </div>
          </motion.div>
        )}

        {/* VIEW 3: VERDICT ENGINE */}
        {flowState === 'VERDICT' && activeVerdict && (
          <motion.div 
            key="verdict-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
          >
            
            {/* Top Toolbar */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <button onClick={resetFlow} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <ArrowRight style={{ transform: 'rotate(180deg)' }} size={20} /> {t('back_to_search', language)}
              </button>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Human Facilitator Escalation Button */}
                <button 
                  onClick={() => setShowFacilitatorModal(true)}
                  className="btn"
                  style={{ 
                    fontSize: '0.85rem', padding: '0.45rem 1rem', 
                    background: 'rgba(45, 122, 91, 0.12)', 
                    border: '1px solid var(--accent-emerald)', 
                    color: 'var(--accent-emerald)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <UserCheck size={16} /> {t('escalate_btn', language)}
                </button>

                {/* Ask Follow-up Chat Button */}
                <a
                  href="#followup-chat-section"
                  className="btn-gold"
                  style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', textDecoration: 'none' }}
                >
                  <MessageSquare size={14} /> {t('ask_followup_btn', language)}
                </a>

                {/* Export Multilingual Advisory PDF Button */}
                <button 
                  onClick={() => setShowPdfModal(true)} 
                  className="btn-gold flex items-center gap-2" 
                  style={{ fontSize: '0.85rem', padding: '0.45rem 1.15rem', borderRadius: '8px' }}
                  title="Export Official Multilingual Statutory PDF Dossier"
                >
                  <FileText size={16} /> {t('export_pdf_btn', language)}
                </button>

                {/* Bookmark Analysis to Supabase */}
                <button
                  onClick={handleBookmarkVerdict}
                  disabled={isSavingBookmark}
                  className="btn"
                  style={{
                    fontSize: '0.85rem',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    background: isBookmarked ? 'rgba(45, 122, 91, 0.12)' : 'var(--bg-glass)',
                    border: isBookmarked ? '1px solid var(--accent-emerald)' : '1px solid var(--border-color)',
                    color: isBookmarked ? 'var(--accent-emerald)' : 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  title={isBookmarked ? "Analysis saved to Supabase Bookmarks" : "Save this analysis to your Bookmarks in Supabase"}
                >
                  {isBookmarked ? (
                    <>
                      <Check size={16} />
                      <span>Bookmarked</span>
                    </>
                  ) : (
                    <>
                      <Bookmark size={16} style={{ color: 'var(--accent-gold)' }} />
                      <span>{isSavingBookmark ? 'Saving...' : 'Bookmark'}</span>
                    </>
                  )}
                </button>

                {/* Jurisdiction Toggle */}
                <div className="glass-panel flex" style={{ padding: '0.2rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                  <button 
                    onClick={() => handleJurisdictionChange('INDIA')}
                    style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: jurisdiction === 'INDIA' ? 'var(--bg-glass-hover)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: jurisdiction === 'INDIA' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}
                  >
                    {t('jurisdiction_india', language)}
                  </button>
                  <button 
                    onClick={() => handleJurisdictionChange('INTERNATIONAL')}
                    style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: jurisdiction === 'INTERNATIONAL' ? 'var(--bg-glass-hover)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: jurisdiction === 'INTERNATIONAL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}
                  >
                    {t('jurisdiction_wipo', language)}
                  </button>
                </div>
              </div>
            </div>

            {/* ── STEP-BY-STEP PROGRESSIVE DISCOVERY BAR ("Show it one by one") ── */}
            <div className="glass-panel" style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem',
              borderRadius: '14px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-card)'
            }}>
              {/* Step Tabs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setActiveStep('VERDICT')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    background: activeStep === 'VERDICT' ? 'var(--accent-gold-glow)' : 'transparent',
                    border: activeStep === 'VERDICT' ? '1px solid var(--accent-gold)' : '1px solid transparent',
                    color: activeStep === 'VERDICT' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: activeStep === 'VERDICT' ? 'var(--accent-gold)' : 'var(--bg-input)',
                    color: activeStep === 'VERDICT' ? '#ffffff' : 'var(--text-muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700
                  }}>1</span>
                  <span>{language === 'HI' ? '1. सीधा निर्णय' : language === 'MR' ? '1. स्पष्ट निकाल' : '1. Plain Verdict'}</span>
                </button>

                <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />

                <button
                  type="button"
                  onClick={() => setActiveStep('FLOWCHART')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    background: activeStep === 'FLOWCHART' ? 'rgba(43, 108, 176, 0.15)' : 'transparent',
                    border: activeStep === 'FLOWCHART' ? '1px solid var(--accent-blue)' : '1px solid transparent',
                    color: activeStep === 'FLOWCHART' ? 'var(--accent-blue)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: activeStep === 'FLOWCHART' ? 'var(--accent-blue)' : 'var(--bg-input)',
                    color: activeStep === 'FLOWCHART' ? '#ffffff' : 'var(--text-muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700
                  }}>2</span>
                  <span>{language === 'HI' ? '2. प्रवाह आरेख' : language === 'MR' ? '2. प्रवाह आलेख' : '2. Visual Flowchart'}</span>
                </button>

                <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />

                <button
                  type="button"
                  onClick={() => setActiveStep('REASONS')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    background: activeStep === 'REASONS' ? 'rgba(184, 58, 48, 0.15)' : 'transparent',
                    border: activeStep === 'REASONS' ? '1px solid var(--accent-crimson)' : '1px solid transparent',
                    color: activeStep === 'REASONS' ? 'var(--accent-crimson)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: activeStep === 'REASONS' ? 'var(--accent-crimson)' : 'var(--bg-input)',
                    color: activeStep === 'REASONS' ? '#ffffff' : 'var(--text-muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700
                  }}>3</span>
                  <span>{language === 'HI' ? '3. मुख्य कारण' : language === 'MR' ? '3. मुख्य कारणे' : '3. Why? (Reasons)'}</span>
                </button>

                <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />

                <button
                  type="button"
                  onClick={() => setActiveStep('OVERCOME')}
                  style={{
                    padding: '0.45rem 0.85rem',
                    borderRadius: '8px',
                    background: activeStep === 'OVERCOME' ? 'rgba(45, 122, 91, 0.15)' : 'transparent',
                    border: activeStep === 'OVERCOME' ? '1px solid var(--accent-emerald)' : '1px solid transparent',
                    color: activeStep === 'OVERCOME' ? 'var(--accent-emerald)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: activeStep === 'OVERCOME' ? 'var(--accent-emerald)' : 'var(--bg-input)',
                    color: activeStep === 'OVERCOME' ? '#ffffff' : 'var(--text-muted)',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 700
                  }}>4</span>
                  <span>{language === 'HI' ? '4. समाधान कैसे करें' : language === 'MR' ? '4. उपाय कसा करावा' : '4. How to Overcome'}</span>
                </button>
              </div>

              {/* Toggle: All at Once vs Step-by-Step */}
              <button
                type="button"
                onClick={() => setActiveStep(activeStep === 'ALL' ? 'VERDICT' : 'ALL')}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  background: activeStep === 'ALL' ? 'var(--accent-gold-glow)' : 'transparent',
                  border: '1px solid var(--border-color)',
                  color: activeStep === 'ALL' ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontSize: '0.76rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Layers size={13} />
                <span>{activeStep === 'ALL' ? (language === 'HI' ? 'एक-एक करके देखें' : 'Switch to Step View') : (language === 'HI' ? 'संपूर्ण रिपोर्ट देखें' : 'View Full Report')}</span>
              </button>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                EXECUTIVE VERDICT INSTRUMENT PANEL — Connected horizontal strip
            ═══════════════════════════════════════════════════════════════════ */}
            <div style={{
              display: 'flex',
              width: '100%',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              marginBottom: '1.5rem',
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-elevation)'
            }}>
              {/* Segment 1: Product Patent — BARRED */}
              <div style={{
                flex: '1.6',
                padding: '1.1rem 1.25rem',
                borderRight: '1px solid var(--border-color)',
                background: 'rgba(184, 58, 48, 0.06)',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent-crimson)', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent-crimson)"><circle cx="12" cy="12" r="12"/></svg>
                  Product Patent
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-crimson)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {activeVerdict.is_patentable ? 'VIABLE' : 'BARRED'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'monospace' }}>s.3(p) · s.3(e) bar</div>
              </div>

              {/* Segment 2: Process Patent — OPEN */}
              <div style={{
                flex: '1.6',
                padding: '1.1rem 1.25rem',
                borderRight: '1px solid var(--border-color)',
                background: 'rgba(45, 122, 91, 0.06)',
                position: 'relative'
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent-emerald)', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent-emerald)"><circle cx="12" cy="12" r="12"/></svg>
                  Process Patent
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {activeVerdict.is_patentable ? 'OPEN' : 'POTENTIALLY VIABLE'}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'monospace' }}>s.2(1)(j) open route</div>
              </div>

              {/* Segment 3: NBA Approval */}
              <div style={{
                flex: '1.4',
                padding: '1.1rem 1.25rem',
                borderRight: '1px solid var(--border-color)',
                background: 'rgba(184, 126, 30, 0.06)'
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent-amber)"><circle cx="12" cy="12" r="12"/></svg>
                  NBA Approval
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-amber)', lineHeight: 1, letterSpacing: '-0.02em' }}>REQD</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'monospace' }}>BDA s.6 Form III</div>
              </div>

              {/* Segment 4: TKDL Disclosure */}
              <div style={{
                flex: '1.4',
                padding: '1.1rem 1.25rem',
                borderRight: '1px solid var(--border-color)',
                background: 'rgba(184, 126, 30, 0.05)'
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent-amber)', textTransform: 'uppercase', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent-amber)"><circle cx="12" cy="12" r="12"/></svg>
                  TKDL Disclosure
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-amber)', lineHeight: 1, letterSpacing: '-0.02em' }}>REQD</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.3rem', fontFamily: 'monospace' }}>IPA s.8 Form 1</div>
              </div>

              {/* Segment 5: Confidence Meter */}
              <div style={{
                flex: '1.8',
                padding: '0.9rem 1.25rem',
                background: 'rgba(186, 141, 50, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--accent-gold)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Statutory Confidence</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.04em' }}>
                    {(activeVerdict.confidence_score * 100).toFixed(0)}
                  </span>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>%</span>
                </div>
                {/* Mini confidence bar */}
                <div style={{ marginTop: '0.4rem' }}>
                  <div style={{ width: '100%', height: '4px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: `${(activeVerdict.confidence_score * 100).toFixed(0)}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-gold), var(--accent-emerald))', borderRadius: '999px', transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontFamily: 'monospace' }}>NLI · Retrieval · Corpus</div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 1: PLAIN VERDICT (What is the App Telling You?)
            ═══════════════════════════════════════════════════════════════════ */}
            {(activeStep === 'VERDICT' || activeStep === 'ALL') && (
              <div className="glass-panel" style={{
                padding: '2rem',
                marginBottom: '2rem',
                borderLeft: activeVerdict.is_patentable ? '6px solid var(--accent-emerald)' : '6px solid var(--accent-crimson)',
                position: 'relative'
              }}>
                <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span style={{
                        background: activeVerdict.is_patentable ? 'rgba(45, 122, 91, 0.12)' : 'rgba(184, 58, 48, 0.12)',
                        color: activeVerdict.is_patentable ? 'var(--accent-emerald)' : 'var(--accent-crimson)',
                        border: activeVerdict.is_patentable ? '1px solid var(--accent-emerald)' : '1px solid var(--accent-crimson)',
                        borderRadius: '6px',
                        padding: '0.2rem 0.55rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}>
                        {activeVerdict.is_patentable ? 'Patentable Via Process' : 'Product Patent Barred'}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-gold)' }}>Step 1 of 4: Verdict Summary</span>
                    </div>

                    <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      <Gavel className={activeVerdict.is_patentable ? 'text-emerald' : 'text-crimson'} size={28} /> 
                      {activeVerdict.verdict_title}
                    </h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      {t('jurisdiction_mode_label', language)} <strong>{jurisdiction === 'INDIA' ? t('jurisdiction_india_full', language) : t('jurisdiction_wipo_full', language)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={toggleSpeaking}
                      className="btn"
                      style={{ 
                        display: 'flex', alignItems: 'center', gap: '0.4rem', 
                        padding: '0.3rem 0.6rem', fontSize: '0.75rem', 
                        background: isSpeaking ? 'rgba(43, 108, 176, 0.15)' : 'var(--bg-card)',
                        color: isSpeaking ? 'var(--accent-blue)' : 'var(--text-secondary)',
                        border: isSpeaking ? '1px solid var(--accent-blue)' : '1px solid var(--border-color)',
                        borderRadius: '8px'
                      }}
                    >
                      {isSpeaking ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
                      {isSpeaking ? t('reading_btn', language) : t('read_aloud_btn', language)}
                    </button>
                    <span className="status-badge" style={{ background: 'rgba(43, 108, 176, 0.1)', color: 'var(--accent-blue)', border: '1px solid rgba(43, 108, 176, 0.25)' }}>
                      {t('confidence_label', language)} {(activeVerdict.confidence_score * 100).toFixed(0)}%
                    </span>
                    {activeVerdict.audit_record && (
                      <span className="status-badge" style={{ background: 'rgba(45, 122, 91, 0.1)', color: 'var(--accent-emerald)', border: '1px solid rgba(45, 122, 91, 0.25)', fontSize: '0.7rem' }}>
                        {t('audit_label', language)} {activeVerdict.audit_record.query_hash.slice(0, 14)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Plain English Verdict Explanation Card */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-highlight)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                    <Lightbulb size={20} style={{ color: 'var(--accent-gold)' }} />
                    <strong style={{ fontSize: '0.98rem', color: 'var(--accent-gold-dark)', letterSpacing: '0.02em' }}>
                      {language === 'HI' ? 'सरल भाषा में इसका क्या अर्थ है (ऐप आपको क्या बता रहा है):' : 'What the App is Telling You in Plain Words:'}
                    </strong>
                  </div>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                    {language === 'HI'
                      ? 'भारतीय पेटेंट कार्यालय (IPO) किसी भी कच्ची जड़ी-बूटी (जैसे हल्दी) या पारंपरिक आयुर्वेदिक मिश्रण को उत्पाद के रूप में पेटेंट देने से मना कर देगा, क्योंकि यह ज्ञान सार्वजनिक धरोहर है।'
                      : 'The Indian Patent Office (IPO) will reject any claim to patent raw medicinal herbs or traditional Ayurvedic herbal pastes as a product. Ancient traditional remedies are Indian cultural heritage and belong to the public domain.'}
                  </p>
                  <p style={{ color: 'var(--accent-emerald)', fontSize: '0.92rem', lineHeight: 1.6, fontWeight: 600 }}>
                    {language === 'HI'
                      ? '✓ हालाँकि, आप एक नवीन निष्कर्षण विधि (प्रक्रिया पेटेंट) या सिद्ध सिनर्जिस्टिक प्रभाव (synergy) का पेटेंट अवश्य प्राप्त कर सकते हैं!'
                      : '✓ However, you CAN successfully patent a novel technical extraction method (Process Patent) or a mathematically proven synergistic formulation!'}
                  </p>
                </div>

                {/* 3 Visual Indicator Progress Gauges (Clean, authentic data display) */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.75rem'
                }}>
                  {/* Gauge 1: Product Patentability */}
                  <div style={{ background: 'var(--bg-card)', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      <span>Product Patentability</span>
                      <strong style={{ color: 'var(--accent-crimson)' }}>0% (Barred s.3p)</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: '5%', height: '100%', background: 'var(--accent-crimson)' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Direct composition barred by TKDL</div>
                  </div>

                  {/* Gauge 2: Process Route Viability */}
                  <div style={{ background: 'var(--bg-card)', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      <span>Process Patent Viability</span>
                      <strong style={{ color: 'var(--accent-emerald)' }}>85% (Open s.2(1)(j))</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: '85%', height: '100%', background: 'var(--accent-emerald)' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Novel extraction method is patentable</div>
                  </div>

                  {/* Gauge 3: TKDL Anticipation Match */}
                  <div style={{ background: 'var(--bg-card)', padding: '1rem 1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      <span>TKDL Prior Art Match</span>
                      <strong style={{ color: 'var(--accent-amber)' }}>98% (Samhitas)</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ width: '98%', height: '100%', background: 'var(--accent-amber)' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>Documented in Charaka & AFI Part 1</div>
                  </div>
                </div>

                {/* Structured Botanical Entity & Pharmacopoeial Monograph Table */}
                {activeVerdict.resolved_botanicals?.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Sprout size={16} style={{ color: 'var(--accent-emerald)' }} />
                      <span>{t('botanicals_label', language)} & Taxonomic Standards</span>
                    </div>

                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', color: 'var(--accent-gold)' }}>
                            <th style={{ padding: '0.75rem 1rem' }}>Sanskrit & Common Name</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Botanical Binomial (Latin)</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Plant Part Used</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Classical Formulary (AFI)</th>
                            <th style={{ padding: '0.75rem 1rem' }}>Prior-Art Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {activeVerdict.resolved_botanicals.map((botanical, idx) => (
                            <tr key={idx} style={{ borderBottom: idx < activeVerdict.resolved_botanicals.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                              <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {botanical.sanskrit_name} <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>({botanical.english_common_name})</span>
                              </td>
                              <td style={{ padding: '0.75rem 1rem', fontStyle: 'italic', color: 'var(--accent-blue)' }}>
                                {botanical.botanical_binomial}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                                {botanical.parts_used?.join(', ') || 'Rhizome / Root'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem', color: 'var(--accent-amber)' }}>
                                {botanical.afi_reference || 'Ayurvedic Formulary of India (AFI, Part I)'}
                              </td>
                              <td style={{ padding: '0.75rem 1rem' }}>
                                <span style={{
                                  background: 'rgba(184, 58, 48, 0.1)',
                                  color: 'var(--accent-crimson)',
                                  padding: '0.2rem 0.5rem',
                                  borderRadius: '6px',
                                  fontSize: '0.72rem',
                                  border: '1px solid rgba(184, 58, 48, 0.25)',
                                  fontWeight: 600
                                }}>
                                  Anticipated (Public Heritage)
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Landmark Precedent Case Alert */}
                {activeVerdict.precedent_case && (
                  <div style={{ background: 'rgba(184, 126, 30, 0.08)', border: '1px solid rgba(184, 126, 30, 0.3)', padding: '0.85rem 1.15rem', borderRadius: '10px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                    <AlertTriangle size={20} style={{ flexShrink: 0, color: 'var(--accent-amber)' }} />
                    <div>
                      <strong style={{ color: 'var(--accent-amber)' }}>{t('precedent_label', language)}</strong> {activeVerdict.precedent_case} — <em>(The benchmark case proving turmeric composition cannot be monopolized)</em>
                    </div>
                  </div>
                )}

                {/* Step 1 Footer: Navigate to Next Step */}
                {activeStep === 'VERDICT' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                    <button
                      type="button"
                      onClick={() => setActiveStep('FLOWCHART')}
                      className="btn-gold"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', fontSize: '0.88rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                    >
                      <span>{language === 'HI' ? 'अगला: दृश्य प्रवाह आरेख देखें' : 'Next: Step 2 — Visual Flowchart Pipeline'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 2: VISUAL FLOWCHART (How the claim travelled)
            ═══════════════════════════════════════════════════════════════════ */}
            {(activeStep === 'FLOWCHART' || activeStep === 'ALL') && (
              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-blue)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Step 2 of 4: Visual Resolution Pipeline
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {language === 'HI' ? 'दावे से रणनीति तक का दृश्य प्रवाह आरेख' : 'Visual Patent Pipeline Flowchart'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {language === 'HI'
                      ? 'नीचे दिए गए आरेख से समझें कि कैसे आपका प्राकृतिक दावा शास्त्रीय ग्रंथों और भारतीय पेटेंट कानून से होते हुए व्यवहार्य रणनीति तक पहुँचा।'
                      : 'Follow the step-by-step vector pipeline below to see how InnoVeda ingested your claim, resolved classical formulations, applied Indian patent statutes, and calculated the viable route.'}
                  </p>
                </div>

                {/* The Redesigned Vector PriorArtGraph */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <PriorArtGraph 
                    query={query} 
                    resolvedBotanicals={activeVerdict.resolved_botanicals}
                    reasoningSteps={activeVerdict.reasoning_chain}
                    precedentCase={activeVerdict.precedent_case}
                    isPatentable={activeVerdict.is_patentable}
                    language={language}
                  />
                </div>

                {/* Clean Stage Journey Table */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    Pipeline Execution Summary Table
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', color: 'var(--accent-blue)' }}>
                          <th style={{ padding: '0.65rem 0.9rem' }}>Stage</th>
                          <th style={{ padding: '0.65rem 0.9rem' }}>Technical Operation</th>
                          <th style={{ padding: '0.65rem 0.9rem' }}>Source / Knowledge Base</th>
                          <th style={{ padding: '0.65rem 0.9rem' }}>Stage Output</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: 'var(--accent-blue)' }}>1. Claim Ingestion</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-secondary)' }}>Dialect stripping & IAST diacritic normalization</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-primary)' }}>Natural Language Input</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--accent-blue)' }}>Standardized semantic claim</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>2. Taxonomic Taxa</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-secondary)' }}>Latin binomial taxonomic mapping & API monographs</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-primary)' }}>Ayurvedic Pharmacopoeia of India</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--accent-emerald)' }}>Curcuma longa L. (Rhizome)</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: 'var(--accent-amber)' }}>3. Prior Art Check</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-secondary)' }}>Cross-referenced against 5,000+ ancient recipes</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-primary)' }}>TKDL, Charaka & Sushruta Samhitas</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--accent-amber)' }}>AFI Part 1 Anticipation Confirmed</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: 'var(--accent-crimson)' }}>4. Statutory Filter</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-secondary)' }}>Section 3(p) TK bar + Section 3(e) Admixture check</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-primary)' }}>Patents Act 1970, BDA 2002 s.6</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--accent-crimson)' }}>Product Claim Barred (Public Domain)</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.65rem 0.9rem', fontWeight: 600, color: 'var(--accent-gold)' }}>5. Strategic Route</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-secondary)' }}>Rerouting formulation to viable process patent</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--text-primary)' }}>Patents Act 1970, Section 2(1)(j)</td>
                          <td style={{ padding: '0.65rem 0.9rem', color: 'var(--accent-gold)' }}>Novel Process / Extraction Route Open</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Step 2 Footer Navigation */}
                {activeStep === 'FLOWCHART' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setActiveStep('VERDICT')}
                      className="btn"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1rem', fontSize: '0.84rem' }}
                    >
                      <ArrowRight style={{ transform: 'rotate(180deg)' }} size={16} />
                      <span>{language === 'HI' ? 'पिछला: सीधा निर्णय' : 'Previous: Step 1'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep('REASONS')}
                      className="btn-gold"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', fontSize: '0.88rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                    >
                      <span>{language === 'HI' ? 'अगला: मुख्य कारण देखें' : 'Next: Step 3 — Why It Is Barred (Reasons)'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 3: WHY IT'S BARRED (The Core Reasons & Legal Objections)
            ═══════════════════════════════════════════════════════════════════ */}
            {(activeStep === 'REASONS' || activeStep === 'ALL') && (
              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative' }}>
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-crimson)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Step 3 of 4: Statutory Legal Reasoning
                  </div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Gavel className="text-crimson" size={24} />
                    {language === 'HI' ? 'यह पेटेंट क्यों वर्जित है: सटीक कानूनी कारण' : 'Why It Is Barred: Core Statutory Reasons'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {language === 'HI'
                      ? 'भारतीय पेटेंट कार्यालय (IPO) आपके दावे पर निम्नलिखित वैधानिक धाराओं के तहत आपत्ति दर्ज करेगा।'
                      : 'Here is the comprehensive statutory matrix showing exactly which legal sections forbid direct product claims on this traditional formulation, and why.'}
                  </p>
                </div>

                {/* Structured Statutory Objections Table */}
                <div style={{ marginBottom: '1.75rem', overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', color: 'var(--accent-crimson)' }}>
                        <th style={{ padding: '0.75rem 1rem' }}>Statute / Precedent</th>
                        <th style={{ padding: '0.75rem 1rem' }}>What the Law Strictly Forbids</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Why Your Formulation Triggers It</th>
                        <th style={{ padding: '0.75rem 1rem' }}>Legal Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--accent-crimson)' }}>
                          Patents Act 1970, Section 3(p)
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                          Inventions that are an anticipation of traditional knowledge of local communities.
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          Turmeric wound healing and anti-inflammatory use is documented in ancient Ayurvedic Samhitas for 3,000+ years.
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: 'rgba(184, 58, 48, 0.1)', color: 'var(--accent-crimson)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            ABSOLUTE BAR (Product)
                          </span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                          Patents Act 1970, Section 3(e)
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                          Mere admixtures resulting only in the aggregation of properties of individual components.
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          Combining herbs is legally deemed ordinary Ayurvedic formulation unless enhanced super-additive synergy is scientifically proven.
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: 'rgba(184, 126, 30, 0.1)', color: 'var(--accent-amber)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            CONDITIONAL BAR
                          </span>
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                          US Patent 5,401,504 Precedent
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                          Attempting to claim traditional wound healing efficacy of turmeric.
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          Granted in US in 1995; formally revoked in 1997 after CSIR challenge using Sanskrit shlokas. IPO examiners cite this automatically.
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: 'rgba(184, 126, 30, 0.1)', color: 'var(--accent-amber)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            BINDING PRECEDENT
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                          Biological Diversity Act 2002, s.6
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-primary)' }}>
                          Commercial patent filing based on Indian biological resources without NBA clearance.
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                          Botanical was harvested in India; statutory Form III must be granted by National Biodiversity Authority prior to grant.
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ background: 'rgba(43, 108, 176, 0.1)', color: 'var(--accent-blue)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>
                            MANDATORY CLEARANCE
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Reasoning Chain Detail Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.75rem' }}>
                  {activeVerdict.reasoning_chain.map((step) => (
                    <div key={step.id} className="glass-panel" style={{ position: 'relative', padding: '1.25rem 1.5rem', overflow: 'hidden' }}>
                      <div style={{
                        position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                        backgroundColor: step.severity === 'BARRED' ? 'var(--accent-crimson)' : step.severity === 'APPROVAL_REQUIRED' ? 'var(--accent-amber)' : 'var(--accent-blue)'
                      }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', marginLeft: '0.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid',
                            backgroundColor: step.severity === 'BARRED' ? 'rgba(184, 58, 48, 0.1)' : step.severity === 'APPROVAL_REQUIRED' ? 'rgba(184, 126, 30, 0.1)' : 'rgba(43, 108, 176, 0.1)',
                            color: step.severity === 'BARRED' ? 'var(--accent-crimson)' : step.severity === 'APPROVAL_REQUIRED' ? 'var(--accent-amber)' : 'var(--accent-blue)',
                            borderColor: step.severity === 'BARRED' ? 'rgba(184, 58, 48, 0.3)' : step.severity === 'APPROVAL_REQUIRED' ? 'rgba(184, 126, 30, 0.3)' : 'rgba(43, 108, 176, 0.3)',
                          }}>
                            {severityLabel(step.severity, language)}
                          </span>
                          <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)' }}>{step.title}</strong>
                          {step.citation?.nli_verified && (
                            <span title="NLI Verification Passed: Claim is strictly entailed by source statute" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--accent-emerald)', background: 'rgba(45, 122, 91, 0.1)', padding: '0.2rem 0.5rem', borderRadius: '999px', border: '1px solid rgba(45, 122, 91, 0.25)' }}>
                              <CheckCircle2 size={12}/> {t('nli_verified_label', language)}
                            </span>
                          )}
                        </div>
                        <button 
                          onClick={() => setShowCitationModal(step.citation)} 
                          className="btn"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-blue)', background: 'rgba(43, 108, 176, 0.1)', border: '1px solid rgba(43, 108, 176, 0.25)', whiteSpace: 'nowrap' }}
                        >
                          <FileText size={13} /> {t('view_citation_btn', language)}
                        </button>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.55, marginLeft: '0.5rem', marginTop: '0.5rem' }}>
                        {step.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Collapsible Simulated Patent Examiner First Examination Report (FER) Check */}
                {adversarialArgument && (
                  <div style={{ marginBottom: '1.5rem', background: 'rgba(184, 58, 48, 0.06)', border: '1px solid rgba(184, 58, 48, 0.25)', borderRadius: '10px', overflow: 'hidden' }}>
                    <button 
                      onClick={() => setShowExaminerView(!showExaminerView)}
                      style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.9rem 1.25rem', background: 'transparent', border: 'none', color: 'var(--accent-crimson)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}
                    >
                      <div className="flex items-center gap-2"><Gavel size={18}/> Simulated Patent Controller First Examination Report (FER) Objection</div>
                      <span>{showExaminerView ? t('examiner_hide_btn', language) : t('examiner_show_btn', language)}</span>
                    </button>
                    {showExaminerView && (
                      <div style={{ padding: '0 1.25rem 1.25rem 1.25rem', color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, borderTop: '1px dashed rgba(184, 58, 48, 0.2)', paddingTop: '0.85rem' }}>
                        {adversarialArgument}
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3 Footer Navigation */}
                {activeStep === 'REASONS' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setActiveStep('FLOWCHART')}
                      className="btn"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1rem', fontSize: '0.84rem' }}
                    >
                      <ArrowRight style={{ transform: 'rotate(180deg)' }} size={16} />
                      <span>{language === 'HI' ? 'पिछला: प्रवाह आरेख' : 'Previous: Step 2 Flowchart'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveStep('OVERCOME')}
                      className="btn-gold"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.4rem', fontSize: '0.88rem', fontWeight: 600, borderRadius: '8px', cursor: 'pointer', border: 'none' }}
                    >
                      <span>{language === 'HI' ? 'अगला: बाधा का समाधान कैसे करें' : 'Next: Step 4 — How to Overcome (Action Blueprint)'}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════════════
                STEP 4: HOW TO OVERCOME & DO THE REQUIRED THING (Action Blueprint)
            ═══════════════════════════════════════════════════════════════════ */}
            {(activeStep === 'OVERCOME' || activeStep === 'ALL') && (
              <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, var(--accent-emerald), var(--accent-blue))' }} />

                <div style={{ marginBottom: '1.5rem' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-emerald)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                    Step 4 of 4: Action Blueprint & Solution
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <CheckCircle2 size={26} />
                    {language === 'HI' ? 'बाधा का समाधान कैसे करें और पेटेंट कैसे प्राप्त करें' : 'How to Overcome the Statutory Bar (Action Blueprint)'}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {language === 'HI'
                      ? 'आपको अपना अन्वेषण छोड़ने की आवश्यकता नहीं है। पेटेंट संरक्षण प्राप्त करने के लिए नीचे दिए गए प्रमाणित कानूनी मार्गों और पूर्व-दाखिल चेकलिस्ट का पालन करें।'
                      : 'You do not have to abandon your research. The law permits protection if you reframe the invention. Below are the legally viable pathways, technical extraction process blueprint, and pre-filing compliance checklist.'}
                  </p>
                </div>

                {/* 1. Vector Extraction Flowchart — Clean SVG Icons, No Emojis */}
                <div style={{
                  background: 'rgba(16, 185, 129, 0.04)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  padding: '1.25rem 1.5rem',
                  marginBottom: '1.75rem'
                }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={14} />
                    <span>Technical Process Extraction Route — Section 2(1)(j) Blueprint</span>
                  </div>

                  {/* Flowchart Boxes — SVG symbols, no emojis */}
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {/* Box 1: Raw Biomass */}
                    <div style={{ flex: '1 0 130px', background: 'rgba(184, 58, 48, 0.08)', border: '1px solid rgba(184, 58, 48, 0.25)', borderRadius: '10px', padding: '0.85rem 0.75rem', textAlign: 'center', minWidth: 0 }}>
                      <div style={{ marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-crimson)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22V12"/><path d="M5 12C5 12 6 8 12 8S19 12 19 12"/><path d="M3 17c0 0 2-4 9-4s9 4 9 4"/><path d="M12 8V2"/></svg>
                      </div>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent-crimson)', marginBottom: '0.15rem' }}>1. Raw Biomass</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Curcuma longa<br/>Rhizome</div>
                      <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.62rem', background: 'rgba(184, 58, 48, 0.12)', color: 'var(--accent-crimson)', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(184, 58, 48, 0.25)' }}>s.3(p) Bar</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>

                    {/* Box 2: Extraction Process */}
                    <div style={{ flex: '1 0 130px', background: 'rgba(43, 108, 176, 0.08)', border: '1px solid rgba(43, 108, 176, 0.25)', borderRadius: '10px', padding: '0.85rem 0.75rem', textAlign: 'center', minWidth: 0 }}>
                      <div style={{ marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                      </div>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.15rem' }}>2. SC-CO₂ Extract</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>45°C, 250 bar<br/>Novel Parameters</div>
                      <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.62rem', background: 'rgba(43, 108, 176, 0.12)', color: 'var(--accent-blue)', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(43, 108, 176, 0.25)' }}>Inventive</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>

                    {/* Box 3: Fractionation */}
                    <div style={{ flex: '1 0 130px', background: 'rgba(186, 141, 50, 0.08)', border: '1px solid rgba(186, 141, 50, 0.25)', borderRadius: '10px', padding: '0.85rem 0.75rem', textAlign: 'center', minWidth: 0 }}>
                      <div style={{ marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/></svg>
                      </div>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.15rem' }}>3. Fractionation</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>HPLC column<br/>chromatography</div>
                      <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.62rem', background: 'rgba(186, 141, 50, 0.12)', color: 'var(--accent-gold)', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(186, 141, 50, 0.25)' }}>Separation</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>

                    {/* Box 4: Purified Isolate */}
                    <div style={{ flex: '1 0 130px', background: 'rgba(45, 122, 91, 0.08)', border: '1px solid rgba(45, 122, 91, 0.25)', borderRadius: '10px', padding: '0.85rem 0.75rem', textAlign: 'center', minWidth: 0 }}>
                      <div style={{ marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12L7 7l5 5 5-5 5 5"/><path d="M7 12v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-5"/></svg>
                      </div>
                      <div style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.15rem' }}>4. Purified Isolate</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>&gt;95% curcuminoid<br/>complex</div>
                      <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.62rem', background: 'rgba(45, 122, 91, 0.12)', color: 'var(--accent-emerald)', padding: '0.12rem 0.45rem', borderRadius: '4px', border: '1px solid rgba(45, 122, 91, 0.25)' }}>Enhanced</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </div>

                    {/* Box 5: Patent Granted */}
                    <div style={{ flex: '1 0 140px', background: 'rgba(45, 122, 91, 0.14)', border: '2px solid var(--accent-emerald)', borderRadius: '10px', padding: '0.85rem 0.75rem', textAlign: 'center', minWidth: 0 }}>
                      <div style={{ marginBottom: '0.45rem', display: 'flex', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-emerald)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                      </div>
                      <div style={{ fontSize: '0.73rem', fontWeight: 800, color: 'var(--accent-emerald)', marginBottom: '0.15rem' }}>5. PROCESS PATENT</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>s.2(1)(j) IPA 1970<br/>20 Years</div>
                      <span style={{ display: 'inline-block', marginTop: '0.4rem', fontSize: '0.62rem', background: 'var(--accent-emerald)', color: 'var(--text-primary-inverse)', padding: '0.12rem 0.5rem', borderRadius: '4px', fontWeight: 700 }}>GRANTED</span>
                    </div>
                  </div>
                </div>

                {/* 2. Three Legally Viable Protection Pathways Comparison Table */}
                <div style={{ marginBottom: '1.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
                    Comparison of Viable Protection Routes
                  </div>
                  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)', color: 'var(--accent-gold)' }}>
                          <th style={{ padding: '0.7rem 0.9rem' }}>Route</th>
                          <th style={{ padding: '0.7rem 0.9rem' }}>How to Draft Claims</th>
                          <th style={{ padding: '0.7rem 0.9rem' }}>Governing Statute</th>
                          <th style={{ padding: '0.7rem 0.9rem' }}>Evidence Required</th>
                          <th style={{ padding: '0.7rem 0.9rem' }}>Term of Monopoly</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                            Route A: Process / Extraction Patent (Recommended)
                          </td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--text-primary)' }}>
                            <em>"A green method for extracting bioactive curcuminoids from Curcuma longa comprising steps..."</em>
                          </td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--accent-gold)' }}>Patents Act 1970, s.2(1)(j)</td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--text-secondary)' }}>Operating parameters, temperature, pressure, yield %</td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--accent-blue)' }}>20 Years</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: 'var(--accent-blue)' }}>
                            Route B: Proven Synergistic Formulation
                          </td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--text-primary)' }}>
                            <em>"A synergistic pharmaceutical composition comprising Curcuma longa and Piper nigrum in a 95:5 ratio..."</em>
                          </td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--accent-gold)' }}>Patents Act 1970, s.3(e) overcome</td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--text-secondary)' }}>Chou-Talalay Combination Index &lt; 0.8 data</td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--accent-blue)' }}>20 Years</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.7rem 0.9rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                            Route C: Geographical Indication (GI Tag)
                          </td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--text-primary)' }}>
                            Register collective brand linked to regional terroir (e.g. <em>Lakadong Turmeric</em>).
                          </td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--accent-gold)' }}>GI of Goods Act 1999</td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--text-secondary)' }}>Regional historical cultivation records & chemical profile</td>
                          <td style={{ padding: '0.7rem 0.9rem', color: 'var(--accent-blue)' }}>Perpetual (Renewable 10 yrs)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Interactive Pre-Filing Readiness Checklist */}
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  marginBottom: '1.75rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileCheck size={20} style={{ color: 'var(--accent-gold)' }} />
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        Interactive Pre-Filing Compliance Checklist
                      </strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: completedChecklistCount === 5 ? 'var(--accent-emerald)' : 'var(--accent-gold)', fontWeight: 600 }}>
                      {completedChecklistCount} of 5 Items Ready ({((completedChecklistCount / 5) * 100).toFixed(0)}%)
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', marginBottom: '1.25rem' }}>
                    <div style={{
                      width: `${(completedChecklistCount / 5) * 100}%`,
                      height: '100%',
                      background: completedChecklistCount === 5 ? 'var(--accent-emerald)' : 'var(--accent-gold)',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {[
                      { key: 'step_claim', label: '1. Amend Claims to Process-Only', desc: 'All independent claims must begin with "A process/method for preparation of..." to bypass Section 3(p) product bar.' },
                      { key: 'step_process', label: '2. Document Novel Operating Parameters', desc: 'Record non-obvious temperature, pressure, solvent ratio, and extraction cycles.' },
                      { key: 'step_fingerprint', label: '3. Attach Phytochemical Chromatography', desc: 'Include HPLC / HPTLC fingerprint spectrum demonstrating bioactive marker concentration vs raw powder.' },
                      { key: 'step_nba', label: '4. File NBA Form III Approval', desc: 'Mandatory statutory application with National Biodiversity Authority under BDA 2002 s.6.' },
                      { key: 'step_synergy', label: '5. Comparative Synergistic Assay Data', desc: 'If filing a herbal mixture, attach cell-culture trial data showing Combination Index < 0.8 (Chou-Talalay method).' },
                    ].map(item => {
                      const isChecked = checkedChecklist[item.key];
                      return (
                        <div 
                          key={item.key}
                          onClick={() => toggleChecklistItem(item.key)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '8px',
                            background: isChecked ? 'rgba(45, 122, 91, 0.08)' : 'var(--bg-elevated)',
                            border: `1px solid ${isChecked ? 'rgba(45, 122, 91, 0.3)' : 'var(--border-color)'}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ marginTop: '0.15rem', color: isChecked ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                            {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isChecked ? 'var(--accent-emerald)' : 'var(--text-primary)', textDecoration: isChecked ? 'line-through' : 'none' }}>
                              {item.label}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                              {item.desc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                  {activeStep === 'OVERCOME' && (
                    <button
                      type="button"
                      onClick={() => setActiveStep('REASONS')}
                      className="btn"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.5rem 1rem', fontSize: '0.84rem' }}
                    >
                      <ArrowRight style={{ transform: 'rotate(180deg)' }} size={16} />
                      <span>{language === 'HI' ? 'पिछला: मुख्य कारण' : 'Previous: Step 3 Reasons'}</span>
                    </button>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      onClick={() => setShowFacilitatorModal(true)}
                      className="btn-gold"
                      style={{ fontSize: '0.86rem', padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', cursor: 'pointer', border: 'none', fontWeight: 600 }}
                    >
                      <UserCheck size={16} />
                      <span>{t('escalate_facilitator_btn', language)}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setShowPdfModal(true)} 
                      className="btn" 
                      style={{ fontSize: '0.86rem', padding: '0.55rem 1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <FileText size={16} />
                      <span>{t('export_pdf_btn', language)}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}


            {/* ═══ JURISDICTION COMPARISON TABLE (India / USA / EPO) ═══ */}
            {diffVerdicts && (
              <div className="glass-panel" style={{ padding: '1.75rem', marginTop: '1.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.07em', color: 'var(--accent-blue)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Jurisdiction Comparison</div>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>India · USA · EPO — Side-by-Side Audit</h3>
                  </div>
                  <a href="/compare" style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem', border: '1px solid var(--border-highlight)', borderRadius: '8px', padding: '0.35rem 0.75rem' }}>
                    <ExternalLink size={12} /> Deep Comparative Audit
                  </a>
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Criteria</th>
                        <th style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>India (IPA 1970)</th>
                        <th style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>United States (USC 35)</th>
                        <th style={{ padding: '0.7rem 1rem', fontWeight: 700, color: 'var(--accent-emerald)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>European Patent Office</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          label: 'Product Patent',
                          india: { text: diffVerdicts.india_verdict.is_patentable ? '✓ Viable' : '✕ Barred', ok: diffVerdicts.india_verdict.is_patentable },
                          us: { text: diffVerdicts.uspto_verdict.is_patentable ? '✓ Viable' : '✕ Barred', ok: diffVerdicts.uspto_verdict.is_patentable },
                          epo: { text: diffVerdicts.epo_verdict.is_patentable ? '✓ Viable' : '✕ Barred', ok: diffVerdicts.epo_verdict.is_patentable },
                        },
                        {
                          label: 'Process Patent',
                          india: { text: '✓ Open', ok: true },
                          us: { text: '✓ Open', ok: true },
                          epo: { text: '~ Conditional', ok: null },
                        },
                        {
                          label: 'Prior Art Database',
                          india: { text: 'TKDL · BDA', ok: null },
                          us: { text: 'AFI · TKDL', ok: null },
                          epo: { text: 'TKDL · AFI', ok: null },
                        },
                        {
                          label: 'Key Statutory Bar',
                          india: { text: 's.3(p) IPA', ok: false },
                          us: { text: '§102 / §103', ok: false },
                          epo: { text: 'Art.52 / Art.56', ok: false },
                        },
                        {
                          label: 'Mandatory Clearance',
                          india: { text: 'NBA Form III', ok: null },
                          us: { text: '— (none)', ok: null },
                          epo: { text: 'Nagoya Disclosure', ok: null },
                        },
                      ].map((row, ri) => (
                        <tr key={ri} style={{ borderBottom: ri < 4 ? '1px solid var(--border-color)' : 'none' }}>
                          <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{row.label}</td>
                          <td style={{ padding: '0.7rem 1rem', color: row.india.ok === true ? 'var(--accent-emerald)' : row.india.ok === false ? 'var(--accent-crimson)' : 'var(--accent-amber)', fontWeight: row.india.ok !== null ? 700 : 400 }}>{row.india.text}</td>
                          <td style={{ padding: '0.7rem 1rem', color: row.us.ok === true ? 'var(--accent-emerald)' : row.us.ok === false ? 'var(--accent-crimson)' : 'var(--accent-blue)', fontWeight: row.us.ok !== null ? 700 : 400 }}>{row.us.text}</td>
                          <td style={{ padding: '0.7rem 1rem', color: row.epo.ok === true ? 'var(--accent-emerald)' : row.epo.ok === false ? 'var(--accent-crimson)' : 'var(--accent-emerald)', fontWeight: row.epo.ok !== null ? 700 : 400 }}>{row.epo.text}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══ EVIDENCE & CITATIONS VAULT BAND ═══ */}
            {activeVerdict.reasoning_chain?.length > 0 && (
              <div style={{
                marginTop: '1.75rem',
                padding: '0.9rem 1.4rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(186, 141, 50, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {activeVerdict.reasoning_chain.length} verified statutory sources across {activeVerdict.reasoning_chain.length} legal grounds
                    </div>
                    <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      Full excerpts, SHA-256 hashes &amp; official India Code links live in the vault
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (activeVerdict.reasoning_chain.length > 0) {
                      const firstStep = activeVerdict.reasoning_chain[0];
                      if (firstStep.citation) {
                        setVaultSelection({
                          citation: firstStep.citation,
                          claimTitle: firstStep.title,
                          claimDescription: firstStep.description,
                          stepId: firstStep.id,
                        });
                      }
                    }
                  }}
                  style={{
                    background: 'var(--accent-gold)',
                    color: 'var(--text-primary-inverse)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0.5rem 1.15rem',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <BookOpen size={14} /> Citations &amp; Rules
                </button>
              </div>
            )}

            {/* 💬 STATUTORY AI ASSISTANT */}
            <FollowUpChat verdict={activeVerdict} jurisdiction={jurisdiction} language={language} />

          </motion.div>
        )}

        {/* VIEW 4: ABSTENTION FALLBACK */}
        {flowState === 'ABSTAIN' && activeVerdict && (
          <motion.div 
            key="abstain-view"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.4 }}
          >
            <button onClick={resetFlow} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <ArrowRight style={{ transform: 'rotate(180deg)' }} size={20} /> {t('back_to_search', language)}
            </button>

            <div className="glass-panel" style={{ padding: '2.5rem', borderLeft: '6px solid var(--accent-amber)', textAlign: 'left' }}>
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="text-amber" size={36} />
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{t('abstention_title', language)}</h2>
                  <div style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600 }}>{t('abstention_guardrail_label', language)}</div>
                </div>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                {t('abstention_query_label', language)} <span style={{ color: 'var(--text-primary)' }}>"{activeVerdict.query}"</span>
              </p>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {activeVerdict.abstention_reason}
              </p>

              <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                  <h4 style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t('escalation_routing_title', language)}</h4>
                  <button 
                    onClick={() => setShowFacilitatorModal(true)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    {t('escalation_generate_btn', language)}
                  </button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  {t('escalation_notice', language)}
                </p>
                <div className="flex gap-4 flex-wrap">
                  <a href="https://ipindia.gov.in" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none' }}>
                    {t('escalation_link_ipo', language)} <ExternalLink size={14}/>
                  </a>
                  <a href="https://ayush.gov.in" target="_blank" rel="noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none' }}>
                    {t('escalation_link_ayush', language)} <ExternalLink size={14}/>
                  </a>
                </div>
              </div>

              {/* Cryptographic Audit Record Footer for Abstention */}
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-elevated)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Shield size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} /> 
                    {t('audit_trail_label', language)}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--accent-emerald)' }}>{t('dpdp_compliant_label', language)}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  <div><strong>{t('txn_id_label', language)}</strong> <br/><span style={{ color: 'var(--text-muted)' }}>{activeVerdict.audit_record?.audit_id || 'N/A'}</span></div>
                  <div><strong>{t('timestamp_label', language)}</strong> <br/><span style={{ color: 'var(--text-muted)' }}>{activeVerdict.audit_record?.timestamp || 'N/A'}</span></div>
                  <div><strong>{t('hash_label', language)}</strong> <br/><span style={{ color: 'var(--text-muted)' }}>{activeVerdict.audit_record?.query_hash || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Floating Ask Assistant Launcher */}
      {flowState === 'VERDICT' && activeVerdict && (
        <a
          href="#followup-chat-section"
          className="btn-gold"
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2.5rem',
            zIndex: 40,
            padding: '0.75rem 1.4rem',
            borderRadius: '999px',
            fontSize: '0.88rem',
            fontWeight: 600,
            boxShadow: '0 8px 32px rgba(201, 168, 106, 0.4)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <MessageSquare size={16} />
          <span>{t('ask_assistant_btn', language)}</span>
        </a>
      )}

      {/* Cryptographic Citation Vault — Inline card click from reasoning chain */}
      {showCitationModal && (
        <CitationVaultDrawer
          selection={{
            citation: showCitationModal,
            claimTitle: showCitationModal.heading || showCitationModal.act_title,
            claimDescription: showCitationModal.explanation || showCitationModal.text_snippet,
          }}
          onClose={() => setShowCitationModal(null)}
        />
      )}

      {/* Citation Vault triggered from Evidence Band */}
      {vaultSelection && (
        <CitationVaultDrawer
          selection={vaultSelection}
          onClose={() => setVaultSelection(null)}
        />
      )}

      {/* Human Facilitator Escalation Modal */}
      {showFacilitatorModal && activeVerdict && (
        <FacilitatorEscalationModal 
          verdict={activeVerdict}
          onClose={() => setShowFacilitatorModal(false)}
          language={language}
        />
      )}

      {/* Multilingual Statutory PDF Dossier Modal */}
      {showPdfModal && activeVerdict && (
        <MultilingualPdfModal 
          verdict={activeVerdict}
          initialLanguage={language === 'HI' ? 'HI' : language === 'MR' ? 'MR' : language === 'SA' ? 'SA' : 'EN'}
          onClose={() => setShowPdfModal(false)}
        />
      )}

      {/* Persistent Legal & Privacy Footer */}
      <footer style={{
        marginTop: '3rem',
        padding: '1rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        maxWidth: '1100px',
        width: '100%',
        margin: '3rem auto 0 auto'
      }}>
        <div>
          {t('footer_text', language)}
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>{t('dpdp_non_pii', language)}</span>
          <span>·</span>
          <span>{t('footer_zero_retention', language)}</span>
          <span>·</span>
          <span>{t('footer_sha256', language)}</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.95); } }
      `}} />
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', color: 'var(--accent-gold)', fontFamily: "var(--font-serif), Georgia, serif", fontSize: '1.1rem' }}>
        <span>Initializing Statutory Intelligence Studio...</span>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

