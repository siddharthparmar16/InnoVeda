// Sanskrit IAST Transliteration & Vernacular Normalizer
import botanicalOntology from '@/data/ontology/ayurvedic_botanical_ontology.json';
const DIACRITIC_MAP: Record<string, string> = {
  'ā': 'a', 'Ā': 'A',
  'ī': 'i', 'Ī': 'I',
  'ū': 'u', 'Ū': 'U',
  'ṛ': 'r', 'Ṛ': 'R',
  'ṝ': 'r', 'Ṝ': 'R',
  'ḷ': 'l', 'Ḷ': 'L',
  'ṅ': 'n', 'Ṅ': 'N',
  'ñ': 'n', 'Ñ': 'N',
  'ṭ': 't', 'Ṭ': 'T',
  'ḍ': 'd', 'Ḍ': 'D',
  'ṇ': 'n', 'Ṇ': 'N',
  'ś': 's', 'Ś': 'S',
  'ṣ': 's', 'Ṣ': 'S',
  'ṃ': 'm', 'Ṃ': 'M',
  'ḥ': 'h', 'Ḥ': 'H',
};

// Manual overrides for synonyms not present in the standard ontology
const MANUAL_SYNONYMS: Record<string, string> = {
  'turmeric': 'Haridra',
  'indian ginseng': 'Ashwagandha',
  'heart leaved moonseed': 'Guduchi',
  'indian gooseberry': 'Amalaki',
  'holy basil': 'Tulsi',
  'dry ginger': 'Shunthi',
};

// Devanagari-script aliases for the core curated herbs (Sanskrit + Hindi +
// Marathi forms). The ontology stores romanized names only, so without this
// map Hindi/Marathi-script queries resolve zero botanicals.
export const DEVANAGARI_SYNONYMS: Record<string, string> = {
  'हरिद्रा': 'Haridra', 'हल्दी': 'Haridra', 'हळद': 'Haridra',
  'मरिच': 'Maricha', 'मरीच': 'Maricha', 'काली मिर्च': 'Maricha',
  'काला मिर्च': 'Maricha', 'मिरी': 'Maricha', 'काळी मिरी': 'Maricha',
  'गुडूची': 'Guduchi', 'गिलोय': 'Guduchi', 'गुळवेल': 'Guduchi',
  'अश्वगंधा': 'Ashwagandha', 'असगंध': 'Ashwagandha',
  'निम्ब': 'Nimba', 'नीम': 'Nimba', 'कडुनिंब': 'Nimba', 'कडू नीम': 'Nimba',
  'आमलकी': 'Amalaki', 'आंवला': 'Amalaki', 'आवळा': 'Amalaki',
  'हरीतकी': 'Haritaki', 'हरड़': 'Haritaki', 'हिरडा': 'Haritaki',
  'बिभीतकी': 'Bibhitaki', 'बहेड़ा': 'Bibhitaki', 'बेहडा': 'Bibhitaki',
  'तुलसी': 'Tulsi', 'तुळस': 'Tulsi',
  'शुण्ठी': 'Shunthi', 'सोंठ': 'Shunthi', 'सुंठ': 'Shunthi',
  'अदरक': 'Shunthi', 'आले': 'Shunthi',
  'पिप्पली': 'Pippali', 'पीपल': 'Pippali',
};

// Dynamically build the synonym map from the ontology
export const VERNACULAR_SYNONYMS: Record<string, string> = { ...MANUAL_SYNONYMS, ...DEVANAGARI_SYNONYMS };

botanicalOntology.forEach(drug => {
  const sanskrit = drug.sanskrit_name;
  if (drug.hindi_name) VERNACULAR_SYNONYMS[drug.hindi_name] = sanskrit;
  if (drug.marathi_name) VERNACULAR_SYNONYMS[drug.marathi_name] = sanskrit;
  if (drug.tamil_name) VERNACULAR_SYNONYMS[drug.tamil_name] = sanskrit;
  if (drug.english_common_name) VERNACULAR_SYNONYMS[drug.english_common_name] = sanskrit;
});

/**
 * Strips IAST diacritics and normalizes case
 */
export function removeIASTDiacritics(text: string): string {
  let normalized = text;
  for (const [diacritic, plain] of Object.entries(DIACRITIC_MAP)) {
    normalized = normalized.replaceAll(diacritic, plain);
  }
  return normalized;
}

/**
 * Normalizes vernacular text (Hindi, Marathi, English variants) to standard Ayurvedic Sanskrit key
 */
export function normalizeQueryText(input: string): string {
  let cleaned = removeIASTDiacritics(input).toLowerCase();

  // Check vernacular synonym map
  for (const [vernacular, sanskritKey] of Object.entries(VERNACULAR_SYNONYMS)) {
    if (cleaned.includes(vernacular.toLowerCase())) {
      cleaned = cleaned.replaceAll(vernacular.toLowerCase(), sanskritKey.toLowerCase());
    }
  }

  return cleaned;
}
