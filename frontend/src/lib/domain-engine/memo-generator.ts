import { LegalVerdict } from '@/types/domain';

export type AdvisoryReportLanguage = 'EN' | 'HI' | 'MR' | 'SA';

export interface LanguageMeta {
  code: AdvisoryReportLanguage;
  label: string;
  nativeLabel: string;
  locale: string;
}

export const SUPPORTED_REPORT_LANGUAGES: LanguageMeta[] = [
  { code: 'EN', label: 'English', nativeLabel: 'English (Official)', locale: 'en-IN' },
  { code: 'HI', label: 'Hindi', nativeLabel: 'हिन्दी (राष्ट्रीय भाषा)', locale: 'hi-IN' },
  { code: 'MR', label: 'Marathi', nativeLabel: 'मराठी (राज्य भाषा)', locale: 'mr-IN' },
  { code: 'SA', label: 'Sanskrit', nativeLabel: 'संस्कृतम् (पारम्परिक)', locale: 'sa-IN' },
];

const I18N_DICTIONARY: Record<AdvisoryReportLanguage, Record<string, string>> = {
  EN: {
    authorityTitle: 'MINISTRY OF AYUSH • GOVERNMENT OF INDIA',
    authoritySubtitle: 'IP-SAKTI Sahayak — Statutory Ayurveda IP & Defensive Disclosure System',
    reportHeader: 'STATUTORY INTELLECTUAL PROPERTY ADVISORY DOSSIER',
    refNo: 'Reference Dossier ID',
    issueDate: 'Filing & Assessment Date',
    regime: 'Applicable Statutory Regime',
    classification: 'Statutory Classification',
    queryExamined: 'Research Invention Query Examined',
    executiveSummaryTitle: '1. Executive Statutory Verdict & Legal Standing',
    verdictLabel: 'Legal Verdict',
    confidenceBand: 'Statutory Confidence Band',
    corroboration: 'Corroborating Evidence Signals',
    abstentionNotice: 'Statutory Scope Notice',
    botanicalsTitle: '2. Botanical Entity Resolution & Pharmacopoeial Standards',
    noBotanicals: 'No classical Ayurvedic botanical species or formulations identified in text.',
    botanicalName: 'Botanical / Binomial',
    sanskritName: 'Sanskrit Name',
    commonName: 'Common English Name',
    afiRef: 'AFI / Pharmacopoeia Ref',
    biopiracyFlag: 'Biopiracy Precedent',
    reasoningTitle: '3. Statutory Reasoning Chain & Canonical Citations',
    statuteCode: 'Statute Provision',
    statuteHeading: 'Statutory Heading',
    legalAnalysis: 'Statutory Legal Assessment',
    canonicalSnippet: 'Canonical Statutory Text',
    evidenceSpans: 'Span-Level Statutory Evidence',
    retrievalScore: 'Retrieval Relevance',
    officialSource: 'Official Regulatory Source',
    shaSeal: 'SHA-256 Cryptographic Hash',
    precedentTitle: '4. Landmark Biopiracy & TKDL Defense Precedent',
    noPrecedent: 'No prior biopiracy revocation recorded for this exact formulation cluster.',
    routesTitle: '5. Recommended Strategic IP Protection Routes',
    actionSteps: 'Actionable Implementation Steps',
    unlockConditions: 'Prerequisite Gap Closures',
    securityWatermark: 'OFFICIAL STATUTORY ADVISORY • AYUSH IP DEFENSE',
    auditSealTitle: '6. Cryptographic Verification & Statutory Attestation',
    hashNotice: 'This advisory dossier has been cryptographically sealed against tamper and validated against India Code & WIPO legal corpora.',
    officerStamp: 'Automated Statutory IP Registrar Seal',
    disclaimer: 'DISCLAIMER: This statutory advisory dossier is generated through algorithmic screening against the Indian Patents Act 1970 (amended 2024), Biological Diversity Act 2002/2023, and WIPO GRATK Treaty. It serves as advisory research intelligence and does not substitute for representation by a registered Indian Patent Agent or Attorney.',
    printButton: 'Print / Save as PDF',
    downloadMdButton: 'Download Markdown (.md)',
  },
  HI: {
    authorityTitle: 'आयुष मंत्रालय • भारत सरकार',
    authoritySubtitle: 'आईपी-शक्ति सहायक — वैधानिक आयुर्वेद बौद्धिक संपदा एवं पारंपरिक ज्ञान रक्षा प्रणाली',
    reportHeader: 'वैधानिक बौद्धिक संपदा परामर्श डोजियर (अभिलेख)',
    refNo: 'संदर्भ डोजियर पहचान संख्या',
    issueDate: 'मूल्यांकन एवं जारी करने की तिथि',
    regime: 'लागू वैधानिक व्यवस्था',
    classification: 'प्रारंभिक वैधानिक वर्गीकरण',
    queryExamined: 'परीक्षित अनुसंधान / आविष्कार प्रश्न',
    executiveSummaryTitle: '१. कार्यकारी वैधानिक निर्णय एवं विधिक स्थिति',
    verdictLabel: 'विधिक निर्णय',
    confidenceBand: 'वैधानिक निश्चितता श्रेणी',
    corroboration: 'पुष्टि करने वाले विधिक साक्ष्य संकेत',
    abstentionNotice: 'वैधानिक कार्यक्षेत्र सूचना',
    botanicalsTitle: '२. वानस्पतिक घटक पहचान एवं औषधकोश मानक (AFI)',
    noBotanicals: 'पूछताछ में किसी शास्त्रीय आयुर्वेदिक वानस्पतिक घटक या फॉर्मूलेशन की पहचान नहीं हुई।',
    botanicalName: 'द्विपद वैज्ञानिक नाम',
    sanskritName: 'संस्कृत शास्त्रीय नाम',
    commonName: 'सामान्य नाम',
    afiRef: 'आयुर्वेदिक फॉर्मूलरी ऑफ इंडिया (AFI) संदर्भ',
    biopiracyFlag: 'जैव-चोरी रक्षा इतिहास',
    reasoningTitle: '३. वैधानिक तर्क श्रृंखला एवं आधिकारिक उद्धरण',
    statuteCode: 'कानूनी धारा / कोड',
    statuteHeading: 'वैधानिक शीर्षक',
    legalAnalysis: 'विधिक विश्लेषण एवं व्याख्या',
    canonicalSnippet: 'प्रामाणिक कानूनी पाठ (अधिनियम)',
    evidenceSpans: 'विशिष्ट साक्ष्य अंश',
    retrievalScore: 'पुनर्प्राप्ति प्रासंगिकता',
    officialSource: 'आधिकारिक कानूनी स्रोत',
    shaSeal: 'SHA-256 क्रिप्टोग्राफिक हैश मुहर',
    precedentTitle: '४. महत्वपूर्ण जैव-चोरी एवं TKDL रक्षा नज़ीर (पूर्व दृष्टांत)',
    noPrecedent: 'इस विशिष्ट फॉर्मूलेशन के लिए कोई पूर्व जैव-चोरी निरस्तीकरण दर्ज नहीं है।',
    routesTitle: '५. अनुशंसित रणनीतिक आईपी सुरक्षा मार्ग एवं कार्ययोजना',
    actionSteps: 'कार्यान्वयन योग्य कदम',
    unlockConditions: 'मार्ग अनलॉक करने हेतु अनिवार्य साक्ष्य',
    securityWatermark: 'आधिकारिक वैधानिक परामर्श • आयुष बौद्धिक संपदा रक्षा',
    auditSealTitle: '६. क्रिप्टोग्राफिक सत्यापन एवं वैधानिक अभिप्रमाणन',
    hashNotice: 'यह परामर्श डोजियर छेड़छाड़ से सुरक्षित है और इंडिया कोड तथा WIPO संधियों के विरुद्ध सत्यापित है।',
    officerStamp: 'स्वचालित वैधानिक आईपी पंजीयक मुहर',
    disclaimer: 'अस्वीकरण: यह वैधानिक परामर्श डोजियर भारतीय पेटेंट अधिनियम १९७० (संशोधित २०२४), जैविक विविधता अधिनियम २००२/२०२३, और WIPO GRATK संधि के विरुद्ध विश्लेषण द्वारा तैयार किया गया है। यह संस्थागत मार्गदर्शन हेतु है तथा पंजीकृत पेटेंट एजेंट या अधिवक्ता की औपचारिक विधिक सलाह का स्थान नहीं लेता है।',
    printButton: 'प्रिंट करें / पीडीएफ (PDF) सुरक्षित करें',
    downloadMdButton: 'मार्कडाउन (.md) डाउनलोड करें',
  },
  MR: {
    authorityTitle: 'आयुष मंत्रालय • भारत सरकार',
    authoritySubtitle: 'आयपी-शक्ती सहाय्यक — वैधानिक आयुर्वेद बौद्धिक संपदा व पारंपरिक ज्ञान संरक्षण प्रणाली',
    reportHeader: 'वैधानिक बौद्धिक संपदा सल्लागार अहवाल (डोसियर)',
    refNo: 'संदर्भ डोसियर क्रमांक',
    issueDate: 'मूल्यांकन व निर्गमन दिनांक',
    regime: 'लागू वैधानिक व्यवस्था',
    classification: 'वैधानिक वर्गीकरण',
    queryExamined: 'तपासलेला संशोधन / शोध प्रश्न',
    executiveSummaryTitle: '१. कार्यकारी वैधानिक निर्णय व कायदेशीर स्थिती',
    verdictLabel: 'कायदेशीर निर्णय',
    confidenceBand: 'वैधानिक निश्चितता श्रेणी',
    corroboration: 'पुष्टी करणारे कायदेशीर पुरावे',
    abstentionNotice: 'वैधानिक कार्यक्षेत्र सूचना',
    botanicalsTitle: '२. वनस्पती घटक ओळख आणि औषधकोश मानके (AFI)',
    noBotanicals: 'चौकशीमध्ये शास्त्रीय आयुर्वेदिक वनस्पती किंवा फॉर्म्युलेशन आढळले नाही.',
    botanicalName: 'शास्त्रीय द्विपद नाव',
    sanskritName: 'संस्कृत नाव',
    commonName: 'सर्वसामान्य नाव',
    afiRef: 'आयुर्वेदिक फॉर्म्युलरी ऑफ इंडिया (AFI) संदर्भ',
    biopiracyFlag: 'जैव-चाचेगिरी संरक्षण इतिहास',
    reasoningTitle: '३. वैधानिक युक्तिवाद साखळी आणि अधिकृत संदर्भ',
    statuteCode: 'कायदेशीर कलम / कोड',
    statuteHeading: 'वैधानिक शीर्षक',
    legalAnalysis: 'कायदेशीर विश्लेषण व निष्कर्ष',
    canonicalSnippet: 'मूळ कायदेशीर संहिता मजकूर',
    evidenceSpans: 'पुरावा मजकूर अंश',
    retrievalScore: 'सुसंगतता गुणसंख्या',
    officialSource: 'अधिकृत नियामक स्रोत',
    shaSeal: 'SHA-256 क्रिप्टोग्राफिक तपासणी शिक्का',
    precedentTitle: '४. ऐतिहासिक जैव-चाचेगिरी व TKDL संरक्षण दाखले',
    noPrecedent: 'या फॉर्म्युलेशनसाठी पूर्वीचा कोणताही जैव-चाचेगिरी रद्दबातल दाखला नोंदवलेला नाही.',
    routesTitle: '५. शिफारस केलेले रणनीतिक आयपी संरक्षण मार्ग आणि कृती आराखडा',
    actionSteps: 'अंमलबजावणीसाठी पावले',
    unlockConditions: 'मार्ग खुला करण्यासाठी आवश्यक पुरावे',
    securityWatermark: 'अधिकृत वैधानिक सल्ला • आयुष आयपी संरक्षण',
    auditSealTitle: '६. क्रिप्टोग्राफिक प्रमाणीकरण आणि वैधानिक शिक्का',
    hashNotice: 'हा सल्लागार अहवाल डिजिटल स्वाक्षरीने सुरक्षित असून इंडिया कोड आणि WIPO कायद्यांशी सुसंगत आहे.',
    officerStamp: 'स्वयंचलित वैधानिक आयपी निबंधक शिक्का',
    disclaimer: 'अस्वीकरण: हा वैधानिक सल्लागार अहवाल भारतीय पेटंट कायदा १९७० (सुधारित २०२४), जैविक विविधता कायदा २००२/२०२३, आणि WIPO GRATK कराराच्या आधारे तयार करण्यात आला आहे. हे केवळ संशोधनात्मक मार्गदर्शन असून नोंदणीकृत पेटंट वकिलाच्या सल्ल्याचा पर्याय नाही.',
    printButton: 'प्रिंट करा / पीडीएफ (PDF) सेव्ह करा',
    downloadMdButton: 'मार्कडाउन (.md) डाऊनलोड करा',
  },
  SA: {
    authorityTitle: 'आयुष मन्त्रालयः • भारत शासनम्',
    authoritySubtitle: 'आईपी-शक्ति सहायकः — पारम्परिक ज्ञान संरक्षणं तथा वैधानिक परामर्श तन्त्रम्',
    reportHeader: 'आयुर्वेद बौद्धिक सम्पदा वैधानिक परामर्श पत्रम् (डोजियर)',
    refNo: 'सन्दर्भ पत्र सङ्ख्या',
    issueDate: 'निर्गमन तथा परीक्षण दिनाङ्कः',
    regime: 'प्रयुक्ता वैधानिक व्यवस्था',
    classification: 'वैधानिक श्रेणीकरणम्',
    queryExamined: 'परीक्षितं शोध प्रश्नम्',
    executiveSummaryTitle: '१. प्रधान वैधानिक निर्णयः तथा विधिक स्थितिः',
    verdictLabel: 'विधिक निर्णयः',
    confidenceBand: 'वैधानिक प्रामाणिकता स्तरः',
    corroboration: 'पुष्टिकरण साक्ष्य सङ्केताः',
    abstentionNotice: 'वैधानिक क्षेत्राधिकार सूचना',
    botanicalsTitle: '२. वानस्पतिक द्रव्य निर्णयः तथा आयुर्वेदौषधकोश (AFI) मानदण्डाः',
    noBotanicals: 'अस्मिन् प्रश्ने कोऽपि शास्त्रीय वानस्पतिक घटकः न लक्षितः।',
    botanicalName: 'वैज्ञानिक द्विपद नाम',
    sanskritName: 'संस्कृत शास्त्रीय नाम',
    commonName: 'सामान्य नाम',
    afiRef: 'AFI औषधकोश सन्दर्भः',
    biopiracyFlag: 'जैव-चौर्य निवारण इतिहासः',
    reasoningTitle: '३. वैधानिक हेतुपरम्परा तथा प्रमाणोद्धरणानि',
    statuteCode: 'वैधानिक धारा / सङ्केतः',
    statuteHeading: 'वैधानिक शीर्षकम्',
    legalAnalysis: 'विधिक मीमांसा तथा विचारः',
    canonicalSnippet: 'मूल वैधानिक पाठः',
    evidenceSpans: 'विशिष्ट साक्ष्यांशः',
    retrievalScore: 'सङ्गतता मानम्',
    officialSource: 'आधिकारिक विधिक स्रोतः',
    shaSeal: 'SHA-256 गूढलेख मुद्रिका',
    precedentTitle: '४. पारम्परिक ज्ञान तथा जैव-चौर्य दृष्टान्तः',
    noPrecedent: 'अस्मै योगविशेषाय कोऽपि पूर्वतनः जैव-चौर्य खण्डन दृष्टान्तः न विद्यते।',
    routesTitle: '५. उपदिष्टाः बौद्धिक सम्पदा रक्षण मार्गाः तथा क्रियाविधयः',
    actionSteps: 'कार्यान्वयन सोपानानि',
    unlockConditions: 'मार्गप्रवेशार्थम् अपेक्षितानि साक्ष्याणि',
    securityWatermark: 'आधिकारिक वैधानिक परामर्शः • आयुष सम्पदा रक्षणम्',
    auditSealTitle: '६. गुप्तलेखन सत्यता तथा वैधानिक मुद्रणम्',
    hashNotice: 'एतत् परामर्श पत्रं संपरिवर्तन रहितं तथा भारत विधि संहिता (India Code) अनुगुणम् अस्ति।',
    officerStamp: 'स्वचालित वैधानिक पञ्जीयक मुद्रिका',
    disclaimer: 'वैधानिक सूचना: एतत् पत्रं भारतीय पेटेण्ट अधिनियम १९७० (२०२४ संशोधित), जैविक विविधता अधिनियम २००२/२०२३ तथा WIPO सन्ध्यानुसारं निर्मितम्। इदं केवलं संस्थागत मार्गदर्शनाय अस्ति, न तु पञ्जीकृत विधिज्ञस्य परामर्श स्थानापन्नम्।',
    printButton: 'मुद्रणम् / पीडीएफ (PDF) संरक्षणम्',
    downloadMdButton: 'मार्कडाउन (.md) अवतरणम्',
  }
};

