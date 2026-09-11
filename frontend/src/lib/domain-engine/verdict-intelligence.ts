/**
 * Intelligent Verdict & Outputs — deterministic classification, confidence
 * bands, evidence-gap map, dynamic route recommender, graceful abstention.
 *
 * All functions are pure + offline. The confidence band counts corroborating
 * evidence signals (never an arbitrary percentage). The gap map names the
 * exact missing facts that block a definitive answer. The route recommender
 * assigns PRIMARY / SECONDARY / NOT_AVAILABLE per classification.
 */

import type {
  AbstentionCategory,
  BotanicalEntity,
  ConfidenceBand,
  EvidenceGap,
  FormulationCategory,
  FormulationClassification,
  Jurisdiction,
  SupportedLanguage,
  ViableRoute,
} from '@/types/domain';
import type { ClassicalHit, TkdlHit } from './statutory-checks';

// ---------------------------------------------------------------------------
// Signal lexicons (local — kept in sync with statutory-checks intent)
// ---------------------------------------------------------------------------

const PROCESS_DETAIL = [
  'supercritical', 'co2 extraction', 'co₂ extraction', 'chromatograph',
  'isolated', 'isolation', 'purified', 'purification', 'fraction',
  'nano', 'liposomal', 'encapsulat', 'ferment', 'biotransform',
  'novel process', 'novel extraction', 'new process', 'extraction process',
  'process for', 'method of extracting', 'standardized extract', 'purity',
  'bioavailability',
];

const EFFICACY_DETAIL = [
  'efficacy', 'synergy', 'synergistic', 'bioavailability', '4x', 'clinical trial',
  'comparative data', 'pilot trial',
];

const COMPOSITION_DETAIL = [
  'ratio', '%', 'proportion', 'parts', 'matra', 'quantity', 'gram', 'mg',
];

const CLASSICAL_NAMES = [
  'triphala', 'trikatu', 'chyawanprash', 'chyavanprash', 'haridra khanda',
  'ashwagandharishta', 'amritarishta', 'abhayarishta', 'agastya haritaki',
  'sudarshana', 'nisha katakadi', 'haridradi', 'marichadi', 'talisadi',
  'balarishta', 'lavangadi', 'triphaladi', 'panchagavya', 'nimbadi',
];

const CLASSICAL_TEXT_MARKERS = [
  'classical', 'shastriya', 'shastric', 'afi', 'ayurvedic formulary',
  'bhaishajya', 'charaka', 'sushruta', 'as tanga', 'astanga',
  'samhita', 'grantha', 'traditional formulation',
];

const AYUR_KEYWORDS = [
  'ayurved', 'herb', 'herbal', 'jadi', 'booti', 'jadi-booti', 'churna',
  'vati', 'kwath', 'kashayam', 'taila', 'ghrita', 'lehya', 'arishta',
  'bhasma', 'rasa', 'plant', 'botanical', 'extract', 'unani', 'siddha',
  'dosha', 'rasayana', 'dravya',
];

const IP_INTENT = [
  'patent', 'ip', 'intellectual property', 'trademark', 'trademark',
  'gi tag', 'geographical indication', 'nba', 'approval', 'licen',
  'protect', 'opposition', 'prior art', 'tkdl', 'section', 'act',
  'law', 'legal', 'claim', 'file', 'filing', 'pct', 'wipo',
  'पेटेंट', 'पेटंट',
];

const MARKET_SIGNALS = [
  'pct', 'wipo', 'international', 'uspto', 'epo', 'foreign', 'abroad',
  'outside india', 'target market', 'market', 'export', 'sell',
];

const ORIGIN_SIGNALS = [
  'from ', 'origin', 'sourced', 'sourcing', 'kerala', 'tamil nadu',
  'karnataka', 'maharashtra', 'gujarat', 'rajasthan', 'punjab',
  'himalaya', 'himalayan', 'western ghats', 'region', 'farm',
  'cultivat', 'wild crafted', 'geo', 'district',
];

const ENTITY_SIGNALS = [
  'company', 'startup', 'firm', 'msme', 'individual', 'citizen',
  'foreign', 'nri', 'entity', 'organisation', 'organization',
  'manufacturer', 'our company', 'i am a',
];

// ---------------------------------------------------------------------------
// 1. Formulation classifier → category + evidence-counted band
// ---------------------------------------------------------------------------

export interface ClassifierInput {
  query: string;
  botanicals: BotanicalEntity[];
  classicalHits: ClassicalHit[];
  tkdlHits: TkdlHit[];
}

const CATEGORY_LABELS: Record<FormulationCategory, string> = {
  CLASSICAL: 'Classical Formulation (Shastriya)',
  PROPRIETARY_ADMIXTURE: 'Proprietary Admixture (TK-based)',
  PROCESS_INNOVATION: 'Process Innovation on TK Base',
  NON_AYURVEDIC: 'Non-Ayurvedic / General Query',
  UNCLASSIFIABLE: 'Unclassifiable — Too Little Evidence',
};

const BAND_LABELS: Record<ConfidenceBand, string> = {
  HIGH: 'High evidence',
  MODERATE: 'Moderate evidence',
  INSUFFICIENT: 'Insufficient evidence',
};

function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

