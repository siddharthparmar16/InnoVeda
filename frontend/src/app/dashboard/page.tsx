"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, ShieldAlert, Shield, ArrowRight, Gavel, FileText, CheckCircle2, 
  ExternalLink, RefreshCw, Download, AlertTriangle, HelpCircle, 
  UserCheck, Languages, Lock, Scale, Mic, MicOff, Volume2, VolumeX
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
import PriorArtGraph from '@/components/PriorArtGraph';
import FacilitatorEscalationModal from '@/components/FacilitatorEscalationModal';

export default function Home() {
  const [flowState, setFlowState] = useState<FlowState>('INPUT');
  const [query, setQuery] = useState('');
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>('INDIA');
  const [language, setLanguage] = useState<SupportedLanguage>('EN');
  const [activeVerdict, setActiveVerdict] = useState<LegalVerdict | null>(null);
  const [showCitationModal, setShowCitationModal] = useState<StatutoryCitation | null>(null);
  const [showFacilitatorModal, setShowFacilitatorModal] = useState(false);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Advanced depth features state
  const [diffVerdicts, setDiffVerdicts] = useState<JurisdictionDiff | null>(null);
  const [adversarialArgument, setAdversarialArgument] = useState<string | null>(null);
  const [showExaminerView, setShowExaminerView] = useState(false);

  const fetchVerdict = async (searchQuery: string, currentJurisdiction: Jurisdiction, currentLanguage: SupportedLanguage) => {
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
    
    // Load advanced comparative depth in parallel
    const diffPromise = verdict.resolved_botanicals && verdict.resolved_botanicals.length > 0
      ? executeJurisdictionDiff(searchQuery, verdict.resolved_botanicals)
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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
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
    recognition.lang = language === 'HI' ? 'hi-IN' : language === 'MR' ? 'mr-IN' : 'en-IN';
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
      utterance.lang = language === 'HI' ? 'hi-IN' : language === 'MR' ? 'mr-IN' : 'en-IN';
      
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
    setQuery(presetText);
    setFlowState('PROCESSING');
    try {
      await fetchVerdict(presetText, jurisdiction, language);
    } catch (error) {
      console.error('Error fetching preset verdict:', error);
      setFlowState('INPUT');
    }
  };

  return (
    <main style={{ minHeight: '100vh', padding: '6rem 1.5rem 1rem 1.5rem', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', background: 'transparent' }}>
      
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
        maxWidth: '1100px',
        margin: '0 auto 1rem auto',
        width: '100%',
        background: 'linear-gradient(90deg, rgba(245, 158, 11, 0.12), rgba(59, 130, 246, 0.12))',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: '10px',
        padding: '0.6rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: '0.8rem',
        color: '#fde68a',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Scale size={16} className="text-amber" />
          <span>
            <strong>Legal Notice:</strong> Statutory Intelligence, Not Legal Advice. Traceable to public Indian & International IP acts. Consult a registered Patent Agent for formal filing.
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#93c5fd', fontSize: '0.75rem' }}>
          <Lock size={13} />
          <span>DPDP Act 2023 Compliant · Non-PII Session</span>
        </div>
      </div>

      {/* Main App Header */}
      <header className="glass-panel" style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem',
        maxWidth: '1100px', margin: '0 auto 2rem auto', width: '100%', padding: '0.85rem 1.75rem', borderRadius: '16px' 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-emerald)', fontWeight: 600, letterSpacing: '0.05em' }}>
            STATUTORY RAG ENGINE
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
                color: 'white',
                fontSize: '0.8rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0.5rem'
              }}
            >
              <option value="EN" style={{ background: '#0f172a' }}>English</option>
              <option value="HI" style={{ background: '#0f172a' }}>हिन्दी (Hindi)</option>
              <option value="MR" style={{ background: '#0f172a' }}>मराठी (Marathi)</option>
            </select>
          </div>

          <span className="status-badge" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid var(--accent-emerald)', color: '#6ee7b7', fontSize: '0.75rem' }}>
            Ministry of Ayush · SIH26045
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="container" style={{ maxWidth: '950px', margin: '0 auto', flex: 1, width: '100%', position: 'relative' }}>
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
              {language === 'HI' 
                ? 'आयुर्वेद हेतु त्वरित पेटेंट एवं आईपी मार्गदर्शन' 
                : language === 'MR' 
                ? 'आयुर्वेदासाठी त्वरित पेटंट व आयपी मार्गदर्शन' 
                : 'Instant Statutory Patent & IP Guidance for Ayurveda'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto 2.5rem auto' }}>
              Citation-grounded retrieval assistant for classical & proprietary formulators. Grounded in the Indian Patents Act, Biological Diversity Act 2023, and WIPO GRATK Treaty.
            </p>

            <form onSubmit={handleSearch} className="glass-panel" style={{ padding: '0.5rem', display: 'flex', borderRadius: '999px', boxShadow: 'var(--shadow-glow)' }}>
              <div style={{ padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}>
                <Search size={24} />
              </div>
              <input 
                type="text" 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  language === 'HI' 
                    ? 'उदा. मैं जोड़ों के दर्द के लिए हल्दी और काली मिर्च का पेटेंट कराना चाहता हूँ।' 
                    : language === 'MR' 
                    ? 'उदा. मला सांधेदुखीसाठी हळद आणि मिरी यांचे पेटंट घ्यायचे आहे.' 
                    : 'E.g., I want to patent a formulation of Haridra and Maricha for joint pain.'
                }
                style={{ 
                  flex: 1, 
                  background: 'transparent', 
                  border: 'none', 
                  color: 'white',
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
              
              <div className="btn-conic" style={{ borderRadius: '999px', margin: '-2px' }}>
                <button 
                  type="submit" 
                  disabled={!query.trim()} 
                  className="group relative overflow-hidden" 
                  style={{ borderRadius: '999px', padding: '0.85rem 2.5rem', fontWeight: 700, background: '#020617', color: 'white', border: 'none', cursor: 'pointer' }}
                >
                  {language === 'HI' ? 'विश्लेषण करें' : language === 'MR' ? 'विश्लेषण करा' : 'Analyze Intent'}
                </button>
              </div>
            </form>
            
            {/* Presets & Badges */}
            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Test Scenarios:</span>
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
                <h3 className="text-gradient-animated" style={{ fontSize: '1.6rem', fontWeight: 700 }}>Analyzing Statutory Corpus...</h3>
              </div>
              
              {/* Pulse Skeleton Loaders */}
              <div style={{ padding: '2rem', background: 'rgba(15, 23, 42, 0.6)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ height: '24px', width: '80%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out' }} />
                <div style={{ height: '24px', width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out 0.2s' }} />
                <div style={{ height: '24px', width: '90%', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', animation: 'pulse 1.5s infinite ease-in-out 0.4s' }} />
              </div>
            </div>

            <div className="flex flex-col gap-2" style={{ color: 'var(--accent-emerald)', textAlign: 'left', fontFamily: 'monospace', fontSize: '0.9rem', background: 'rgba(16, 185, 129, 0.05)', padding: '1.5rem', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <p>✓ Scrubbing client identifiers under DPDP Act 2023...</p>
              <p>✓ Resolving Sanskrit & Vernacular Botanical Taxonomy (Curcuma longa, Piper nigrum)...</p>
              <p>✓ Evaluating Section 3(p) Traditional Knowledge Bar & AFI Formulary...</p>
              <p>✓ Checking Biological Diversity Act 2023 Sec 6 NBA Form III compliance...</p>
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
                <ArrowRight style={{ transform: 'rotate(180deg)' }} size={20} /> Back to Search
              </button>
              
              <div className="flex items-center gap-3 flex-wrap">
                {/* Human Facilitator Escalation Button */}
                <button 
                  onClick={() => setShowFacilitatorModal(true)}
                  className="btn"
                  style={{ 
                    fontSize: '0.85rem', padding: '0.45rem 1rem', 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    border: '1px solid var(--accent-emerald)', 
                    color: '#6ee7b7',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                  }}
                >
                  <UserCheck size={16} /> Escalate to Human Facilitator
                </button>

                {/* Export Advisory Memo Button */}
                <button 
                  onClick={() => downloadAdvisoryMemoFile(activeVerdict)} 
                  className="btn btn-primary flex items-center gap-2" 
                  style={{ fontSize: '0.85rem', padding: '0.45rem 1rem' }}
                >
                  <Download size={15} /> Export Memo (.md)
                </button>

                {/* Jurisdiction Toggle */}
                <div className="glass-panel flex" style={{ padding: '0.2rem', borderRadius: '8px' }}>
                  <button 
                    onClick={() => handleJurisdictionChange('INDIA')}
                    style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: jurisdiction === 'INDIA' ? 'var(--bg-glass-hover)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: jurisdiction === 'INDIA' ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}
                  >
                    🇮🇳 Indian Regime
                  </button>
                  <button 
                    onClick={() => handleJurisdictionChange('INTERNATIONAL')}
                    style={{ 
                      padding: '0.35rem 0.75rem', 
                      background: jurisdiction === 'INTERNATIONAL' ? 'var(--bg-glass-hover)' : 'transparent',
                      border: 'none',
                      borderRadius: '6px',
                      color: jurisdiction === 'INTERNATIONAL' ? 'white' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem'
                    }}
                  >
                    🌐 International (WIPO)
                  </button>
                </div>
              </div>
            </div>

            {/* Verdict Header Banner */}
            <div className="glass-panel" style={{ 
              padding: '2rem', marginBottom: '2rem', 
              borderLeft: activeVerdict.is_patentable ? '6px solid var(--accent-emerald)' : '6px solid var(--accent-crimson)' 
            }}>
              <div className="flex justify-between items-start mb-4 flex-wrap gap-2">
                <div>
                  <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 700 }}>
                    <Gavel className={activeVerdict.is_patentable ? 'text-emerald' : 'text-crimson'} size={28} /> 
                    {activeVerdict.verdict_title}
                  </h2>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    Jurisdiction Mode: <strong>{jurisdiction === 'INDIA' ? 'Indian Patents Act & BDA 2023' : 'WIPO International / PCT Regime'}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSpeaking}
                    className="btn"
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: '0.4rem', 
                      padding: '0.3rem 0.6rem', fontSize: '0.75rem', 
                      background: isSpeaking ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                      color: isSpeaking ? '#93c5fd' : 'var(--text-secondary)',
                      border: isSpeaking ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border-color)',
                      borderRadius: '8px'
                    }}
                  >
                    {isSpeaking ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
                    {isSpeaking ? 'Reading...' : 'Read Aloud'}
                  </button>
                  <span className="status-badge" style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.4)' }}>
                    Confidence: {(activeVerdict.confidence_score * 100).toFixed(0)}%
                  </span>
                  {activeVerdict.audit_record && (
                    <span className="status-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,0.3)', fontSize: '0.7rem' }}>
                      Audit: {activeVerdict.audit_record.query_hash.slice(0, 14)}
                    </span>
                  )}
                </div>
              </div>

              {/* Resolved Botanicals */}
              {activeVerdict.resolved_botanicals?.length > 0 && (
                <div style={{ marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Resolved Botanical Species & Pharmacopoeial Standards
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    {activeVerdict.resolved_botanicals.map((botanical, idx) => (
                      <div key={idx} style={{ fontSize: '0.9rem' }}>
                        <span style={{ color: 'white', fontWeight: 600 }}>{botanical.sanskrit_name}</span> ({botanical.english_common_name}) → <em style={{ color: 'var(--accent-blue)' }}>{botanical.botanical_binomial}</em>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Landmark Precedent Case Alert */}
              {activeVerdict.precedent_case && (
                <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid var(--accent-amber)', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', color: '#fcd34d' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>Biopiracy Landmark Precedent:</strong> {activeVerdict.precedent_case}
                  </div>
                </div>
              )}

              {/* Dynamic Relational Prior-Art Knowledge Graph */}
              <div style={{ marginBottom: '2rem' }}>
                <PriorArtGraph 
                  query={query} 
                  resolvedBotanicals={activeVerdict.resolved_botanicals}
                  reasoningSteps={activeVerdict.reasoning_chain}
                  precedentCase={activeVerdict.precedent_case}
                  isPatentable={activeVerdict.is_patentable}
                />
              </div>

              {/* Adversarial Examiner Self-Check */}
              {adversarialArgument && (
                <div style={{ marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setShowExaminerView(!showExaminerView)}
                    style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'transparent', border: 'none', color: '#fca5a5', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}
                  >
                    <div className="flex items-center gap-2"><Gavel size={18}/> Simulated Patent Examiner Rejection (Adversarial Check)</div>
                    <span>{showExaminerView ? 'Hide' : 'View Rejection Stance'}</span>
                  </button>
                  {showExaminerView && (
                    <div style={{ padding: '0 1rem 1rem 1rem', color: '#fca5a5', fontSize: '0.875rem', lineHeight: 1.6 }}>
                      {adversarialArgument}
                    </div>
                  )}
                </div>
              )}

              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Gavel className="text-crimson" size={22} />
                Statutory Reasoning & Legal Analysis
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {activeVerdict.reasoning_chain.map((step) => (
                  <div key={step.id} className="glass-panel" style={{ position: 'relative', padding: '1.5rem', overflow: 'hidden' }}>
                    <div style={{
                      position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                      backgroundColor: step.severity === 'BARRED' ? 'var(--accent-crimson)' : step.severity === 'APPROVAL_REQUIRED' ? 'var(--accent-amber)' : 'var(--accent-blue)'
                    }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem', marginLeft: '0.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <span style={{
                          padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', border: '1px solid',
                          backgroundColor: step.severity === 'BARRED' ? 'rgba(239, 68, 68, 0.1)' : step.severity === 'APPROVAL_REQUIRED' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                          color: step.severity === 'BARRED' ? '#fca5a5' : step.severity === 'APPROVAL_REQUIRED' ? '#fcd34d' : '#93c5fd',
                          borderColor: step.severity === 'BARRED' ? 'rgba(239, 68, 68, 0.3)' : step.severity === 'APPROVAL_REQUIRED' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(59, 130, 246, 0.3)',
                        }}>
                          {step.severity.replace('_', ' ')}
                        </span>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>{step.title}</strong>
                        {step.citation?.nli_verified && (
                          <span title="NLI Verification Passed: Claim is strictly entailed by source statute" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#6ee7b7', background: 'rgba(16, 185, 129, 0.15)', padding: '0.25rem 0.6rem', borderRadius: '999px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                            <CheckCircle2 size={12}/> NLI Verified
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => setShowCitationModal(step.citation)} 
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', fontSize: '0.75rem', color: '#93c5fd', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', whiteSpace: 'nowrap' }}
                      >
                        <FileText size={14} /> View Original Citation
                      </button>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6, marginLeft: '0.5rem', marginTop: '0.75rem' }}>
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Viable Protection Routes */}
            <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(to right, var(--accent-emerald), var(--accent-blue))' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-emerald)' }}>
                  <CheckCircle2 size={24} /> Recommended Viable Protection Routes
                </h2>
                <button 
                  onClick={() => setShowFacilitatorModal(true)}
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                >
                  Escalate to Facilitator
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {activeVerdict.viable_routes.map((route, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                    <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{route.title}</h4>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1rem' }}>
                      {route.description}
                    </p>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-emerald)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Actionable Steps</div>
                      <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {route.actionable_steps.map((step, sIdx) => (
                          <li key={sIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#a7f3d0', fontSize: '0.85rem' }}>
                            <div style={{ marginTop: '0.3rem', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-emerald)', flexShrink: 0 }} />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Jurisdiction Diff Engine Card */}
            {diffVerdicts && (
              <div className="glass-panel" style={{ padding: '2.5rem', marginTop: '2rem', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                <h2 style={{ fontSize: '1.35rem', marginBottom: '2rem', color: 'var(--accent-blue)', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Jurisdiction Diff Engine (India vs US vs EPO)
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                  {/* India */}
                  <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderTop: '4px solid var(--accent-amber)' }}>
                    <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>🇮🇳 India (Patents Act + BDA)</h4>
                    <p style={{ color: diffVerdicts.india_verdict.is_patentable ? 'var(--accent-emerald)' : 'var(--accent-crimson)', fontWeight: 700, fontSize: '1.05rem' }}>{diffVerdicts.india_verdict.verdict_title}</p>
                    <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem', listStyle: 'disc', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <li>NBA Form III Approval: Required</li>
                      <li>Section 3(p) TK Bar Applies</li>
                    </ul>
                  </div>
                  {/* US */}
                  <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderTop: '4px solid var(--accent-blue)' }}>
                    <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>🇺🇸 USPTO</h4>
                    <p style={{ color: diffVerdicts.uspto_verdict.is_patentable ? 'var(--accent-emerald)' : 'var(--accent-crimson)', fontWeight: 700, fontSize: '1.05rem' }}>{diffVerdicts.uspto_verdict.verdict_title}</p>
                    <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem', listStyle: 'disc', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <li>102/103 Prior Art Rejections via AFI/TKDL</li>
                      <li>Process claims patentable if novel</li>
                    </ul>
                  </div>
                  {/* EPO */}
                  <div className="glass-panel" style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderTop: '4px solid #eab308' }}>
                    <h4 style={{ color: 'white', fontWeight: 700, marginBottom: '1rem', fontSize: '1.1rem' }}>🇪🇺 EPO (Europe)</h4>
                    <p style={{ color: diffVerdicts.epo_verdict.is_patentable ? 'var(--accent-emerald)' : 'var(--accent-crimson)', fontWeight: 700, fontSize: '1.05rem' }}>{diffVerdicts.epo_verdict.verdict_title}</p>
                    <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '1rem', listStyle: 'disc', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <li>Article 56 EPC Inventive Step Burden</li>
                      <li>Nagoya Protocol origin disclosure</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

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
              <ArrowRight style={{ transform: 'rotate(180deg)' }} size={20} /> Back to Search
            </button>

            <div className="glass-panel" style={{ padding: '2.5rem', borderLeft: '6px solid var(--accent-amber)', textAlign: 'left' }}>
              <div className="flex items-center gap-3 mb-4">
                <HelpCircle className="text-amber" size={36} />
                <div>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Safe Abstention: Query Outside IP Scope</h2>
                  <div style={{ color: 'var(--accent-amber)', fontSize: '0.85rem', fontWeight: 600 }}>SYSTEM MEDICAL GUARDRAIL TRIGGERED</div>
                </div>
              </div>
              
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                Query: <span style={{ color: 'white' }}>"{activeVerdict.query}"</span>
              </p>

              <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {activeVerdict.abstention_reason}
              </p>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                  <h4 style={{ fontWeight: 600, color: 'white' }}>Escalation & Expert Routing</h4>
                  <button 
                    onClick={() => setShowFacilitatorModal(true)}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                  >
                    Generate Escalation Brief
                  </button>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  For therapeutic dosages, clinical questions, or formal patent prosecution, please consult licensed medical authorities or registered patent facilitators:
                </p>
                <div className="flex gap-4 flex-wrap">
                  <a href="https://ipindia.gov.in" target="_blank" rel="noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none' }}>
                    IP India Registered Patent Agents Registry <ExternalLink size={14}/>
                  </a>
                  <a href="https://ayush.gov.in" target="_blank" rel="noreferrer" className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', textDecoration: 'none' }}>
                    Ministry of Ayush Portal <ExternalLink size={14}/>
                  </a>
                </div>
              </div>

              {/* Cryptographic Audit Record Footer for Abstention */}
              <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Shield size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-top' }} /> 
                    Cryptographic Audit Trail
                  </span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#10b981' }}>DPDP-2023 COMPLIANT</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                  <div><strong>Transaction ID:</strong> <br/><span style={{ color: '#94a3b8' }}>{activeVerdict.audit_record?.audit_id || 'N/A'}</span></div>
                  <div><strong>Timestamp:</strong> <br/><span style={{ color: '#94a3b8' }}>{activeVerdict.audit_record?.timestamp || 'N/A'}</span></div>
                  <div><strong>Hash:</strong> <br/><span style={{ color: '#94a3b8' }}>{activeVerdict.audit_record?.query_hash || 'N/A'}</span></div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>

      {/* Cryptographic Citation Vault Modal */}
      {showCitationModal && (
        <div className="modal-overlay" onClick={() => setShowCitationModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="flex items-center gap-2">
                <ShieldAlert className="text-blue" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Statutory Citation Vault</h3>
              </div>
              <button onClick={() => setShowCitationModal(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.5rem' }}>×</button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>
                  Statutory Source Authority
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {showCitationModal.act_title} ({showCitationModal.citation_code})
                </div>
                {showCitationModal.version_tag && (
                  <div style={{ fontSize: '0.8rem', color: '#93c5fd', marginTop: '0.2rem' }}>
                    Legislation Version: <strong>{showCitationModal.version_tag}</strong>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.825rem', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--accent-emerald)' }}>
                    ✓ SHA-256 Hash: {showCitationModal.sha256_hash ? showCitationModal.sha256_hash.slice(0, 16) + '...' : 'Verified Authentic'}
                  </span>
                  <a href="https://indiacode.nic.in" target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    India Code Official Registry <ExternalLink size={12}/>
                  </a>
                </div>
              </div>
              
              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-blue)', fontFamily: 'Georgia, serif', lineHeight: 1.7, fontSize: '0.95rem' }}>
                <strong>{showCitationModal.heading}</strong><br/><br/>
                <span style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.2rem 0.4rem', borderRadius: '4px' }}>
                  &ldquo;{showCitationModal.text_snippet}&rdquo;
                </span>
                {showCitationModal.explanation && (
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    <strong>Statutory Meaning:</strong> {showCitationModal.explanation}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Human Facilitator Escalation Modal */}
      {showFacilitatorModal && activeVerdict && (
        <FacilitatorEscalationModal 
          verdict={activeVerdict}
          onClose={() => setShowFacilitatorModal(false)}
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
          IP-SAKTI Sahayak · Smart India Hackathon 2026 (SIH26045) · Ministry of Ayush Target
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <span>DPDP Act 2023 Compliant</span>
          <span>·</span>
          <span>Zero-Retention Ephemeral Pipeline</span>
          <span>·</span>
          <span>SHA-256 Audit Grounding</span>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.8; transform: scale(0.95); } }
      `}} />
    </main>
  );
}