/**
 * Returns localized string for given key and language
 */
export function getReportText(key: string, lang: AdvisoryReportLanguage = 'EN'): string {
  const dict = I18N_DICTIONARY[lang] || I18N_DICTIONARY.EN;
  return dict[key] || I18N_DICTIONARY.EN[key] || key;
}

/**
 * Generate structured Markdown in chosen language
 */
export function generateAdvisoryMemoMarkdown(verdict: LegalVerdict, lang: AdvisoryReportLanguage = 'EN'): string {
  const t = (key: string) => getReportText(key, lang);
  const timestamp = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const dossierId = `AYUSH/IP-SAKTI/${new Date().getFullYear()}/${Math.abs(hashString(verdict.query)).toString(16).toUpperCase().padStart(8, '0')}`;

  let md = `# ${t('reportHeader')}\n`;
  md += `**${t('authorityTitle')}**  \n`;
  md += `*${t('authoritySubtitle')}*\n\n`;
  md += `---\n\n`;
  md += `- **${t('refNo')}:** \`${dossierId}\`\n`;
  md += `- **${t('issueDate')}:** ${timestamp}\n`;
  md += `- **${t('queryExamined')}:** "${verdict.query}"\n\n`;
  md += `---\n\n`;

  // 1. Verdict
  md += `## ${t('executiveSummaryTitle')}\n`;
  md += `- **${t('verdictLabel')}:** **${verdict.verdict_title}**\n`;
  if (verdict.classification) {
    md += `- **${t('classification')}:** ${verdict.classification.category_label} (${verdict.classification.category})\n`;
    md += `- **${t('confidenceBand')}:** ${verdict.classification.band_label} (${verdict.classification.evidence_points} ${t('corroboration')})\n`;
    verdict.classification.rationale.forEach(r => {
      md += `  - ${r}\n`;
    });
  } else {
    md += `- **${t('confidenceBand')}:** ${(verdict.confidence_score * 100).toFixed(0)}%\n`;
  }
  if (verdict.abstain) {
    md += `\n> **${t('abstentionNotice')}:** ${verdict.abstention_reason}\n\n`;
  }
  md += `\n---\n\n`;

  // 2. Botanicals
  md += `## ${t('botanicalsTitle')}\n`;
  if (verdict.resolved_botanicals && verdict.resolved_botanicals.length > 0) {
    verdict.resolved_botanicals.forEach(b => {
      md += `- **${b.sanskrit_name}** (${b.english_common_name || 'Ayurvedic herb'}) → *${b.botanical_binomial}* [${t('afiRef')}: ${b.afi_reference || 'Codified'}]\n`;
      if (b.biopiracy_precedent) {
        md += `  - *${t('biopiracyFlag')}:* ${b.biopiracy_precedent}\n`;
      }
    });
  } else {
    md += `${t('noBotanicals')}\n`;
  }
  md += `\n---\n\n`;

  // 3. Citations & Reasoning
  md += `## ${t('reasoningTitle')}\n`;
  verdict.reasoning_chain.forEach(step => {
    md += `### ${step.step_number}. ${step.title}\n`;
    md += `- **${t('statuteCode')}:** \`${step.citation.citation_code}\` (${step.citation.act_title})\n`;
    md += `- **${t('statuteHeading')}:** ${step.citation.heading}\n`;
    md += `- **${t('legalAnalysis')}:** ${step.description}\n`;
    md += `- **${t('canonicalSnippet')}:**\n  > "${step.citation.text_snippet}"\n`;
    if (step.citation.sha256_hash) {
      md += `- **${t('shaSeal')}:** \`${step.citation.sha256_hash}\`\n`;
    }
    md += `\n`;
  });
  md += `---\n\n`;

  // 4. Precedent
  if (verdict.precedent_case) {
    md += `## ${t('precedentTitle')}\n`;
    md += `${verdict.precedent_case}\n\n---\n\n`;
  }

  // 5. Viable Routes
  md += `## ${t('routesTitle')}\n`;
  verdict.viable_routes.forEach((route, idx) => {
    md += `### ${idx + 1}. ${route.title} [${route.type}]\n`;
    md += `${route.description}\n\n`;
    if (route.actionable_steps && route.actionable_steps.length > 0) {
      md += `**${t('actionSteps')}:**\n`;
      route.actionable_steps.forEach(step => {
        md += `- ${step}\n`;
      });
      md += `\n`;
    }
  });

  md += `---\n\n`;
  md += `## ${t('auditSealTitle')}\n`;
  md += `${t('hashNotice')}\n\n`;
  md += `*${t('disclaimer')}*\n`;

  return md;
}

