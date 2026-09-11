/**
 * Multilingual Language Detection for English, Hindi, Marathi
 * Uses script analysis and common word patterns for fast client-side detection
 */

export type SupportedLanguage = 'EN' | 'HI' | 'MR' | 'SA';

// Devanagari Unicode range: U+0900 to U+097F
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;

// Common Hindi words (Devanagari script)
const HINDI_COMMON_WORDS = new Set([
  'मैं', 'हम', 'आप', 'यह', 'वह', 'है', 'हैं', 'था', 'थी', 'थे',
  'करना', 'चाहता', 'चाहती', 'चाहते', 'पेटेंट', 'करवाना', 'हूँ',
  'के', 'लिए', 'और', 'या', 'का', 'की', 'के', 'में', 'से', 'को',
  'दर्द', 'जोड़ों', 'उपचार', 'इलाज', 'आयुर्वेद', 'फॉर्मूलेशन',
  'हरिद्रा', 'मरिच', 'हल्दी', 'काली', 'मिर्च', 'गुडुची', 'अश्वगंधा',
  'नीम', 'आंवला', 'तुलसी', 'शुंठी', 'अदरक', 'सोंठ'
]);

// Common Marathi words (Devanagari script)
const MARATHI_COMMON_WORDS = new Set([
  'मी', 'आम्ही', 'तुम्ही', 'हे', 'ते', 'आहे', 'आहेत', 'होते', 'होती', 'होते',
  'करायचे', 'पेटंट', 'घ्यायचे', 'आहे',
  'साठी', 'आणि', 'किंवा', 'चा', 'ची', 'चे', 'मध्ये', 'पासून', 'ला',
  'दुखी', 'सांधे', 'उपचार', 'आयुर्वेद', 'फॉर्म्युलेशन',
  'हळद', 'मिरी', 'गुळवेल', 'अश्वगंधा', 'कडू', 'नीम', 'आवळा', 'तुळशी', 'सुंठ', 'आले'
]);

// English common words for patent/IP context
const ENGLISH_COMMON_WORDS = new Set([
  'i', 'we', 'you', 'want', 'to', 'patent', 'a', 'formulation', 'for',
  'the', 'and', 'or', 'of', 'in', 'with', 'is', 'are', 'was', 'were',
  'pain', 'joint', 'treatment', 'ayurvedic', 'herbal', 'extract',
  'haridra', 'maricha', 'turmeric', 'pepper', 'guduchi', 'ashwagandha',
  'neem', 'amla', 'tulsi', 'ginger', 'shunthi', 'process', 'claim',
  'patentable', 'protection', 'intellectual', 'property', 'rights'
]);

/**
 * Detects the primary language of the input text
 * Returns 'EN', 'HI', or 'MR'
 */
export function detectLanguage(text: string): SupportedLanguage {
  const trimmed = text.trim().toLowerCase();
  
  if (!trimmed) return 'EN';

  // Check for Devanagari script first
  const hasDevanagari = DEVANAGARI_REGEX.test(text);
  
  if (!hasDevanagari) {
    // No Devanagari - likely English
    return 'EN';
  }

  // Count word matches for Hindi vs Marathi
  const words = trimmed.split(/\s+/);
  let hindiScore = 0;
  let marathiScore = 0;

  for (const word of words) {
    // Remove punctuation for matching
    const cleanWord = word.replace(/[.,!?;:()\[\]{}"'-]/g, '');
    
    if (HINDI_COMMON_WORDS.has(cleanWord)) {
      hindiScore += 2;
    }
    if (MARATHI_COMMON_WORDS.has(cleanWord)) {
      marathiScore += 2;
    }
    
    // Check partial matches for longer words
    for (const hindiWord of HINDI_COMMON_WORDS) {
      if (hindiWord.length > 3 && cleanWord.includes(hindiWord)) {
        hindiScore += 1;
      }
    }
    for (const marathiWord of MARATHI_COMMON_WORDS) {
      if (marathiWord.length > 3 && cleanWord.includes(marathiWord)) {
        marathiScore += 1;
      }
    }
  }

  // Special Marathi markers (distinctive characters/words)
  const marathiMarkers = ['चे', 'ची', 'चा', 'ला', 'साठी', 'पासून', 'मध्ये', 'आहे', 'आहेत', 'होते'];
  const hindiMarkers = ['के', 'की', 'का', 'को', 'में', 'से', 'है', 'हैं', 'था', 'थी', 'चाहता', 'चाहती'];
  
  for (const marker of marathiMarkers) {
    if (trimmed.includes(marker)) marathiScore += 3;
  }
  for (const marker of hindiMarkers) {
    if (trimmed.includes(marker)) hindiScore += 3;
  }

  // Marathi has distinctive 'ऍ' 'ऑ' characters sometimes
  if (/[ऍऑ]/.test(text)) marathiScore += 5;

  if (marathiScore > hindiScore) return 'MR';
  if (hindiScore > marathiScore) return 'HI';
  
  // Default to Hindi if Devanagari but unclear
  return 'HI';
}

/**
 * Gets the display name for a language code
 */
export function getLanguageDisplayName(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'हिन्दी (Hindi)';
    case 'MR': return 'मराठी (Marathi)';
    case 'SA': return 'संस्कृतम् (Sanskrit)';
    case 'EN': return 'English';
    default: return 'English';
  }
}

/**
 * Gets the native name for a language code
 */
export function getLanguageNativeName(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'हिन्दी';
    case 'MR': return 'मराठी';
    case 'SA': return 'संस्कृतम्';
    case 'EN': return 'English';
    default: return 'English';
  }
}