export function classifyFormulation(input: ClassifierInput): FormulationClassification {
  const lowered = input.query.toLowerCase();
  const { botanicals, classicalHits, tkdlHits } = input;
  const rationale: string[] = [];
  const signals: string[] = [];

  // --- evidence points (the band is a count, not a vibe) ---
  let points = 0;
  if (botanicals.length > 0) {
    points += 1;
    signals.push(`${botanicals.length} botanical${botanicals.length > 1 ? 's' : ''} resolved to Latin binomials`);
  }
  if (classicalHits.length > 0) {
    points += 1;
    signals.push(`AFI classical match: ${classicalHits[0].name}`);
  }
  if (tkdlHits.length > 0) {
    points += 1;
    signals.push(`TKDL prior-art entry: ${tkdlHits[0].tkdl_id}`);
  }
  const hasProcessDetail = containsAny(lowered, PROCESS_DETAIL);
  if (hasProcessDetail) {
    points += 1;
    signals.push('Novel process parameters described');
  }
  const hasComposition = containsAny(lowered, COMPOSITION_DETAIL);
  if (hasComposition) {
    points += 1;
    signals.push('Composition / ratio / purity stated');
  }
  if (containsAny(lowered, MARKET_SIGNALS)) {
    points += 1;
    signals.push('Target market / jurisdiction stated');
  }

  // --- category decision tree ---
  const strongClassical =
    classicalHits.some((h) => h.matchedIngredients.length >= 2) ||
    containsAny(lowered, CLASSICAL_NAMES);
  const textClaimsClassical = containsAny(lowered, CLASSICAL_TEXT_MARKERS);
  const ayurContext =
    botanicals.length > 0 ||
    containsAny(lowered, AYUR_KEYWORDS) ||
    containsAny(lowered, CLASSICAL_NAMES);

  // Generic TK-formulation claim: patent + mixture language + therapeutic use,
  // even when individual herbs miss the ontology (e.g. synthetic test aliases).
  const genericTKClaim =
    /patent|पेटेंट|पेटंट/i.test(input.query) &&
    /(formulation|mixture|combination|blend|churna|admixture)/i.test(input.query) &&
    /(curing|treating|treatment|for (fever|cough|pain|disease|ailment))/i.test(input.query);

  // Generic process claim on an unmapped herb (e.g. synthetic test aliases):
  // novel-method language + botanical/formulation context, ontology miss.
  const genericProcessClaim =
    hasProcessDetail &&
    botanicals.length === 0 &&
    /(extract|supercritical|isolat|purif|fraction|herb|botanical|formulation|tinospora|brahmi|guduchi|ashwagandha|curcuma|withania)/i.test(input.query);

  let category: FormulationCategory;
  if (genericProcessClaim) {
    category = 'PROCESS_INNOVATION';
    rationale.push('A novel extraction/isolation process is claimed, but the named herb alias did not resolve to the curated ontology — treated as a process innovation on an unmapped TK base pending botanical confirmation.');
  } else if (genericTKClaim && botanicals.length === 0) {
    category = 'PROPRIETARY_ADMIXTURE';
    rationale.push('The query claims a patent on a herbal-style formulation for therapeutic use, but its ingredients did not resolve to the botanical ontology — treated as an unmapped proprietary admixture of traditional components.');
    if (!textClaimsClassical && classicalHits.length === 0) {
      rationale.push('No classical match could be confirmed automatically; a full TKDL search is needed to rule a codified mirror in or out.');
    }
  } else if (!ayurContext) {
    if (input.query.trim().length < 20) {
      category = 'UNCLASSIFIABLE';
      rationale.push('Query is too short and names no Ayurvedic herb, formulation, or IP intent.');
    } else {
      category = 'NON_AYURVEDIC';
      rationale.push('No Ayurvedic botanical, formulation, or classical reference detected.');
    }
  } else if (hasProcessDetail && botanicals.length > 0) {
    category = 'PROCESS_INNOVATION';
    rationale.push('A novel extraction/isolation process is claimed on a TK botanical base — the product/process distinction decides patentability.');
    if (strongClassical || textClaimsClassical) {
      rationale.push('The underlying herb combination overlaps classical prior art, so only the process (not the mixture) can be considered.');
    }
  } else if (strongClassical || textClaimsClassical) {
    category = 'CLASSICAL';
    rationale.push(
      strongClassical
        ? `Ingredient overlap with a codified classical formulation (${classicalHits[0]?.name ?? 'AFI entry'}) places this squarely in documented traditional knowledge.`
        : 'The query invokes a classical text or formulary, placing it in documented traditional knowledge.'
    );
  } else if (botanicals.length > 0) {
    category = 'PROPRIETARY_ADMIXTURE';
    rationale.push('Known TK herbs are combined without a codified classical match and without a described novel process — a proprietary-style admixture of traditional components.');
  } else {
    category = 'UNCLASSIFIABLE';
    rationale.push('Ayurvedic context is hinted but no resolvable herb or formulation could be mapped to the ontology.');
  }

  const band: ConfidenceBand =
    category === 'NON_AYURVEDIC' || category === 'UNCLASSIFIABLE'
      ? 'INSUFFICIENT'
      : points >= 3
        ? 'HIGH'
        : points === 2
          ? 'MODERATE'
          : 'INSUFFICIENT';

  if (band === 'INSUFFICIENT' && (category === 'CLASSICAL' || category === 'PROPRIETARY_ADMIXTURE' || category === 'PROCESS_INNOVATION')) {
    rationale.push('Only one corroborating signal was found — supply the missing facts in the Evidence Gap Map below to raise the band.');
  }

  return {
    category,
    category_label: CATEGORY_LABELS[category],
    band,
    band_label: BAND_LABELS[band],
    evidence_points: points,
    rationale,
    signals,
  };
}

// ---------------------------------------------------------------------------
// 2. Evidence Gap Map — "What is still unknown?"
// ---------------------------------------------------------------------------

export interface GapInput extends ClassifierInput {
  jurisdiction: Jurisdiction;
  barred: boolean;
}