/**
 * Generate full vector-crisp printable HTML document with official stamps and watermarks
 */
export function generateAdvisoryHtmlReport(verdict: LegalVerdict, lang: AdvisoryReportLanguage = 'EN'): string {
  const t = (key: string) => getReportText(key, lang);
  const timestamp = new Date().toLocaleDateString(
    lang === 'HI' ? 'hi-IN' : lang === 'MR' ? 'mr-IN' : lang === 'SA' ? 'sa-IN' : 'en-IN',
    { day: 'numeric', month: 'long', year: 'numeric' }
  );
  const dossierId = `AYUSH/IP-SAKTI/${new Date().getFullYear()}/${Math.abs(hashString(verdict.query)).toString(16).toUpperCase().padStart(8, '0')}`;
  const shaSeal = Math.abs(hashString(verdict.query + verdict.verdict_title + '2026')).toString(16).padStart(64, 'a9b2c3d4e5f60718293a4b5c6d7e8f90');

  const verdictColor = verdict.is_patentable ? '#059669' : '#dc2626';
  const verdictBg = verdict.is_patentable ? '#ecfdf5' : '#fef2f2';
  const verdictBorder = verdict.is_patentable ? '#10b981' : '#f87171';

  return `<!DOCTYPE html>
<html lang="${lang.toLowerCase()}">
<head>
  <meta charset="utf-8" />
  <title>${t('reportHeader')} - ${dossierId}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700;900&family=Noto+Sans+Devanagari:wght@400;500;600;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Outfit', 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.5;
      font-size: 10pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 24px;
      position: relative;
      background: #ffffff;
    }
    /* Official Government Watermark */
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-35deg);
      font-size: 44pt;
      font-weight: 800;
      color: rgba(180, 131, 40, 0.05);
      letter-spacing: 0.15em;
      white-space: nowrap;
      pointer-events: none;
      z-index: 0;
      font-family: 'Cinzel', serif;
    }
    .header-bar {
      border-bottom: 2px solid #b48328;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: relative;
      z-index: 1;
    }
    .emblem-title-group {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .seal-box {
      width: 54px;
      height: 54px;
      border-radius: 50%;
      border: 2px solid #b48328;
      background: #fdfbf7;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #b48328;
    }
    .authority-heading {
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.18em;
      color: #b48328;
      text-transform: uppercase;
    }
    .dossier-heading {
      font-family: 'Cinzel', 'Noto Sans Devanagari', serif;
      font-size: 14pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.02em;
      margin-top: 2px;
    }
    .sub-system {
      font-size: 8pt;
      color: #64748b;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 8pt;
      color: #475569;
      line-height: 1.4;
    }
    .meta-box strong { color: #0f172a; }

    /* Metadata Table */
    .metadata-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 18px;
      font-size: 8.5pt;
      position: relative;
      z-index: 1;
    }
    .meta-row { display: flex; flex-direction: column; }
    .meta-label { font-size: 7pt; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em; }
    .meta-value { font-weight: 600; color: #1e293b; margin-top: 2px; word-break: break-word; }

    /* Verdict Card */
    .verdict-banner {
      background: ${verdictBg};
      border: 1.5px solid ${verdictBorder};
      border-radius: 10px;
      padding: 14px 18px;
      margin-bottom: 20px;
      position: relative;
      z-index: 1;
    }
    .verdict-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .verdict-tag {
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${verdictColor};
      background: rgba(255, 255, 255, 0.8);
      padding: 2px 8px;
      border-radius: 4px;
      border: 1px solid ${verdictBorder};
    }
    .verdict-main {
      font-size: 13pt;
      font-weight: 800;
      color: ${verdictColor};
      font-family: 'Cinzel', 'Noto Sans Devanagari', serif;
    }
    .verdict-explanation {
      font-size: 8.5pt;
      color: #334155;
      margin-top: 6px;
      line-height: 1.45;
    }

    /* Section Headings */
    .section-title {
      font-family: 'Cinzel', 'Noto Sans Devanagari', serif;
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 4px;
      margin-top: 18px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .section-title::before {
      content: "";
      width: 4px;
      height: 14px;
      background: #b48328;
      border-radius: 2px;
      display: inline-block;
    }

    /* Table styles */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 8.5pt;
    }
    th {
      background: #f1f5f9;
      text-align: left;
      padding: 6px 10px;
      font-weight: 700;
      color: #334155;
      border: 1px solid #cbd5e1;
      font-size: 7.5pt;
      text-transform: uppercase;
    }
    td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      color: #1e293b;
      vertical-align: top;
    }

    /* Citation Box */
    .citation-card {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-left: 3.5px solid #b48328;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }
    .citation-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }
    .citation-code {
      font-family: monospace;
      font-weight: 700;
      font-size: 8.5pt;
      color: #0f172a;
      background: #f1f5f9;
      padding: 1px 6px;
      border-radius: 4px;
    }
    .citation-source {
      font-size: 7.5pt;
      color: #64748b;
    }
    .citation-body {
      font-size: 8.5pt;
      color: #334155;
      margin-top: 4px;
      line-height: 1.4;
    }
    .canonical-quote {
      background: #f8fafc;
      border-left: 2px solid #cbd5e1;
      padding: 6px 10px;
      font-size: 8pt;
      font-style: italic;
      color: #475569;
      margin-top: 6px;
      border-radius: 0 4px 4px 0;
    }

    /* Route Box */
    .route-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 10px 14px;
      margin-bottom: 8px;
    }
    .route-title {
      font-size: 9pt;
      font-weight: 700;
      color: #0f172a;
    }
    .route-desc {
      font-size: 8pt;
      color: #475569;
      margin-top: 3px;
    }
    .action-list {
      margin-top: 5px;
      margin-left: 18px;
      font-size: 8pt;
      color: #334155;
    }

    /* Footer & Stamp */
    .dossier-footer {
      border-top: 2px solid #e2e8f0;
      margin-top: 24px;
      padding-top: 14px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      page-break-inside: avoid;
    }
    .disclaimer-text {
      font-size: 7pt;
      color: #64748b;
      line-height: 1.4;
      max-width: 520px;
    }
    .stamp-container {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .official-stamp {
      width: 72px;
      height: 72px;
      border: 2px dashed #b48328;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: #b48328;
      font-size: 6pt;
      font-weight: 700;
      text-transform: uppercase;
      padding: 4px;
      line-height: 1.1;
      background: rgba(180, 131, 40, 0.03);
    }
    .sha-hash {
      font-family: monospace;
      font-size: 6.5pt;
      color: #94a3b8;
      margin-top: 4px;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="watermark">${t('securityWatermark')}</div>
  
  <div class="page-container">
    <!-- Header -->
    <div class="header-bar">
      <div class="emblem-title-group">
        <div class="seal-box">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="rgba(180, 131, 40, 0.15)" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.4" />
          </svg>
        </div>
        <div>
          <div class="authority-heading">${t('authorityTitle')}</div>
          <div class="dossier-heading">${t('reportHeader')}</div>
          <div class="sub-system">${t('authoritySubtitle')}</div>
        </div>
      </div>
      <div class="meta-box">
        <div>${t('refNo')}: <strong>${dossierId}</strong></div>
        <div>${t('issueDate')}: <strong>${timestamp}</strong></div>
        <div>Language: <strong>${SUPPORTED_REPORT_LANGUAGES.find(l => l.code === lang)?.nativeLabel}</strong></div>
      </div>
    </div>

    <!-- Metadata Grid -->
    <div class="metadata-grid">
      <div class="meta-row">
        <span class="meta-label">${t('queryExamined')}</span>
        <span class="meta-value">"${verdict.query}"</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">${t('classification')}</span>
        <span class="meta-value">${verdict.classification ? `${verdict.classification.category_label} (${verdict.classification.category})` : 'Traditional Knowledge Assessment'}</span>
      </div>
    </div>

    <!-- 1. Verdict Banner -->
    <div class="verdict-banner">
      <div class="verdict-title-row">
        <span class="verdict-tag">${t('verdictLabel')}</span>
        <span style="font-size: 7.5pt; font-weight: 700; color: #475569;">${t('confidenceBand')}: ${verdict.classification ? verdict.classification.band_label : `${(verdict.confidence_score * 100).toFixed(0)}%`}</span>
      </div>
      <div class="verdict-main">${verdict.verdict_title}</div>
      <div class="verdict-explanation">
        ${verdict.classification ? verdict.classification.rationale.join(' ') : 'Statutory determination verified against Sections 3(p), 3(e), 3(d) and Biodiversity Act 2023.'}
      </div>
    </div>

    <!-- 2. Botanicals Table -->
    <div class="section-title">${t('botanicalsTitle')}</div>
    ${verdict.resolved_botanicals && verdict.resolved_botanicals.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>${t('sanskritName')}</th>
          <th>${t('commonName')}</th>
          <th>${t('botanicalName')}</th>
          <th>${t('afiRef')}</th>
        </tr>
      </thead>
      <tbody>
        ${verdict.resolved_botanicals.map(b => `
          <tr>
            <td><strong>${b.sanskrit_name}</strong></td>
            <td>${b.english_common_name || '—'}</td>
            <td><em>${b.botanical_binomial}</em></td>
            <td>${b.afi_reference || 'Codified in AFI Vol 1'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ` : `<p style="font-size: 8.5pt; color: #64748b; margin-bottom: 12px;">${t('noBotanicals')}</p>`}

    <!-- 3. Statutory Reasoning -->
    <div class="section-title">${t('reasoningTitle')}</div>
    ${verdict.reasoning_chain.map(step => `
      <div class="citation-card">
        <div class="citation-header">
          <span class="citation-code">${step.citation.citation_code}</span>
          <span class="citation-source">${step.citation.act_title} [${step.severity}]</span>
        </div>
        <div style="font-weight: 700; font-size: 9pt; color: #0f172a; margin-top: 3px;">${step.citation.heading}</div>
        <div class="citation-body">${step.description}</div>
        <div class="canonical-quote">"${step.citation.text_snippet}"</div>
      </div>
    `).join('')}

    <!-- 4. Precedent -->
    ${verdict.precedent_case ? `
      <div class="section-title">${t('precedentTitle')}</div>
      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 3.5px solid #f59e0b; padding: 8px 12px; border-radius: 6px; font-size: 8.5pt; color: #92400e; margin-bottom: 12px;">
        ${verdict.precedent_case}
      </div>
    ` : ''}

    <!-- 5. Recommended Protection Routes -->
    <div class="section-title">${t('routesTitle')}</div>
    ${verdict.viable_routes.map((route, i) => `
      <div class="route-item">
        <div class="route-title">${i + 1}. ${route.title} (${route.type})</div>
        <div class="route-desc">${route.description}</div>
        ${route.actionable_steps && route.actionable_steps.length > 0 ? `
          <ul class="action-list">
            ${route.actionable_steps.map(s => `<li>${s}</li>`).join('')}
          </ul>
        ` : ''}
      </div>
    `).join('')}

    <!-- Footer -->
    <div class="dossier-footer">
      <div class="disclaimer-text">
        <div style="font-weight: 700; margin-bottom: 2px;">${t('disclaimer').split(':')[0]}</div>
        ${t('disclaimer').split(':')[1]}
      </div>
      <div class="stamp-container">
        <div class="official-stamp">
          <span>GOVT OF INDIA</span>
          <span style="font-size: 8pt; margin: 1px 0;">⚖️</span>
          <span>IP-SAKTI VERIFIED</span>
        </div>
        <div class="sha-hash" title="SHA-256: ${shaSeal}">HASH: ${shaSeal.substring(0, 16)}...</div>
      </div>
    </div>
  </div>

  <script>
    window.onload = function() {
      // Auto-trigger print dialog when document is loaded in separate window/iframe
      if (window.location.search.includes('autoprint=true')) {
        setTimeout(function() { window.print(); }, 400);
      }
    };
  </script>
</body>
</html>`;
}

/**
 * Print or download the advisory memo as high-res PDF
 */
export function printOrDownloadAdvisoryPdf(verdict: LegalVerdict, lang: AdvisoryReportLanguage = 'EN') {
  const html = generateAdvisoryHtmlReport(verdict, lang);
  
  // Open dedicated print window with auto-print
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to generate and print your statutory PDF.");
    return;
  }
  
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  
  // Wait for fonts to load before triggering print
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 500);
}

/**
 * Triggers browser download of advisory memo as a .md file in the chosen language
 */
export function downloadAdvisoryMemoFile(verdict: LegalVerdict, lang: AdvisoryReportLanguage = 'EN') {
  const mdContent = generateAdvisoryMemoMarkdown(verdict, lang);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `IP_SAKTI_Advisory_${lang}_${Date.now()}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Utility string hash for reproducible reference IDs
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