/**
 * Gets the Speech Recognition language code for browser API
 */
export function getSpeechRecognitionLang(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'hi-IN';
    case 'MR': return 'mr-IN';
    case 'SA': return 'hi-IN'; // Fallback to hindi
    case 'EN': return 'en-IN';
    default: return 'en-IN';
  }
}

/**
 * Gets the Speech Synthesis language code for browser API
 */
export function getSpeechSynthesisLang(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'hi-IN';
    case 'MR': return 'mr-IN';
    case 'SA': return 'hi-IN'; // Fallback to hindi
    case 'EN': return 'en-IN';
    default: return 'en-IN';
  }
}

/**
 * Placeholder text for the textarea based on language
 */
export function getPlaceholderText(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'उदा. मैं जोड़ों के दर्द के लिए हल्दी और काली मिर्च का पेटेंट कराना चाहता हूँ।';
    case 'MR': return 'उदा. मला सांधेदुखीसाठी हळद आणि मिरी यांचे पेटंट घ्यायचे आहे।';
    case 'SA': return 'उदा. अहं सन्धिशूलाय हरिद्रामरिचयोः पेटण्ट् प्राप्तुम् इच्छामि।';
    case 'EN': return 'E.g., I want to patent a formulation of Haridra and Maricha for joint pain.';
    default: return 'E.g., I want to patent a formulation of Haridra and Maricha for joint pain.';
  }
}

/**
 * Title text for the input view based on language
 */
export function getInputTitle(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'आयुर्वेद हेतु त्वरित पेटेंट एवं आईपी मार्गदर्शन';
    case 'MR': return 'आयुर्वेदासाठी त्वरित पेटंट व आयपी मार्गदर्शन';
    case 'SA': return 'आयुर्वेदाय त्वरितं पेटण्ट् तथा आईपी मार्गदर्शनम्';
    case 'EN': return 'Instant Statutory Patent & IP Guidance for Ayurveda';
    default: return 'Instant Statutory Patent & IP Guidance for Ayurveda';
  }
}

/**
 * Description text for the input view based on language
 */
export function getInputDescription(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'शास्त्रीय और मालिकाना फॉर्मूलेटर्स के लिए उद्धरण-आधारित पुनर्प्राप्ति सहायक। भारतीय पेटेंट अधिनियम, जैविक विविधता अधिनियम 2023, और WIPO GRATK संधि में आधारित।';
    case 'MR': return 'शास्त्रीय आणि मालमत्तेदार फॉर्मुलेटर्ससाठी उद्धरण-आधारित पुनर्प्राप्ती सहाय्यक। भारतीय पेटंट कायदा, जैविक विविधता कायदा २०२३, आणि WIPO GRATK करारात आधारित।';
    case 'SA': return 'शास्त्रीय-स्वामित्व-निर्मातृभ्यः उद्धरण-आधारितः पुनर्प्राप्ति-सहायकः। भारतीयपेटण्टअधिनियमः, जैविकविविधताअधिनियमः २०२३, WIPO GRATK सन्धिः च इत्येषु आधारितम्।';
    case 'EN': return 'Citation-grounded retrieval assistant for classical & proprietary formulators. Grounded in the Indian Patents Act, Biological Diversity Act 2023, and WIPO GRATK Treaty.';
    default: return 'Citation-grounded retrieval assistant for classical & proprietary formulators. Grounded in the Indian Patents Act, Biological Diversity Act 2023, and WIPO GRATK Treaty.';
  }
}

/**
 * Analyze button text based on language
 */
export function getAnalyzeButtonText(lang: SupportedLanguage): string {
  switch (lang) {
    case 'HI': return 'विश्लेषण करें';
    case 'MR': return 'विश्लेषण करा';
    case 'SA': return 'विश्लेषणं करोतु';
    case 'EN': return 'Analyze Intent';
    default: return 'Analyze Intent';
  }
}