export function analyzeEvidenceGaps(input: GapInput): EvidenceGap[] {
  const lowered = input.query.toLowerCase();
  const gaps: EvidenceGap[] = [];

  const hasProcess = containsAny(lowered, PROCESS_DETAIL);
  const hasEfficacy = containsAny(lowered, EFFICACY_DETAIL);
  const hasComposition = containsAny(lowered, COMPOSITION_DETAIL);
  const hasMarket = containsAny(lowered, MARKET_SIGNALS);
  const hasOrigin = containsAny(lowered, ORIGIN_SIGNALS);
  const hasEntity = containsAny(lowered, ENTITY_SIGNALS);

  if ((input.barred || input.botanicals.length > 0) && !hasProcess) {
    gaps.push({
      id: 'extraction_method',
      question: 'What is the exact extraction / isolation method and its parameters?',
      why_it_matters:
        'The only escape from the s.3(p)/s.3(e) product bar is a genuinely novel process. Without solvents, temperatures, yields, or purity figures, no process claim can be drafted or examined.',
      statutory_link: 's.3(d)',
      severity: 'BLOCKING',
      how_to_fix: 'Describe the method step-by-step (e.g. supercritical CO₂ at stated pressure/temperature, chromatography, standardisation) in the Smart Input Form.',
    });
  }
  if (input.botanicals.length >= 1 && !hasEfficacy) {
    gaps.push({
      id: 'efficacy_data',
      question: 'Where is the comparative efficacy / synergy data?',
      why_it_matters:
        'Sections 3(d) and 3(e) demand quantified proof — enhanced efficacy over the known substance, or synergy beyond the sum of parts. Assertions without numbers sustain the objection.',
      statutory_link: 's.3(e)',
      severity: input.barred ? 'BLOCKING' : 'HELPFUL',
      how_to_fix: 'Add bioavailability, dissolution, or pilot-trial figures (Novartis v. Union of India standard) or plan Rule 158B pilot studies.',
    });
  }
  if (input.botanicals.length >= 2 && !hasComposition) {
    gaps.push({
      id: 'composition_ratios',
      question: 'What are the exact proportions, ratios, and dosage form?',
      why_it_matters:
        'An admixture objection under s.3(e) turns on whether the combination is a mere aggregation. Exact ratios and the finished form (churna, extract, capsule) define what is actually being claimed.',
      statutory_link: 's.3(e)',
      severity: input.barred ? 'BLOCKING' : 'HELPFUL',
      how_to_fix: 'State each ingredient quantity, ratio (e.g. 3:1), and dosage form in the Ingredients field.',
    });
  }
  if (!hasMarket) {
    gaps.push({
      id: 'target_market',
      question: 'Which market are you filing for — India only, or PCT/international?',
      why_it_matters:
        'India-only filings face NBA s.6(1) + s.10(4)(d); any foreign track additionally triggers WIPO GRATK Article 3 disclosure and BDA s.3 foreign-entity approval. The compliance checklist differs completely.',
      statutory_link: 'WIPO_art.3',
      severity: 'HELPFUL',
      how_to_fix: 'Pick a Target Market in the Smart Input Form (India / International / USPTO / EPO).',
    });
  }
  if (input.botanicals.length > 0 && !hasOrigin) {
    gaps.push({
      id: 'bio_source_origin',
      question: 'What is the geographical source of each biological material?',
      why_it_matters:
        'The complete specification must disclose source and geographical origin (s.10(4)(d)); omission invites pre-grant opposition and revocation. Origin also decides GI potential and Nagoya benefit-sharing.',
      statutory_link: 's.10(4)(d)',
      severity: 'HELPFUL',
      how_to_fix: 'Name the sourcing region/state and supplier (e.g. Kerala-farmed Curcuma longa) when known.',
    });
  }
  if (input.botanicals.length > 0 && input.classicalHits.length === 0) {
    gaps.push({
      id: 'classical_match_confirm',
      question: 'Does this mirror a codified AFI/TKDL formulation?',
      why_it_matters:
        'No automatic AFI/TKDL mirror was found, but absence from the sample index is not proof of novelty. A full TKDL search decides whether s.3(p) applies or the admixture is genuinely new.',
      statutory_link: 's.3(p)',
      severity: 'HELPFUL',
      how_to_fix: 'Confirm against the full AFI/TKDL or escalate to a patent facilitator for a formal prior-art search.',
    });
  }
  if (input.botanicals.length > 0 && !hasEntity) {
    gaps.push({
      id: 'applicant_type',
      question: 'Who is the applicant — Indian individual/entity, or foreign-linked?',
      why_it_matters:
        'Indian applicants intimate the State Biodiversity Board (BDA s.7); foreign-linked applicants need prior NBA approval even for access (BDA s.3). The wrong track voids the filing.',
      statutory_link: 'BDA_s.7',
      severity: 'HELPFUL',
      how_to_fix: 'State applicant status (Indian citizen / Indian company / foreign-linked) before choosing Form I vs Form III/VII.',
    });
  }
  return gaps;
}

// ---------------------------------------------------------------------------
// 3. Viable Route Recommender — dynamic pivots with eligibility
// ---------------------------------------------------------------------------

export interface RouteInput {
  barred: boolean;
  processViable: boolean;
  classification: FormulationClassification;
  gaps: EvidenceGap[];
  jurisdiction: Jurisdiction;
  botanicals: BotanicalEntity[];
  language?: SupportedLanguage;
}

function needsPresent(gaps: EvidenceGap[], ids: string[]): string[] {
  const present = new Set(gaps.map((g) => g.id));
  return ids.filter((id) => present.has(id));
}

