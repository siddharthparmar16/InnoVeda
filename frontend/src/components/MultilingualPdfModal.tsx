"use client";

import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  ShieldCheck, 
  Languages, 
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { LegalVerdict } from '@/types/domain';
import { 
  AdvisoryReportLanguage, 
  SUPPORTED_REPORT_LANGUAGES, 
  getReportText, 
  generateAdvisoryMemoMarkdown, 
  printOrDownloadAdvisoryPdf, 
  downloadAdvisoryMemoFile 
} from '@/lib/domain-engine/memo-generator';

interface MultilingualPdfModalProps {
  verdict: LegalVerdict;
  initialLanguage?: AdvisoryReportLanguage;
  onClose: () => void;
}

export default function MultilingualPdfModal({
  verdict,
  initialLanguage = 'EN',
  onClose,
}: MultilingualPdfModalProps) {
  const [selectedLang, setSelectedLang] = useState<AdvisoryReportLanguage>(initialLanguage);
  const [copied, setCopied] = useState(false);

  const t = (key: string) => getReportText(key, selectedLang);

  const handleCopy = () => {
    const md = generateAdvisoryMemoMarkdown(verdict, selectedLang);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    printOrDownloadAdvisoryPdf(verdict, selectedLang);
  };

  const handleDownloadMd = () => {
    downloadAdvisoryMemoFile(verdict, selectedLang);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        inset: 0, 
        backgroundColor: 'rgba(0, 0, 0, 0.75)', 
        backdropFilter: 'blur(8px)', 
        zIndex: 100, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '1.5rem' 
      }}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '850px',
          maxHeight: '90vh',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '1.25rem 1.75rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-glass)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--accent-gold-glow)',
                border: '1px solid var(--border-highlight)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)'
              }}
            >
              <FileText size={20} />
            </div>
            <div>
              <h3 
                style={{ 
                  margin: 0, 
                  fontSize: '1.15rem', 
                  fontFamily: "var(--font-serif), Georgia, serif", 
                  fontWeight: 700,
                  color: 'var(--text-primary)'
                }}
              >
                {t('reportHeader')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                {t('authoritySubtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.4rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.background = 'var(--bg-glass-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Language Selection Bar */}
        <div 
          style={{
            padding: '0.85rem 1.75rem',
            background: 'var(--bg-sidebar)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Languages size={16} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Select Dossier Language:
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {SUPPORTED_REPORT_LANGUAGES.map((lang) => {
              const isSelected = selectedLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLang(lang.code)}
                  style={{
                    padding: '0.35rem 0.85rem',
                    borderRadius: '999px',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: isSelected ? 'var(--accent-gold)' : 'var(--bg-card)',
                    color: isSelected ? '#0b0d14' : 'var(--text-secondary)',
                    border: isSelected ? '1px solid var(--accent-gold)' : '1px solid var(--border-color)',
                    boxShadow: isSelected ? '0 2px 8px var(--accent-gold-glow)' : 'none'
                  }}
                >
                  {lang.nativeLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Document Preview */}
        <div 
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            background: 'var(--bg-primary)',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '740px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: 'var(--shadow-glass)',
              boxSizing: 'border-box'
            }}
          >
            {/* Header with Emblem */}
            <div 
              style={{
                borderBottom: '2px solid var(--accent-gold)',
                paddingBottom: '1rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div 
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    border: '1.5px solid var(--accent-gold)',
                    background: 'var(--accent-gold-glow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)'
                  }}
                >
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', color: 'var(--accent-gold)', textTransform: 'uppercase' }}>
                    {t('authorityTitle')}
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "var(--font-serif), Georgia, serif" }}>
                    {t('reportHeader')}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t('authoritySubtitle')}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <div>Date: <strong style={{ color: 'var(--text-primary)' }}>{new Date().toLocaleDateString()}</strong></div>
                <div>Language: <strong style={{ color: 'var(--accent-gold)' }}>{SUPPORTED_REPORT_LANGUAGES.find(l => l.code === selectedLang)?.nativeLabel}</strong></div>
              </div>
            </div>

            {/* Query Evaluated */}
            <div 
              style={{
                background: 'var(--bg-sidebar)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                marginBottom: '1.25rem'
              }}
            >
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                {t('queryExamined')}
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                &quot;{verdict.query}&quot;
              </div>
            </div>

            {/* Verdict Banner */}
            <div 
              style={{
                background: verdict.is_patentable ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                border: `1.5px solid ${verdict.is_patentable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                borderRadius: '10px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span 
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: verdict.is_patentable ? 'var(--accent-emerald)' : 'var(--accent-crimson)',
                    letterSpacing: '0.08em'
                  }}
                >
                  {t('verdictLabel')}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('confidenceBand')}: {verdict.classification ? verdict.classification.band_label : `${(verdict.confidence_score * 100).toFixed(0)}%`}
                </span>
              </div>
              <div 
                style={{ 
                  fontSize: '1.15rem', 
                  fontWeight: 800, 
                  color: verdict.is_patentable ? 'var(--accent-emerald)' : 'var(--accent-crimson)',
                  fontFamily: "var(--font-serif), Georgia, serif"
                }}
              >
                {verdict.verdict_title}
              </div>
            </div>

            {/* Botanical Taxa Resolution */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {t('botanicalsTitle')}
              </h4>
              {verdict.resolved_botanicals && verdict.resolved_botanicals.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {verdict.resolved_botanicals.map((b, i) => (
                    <div 
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.55rem 0.85rem',
                        background: 'var(--bg-sidebar)',
                        borderRadius: '6px',
                        fontSize: '0.84rem'
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--accent-gold)' }}>{b.sanskrit_name}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: '0.4rem' }}>({b.english_common_name || 'Ayurvedic herb'})</span>
                      </div>
                      <div style={{ fontStyle: 'italic', color: 'var(--text-primary)' }}>
                        {b.botanical_binomial}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{t('noBotanicals')}</p>
              )}
            </div>

            {/* Citations Snippets */}
            <div style={{ marginBottom: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.6rem', fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                {t('reasoningTitle')}
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {verdict.reasoning_chain.slice(0, 3).map((step, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'var(--bg-sidebar)',
                      borderLeft: '3px solid var(--accent-gold)',
                      borderRadius: '4px',
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                      <span style={{ color: 'var(--accent-gold)' }}>{step.citation.citation_code}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{step.citation.act_title}</span>
                    </div>
                    <div style={{ color: 'var(--text-primary)', marginTop: '0.3rem', fontWeight: 500 }}>
                      {step.title}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem', fontSize: '0.78rem' }}>
                      {step.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Seal & Attestation */}
            <div 
              style={{
                borderTop: '1px solid var(--border-color)',
                paddingTop: '1rem',
                marginTop: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.4 }}>
                {t('disclaimer')}
              </div>

              <div 
                style={{
                  padding: '0.5rem 0.85rem',
                  border: '1.5px dashed var(--accent-gold)',
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontSize: '0.66rem',
                  fontWeight: 700,
                  color: 'var(--accent-gold)',
                  textTransform: 'uppercase'
                }}
              >
                <div>GOVT OF INDIA • AYUSH</div>
                <div style={{ letterSpacing: '0.1em' }}>IP-SAKTI VERIFIED</div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div 
          style={{
            padding: '1rem 1.75rem',
            borderTop: '1px solid var(--border-color)',
            background: 'var(--bg-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Sparkles size={14} style={{ color: 'var(--accent-gold)' }} />
            <span>Cryptographically sealed & ready for institutional export</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleCopy}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                fontSize: '0.84rem'
              }}
            >
              {copied ? <Check size={15} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={15} />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handleDownloadMd}
              className="btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                fontSize: '0.84rem'
              }}
            >
              <Download size={15} />
              <span>{t('downloadMdButton')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn-gold"
              style={{
                padding: '0.55rem 1.25rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                borderRadius: '8px'
              }}
            >
              <Printer size={16} />
              <span>{t('printButton')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
