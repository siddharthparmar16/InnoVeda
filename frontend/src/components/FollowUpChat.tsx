"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  ShieldCheck, 
  ArrowRight,
  BookOpen,
  MessageSquare
} from 'lucide-react';
import { Jurisdiction, LegalVerdict, SupportedLanguage } from '@/types/domain';
import { FollowUpContext, starterSuggestions } from '@/lib/domain-engine/followup-responder';
import { t } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: string[];
  suggestions?: string[];
  timestamp: string;
}

interface Props {
  verdict: LegalVerdict;
  jurisdiction: Jurisdiction;
  language?: SupportedLanguage;
}

function buildContext(verdict: LegalVerdict, jurisdiction: FollowUpContext['jurisdiction']): FollowUpContext {
  return {
    query: verdict.query,
    jurisdiction,
    language: verdict.language,
    verdict_title: verdict.verdict_title,
    is_patentable: verdict.is_patentable,
    nba_required: verdict.nba_approval_required,
    wipo_required: verdict.wipo_disclosure_mandatory,
    classification_label: verdict.classification?.category_label,
    classification_category: verdict.classification?.category,
    band_label: verdict.classification?.band_label,
    botanicals: (verdict.resolved_botanicals ?? []).map((b) => ({
      sanskrit_name: b.sanskrit_name,
      botanical_binomial: b.botanical_binomial,
      english_common_name: b.english_common_name,
    })),
    reasoning: (verdict.reasoning_chain ?? []).map((s) => ({
      title: s.title,
      severity: s.severity,
      citation_code: s.citation?.citation_code ?? '',
      section_id: s.citation?.section_id ?? '',
    })),
    gaps: (verdict.evidence_gaps ?? []).map((g) => ({
      id: g.id,
      question: g.question,
      how_to_fix: g.how_to_fix,
      severity: g.severity,
    })),
    routes: (verdict.viable_routes ?? []).map((r) => ({
      type: r.type,
      title: r.title,
      priority: r.priority,
    })),
  };
}