export function recommendRoutes(input: RouteInput): ViableRoute[] {
  const { barred, processViable, classification, gaps, botanicals } = input;
  const lang = input.language ?? 'EN';
  const cat = classification.category;
  const noTK = cat === 'NON_AYURVEDIC' || cat === 'UNCLASSIFIABLE';
  const routes: ViableRoute[] = [];

  // --- Novel Process / Method patent ---
  if (processViable) {
    const needs = needsPresent(gaps, ['efficacy_data', 'composition_ratios']);
    routes.push({
      type: 'PROCESS_PATENT',
      title:
        lang === 'HI'
          ? 'नवीन प्रक्रिया / विधि पेटेंट — प्राथमिक विकल्प'
          : lang === 'MR'
          ? 'नाविन्यपूर्ण प्रक्रिया / पद्धती पेटंट — प्राथमिक पर्याय'
          : lang === 'SA'
          ? 'अभिनवप्रक्रिया / विधिपटण्टम् — प्राथमिकविकल्पः'
          : 'Novel Process / Method Patent — PRIMARY PIVOT',
      description:
        lang === 'HI'
          ? 'एक नवीन निष्कर्षण, पृथक्करण या मानकीकरण प्रक्रिया का वर्णन किया गया है। जड़ी-बूटियों पर उत्पाद दावे वर्जित हैं, लेकिन यदि तुलनात्मक डेटा के साथ संवर्धित प्रभावकारिता सिद्ध होती है तो प्रक्रिया का दावा किया जा सकता है।'
          : lang === 'MR'
          ? 'नाविन्यपूर्ण निष्कर्षण, अलगीकरण किंवा प्रमाणीकरण प्रक्रियेचे वर्णन केले आहे. वनस्पतींवर उत्पादन दावे प्रतिबंधित आहेत, परंतु तुलनात्मक डेटासह वर्धित परिणामकारकता सिद्ध झाल्यास प्रक्रियेचाच दावा केला जाऊ शकतो.'
          : lang === 'SA'
          ? 'अभिनवनिष्कर्षणस्य, पृथक्करणस्य, मानकीकरणस्य वा प्रक्रिया वर्णिता। वनौषधिसम्बद्धाः उत्पाददावाः वर्जिताः, किन्तु यदि तुलनात्मकदत्तांशैः संवर्धितप्रभावकारिता सिध्यति तर्हि प्रक्रियायाः एव दावा कर्तुं शक्यते।'
          : 'A novel extraction, isolation, or standardisation process is described. Product claims on the herbs are barred, but the process itself can be claimed if enhanced efficacy is proved with comparative data.',
      actionable_steps:
        lang === 'HI'
          ? [
              'दावों को प्रक्रिया (विलायक, पैरामीटर, उपज, शुद्धता) के रूप में पुनः तैयार करें — केवल जड़ी-बूटी मिश्रण के रूप में कभी नहीं।',
              'धारा 3(d)/3(e) (नोवार्टिस मानक) के अनुपालन हेतु तुलनात्मक प्रभावकारिता/जैव-उपलब्धता डेटा संलग्न करें।',
              'दाखिल करने से पहले NBA फॉर्म III स्वीकृति प्राप्त करें; धारा 10(4)(d) स्रोत प्रकटीकरण के साथ उद्धृत करें।',
              'PCT ट्रैक के लिए, GRATK अनुच्छेद 3 उद्गम/TK प्रकटीकरण + TKDL/AFI पूर्व कला सूची (IDS) जोड़ें।',
            ]
          : lang === 'MR'
          ? [
              'दावे प्रक्रियेनुसार (द्रावक, मापदंड, उत्पादन, शुद्धता) पुन्हा तयार करा — वनस्पतींच्या मिश्रणावर कधीही नाही.',
              'कलम 3(d)/3(e) (नोव्हार्टिस मानक) पूर्ततेसाठी तुलनात्मक परिणामकारकता/जैवउपलब्धता डेटा जोडा.',
              'दाखल करण्यापूर्वी NBA फॉर्म III मान्यता मिळवा; कलम 10(4)(d) स्रोत प्रकटीकरणासह उद्धृत करा.',
              'PCT मार्गासाठी, GRATK अनु. 3 उत्पत्ती/TK प्रकटीकरण + TKDL/AFI पूर्वकला सूची (IDS) समाविष्ट करा.',
            ]
          : lang === 'SA'
          ? [
              'दावान् प्रक्रियां प्रति (द्रावक-मापदण्ड-प्राप्ति-शुद्धतान्) पुनर्प्रारूपयतु — वनौषधिमिश्रणस्योपरि कदापि न।',
              'धारा ३(d)/३(e) (नोवार्टिस्-मानकम्) अनुपालनाय तुलनात्मकप्रभावकारिता/जैवउपलब्धतादत्तांशान् संलग्नीकुरुत।',
              'दाखिलात् पूर्वं NBA प्रपत्रम् III अनुमोदनं प्राप्नुवन्तु; धारा १०(४)(d) स्रोतःप्रकटीकरणेन सह उद्धरन्तु।',
              'PCT मार्गाय GRATK अनु. ३ मूल/TK प्रकटनम् + TKDL/AFI पूर्वकलासूचीं योजयन्तु।',
            ]
          : [
              'Redraft claims to the PROCESS (solvents, parameters, yields, purity) — never the herb mixture per se.',
              'Attach comparative efficacy/bioavailability data to survive s.3(d)/s.3(e) (Novartis standard).',
              'Obtain NBA Form III approval BEFORE filing; cite it with s.10(4)(d) source disclosure.',
              'For PCT track, add GRATK Art.3 origin/TK disclosure + IDS listing TKDL/AFI prior art.',
            ],
      priority: 'PRIMARY',
      rationale:
        lang === 'HI'
          ? 'प्रक्रिया पैरामीटर निर्दिष्ट हैं, इसलिए धारा 3(p)/3(e) उत्पाद बाधा विधि पर लागू नहीं होती है।'
          : lang === 'MR'
          ? 'प्रक्रिया मापदंड नमूद केले आहेत, त्यामुळे कलम 3(p)/3(e) उत्पादन बंदी पद्धतीवर लागू होत नाही.'
          : lang === 'SA'
          ? 'प्रक्रियामापदण्डाः निर्दिष्टाः, अतः धारा ३(p)/३(e) उत्पादप्रतिबन्धः विधावप्रवृत्तः।'
          : 'Process parameters are stated, so the s.3(p)/s.3(e) product bar does not extend to the method.',
      needs_gaps: needs,
    });
  } else if (!noTK) {
    const needs = needsPresent(gaps, ['extraction_method', 'efficacy_data', 'composition_ratios']);
    routes.push({
      type: 'PROCESS_PATENT',
      title:
        lang === 'HI'
          ? 'नवीन प्रक्रिया / विधि पेटेंट — सशर्त विकल्प'
          : lang === 'MR'
          ? 'नाविन्यपूर्ण प्रक्रिया / पद्धती पेटंट — सशर्त पर्याय'
          : lang === 'SA'
          ? 'अभिनवप्रक्रिया / विधिपटण्टम् — सशर्तविकल्पः'
          : 'Novel Process / Method Patent — CONDITIONAL PIVOT',
      description:
        lang === 'HI'
          ? 'उत्पाद के दावे वर्जित हैं, लेकिन प्रभावकारिता डेटा के साथ एक वास्तविक रूप से नवीन प्रक्रिया धारा 3(p)/3(e) से बच सकती है। यह विकल्प केवल नीचे दिए गए साक्ष्य अंतराल को पूरा करने के बाद ही उपलब्ध है।'
          : lang === 'MR'
          ? 'उत्पादन दावे प्रतिबंधित आहेत, परंतु परिणामकारकता डेटासह खरोखर नाविन्यपूर्ण प्रक्रिया कलम 3(p)/3(e) मधून सुटू शकते. खालील पुरावा अंतर भरून काढल्यानंतरच हा पर्याय उपलब्ध होतो.'
          : lang === 'SA'
          ? 'उत्पाददावाः वर्जिताः, किन्तु प्रभावकारितादत्तांशैः सह वस्तुतः अभिनवा प्रक्रिया धारा ३(p)/३(e) इत्यस्मात् मुच्यते। अयम् विकल्पः अधस्तनैः प्रमाणान्तरपूरणानन्तरमेव लभ्यते।'
          : 'Product claims are barred, but a genuinely novel process with efficacy data escapes s.3(p)/s.3(e). This pivot is available only after the evidence gaps below are closed.',
      actionable_steps:
        lang === 'HI'
          ? [
              'मापने योग्य मापदंडों के साथ एक नवीन प्रक्रिया (निष्कर्षण, प्रभाजन, नैनो-वितरण) तैयार करें।',
              'शास्त्रीय आधारभूत स्तर के विरुद्ध तुलनात्मक प्रभावकारिता डेटा उत्पन्न करें।',
              'फिर केवल प्रक्रिया संबंधी दावे + NBA फॉर्म III + धारा 10(4)(d) प्रकटीकरण तैयार करें।',
            ]
          : lang === 'MR'
          ? [
              'मोजण्यायोग्य मापदंडांसह एक नवीन प्रक्रिया (निष्कर्षण, अंशिकरण, नॅनो-डिलिव्हरी) डिझाइन करा.',
              'शास्त्रीय पायाभूत पातळीविरुद्ध तुलनात्मक परिणामकारकता डेटा तयार करा.',
              'त्यानंतर केवळ प्रक्रियेचे दावे + NBA फॉर्म III + कलम 10(4)(d) प्रकटीकरण मसुदा तयार करा.',
            ]
          : lang === 'SA'
          ? [
              'मापनयोग्यमापदण्डैः सह अभिनवप्रक्रियां (निष्कर्षण-प्रभाजन-नैनोवितरणम्) रचयन्तु।',
              'शास्त्रीयमानकविरुद्धं तुलनात्मकप्रभावकारितादत्तांशान् उत्पादयन्तु।',
              'तदनन्तरं केवलप्रक्रियादावान् + NBA प्रपत्रम् III + धारा १०(४)(d) प्रकटनं प्रारूपयन्तु।',
            ]
          : [
              'Design a novel process (extraction, fractionation, nano-delivery) with measurable parameters.',
              'Generate comparative efficacy data against the classical baseline.',
              'Then draft process-only claims + NBA Form III + s.10(4)(d) disclosure.',
            ],
      priority: 'SECONDARY',
      rationale:
        lang === 'HI'
          ? 'अभी तक किसी नवीन प्रक्रिया का वर्णन नहीं है — विधि और प्रभावकारिता के प्रमाण प्रस्तुत होने पर यह मार्ग खुलता है।'
          : lang === 'MR'
          ? 'अद्याप कोणत्याही नाविन्यपूर्ण प्रक्रियेचे वर्णन केलेले नाही — पद्धती आणि परिणामकारकतेचा पुरावा उपलब्ध झाल्यावर हा मार्ग खुला होतो.'
          : lang === 'SA'
          ? 'अद्यापि अभिनवप्रक्रिया न वर्णिता — विधि-प्रभावकारिताप्रमाणेषु प्राप्तेषु अयम् मार्गः उद्घाट्यते।'
          : 'No novel process is described yet — this route unlocks once method and efficacy evidence exist.',
      needs_gaps: needs,
    });
  } else {
    routes.push({
      type: 'PROCESS_PATENT',
      title:
        lang === 'HI'
          ? 'नवीन प्रक्रिया / विधि पेटेंट'
          : lang === 'MR'
          ? 'नाविन्यपूर्ण प्रक्रिया / पद्धती पेटंट'
          : lang === 'SA'
          ? 'अभिनवप्रक्रिया / विधिपटण्टम्'
          : 'Novel Process / Method Patent',
      description:
        lang === 'HI'
          ? 'प्रक्रिया दावे को सहारा देने के लिए किसी TK विषय वस्तु की पहचान नहीं की गई।'
          : lang === 'MR'
          ? 'प्रक्रियेच्या दाव्याला आधार देण्यासाठी कोणताही TK विषय ओळखला गेला नाही.'
          : lang === 'SA'
          ? 'प्रक्रियादावाय किमपि TK विषयवस्तु न अभिज्ञातम्।'
          : 'No TK subject matter was identified to anchor a process claim.',
      actionable_steps: [],
      priority: 'NOT_AVAILABLE',
      rationale:
        lang === 'HI'
          ? 'आयुर्वेदिक के रूप में कुछ भी वर्गीकृत नहीं किया गया था — TK-प्रक्रिया धुरी के लिए कोई पारंपरिक आधार नहीं है।'
          : 'Nothing Ayurvedic was classified — there is no traditional base for a TK-process pivot.',
      needs_gaps: [],
    });
  }

  // --- Geographical Indication ---
  if (!noTK) {
    const needs = needsPresent(gaps, ['bio_source_origin']);
    routes.push({
      type: 'GEOGRAPHICAL_INDICATION',
      title:
        lang === 'HI'
          ? 'भौगोलिक उपदर्शन (GI) टैग — सामूहिक संरक्षण'
          : lang === 'MR'
          ? 'भौगोलिक उपदर्शन (GI) टॅग — सामूहिक संरक्षण'
          : lang === 'SA'
          ? 'भौगोलिक-उपदर्शनम् (GI) — सामूहिकसंरक्षणम्'
          : 'Geographical Indication (GI) Tag — COLLECTIVE PROTECTION',
      description:
        lang === 'HI'
          ? 'शास्त्रीय पारंपरिक ज्ञान का पेटेंट द्वारा एकाधिकार नहीं किया जा सकता, लेकिन एक विशिष्ट क्षेत्र/समुदाय से जुड़े उत्पाद के लिए माल के भौगोलिक उपदर्शन अधिनियम, 1999 के तहत GI पंजीकरण प्राप्त किया जा सकता है — एक सामूहिक अधिकार जो क्षेत्रीय नाम के दुरुपयोग को रोकता है।'
          : lang === 'MR'
          ? 'शास्त्रीय पारंपरिक ज्ञानावर पेटंटद्वारे मक्तेदारी मिळवता येत नाही, परंतु विशिष्ट प्रदेश/समुदायाशी जोडलेले उत्पादन वस्तूंचे भौगोलिक उपदर्शन कायदा, 1999 अंतर्गत GI नोंदणी घेऊ शकते — हा एक सामूहिक हक्क आहे जो प्रादेशिक नावाचा गैरवापर रोखतो.'
          : lang === 'SA'
          ? 'शास्त्रीयपारम्परिकज्ञानस्य पटण्टेन एकाधिकारः न सम्भवति, किन्तु विशिष्टक्षेत्रसम्बद्धाय उत्पादाय भौगोलिक-उपदर्शन-अधिनियमः १९९९ अन्तर्गतं GI पञ्जीकरणं प्राप्तुं शक्यते — सामूहिकः अधिकारः यः क्षेत्रीयनामस्य दुरुपयोगं वारयति।'
          : 'Classical TK cannot be monopolised by patent, but a product tied to a specific region/community can seek GI registration under the Geographical Indications of Goods Act, 1999 — a collective right that blocks misappropriation of the regional name.',
      actionable_steps:
        lang === 'HI'
          ? [
              'क्षेत्रीय संबंध स्थापित करें: कृषि-जलवायु विशिष्टता, पारंपरिक निर्माता, ऐतिहासिक प्रतिष्ठा।',
              'GI आवेदन दाखिल करने के लिए एक उत्पादक संघ बनाएं या उसमें शामिल हों।',
              'GI विनिर्देश के लिए उत्पादन पद्धति और गुणवत्ता मानकों का दस्तावेजीकरण करें।',
            ]
          : lang === 'MR'
          ? [
              'प्रादेशिक दुवा स्थापित करा: कृषी-हवामान विशिष्टता, पारंपारिक उत्पादक, ऐतिहासिक प्रतिष्ठा.',
              'GI अर्ज दाखल करण्यासाठी उत्पादक संघटना स्थापन करा किंवा त्यात सामील व्हा.',
              'GI तपशीलासाठी उत्पादन पद्धती आणि गुणवत्ता मानकांचे दस्तऐवजीकरण करा.'
            ]
          : lang === 'SA'
          ? [
              'क्षेत्रीयसम्बन्धं स्थापयन्तु: कृषि-जलवायु-विशिष्टता, पारम्परिकनिर्मातारः, ऐतिहासिकप्रतिष्ठा।',
              'GI आवेदनं प्रदातुं उत्पादकसङ्घटनं रचयन्तु अथवा तत्र सम्मिलिताः भवन्तु।',
              'GI विनिर्देशाय उत्पादनपद्धतेः गुणवत्तामानानां च प्रलेखनं कुर्वन्तु।'
            ]
          : [
              'Establish the region link: agro-climatic specificity, traditional makers, historical reputation.',
              'Form or join a producer association to file the GI application.',
              'Document the production method and quality benchmarks for the GI specification.',
            ],
      priority: 'SECONDARY',
      rationale:
        cat === 'CLASSICAL'
          ? lang === 'HI'
            ? 'शास्त्रीय योग सार्वजनिक-डोमेन TK हैं — GI क्षेत्रीय प्रतिष्ठा की रक्षा करता है जहां पेटेंट नहीं कर सकते।'
            : 'Classical formulations are public-domain TK — GI protects the regional reputation where patents cannot.'
          : lang === 'HI'
          ? 'TK-आधारित मिश्रणों का उत्पाद-पेटेंट नहीं किया जा सकता; क्षेत्रीय पहचान को सामूहिक रूप से संरक्षित किया जा सकता है।'
          : 'TK-based admixtures cannot be product-patented; a regional identity can still be ring-fenced collectively.',
      needs_gaps: needs,
    });
  } else {
    routes.push({
      type: 'GEOGRAPHICAL_INDICATION',
      title:
        lang === 'HI'
          ? 'भौगोलिक उपदर्शन (GI) टैग'
          : lang === 'MR'
          ? 'भौगोलिक उपदर्शन (GI) टॅग'
          : lang === 'SA'
          ? 'भौगोलिक-उपदर्शनम् (GI)'
          : 'Geographical Indication (GI) Tag',
      description:
        lang === 'HI'
          ? 'किसी क्षेत्र से जुड़े पारंपरिक उत्पाद की पहचान नहीं की गई।'
          : 'No region-linked traditional product was identified.',
      actionable_steps: [],
      priority: 'NOT_AVAILABLE',
      rationale:
        lang === 'HI'
          ? 'GI के लिए भौगोलिक पहचान वाले पारंपरिक उत्पाद की आवश्यकता होती है — कोई भी वर्गीकृत नहीं था।'
          : 'GI requires a traditional product with a geographical identity — none was classified.',
      needs_gaps: [],
    });
  }

  // --- Trademark + AYUSH licence (commercial route) ---
  if (!noTK) {
    routes.push({
      type: 'TRADEMARK',
      title:
        lang === 'HI'
          ? 'ब्रांड (ट्रेडमार्क) + आयुष लाइसेंस — व्यावसायिक मार्ग'
          : lang === 'MR'
          ? 'ब्रँड (ट्रेडमार्क) + आयुष परवाना — व्यावसायिक मार्ग'
          : lang === 'SA'
          ? 'मुद्रा (ट्रेडमार्क) + आयुष-अनुज्ञापत्रम् — व्यावसायिकमार्गः'
          : 'Brand (Trademark) + AYUSH Licence — COMMERCIAL ROUTE',
      description:
        lang === 'HI'
          ? 'जहां पेटेंट प्रतिबंधित है, वहां अनुसूची T GMP के तहत पेटेंट और मालिकाना दवा (नियम 158B) के लिए ब्रांड और राज्य आयुष विनिर्माण लाइसेंस द्वारा व्यावसायिक स्थिति की सुरक्षा की जाती है।'
          : lang === 'MR'
          ? 'जिथे पेटंट प्रतिबंधित आहे, तिथे अनुसूची T GMP अंतर्गत पेटंट आणि प्रोप्रायटरी औषधासाठी (नियम 158B) ब्रँड आणि राज्य आयुष उत्पादन परवान्याद्वारे व्यावसायिक स्थान सुरक्षित केले जाते.'
          : lang === 'SA'
          ? 'यत्र पटण्टीकरणं वर्जितम्, तत्र अनुसूची T GMP अन्तर्गतं स्वामित्वाषधाय (नियमः १५८B) मुद्रया राज्य-आयुष-उत्पादन-अनुज्ञया च व्यावसायिकसंरक्षणं भवति।'
          : 'Where patenting is barred, the commercial position is protected by brand plus a State AYUSH manufacturing licence for patent & proprietary medicine (Rule 158B) under Schedule T GMP.',
      actionable_steps:
        lang === 'HI'
          ? [
              'उत्पाद ब्रांड के लिए ट्रेडमार्क पंजीकृत करें।',
              'पायलट सुरक्षा/प्रभावकारिता डोसियर (नियम 158B) + अनुसूची T GMP के साथ आयुष विनिर्माण लाइसेंस हेतु आवेदन करें।',
              'व्यावसायिक उपयोग के लिए SBB सूचना (BDA धारा 7) पूर्ण करें।',
            ]
          : lang === 'MR'
          ? [
              'उत्पादन ब्रँडसाठी ट्रेडमार्क दाखल करा.',
              'पायलट सुरक्षितता/परिणामकारकता डोसियर (नियम 158B) + अनुसूची T GMP सह आयुष उत्पादन परवान्यासाठी अर्ज करा.',
              'व्यावसायिक वापरासाठी SBB पूर्व सूचना (BDA कलम 7) पूर्ण करा.'
            ]
          : lang === 'SA'
          ? [
              'उत्पादमुद्रायै ट्रेडमार्क-पञ्जीकरणं कुर्वन्तु।',
              'सुरक्षा/प्रभावकारिताडोसियर (नियमः १५८B) + अनुसूची T GMP सह आयुष-उत्पादन-अनुज्ञायै आवेदनं कुर्वन्तु।',
              'व्यावसायिकोपयोगाय SBB सूचनां (BDA धारा ७) सम्पादयन्तु।'
            ]
          : [
              'File a trademark for the product brand.',
              'Apply for AYUSH manufacturing licence with pilot safety/efficacy dossier (Rule 158B) + Schedule T GMP.',
              'Complete SBB intimation (BDA s.7) for commercial utilisation.',
            ],
      priority: barred ? 'PRIMARY' : 'SECONDARY',
      rationale: barred
        ? lang === 'HI'
          ? 'उत्पाद के पेटेंट अयोग्य होने के साथ, ब्रांड + विनियामक विशिष्टता तुरंत कार्रवाई योग्य संरक्षण है।'
          : 'With the product unpatentable, brand + regulatory exclusivity is the immediately actionable protection.'
        : lang === 'HI'
        ? 'किसी भी प्रक्रिया-पेटेंट दाखिल करने के साथ-साथ एक समानांतर व्यावसायिक ट्रैक।'
        : 'A parallel commercial track alongside any process-patent filing.',
      needs_gaps: [],
    });
  } else {
    routes.push({
      type: 'TRADEMARK',
      title:
        lang === 'HI'
          ? 'ब्रांड (ट्रेडमार्क) + आयुष लाइसेंस'
          : lang === 'MR'
          ? 'ब्रँड (ट्रेडमार्क) + आयुष परवाना'
          : lang === 'SA'
          ? 'मुद्रा (ट्रेडमार्क) + आयुष-अनुज्ञापत्रम्'
          : 'Brand (Trademark) + AYUSH Licence',
      description:
        lang === 'HI'
          ? 'ब्रांड या लाइसेंस के लिए किसी आयुर्वेदिक उत्पाद की पहचान नहीं की गई।'
          : 'No Ayurvedic product was identified to brand or license.',
      actionable_steps: [],
      priority: 'NOT_AVAILABLE',
      rationale: 'Nothing to commercialise under AYUSH was classified.',
      needs_gaps: [],
    });
  }

  // --- Trade secret (know-how) ---
  if (cat === 'CLASSICAL') {
    routes.push({
      type: 'TRADE_SECRET',
      title:
        lang === 'HI'
          ? 'व्यापार रहस्य (तकनीकी जानकारी)'
          : lang === 'MR'
          ? 'व्यापार गुप्तता (तांत्रिक ज्ञान)'
          : lang === 'SA'
          ? 'व्यापाररहस्यम् (प्रविधिविज्ञानम्)'
          : 'Trade Secret (Know-How)',
      description:
        lang === 'HI'
          ? 'शास्त्रीय योग सार्वजनिक डोमेन TKDL पूर्व कला हैं और इन्हें गुप्त नहीं रखा जा सकता है।'
          : lang === 'MR'
          ? 'शास्त्रीय योग हे सार्वजनिक डोमेन TKDL पूर्वकला आहेत आणि ते गुप्त ठेवता येत नाहीत.'
          : lang === 'SA'
          ? 'शास्त्रीययोगाः सार्वजनिक-TKDL-पूर्वसम्पत्तयः सन्ति, अतः एतान् गोपनीयं रक्षितुं न शक्यते।'
          : 'Classical formulations are public-domain TKDL prior art and cannot be kept secret.',
      actionable_steps: [],
      priority: 'NOT_AVAILABLE',
      rationale:
        lang === 'HI'
          ? 'संहिताबद्ध TK पहले से ही प्रकाशित है — गोपनीयता असंभव है; GI या ब्रांड मार्ग को प्राथमिकता दें।'
          : 'Codified TK is already published — secrecy is impossible; prefer GI or brand routes.',
      needs_gaps: [],
    });
  } else if (!noTK) {
    const needs = needsPresent(gaps, ['extraction_method', 'composition_ratios']);
    routes.push({
      type: 'TRADE_SECRET',
      title:
        lang === 'HI'
          ? 'व्यापार रहस्य (प्रक्रिया ज्ञान)'
          : lang === 'MR'
          ? 'व्यापार गुप्तता (प्रक्रिया ज्ञान)'
          : lang === 'SA'
          ? 'व्यापाररहस्यम् (प्रक्रियाविज्ञानम्)'
          : 'Trade Secret (Process Know-How)',
      description:
        lang === 'HI'
          ? 'अघोषित अनुपात, तापमान और मानकीकरण की जानकारी को प्रक्रिया पेटेंट प्राप्त करने के दौरान (या इसके स्थान पर) व्यापार रहस्य के रूप में रखा जा सकता है — जिसे आप गुप्त रखना चाहते हैं उसे कभी प्रकाशित न करें।'
          : lang === 'MR'
          ? 'अघोषित प्रमाण, तापमान आणि प्रमाणीकरण कौशल्य प्रक्रिया पेटंट घेताना (किंवा त्याऐवजी) व्यापार गुप्तता म्हणून ठेवले जाऊ शकते — जे गुप्त ठेवायचे आहे ते कधीही प्रकाशित करू नका.'
          : lang === 'SA'
          ? 'अप्रकाशितप्रमाणाः, तापमानानि, मानकीकरणविज्ञानं च प्रक्रियापटण्टसमनन्तरं व्यापाररहस्यत्वेन रक्षितुं शक्यते — यत् गोप्यं तन्मा प्रकाशयन्तु।'
          : 'Undisclosed ratios, temperatures, and standardisation know-how can be held as trade secrets while (or instead of) pursuing a process patent — never publish what you intend to keep secret.',
      actionable_steps:
        lang === 'HI'
          ? [
              'वास्तविक रूप से गोपनीय मापदंडों (सटीक अनुपात, महत्वपूर्ण कदम) की पहचान करें।',
              'किसी भी प्रकटीकरण या दाखिल करने से पहले NDA और अभिगम नियंत्रण (access controls) लागू करें।',
              'प्रारंभ में ही निर्णय लें: प्रक्रिया को पेटेंट कराने से उसकी गोपनीयता समाप्त हो जाती है — प्रति पैरामीटर एक मार्ग चुनें।',
            ]
          : lang === 'MR'
          ? [
              'खरोखर गुप्त पॅरामीटर्स (अचूक प्रमाण, महत्त्वाच्या पायऱ्या) ओळखा.',
              'कोणत्याही प्रकटीकरणापूर्वी किंवा दाखल करण्यापूर्वी NDA आणि प्रवेश नियंत्रणे लागू करा.',
              'लवकर निर्णय घ्या: प्रक्रियेचे पेटंट केल्याने तिची गोपनीयता नष्ट होते — प्रति पॅरामीटर एकच मार्ग निवडा.'
            ]
          : lang === 'SA'
          ? [
              'वस्तुतः गोपनीयमापदण्डान् (यथार्थप्रमाणानि, प्रमुखाः चरणाः) अभिज्ञातव्यम्।',
              'कस्मादपि प्रकटनात् पूर्वं NDA तथा च अभिगम-नियन्त्रणं स्थापयन्तु।',
              'शीघ्रं निश्चिनुवन्तु: प्रक्रियायाः पटण्टीकरणेन गोपनीयता नश्यति — प्रतिघटकम् एकमेव पन्थानं वृणुत।'
            ]
          : [
              'Identify the genuinely secret parameters (exact ratios, critical steps).',
              'Put NDAs and access controls in place before any disclosure or filing.',
              'Decide early: patenting a process destroys its secrecy — choose one lane per parameter.',
            ],
      priority: 'SECONDARY',
      rationale:
        lang === 'HI'
          ? 'मालिकाना पैरामीटर प्रकाशित शास्त्रीय रिकॉर्ड के बाहर मौजूद हैं और अनुबंध के तहत सुरक्षित किए जा सकते हैं।'
          : 'Proprietary parameters exist outside the published classical record and can be ring-fenced contractually.',
      needs_gaps: needs,
    });
  } else {
    routes.push({
      type: 'TRADE_SECRET',
      title:
        lang === 'HI'
          ? 'व्यापार रहस्य (तकनीकी जानकारी)'
          : lang === 'MR'
          ? 'व्यापार गुप्तता (तांत्रिक ज्ञान)'
          : lang === 'SA'
          ? 'व्यापाररहस्यम् (प्रविधिविज्ञानम्)'
          : 'Trade Secret (Know-How)',
      description:
        lang === 'HI'
          ? 'किसी मालिकाना जानकारी की पहचान नहीं की गई।'
          : 'No proprietary know-how was identified.',
      actionable_steps: [],
      priority: 'NOT_AVAILABLE',
      rationale: 'Nothing confidential was classified.',
      needs_gaps: [],
    });
  }

  const order = { PRIMARY: 0, SECONDARY: 1, NOT_AVAILABLE: 2 };
  return routes.sort((a, b) => order[a.priority ?? 'SECONDARY'] - order[b.priority ?? 'SECONDARY']);
}

