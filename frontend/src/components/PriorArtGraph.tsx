'use client';

import React, { useEffect, useState } from 'react';
import { BotanicalEntity, LegalReasoningStep, SupportedLanguage } from '@/types/domain';
import { 
  Search, Sprout, BookOpen, AlertOctagon, 
  Sparkles, Layers
} from 'lucide-react';

interface PriorArtGraphProps {
  query: string;
  resolvedBotanicals?: BotanicalEntity[];
  reasoningSteps?: LegalReasoningStep[];
  precedentCase?: string | null;
  isPatentable?: boolean;
  language?: SupportedLanguage;
}

export default function PriorArtGraph({ 
  query, 
  resolvedBotanicals = [], 
  reasoningSteps = [], 
  precedentCase = null,
  isPatentable = false,
  language = 'EN'
}: PriorArtGraphProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string>('statute');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div style={{ height: '240px', width: '100%', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--accent-gold)', fontSize: '0.85rem' }}>Loading Flowchart Pipeline...</div>
      </div>
    );
  }

  // Botanical display text
  const primaryBotanical = resolvedBotanicals[0];
  const botanicalName = resolvedBotanicals.length > 0
    ? resolvedBotanicals.map(b => b.sanskrit_name).join(' + ')
    : (language === 'HI' ? 'हरिद्रा (हल्दी)' : language === 'MR' ? 'हळद' : 'Haridra (Curcuma longa)');

  const botanicalLatin = resolvedBotanicals.length > 0
    ? resolvedBotanicals.map(b => b.botanical_binomial).join(', ')
    : 'Curcuma longa L.';

  const afiRef = primaryBotanical?.afi_reference || 'Ayurvedic Formulary of India (AFI, Part I)';
  
  // Primary statutory bar
  const primaryBar = reasoningSteps.find(s => s.severity === 'BARRED') || reasoningSteps[0];
  const statutoryLabel = primaryBar ? (primaryBar.citation?.citation_code || primaryBar.title) : 'Patents Act 1970, s.3(p)';

  // Outcome label
  const outcomeLabel = isPatentable 
    ? (language === 'HI' ? 'प्रक्रिया पेटेंट योग्य' : language === 'MR' ? 'प्रक्रिया पेटंट पात्र' : 'Process Patent Viable')
    : (language === 'HI' ? 'प्रक्रिया मार्ग अनुशंसित' : language === 'MR' ? 'प्रक्रिया मार्ग शिफारस' : 'Process Route Only (Sec 2(1)(j))');

  const nodes = [
    {
      id: 'input',
      step: 1,
      icon: <Search size={18} style={{ color: '#60a5fa' }} />,
      badgeColor: 'rgba(59, 130, 246, 0.15)',
      borderColor: '#3b82f6',
      title: language === 'HI' ? 'दावा प्रविष्टि' : language === 'MR' ? 'दावा नोंद' : '1. Claim Input',
      sub: query ? `"${query.slice(0, 36)}..."` : 'Natural Language Claim',
      meta: language === 'HI' ? 'मानकीकृत दावा' : 'Normalized Claim',
      status: 'NEUTRAL',
    },
    {
      id: 'botanical',
      step: 2,
      icon: <Sprout size={18} style={{ color: '#34d399' }} />,
      badgeColor: 'rgba(16, 185, 129, 0.15)',
      borderColor: '#10b981',
      title: language === 'HI' ? 'वानस्पतिक वर्ग' : language === 'MR' ? 'वानस्पतिक वर्ग' : '2. Botanical Taxa',
      sub: botanicalName,
      meta: botanicalLatin,
      status: 'IDENTIFIED',
    },
    {
      id: 'priorArt',
      step: 3,
      icon: <BookOpen size={18} style={{ color: '#fbbf24' }} />,
      badgeColor: 'rgba(245, 158, 11, 0.15)',
      borderColor: '#f59e0b',
      title: language === 'HI' ? 'टीकेडीएल पूर्व-कला' : language === 'MR' ? 'टीकेडीएल पूर्व-कला' : '3. TKDL Prior Art',
      sub: 'AFI & Classical Texts',
      meta: 'Anticipated in Samhitas',
      status: 'MATCHED',
    },
    {
      id: 'statute',
      step: 4,
      icon: <AlertOctagon size={18} style={{ color: '#f87171' }} />,
      badgeColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: '#ef4444',
      title: language === 'HI' ? 'वैधानिक बाधा' : language === 'MR' ? 'वैधानिक बंदी' : '4. Statutory Bar',
      sub: statutoryLabel.slice(0, 28),
      meta: precedentCase ? 'Biopiracy Precedent' : 'Product Claim Barred',
      status: 'BARRED',
    },
    {
      id: 'outcome',
      step: 5,
      icon: <Sparkles size={18} style={{ color: '#c084fc' }} />,
      badgeColor: 'rgba(192, 132, 252, 0.15)',
      borderColor: '#a855f7',
      title: language === 'HI' ? 'सुरक्षा रणनीति' : language === 'MR' ? 'संरक्षण रणनीती' : '5. IP Strategy',
      sub: outcomeLabel,
      meta: 'Novel Extraction Route',
      status: 'STRATEGY',
    },
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '16px',
      border: '1px solid var(--border-color)',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-glass)'
    }}>
      {/* Header with Title & Stats */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: '1rem',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '1.25rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: 'var(--accent-gold)',
            boxShadow: '0 0 10px var(--accent-gold)'
          }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            {language === 'HI' ? 'वैधानिक विश्लेषण प्रवाह आरेख' : 'Statutory Analysis Flowchart'}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            | {language === 'HI' ? 'दावे से संरक्षण रणनीति तक की यात्रा' : 'Journey from Natural Claim to IP Protection Strategy'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem' }}>
          <span style={{
            background: 'rgba(45, 122, 91, 0.12)',
            color: 'var(--accent-emerald)',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            border: '1px solid rgba(45, 122, 91, 0.3)'
          }}>
            {resolvedBotanicals.length} {language === 'HI' ? 'वनस्पति पहचानी गई' : 'Botanical Resolved'}
          </span>
          <span style={{
            background: 'rgba(184, 58, 48, 0.12)',
            color: 'var(--accent-crimson)',
            padding: '0.2rem 0.6rem',
            borderRadius: '999px',
            border: '1px solid rgba(184, 58, 48, 0.3)'
          }}>
            {reasoningSteps.length || 3} {language === 'HI' ? 'वैधानिक बिंदु' : 'Statutory Knots'}
          </span>
        </div>
      </div>

      {/* Horizontal Vector Pipeline Flow */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '0.75rem',
        overflowX: 'auto',
        paddingBottom: '0.75rem',
        marginBottom: '1rem',
        scrollbarWidth: 'thin'
      }}>
        {nodes.map((node, index) => {
          const isSelected = selectedNode === node.id;
          return (
            <React.Fragment key={node.id}>
              {/* Stage Card */}
              <div
                onClick={() => setSelectedNode(node.id)}
                style={{
                  flex: '1 0 170px',
                  minWidth: '165px',
                  maxWidth: '220px',
                  background: isSelected ? 'var(--bg-elevated)' : 'var(--bg-card)',
                  border: `1.5px solid ${isSelected ? node.borderColor : 'var(--border-color)'}`,
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  boxShadow: isSelected ? `0 0 14px ${node.borderColor}30` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative'
                }}
              >
                {/* Step badge & icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: node.badgeColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {node.icon}
                  </div>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: isSelected ? node.borderColor : 'var(--text-secondary)',
                    letterSpacing: '0.05em'
                  }}>
                    STEP {node.step}
                  </span>
                </div>

                {/* Node Title & Subtitle */}
                <div>
                  <div style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.25rem',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {node.title}
                  </div>
                  <div style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.3,
                    marginBottom: '0.5rem',
                    minHeight: '2.4em'
                  }}>
                    {node.sub}
                  </div>
                </div>

                {/* Footer Tag */}
                <div style={{
                  paddingTop: '0.5rem',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '0.7rem',
                  color: isSelected ? node.borderColor : 'var(--accent-gold)',
                  fontStyle: 'italic',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {node.meta}
                </div>
              </div>

              {/* Connecting Vector Arrow (except for last node) */}
              {index < nodes.length - 1 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: 'var(--text-secondary)',
                  opacity: 0.6
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Interactive Stage Deep-Dive Inspector */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginTop: '0.5rem',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: 'rgba(186, 141, 50, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'var(--accent-gold)'
        }}>
          <Layers size={20} />
        </div>

        <div style={{ flex: 1 }}>
          {selectedNode === 'input' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '0.35rem' }}>
                {language === 'HI' ? 'चरण 1: दावा प्रविष्टि और भाषाई विश्लेषण' : 'Stage 1: Vernacular Claim Normalization'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {language === 'HI' 
                  ? 'अन्वेषक के कच्चे दावे का विश्लेषण किया जाता है। स्थानीय नामों (जैसे हल्दी, हरिद्रा, मरिच) को IAST डायक्रिटिक स्ट्रिपर और शब्दावली सामान्यीकरण द्वारा मानकीकृत किया जाता है।'
                  : 'The natural language patent claim was ingested and stripped of vernacular spelling ambiguities. Sanskrit, Hindi, and colloquial herbal names were converted into standardized canonical descriptors for ontological matching.'}
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-blue)', fontFamily: 'monospace' }}>
                Processed Query: "{query || 'Ayurvedic patent inquiry'}"
              </div>
            </div>
          )}

          {selectedNode === 'botanical' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.35rem' }}>
                {language === 'HI' ? 'चरण 2: वानस्पतिक वर्गीकरण और ऑन्टोलॉजी मिलान' : 'Stage 2: Taxonomic Resolution & Pharmacopoeial Mapping'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {language === 'HI'
                  ? `दावे में उल्लिखित जड़ी-बूटी को लैटिन द्विपद (${botanicalLatin}) और आयुर्वेदिक फार्माकोपिया ऑफ़ इंडिया (API) के आधिकारिक मोनोग्राफ से मैप किया गया है।`
                  : `Resolved the active herb to official botanical taxonomy (${botanicalLatin}, Family: Zingiberaceae). Mapped active botanical parts (Rhizome) to Ayurvedic Pharmacopoeia of India (API) standards.`}
              </p>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
                <span style={{ color: 'var(--accent-gold)' }}>Sanskrit: <strong>{botanicalName}</strong></span>
                <span style={{ color: 'var(--accent-emerald)' }}>Binomial: <em>{botanicalLatin}</em></span>
                <span style={{ color: 'var(--accent-blue)' }}>Part: Rhizome</span>
              </div>
            </div>
          )}

          {selectedNode === 'priorArt' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
                {language === 'HI' ? 'चरण 3: टीकेडीएल और शास्त्रीय पूर्व-कला खोज' : 'Stage 3: TKDL & Classical Formulary Cross-Reference'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {language === 'HI'
                  ? `पारंपरिक ज्ञान डिजिटल लाइब्रेरी (TKDL) और शास्त्रीय संहिताओं (चरक, सुश्रुत, अष्टांग हृदय) में खोज की गई। घाव भरने और सूजन के लिए इसका उपयोग सदियों से प्रलेखित पाया गया।`
                  : `Automated scan against 5,000+ classical formulations across Charaka Samhita, Sushruta Samhita, and Ayurvedic Formulary of India (AFI Part 1). The medicinal usage for wound healing is firmly established in public-domain prior art.`}
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                Citation: <strong>{afiRef}</strong> · Public Domain Status: <em>Pre-dated prior art verified</em>
              </div>
            </div>
          )}

          {selectedNode === 'statute' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-crimson)', marginBottom: '0.35rem' }}>
                {language === 'HI' ? 'चरण 4: वैधानिक बाधा और ऐतिहासिक मिसाल' : 'Stage 4: Indian Patents Act 1970 Statutory Filtering'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {language === 'HI'
                  ? `भारतीय पेटेंट अधिनियम 1970 की धारा 3(p) के तहत पारंपरिक ज्ञान को उत्पाद पेटेंट नहीं दिया जा सकता। धारा 3(e) मिश्रण पर रोक लगाती है, और जैव विविधता अधिनियम 2002 की धारा 6 के तहत एनबीए की मंजूरी आवश्यक है।`
                  : `The Indian Patent Office (IPO) automatically rejects product claims on traditional botanicals under Section 3(p) (Traditional Knowledge bar) and Section 3(e) (mere admixture without proven synergy). Supported by the landmark 1997 revocation of US Patent 5,401,504.`}
              </p>
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--accent-crimson)' }}>Statute: <strong>Section 3(p) + 3(e)</strong></span>
                <span style={{ color: 'var(--accent-amber)' }}>Precedent: <strong>US Patent 5,401,504 (Revoked)</strong></span>
                <span style={{ color: 'var(--accent-blue)' }}>Compliance: <strong>NBA Form III Required</strong></span>
              </div>
            </div>
          )}

          {selectedNode === 'outcome' && (
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '0.35rem' }}>
                {language === 'HI' ? 'चरण 5: अनुशंसित आईपी संरक्षण रणनीति' : 'Stage 5: Actionable IP Strategy & Overcome Pathway'}
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {language === 'HI'
                  ? `उत्पाद दावे को त्यागें और धारा 2(1)(j) के तहत नवीन निष्कर्षण प्रक्रिया (जैसे ग्रीन सुपरक्रिटिकल CO2 निष्कर्षण) का पेटेंट प्राप्त करें, या सिद्ध सिनर्जिस्टिक प्रभाव प्रस्तुत करें।`
                  : `Pivot your filing from a prohibited composition claim into a patentable Process Innovation under Section 2(1)(j) (e.g. green supercritical CO2 extraction achieving >95% bioactive yield), or file for a Geographical Indication (GI).`}
              </p>
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--accent-gold)' }}>
                Recommended Route: <strong>Process Patent (Form 1 & Form 2)</strong> · Protection Term: 20 Years
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{
        marginTop: '0.75rem',
        fontSize: '0.72rem',
        color: 'var(--text-secondary)',
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem'
      }}>
        <span>💡</span>
        <span>
          {language === 'HI' 
            ? 'प्रत्येक चरण का विवरण और वैधानिक नियम देखने के लिए ऊपर दिए गए किसी भी कार्ड पर क्लिक करें।' 
            : 'Click on any stage card above (1 to 5) to inspect its technical and legal derivation.'}
        </span>
      </div>
    </div>
  );
}