export default function FollowUpChat({ verdict, jurisdiction, language = 'EN' }: Props) {
  const context = useMemo(() => buildContext(verdict, jurisdiction), [verdict, jurisdiction]);
  const starters = useMemo(() => starterSuggestions(context), [context]);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only scroll the internal messages container, and only when user actively sends/receives messages
    if (messages.length > 0 && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([]);
  };

  const send = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: data.answer ?? 'No statutory opinion returned.',
        citations: data.citations ?? [],
        suggestions: data.suggestions ?? [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'The analysis assistant could not complete the request. Your verdict context remains cached; please re-send your query.',
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const herbChips = context.botanicals.map((b) => b.sanskrit_name).join(' + ') || 'General Statutory Analysis';
  const lang = language;

  return (
    <div 
      id="followup-chat-section"
      className="luxury-card"
      style={{
        padding: 0,
        margin: '2.5rem 0 1rem 0',
        border: '1px solid var(--border-gold)',
        boxShadow: 'var(--shadow-elevation)',
        overflow: 'hidden',
        background: 'var(--bg-card)'
      }}
    >
      {/* Top Accent Strip */}
      <div 
        style={{ 
          height: '3px', 
          width: '100%', 
          background: 'linear-gradient(90deg, var(--gold) 0%, #10b981 50%, #3b82f6 100%)' 
        }} 
      />

      {/* Header Bar */}
      <div 
        style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          background: 'var(--bg-elevated)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div 
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'rgba(201, 168, 106, 0.15)',
              border: '1px solid rgba(201, 168, 106, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold)',
              flexShrink: 0
            }}
          >
            <Bot size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 
                style={{ 
                  margin: 0, 
                  fontSize: '1.15rem', 
                  fontWeight: 600, 
                  color: 'var(--text-primary)',
                  fontFamily: "var(--font-serif), Georgia, serif"
                }}
              >
                {t('chat_title', lang)}
              </h3>
              <span 
                style={{ 
                  fontSize: '0.66rem', 
                  color: 'var(--accent-emerald)', 
                  background: 'rgba(16, 185, 129, 0.12)', 
                  border: '1px solid rgba(16, 185, 129, 0.25)', 
                  borderRadius: '999px', 
                  padding: '0.15rem 0.55rem', 
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem'
                }}
              >
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                {t('chat_grounded_label', lang)}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {t('chat_subtitle', lang)}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span 
            style={{ 
              fontSize: '0.74rem', 
              color: 'var(--gold)', 
              background: 'rgba(201, 168, 106, 0.1)', 
              border: '1px solid rgba(201, 168, 106, 0.25)',
              padding: '0.25rem 0.75rem',
              borderRadius: '999px',
              fontWeight: 500,
              maxWidth: '320px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={herbChips}
          >
            {t('chat_context_prefix', lang)} {herbChips}
          </span>

          {messages.length > 0 && (
            <button
              onClick={handleClear}
              style={{
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                fontSize: '0.76rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                transition: 'all 0.2s'
              }}
              title="Reset conversation"
            >
              <RotateCcw size={12} />
              <span>{t('chat_clear', lang)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div 
        ref={messagesContainerRef}
        style={{
          padding: '1.75rem',
          minHeight: '260px',
          maxHeight: '480px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          background: 'var(--bg-card)'
        }}
      >
        {/* Welcome State when no messages */}
        {messages.length === 0 && (
          <div 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              textAlign: 'center', 
              padding: '1.5rem 1rem', 
              maxWidth: '680px', 
              margin: '0 auto' 
            }}
          >
            <div 
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(186, 141, 50, 0.25) 0%, var(--bg-card) 100%)',
                border: '1px solid var(--border-gold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold)',
                marginBottom: '1rem',
                boxShadow: '0 0 16px -2px rgba(186, 141, 50, 0.25)'
              }}
            >
              <Sparkles size={22} />
            </div>

            <h4 
              style={{ 
                margin: '0 0 0.4rem 0', 
                fontSize: '1.2rem', 
                color: 'var(--text-primary)',
                fontFamily: "var(--font-serif), Georgia, serif",
                fontWeight: 500
              }}
            >
              {t('chat_welcome_title', lang)}
            </h4>
            <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {t('chat_welcome_sub', lang)} <strong>"{verdict.query}"</strong>. Select a suggested topic below or type your inquiry.
            </p>

            {/* Quick Starter Suggestion Chips */}
            <div 
              style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '0.6rem', 
                justifyContent: 'center' 
              }}
            >
              {starters.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => send(s)}
                  disabled={loading}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-gold)',
                    color: 'var(--gold)',
                    padding: '0.5rem 0.9rem',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(201, 168, 106, 0.18)';
                    e.currentTarget.style.borderColor = 'rgba(201, 168, 106, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--bg-elevated)';
                    e.currentTarget.style.borderColor = 'var(--border-gold)';
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Rendered Messages */}
        {messages.map((m) => (
          <div 
            key={m.id}
            style={{
              display: 'flex',
              gap: '0.85rem',
              alignItems: 'flex-start',
              flexDirection: m.role === 'user' ? 'row-reverse' : 'row'
            }}
          >
            {/* Avatar */}
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: m.role === 'user' 
                  ? 'linear-gradient(135deg, rgba(201, 168, 106, 0.3) 0%, rgba(201, 168, 106, 0.1) 100%)' 
                  : 'linear-gradient(135deg, rgba(45, 122, 91, 0.2) 0%, rgba(45, 122, 91, 0.05) 100%)',
                border: m.role === 'user' ? '1px solid rgba(201, 168, 106, 0.4)' : '1px solid rgba(45, 122, 91, 0.3)',
                color: m.role === 'user' ? 'var(--accent-gold)' : 'var(--accent-emerald)'
              }}
            >
              {m.role === 'user' ? <User size={15} /> : <Bot size={15} />}
            </div>

            {/* Bubble */}
            <div 
              style={{
                maxWidth: '82%',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.4rem',
                alignItems: m.role === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <div 
                style={{
                  padding: '0.9rem 1.25rem',
                  borderRadius: m.role === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                  fontSize: '0.92rem',
                  lineHeight: 1.65,
                  whiteSpace: 'pre-wrap',
                  background: m.role === 'user' 
                    ? 'rgba(201, 168, 106, 0.15)' 
                    : 'var(--bg-elevated)',
                  border: m.role === 'user' 
                    ? '1px solid rgba(201, 168, 106, 0.35)' 
                    : '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  boxShadow: 'var(--shadow-elevation)'
                }}
              >
                {m.text}

                {/* Citations list */}
                {m.citations && m.citations.length > 0 && (
                  <div 
                    style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: '0.4rem', 
                      marginTop: '0.85rem',
                      paddingTop: '0.65rem',
                      borderTop: '1px solid var(--border-color)'
                    }}
                  >
                    <span style={{ fontSize: '0.72rem', color: 'var(--gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BookOpen size={12} /> {t('chat_citations_label', lang)}
                    </span>
                    {m.citations.map((cite, cIdx) => (
                      <span 
                        key={cIdx}
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                          color: 'var(--accent-emerald)',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          borderRadius: '6px',
                          padding: '0.15rem 0.5rem',
                          fontWeight: 600
                        }}
                      >
                        [{cite}]
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Message metadata & actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)', padding: '0 0.25rem' }}>
                <span>{m.timestamp}</span>
                {m.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(m.id, m.text)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: copiedId === m.id ? '#10b981' : 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: 0
                    }}
                    title="Copy answer"
                  >
                    {copiedId === m.id ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedId === m.id ? t('chat_copied', lang) : t('chat_copy', lang)}</span>
                  </button>
                )}
              </div>

              {/* Assistant Follow-up Suggestions Chips */}
              {m.suggestions && m.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.35rem' }}>
                  {m.suggestions.map((sug, sIdx) => (
                    <button
                      key={sIdx}
                      onClick={() => send(sug)}
                      disabled={loading}
                      style={{
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '999px',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = 'var(--gold)';
                        e.currentTarget.style.borderColor = 'rgba(201, 168, 106, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'var(--text-secondary)';
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                      }}
                    >
                      <span>{sug}</span>
                      <ArrowRight size={11} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading / Typing State */}
        {loading && (
          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
            <div 
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)'
              }}
            >
              <Bot size={15} />
            </div>
            <div 
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '4px 16px 16px 16px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--gold)',
                fontSize: '0.84rem'
              }}
            >
              <span className="cursor-blink" style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)' }} />
              <span>{t('chat_loading', lang)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Composer Input Area */}
      <div 
        style={{
          padding: '1.25rem 1.75rem',
          borderTop: '1px solid var(--border-color)',
          background: 'var(--bg-elevated)'
        }}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-gold)',
            borderRadius: '999px',
            padding: '0.45rem 0.5rem 0.45rem 1.4rem',
            boxShadow: 'var(--shadow-elevation)',
            transition: 'border-color 0.2s'
          }}
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat_placeholder', lang)}
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '0.92rem',
              padding: '0.35rem 0'
            }}
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className={input.trim() && !loading ? "btn-gold" : ""}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: 'none',
              cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              background: input.trim() && !loading ? undefined : 'var(--bg-elevated)',
              color: input.trim() && !loading ? 'var(--bg-primary)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transition: 'all 0.2s'
            }}
            title="Send follow-up"
          >
            <Send size={15} />
          </button>
        </form>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.65rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span>{t('chat_footer_hint', lang)}</span>
          <span>{t('dpdp_tag', lang)}</span>
        </div>
      </div>
    </div>
  );
}