// ---------------------------------------------------------------------------
// 4. Graceful abstention — typed, specific, redirecting
// ---------------------------------------------------------------------------

const MEDICAL_PATTERNS = [
  'dosage', 'dose', 'how much', 'how many', 'cure my', 'treat my',
  'diagnos', 'symptom', 'side effect', 'should i take', 'is it safe',
  'safe to take', 'safe to consume', 'can i take', 'can i consume',
  'therapeutic dose', 'pediatric dose', 'खुराक', 'डोस', 'मात्रा', 'लक्षण',
];

const GREETING_OR_TRIVIA = [
  '^(hi|hello|hey|namaste|namaskar|thanks|thank you|thankyou|who are you|what can you do)\\b',
  '^(write|generate|debug|explain).{0,40}(code|python|javascript|program|poem|essay|email)\\b',
];

export interface AbstentionResult {
  category: AbstentionCategory;
  reason: string;
  suggestions: string[];
}

export function classifyAbstention(
  query: string,
  language: SupportedLanguage = 'EN'
): AbstentionResult | null {
  const lowered = query.toLowerCase().trim();

  // 1) Safety first: medical / therapeutic advice
  if (MEDICAL_PATTERNS.some((p) => lowered.includes(p))) {
    return {
      category: 'MEDICAL_ADVICE',
      reason:
        language === 'HI'
          ? 'यह प्रश्न चिकित्सीय सलाह (खुराक, निदान, उपचार) माँगता है। IP-SAKTI सहायक चिकित्सा परामर्श नहीं देता — यह सांविधिक IP मार्गदर्शन देता है।'
          : language === 'MR'
            ? 'ही विचारणा वैद्यकीय सल्ला (डोस, निदान, उपचार) मागते. IP-SAKTI सहाय्यक वैद्यकीय सल्ला देत नाही — ते वैधानिक IP मार्गदर्शन देते.'
            : 'This query asks for medical advice (dosage, diagnosis, or treatment). IP-SAKTI Sahayak does not practise medicine — it gives statutory IP and regulatory guidance for Ayurvedic formulations.',
      suggestions: [
        'Ask: "Can I patent a formulation of Haridra and Maricha for joint pain?"',
        'Ask: "What NBA approvals are needed to commercialise a Guduchi extract?"',
        'For dosage or treatment, consult a registered Ayurvedic practitioner or the Ministry of Ayush portal.',
      ],
    };
  }

  // 2) Small talk / trivia / off-topic code — label precisely, whatever the length
  const isSmallTalk = GREETING_OR_TRIVIA.some((p) => new RegExp(p, 'i').test(query.trim()));
  if (isSmallTalk) {
    return {
      category: 'NON_IP_DOMAIN',
      reason:
        'This looks like small talk or a general request, not a statutory IP question — no patent, TKDL, Biodiversity Act, or AYUSH licensing issue was detected. The engine abstains rather than generating an off-topic answer.',
      suggestions: [
        'Ask about patentability under Section 3(p)/3(e) of the Patents Act.',
        'Ask about NBA approval (BDA s.6) for using Indian biological resources.',
        'Ask about WIPO GRATK disclosure for an international (PCT) filing.',
      ],
    };
  }

  // 3) Too little to work with
  if (lowered.length < 20) {
    return {
      category: 'INSUFFICIENT_INPUT',
      reason:
        'The query is too short to classify — no herb, formulation, process, or legal question could be identified. The engine refuses to guess rather than hallucinate an answer.',
      suggestions: [
        'Name at least one herb or formulation (e.g. Haridra, Triphala, Guduchi extract).',
        'State your goal: patent, commercialise, export, or license.',
        'Use the Smart Input Form to add ingredients, intended use, and target market.',
      ],
    };
  }

  // 4) Outside the IP domain entirely.
  // Short tokens ('ip', 'nba', 'pct', 'act') match on word boundaries only —
  // otherwise 'Triphala' would false-positive on the 'ip' inside it.
  const tokenHit = (p: string) =>
    p.length <= 3
      ? new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(query)
      : lowered.includes(p);
  const hasIpIntent = IP_INTENT.some(tokenHit);
  const hasAyur = AYUR_KEYWORDS.some((p) => lowered.includes(p));
  if (!hasIpIntent && !hasAyur) {
    return {
      category: 'NON_IP_DOMAIN',
      reason:
        'This query falls outside statutory IP and regulatory scope — no patent, TKDL, Biodiversity Act, or AYUSH licensing question was detected. The engine abstains rather than generating an off-topic answer.',
      suggestions: [
        'Ask about patentability under Section 3(p)/3(e) of the Patents Act.',
        'Ask about NBA approval (BDA s.6) for using Indian biological resources.',
        'Ask about WIPO GRATK disclosure for an international (PCT) filing.',
      ],
    };
  }

  return null;
}
