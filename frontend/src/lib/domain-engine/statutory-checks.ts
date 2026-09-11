/**
 * Specialized Statutory Rule Engine (The "Brain") — HARDCODED legal checks.
 *
 * Runs deterministically WITHOUT any LLM call. Every step cites a real
 * section_id from legal_statutory_corpus.json so citation-validator can
 * ground it with SHA-256 + version_tag. AI output is treated as enrichment
 * only — these checks are the non-bypassable floor.
 *
 *  - Section 3(p) Patentability Filter (Patents Act 1970)
 *  - Section 3(e) admixture + 3(d) efficacy companion bars
 *  - BDA Section 6(1) / 7 NBA compliance checker
 *  - WIPO GRATK 2024 Art.3/Art.4 disclosure alignment (PCT jurisdictions)
 *  - Patents Act s.10(4)(d) source-disclosure mandate
 */

import {
  BotanicalEntity,
  Jurisdiction,
  LegalReasoningStep,
  LegalVerdict,
  SupportedLanguage,
  ViableRoute,
} from '@/types/domain';
import { resolveBotanicalEntities } from './botanical-resolver';
import { validateCitations } from './citation-validator';
import {
  analyzeEvidenceGaps,
  classifyFormulation,
  recommendRoutes,
} from './verdict-intelligence';
import classicalFormulations from '@/data/corpus/classical_formulations_index.json';
import tkdlCorpus from '@/data/corpus/tkdl_sample_corpus.json';
import botanicalOntology from '@/data/ontology/ayurvedic_botanical_ontology.json';
import { t } from '../i18n';

/**
 * Augments resolver output with genus+species binomial matching.
 * The base resolver only matches FULL aliases (e.g. the whole
 * "Tinospora cordifolia (Willd.) Miers" string), so a query mentioning just
 * "Tinospora cordifolia" would miss. This catches "<Genus> <species>".
 */
function augmentWithBinomialMatch(
  query: string,
  existing: BotanicalEntity[]
): BotanicalEntity[] {
  const lowered = query.toLowerCase();
  const seen = new Set(existing.map((b) => b.sanskrit_name));
  const out = [...existing];
  for (const drug of botanicalOntology as Record<string, unknown>[]) {
    const binomial = String(drug['botanical_binomial'] ?? '');
    const m = binomial.match(/^([A-Z][a-z]+)\s+([a-z]+)/);
    if (!m) continue;
    const short = `${m[1]} ${m[2]}`.toLowerCase();
    if (short.length < 5) continue;
    if (lowered.includes(short) && !seen.has(String(drug['sanskrit_name']))) {
      seen.add(String(drug['sanskrit_name']));
      out.push({ ...(drug as unknown as BotanicalEntity), matched_alias: short });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Signal lexicons (deterministic, multilingual where cheap)
// ---------------------------------------------------------------------------

/** Novel-process signals that can rescue a product-bar into a process-route. */
const PROCESS_SIGNALS = [
  'supercritical', 'co2 extraction', 'co₂ extraction', 'chromatograph',
  'isolated', 'isolation', 'purified', 'purification', 'fraction',
  'nano', 'liposomal', 'encapsulat', 'ferment', 'biotransform',
  'novel process', 'novel extraction', 'new process', 'extraction process',
  'process for', 'method of extracting', 'standardized extract',
  '98% purity', '95% purity', 'high purity', 'bioavailability-enhanced',
  'novel ratio with data', 'synergistic index', 'clinical trial data',
];

/** Mere-admixture signals: physical mixing of known herbs, no synergy proof. */
const ADMIXTURE_SIGNALS = [
  'mixture of', 'mix of', 'combination of', 'formulation of',
  'admixture', 'blend of', 'mix powder', 'mix powders', 'churna',
  'kashayam', 'arishta', 'taila', 'ghrita', 'lehya', 'vati',
];

/** Efficacy-upgrade claims that trigger s.3(d) scrutiny. */
const EFFICACY_SIGNALS = [
  'enhanced efficacy', 'increased efficacy', 'improved efficacy',
  'synergy', 'synergistic', 'bioavailability', 'novel use', 'new use',
  'new form', 'derivative', 'more effective',
];

/** Foreign / PCT intent signals. */
const PCT_SIGNALS = [
  'pct', 'wipo', 'international', 'uspto', 'united states', 'epo',
  'europe', 'foreign', 'abroad', 'outside india', 'target market: international',
  'target market: uspto', 'target market: epo',
];

const PRODUCT_CLAIM_SIGNALS = [
  'patent a formulation', 'patent the formulation', 'product patent',
  'patent this mixture', 'patent this combination', 'patent karana',
  'पेटेंट कराना', 'पेटंट घ्यायचे', 'patent for joint pain',
];

// ---------------------------------------------------------------------------
// Helpers: classical + TKDL matching
// ---------------------------------------------------------------------------

export interface ClassicalHit {
  name: string;
  reference: string;
  matchedIngredients: string[];
}

function formulationIngredients(f: Record<string, unknown>): string[] {
  const raw = f['ingredients'];
  if (Array.isArray(raw)) {
    return raw.map((ing) => {
      if (typeof ing === 'string') return ing.toLowerCase();
      if (ing && typeof ing === 'object') {
        const o = ing as Record<string, unknown>;
        return String(o['name'] ?? o['ingredient'] ?? '').toLowerCase();
      }
      return '';
    }).filter(Boolean);
  }
  return [];
}

function formulationName(f: Record<string, unknown>): string {
  return String(
    f['name'] ?? f['name_sanskrit'] ?? f['title'] ?? f['formulation'] ?? 'Classical formulation'
  );
}

function formulationRef(f: Record<string, unknown>): string {
  return String(
    f['reference'] ?? f['reference_text'] ?? f['ref'] ?? f['afi_ref'] ?? f['source'] ?? 'AFI / Classical text'
  );
}

/**
 * Finds classical formulations whose ingredient list overlaps the resolved
 * botanicals. Returns hits sorted by overlap desc.
 */
export function findClassicalHits(botanicals: BotanicalEntity[]): ClassicalHit[] {
  if (botanicals.length === 0) return [];
  const keys = new Set<string>();
  for (const b of botanicals) {
    if (b.sanskrit_name) keys.add(b.sanskrit_name.toLowerCase());
    if (b.english_common_name) {
      for (const part of b.english_common_name.toLowerCase().split(/[\s/,()]+/)) {
        if (part.length > 2) keys.add(part);
      }
    }
    if (b.botanical_binomial) {
      for (const part of b.botanical_binomial.toLowerCase().split(/[\s().,]+/)) {
        if (part.length > 3) keys.add(part);
      }
    }
  }

  const hits: ClassicalHit[] = [];
  for (const f of classicalFormulations as Record<string, unknown>[]) {
    const ings = formulationIngredients(f);
    const matched = ings.filter((ing) =>
      [...keys].some((k) => k.length > 2 && (ing.includes(k) || k.includes(ing)))
    );
    if (matched.length > 0) {
      hits.push({ name: formulationName(f), reference: formulationRef(f), matchedIngredients: matched });
    }
  }
  // Prefer formulations matching 2+ ingredients (e.g. Haridra+Maricha → Haridra Khanda)
  hits.sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length);
  return hits.slice(0, 3);
}

export interface TkdlHit {
  tkdl_id: string;
  title: string;
  reference: string;
}

/** Finds TKDL entries whose ingredient text mentions a resolved botanical. */
export function findTkdlHits(botanicals: BotanicalEntity[]): TkdlHit[] {
  if (botanicals.length === 0) return [];
  const needles: string[] = [];
  for (const b of botanicals) {
    if (b.sanskrit_name) needles.push(b.sanskrit_name.toLowerCase());
    if (b.english_common_name) needles.push(b.english_common_name.toLowerCase());
    if (b.botanical_binomial) needles.push(b.botanical_binomial.toLowerCase().split(' ')[0]);
  }
  const hits: TkdlHit[] = [];
  for (const e of tkdlCorpus as Record<string, unknown>[]) {
    const blob = JSON.stringify(e).toLowerCase();
    if (needles.some((n) => n.length > 2 && blob.includes(n))) {
      hits.push({
        tkdl_id: String(e['tkdl_id'] ?? 'TKDL_ENTRY'),
        title: String(e['title'] ?? e['disease_concept'] ?? e['disease'] ?? 'TKDL prior-art entry'),
        reference: String(
          e['classical_reference'] ?? e['prior_art_date'] ?? 'TKDL database'
        ),
      });
      if (hits.length >= 3) break;
    }
  }
  return hits;
}

function containsAny(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n));
}

// ---------------------------------------------------------------------------
// Individual hardcoded checks — each returns steps (empty = not triggered)
// ---------------------------------------------------------------------------

export interface CheckContext {
  query: string;
  lowered: string;
  botanicals: BotanicalEntity[];
  classicalHits: ClassicalHit[];
  tkdlHits: TkdlHit[];
  jurisdiction: Jurisdiction;
  language: SupportedLanguage;
  isPCT: boolean;
  claimsNovelProcess: boolean;
  claimsProduct: boolean;
}

export function buildCheckContext(
  query: string,
  jurisdiction: Jurisdiction,
  botanicals?: BotanicalEntity[],
  language: SupportedLanguage = 'EN'
): CheckContext {
  const lowered = query.toLowerCase();
  const base = botanicals ?? resolveBotanicalEntities(query);
  // Binomial augmentation only when caller didn't pre-resolve (pre-resolved
  // lists from the API path already went through the resolver; augmenting a
  // caller-supplied list could double-add — so augment the base resolution).
  const resolved = augmentWithBinomialMatch(query, base);
  const classicalHits = findClassicalHits(resolved);
  const tkdlHits = findTkdlHits(resolved);
  const isPCT =
    jurisdiction !== 'INDIA' || containsAny(lowered, PCT_SIGNALS);
  const claimsNovelProcess = containsAny(lowered, PROCESS_SIGNALS);
  const claimsProduct =
    containsAny(lowered, PRODUCT_CLAIM_SIGNALS) ||
    (resolved.length > 0 && !claimsNovelProcess);
  return {
    query, lowered, botanicals: resolved, classicalHits, tkdlHits,
    jurisdiction, language, isPCT, claimsNovelProcess, claimsProduct,
  };
}

/**
 * Generic TK-claim fallback: when the ontology misses (e.g. synthetic test
 * aliases like Brahmi_3) but the query plainly claims a multi-herb Ayurvedic
 * formulation for curing/treating, still bar it deterministically.
 */
function checkGenericTKClaim(ctx: CheckContext): LegalReasoningStep[] {
  if (ctx.botanicals.length > 0) return [];
  const claimsFormulation =
    /patent|पेटेंट|पेटंट/i.test(ctx.query) &&
    /(formulation|mixture|combination|blend|churna|admixture)/i.test(ctx.query) &&
    /(curing|treating|treatment|for (fever|cough|pain|disease|ailment))/i.test(ctx.query);
  if (!claimsFormulation) return [];
  if (ctx.claimsNovelProcess) return [];
  const lang = ctx.language;
  return [
    {
      id: 'hardcoded-3p-generic',
      step_number: 1,
      title: t('step_3p_generic_title', lang),
      severity: 'BARRED',
      description:
        lang === 'HI'
          ? `हार्डकोड फ़िल्टर सक्रिय: प्रश्न बिना किसी नवीन प्रक्रिया या तालमेल डेटा के आयुर्वेदिक हर्बल सूत्रता पर पेटेंट का दावा करता है। धारा 3(p) के अनुसार पारंपरिक ज्ञान की संचय उत्पाद के रूप में पेटेंट योग्य नहीं है। केवल प्रभावकारिता प्रमाण सहित नवीन प्रक्रिया विचारणीय है।`
          : lang === 'MR'
          ? `हार्डकोड फिल्टर सक्रिय: प्रश्न नवीन प्रक्रिया किंवा सहकार्य डेटाशिवाय आयुर्वेदिक हर्बल सूत्रावर पेटंटचा दावा करतो. कलम 3(p) अन्वये पारंपरिक ज्ञानाचे संचय उत्पादन म्हणून पेटंटयोग्य नाही. केवळ परिणामकारकता पुरावा असलेली नाविन्यपूर्ण प्रक्रिया विचारात घेतली जाऊ शकते.`
          : `Hardcoded filter TRIGGERED: the query claims a patent on an Ayurvedic herbal formulation/combination for therapeutic use ` +
            `without any described novel process or synergy data ("${ctx.query.slice(0, 160)}"). Under Section 3(p) of the Patents Act, 1970, ` +
            `an invention which in effect is traditional knowledge or an aggregation of known properties of traditionally known components is not an invention. ` +
            `Product patenting is barred; only a novel process with efficacy proof may be considered.`,
      citation: {
        section_id: 's.3(p)',
        citation_code: 'Patents Act 1970, s.3(p)',
        act_title: 'The Patents Act, 1970 (as amended up to Patents Rules 2024)',
        jurisdiction: 'INDIA',
        heading: 'Inventions relating to Traditional Knowledge not patentable',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: बिना प्रक्रिया नवीनता के सामान्य बहु-जड़ी-बूटी सूत्रता दावा।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: प्रक्रिया नावीन्याशिवाय सामान्य बहु-औषधी सूत्र दावा.'
          : 'Hardcoded rule: generic multi-herb formulation claim without process novelty.',
      },
    },
    {
      id: 'hardcoded-3e-generic',
      step_number: 2,
      title: t('step_3e_generic_title', lang),
      severity: 'BARRED',
      description:
        lang === 'HI'
          ? `हार्डकोड फ़िल्टर सक्रिय: दावा किया गया संयोजन केवल गुणों का संचय प्रतीत होता है। धारा 3(e) के अनुसार, पेटेंट योग्यता के लिए प्रयोगात्मक डेटा के साथ भागों के योग से अधिक तालमेल प्रभाव का प्रमाण आवश्यक है।`
          : lang === 'MR'
          ? `हार्डकोड फिल्टर सक्रिय: दावा केलेले संयोजन केवळ गुणधर्मांचे संचय दिसते. कलम 3(e) अन्वये, पेटंटयोग्यतेसाठी प्रायोगिक डेटासह भागांच्या बेरजेपेक्षा अधिक सहकार्य परिणामाचा पुरावा आवश्यक आहे.`
          : `Hardcoded filter TRIGGERED: the claimed combination reads as a mere admixture resulting only in aggregation of properties. ` +
            `Under Section 3(e), patentability requires proof of synergistic effect strictly greater than the sum of parts with experimental data.`,
      citation: {
        section_id: 's.3(e)',
        citation_code: 'Patents Act 1970, s.3(e)',
        act_title: 'The Patents Act, 1970 (as amended up to Patents Rules 2024)',
        jurisdiction: 'INDIA',
        heading: 'Mere admixture resulting only in aggregation of properties',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: बिना तालमेल डेटा के सामान्य मिश्रण दावा।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: सहकार्य डेटाशिवाय सामान्य मिश्रण दावा.'
          : 'Hardcoded rule: generic admixture claim without synergy data.',
      },
    },
  ];
}

/** CHECK 1 — Section 3(p): TK / aggregation of known properties = NOT an invention. */
function checkSection3p(ctx: CheckContext): LegalReasoningStep[] {
  if (ctx.botanicals.length === 0) return [];
  const names = ctx.botanicals.map((b) => b.sanskrit_name).join(', ');
  const hasClassicalOverlap =
    ctx.classicalHits.length > 0 &&
    ctx.classicalHits.some((h) => h.matchedIngredients.length >= 1);
  const hasTkdl = ctx.tkdlHits.length > 0;
  const isAdmixtureLike =
    containsAny(ctx.lowered, ADMIXTURE_SIGNALS) || ctx.botanicals.length >= 2;

  // Trigger when: classical overlap OR TKDL prior art OR multi-herb admixture
  // claimed as a product (without a novel-process escape).
  if (!hasClassicalOverlap && !hasTkdl && !isAdmixtureLike) return [];

  // Novel extraction/isolated-fraction process claims escape the product bar
  // (they are routed to CONDITIONALLY_VIABLE via the 3(d)/process check).
  if (ctx.claimsNovelProcess && !ctx.claimsProduct) return [];

  const lang = ctx.language;
  const classicalRef =
    ctx.classicalHits[0]?.name && ctx.classicalHits[0]?.reference
      ? ` Classical prior art: ${ctx.classicalHits[0].name} (${ctx.classicalHits[0].reference}).`
      : '';
  const tkdlRef =
    ctx.tkdlHits[0]
      ? ` TKDL prior art: ${ctx.tkdlHits[0].title} [${ctx.tkdlHits[0].tkdl_id}, ${ctx.tkdlHits[0].reference}].`
      : '';
  const herbList =
    ctx.botanicals
      .map((b) => `${b.sanskrit_name} (${b.botanical_binomial})`)
      .join('; ');

  const description =
    lang === 'HI'
      ? `हार्डकोड फ़िल्टर सक्रिय: दावा किया गया विषय (${names}) वास्तव में पारंपरिक ज्ञान / पारंपरिक रूप से ज्ञात घटकों के ज्ञात गुणों का संचय है: ${herbList}.${classicalRef}${tkdlRef} धारा 3(p) के अंतर्गत उत्पाद पेटेंट वर्जित है। केवल प्रदर्शित तालमेल/प्रभावकारिता के साथ नवीन प्रक्रिया विचारणीय है।`
      : lang === 'MR'
      ? `हार्डकोड फिल्टर सक्रिय: दावा केलेला विषय (${names}) प्रत्यक्षात पारंपरिक ज्ञान / पारंपरिकरित्या ज्ञात घटकांच्या ज्ञात गुणधर्मांचे संचय आहे: ${herbList}.${classicalRef}${tkdlRef} कलम 3(p) अन्वये उत्पादन पेटंट प्रतिबंधित आहे. केवळ सिद्ध सहकार्य/परिणामकारकतेसह नाविन्यपूर्ण प्रक्रिया विचारात घेतली जाऊ शकते.`
      : `Hardcoded filter TRIGGERED: the claimed subject matter (${names}) in effect is traditional ` +
        `knowledge / an aggregation of known properties of traditionally known components: ${herbList}.${classicalRef}${tkdlRef} ` +
        `Product patenting is barred under Section 3(p) of the Patents Act, 1970. Only a novel process with demonstrated synergy/efficacy can be considered (see s.3(e)/s.3(d) checks).`;

  return [
    {
      id: 'hardcoded-3p',
      step_number: 1,
      title: t('step_3p_title', lang),
      severity: 'BARRED',
      description,
      citation: {
        section_id: 's.3(p)',
        citation_code: 'Patents Act 1970, s.3(p)',
        act_title: 'The Patents Act, 1970 (as amended up to Patents Rules 2024)',
        jurisdiction: 'INDIA',
        heading: 'Inventions relating to Traditional Knowledge not patentable',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: ऑन्टोलॉजी + AFI/TKDL ओवरलैप के माध्यम से TK संचय का पता लगाया गया।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: ऑन्टोलॉजी + AFI/TKDL ओव्हरलॅपद्वारे TK संचय शोधला गेला.'
          : 'Hardcoded rule: TK aggregation detected via ontology + AFI/TKDL overlap.',
      },
    },
  ];
}

/** CHECK 2 — Section 3(e): mere admixture bar (companion to 3(p)). */
function checkSection3e(ctx: CheckContext): LegalReasoningStep[] {
  if (ctx.botanicals.length === 0) return [];
  const looksLikeAdmixture =
    containsAny(ctx.lowered, ADMIXTURE_SIGNALS) || ctx.botanicals.length >= 2;
  if (!looksLikeAdmixture) return [];
  if (ctx.claimsNovelProcess && containsAny(ctx.lowered, EFFICACY_SIGNALS)) return [];
  const lang = ctx.language;
  const herbNames = ctx.botanicals.map((b) => b.sanskrit_name).join(' + ');
  const description =
    lang === 'HI'
      ? `हार्डकोड फ़िल्टर सक्रिय: दावा ज्ञात आयुर्वेदिक घटकों के केवल मिश्रण के रूप में पढ़ा जाता है (${herbNames}). धारा 3(e) के अंतर्गत, ऐसा पदार्थ आविष्कार नहीं है जब तक कि प्रयोगात्मक डेटा के साथ भागों के योग से अधिक तालमेल प्रभाव सिद्ध न हो।`
      : lang === 'MR'
      ? `हार्डकोड फिल्टर सक्रिय: दावा ज्ञात आयुर्वेदिक घटकांचे केवळ मिश्रण म्हणून वाचला जातो (${herbNames}). कलम 3(e) अन्वये, असा पदार्थ शोध नाही जोपर्यंत प्रायोगिक डेटासह भागांच्या बेरजेपेक्षा अधिक सहकार्य परिणाम सिद्ध केला जात नाही.`
      : `Hardcoded filter TRIGGERED: the claim reads as a mere admixture of known Ayurvedic components ` +
        `(${herbNames}). Under Section 3(e), such a substance is not an invention ` +
        `unless synergistic effect strictly greater than the sum of parts is proven with experimental data (cf. D&C Rule 158B pilot-trial requirement).`;
  return [
    {
      id: 'hardcoded-3e',
      step_number: 2,
      title: t('step_3e_title', lang),
      severity: 'BARRED',
      description,
      citation: {
        section_id: 's.3(e)',
        citation_code: 'Patents Act 1970, s.3(e)',
        act_title: 'The Patents Act, 1970 (as amended up to Patents Rules 2024)',
        jurisdiction: 'INDIA',
        heading: 'Mere admixture resulting only in aggregation of properties',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: बिना तालमेल डेटा के मिश्रण भाषा और/या बहु-जड़ी-बूटी दावा।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: सहकार्य डेटाशिवाय मिश्रण भाषा आणि/किंवा बहु-औषधी दावा.'
          : 'Hardcoded rule: admixture language and/or multi-herb claim without synergy data.',
      },
    },
  ];
}

/** CHECK 3 — Section 3(d): new form / new use without enhanced efficacy. */
function checkSection3d(ctx: CheckContext): LegalReasoningStep[] {
  if (!containsAny(ctx.lowered, EFFICACY_SIGNALS) && !ctx.claimsNovelProcess) return [];
  const lang = ctx.language;
  // If a genuine novel process + efficacy data is claimed, this is guidance, not a bar.
  if (ctx.claimsNovelProcess) {
    return [
      {
        id: 'hardcoded-3d-process',
        step_number: 3,
        title: t('step_3d_process_title', lang),
        severity: 'CONDITIONALLY_VIABLE',
        description:
          lang === 'HI'
            ? `हार्डकोड आकलन: एक नवीन निष्कर्षण/अलगाव प्रक्रिया का दावा किया गया है। PROCESS दावा धारा 3(p)/3(e) से बच सकता है, बशर्ते तुलनात्मक डेटा के साथ महत्वपूर्ण रूप से बढ़ी हुई चिकित्सीय प्रभावकारिता या जैव-उपलब्धता प्रदर्शित की जाए (Novartis बनाम भारत संघ मानक)। जड़ी-बूटी पर नहीं, बल्कि प्रक्रिया पर दावे तैयार करें और प्रभावकारिता डोसियर संलग्न करें।`
            : lang === 'MR'
            ? `हार्डकोड मूल्यांकन: नाविन्यपूर्ण निष्कर्षण/पृथक्करण प्रक्रियेचा दावा केला गेला आहे. PROCESS दावा कलम 3(p)/3(e) मधून सुटू शकतो, जर तुलनात्मक डेटासह लक्षणीयरित्या वर्धित उपचारात्मक परिणामकारकता किंवा जैवउपलब्धता दर्शवली जाते (Novartis वि. भारत संघ मानक). औषधीवनस्पतीवर नाही तर प्रक्रियेवर दावे तयार करा आणि परिणामकारकता डोसियर जोडा.`
            : `Hardcoded assessment: a novel extraction/isolation process is claimed. A PROCESS claim may escape Sections 3(p)/3(e) ` +
              `provided significantly enhanced therapeutic efficacy or bioavailability is demonstrated with comparative data ` +
              `(Novartis v. Union of India standard). Draft claims to the process, not the herb per se, and attach the efficacy dossier.`,
        citation: {
          section_id: 's.3(d)',
          citation_code: 'Patents Act 1970, s.3(d)',
          act_title: 'The Patents Act, 1970 (as amended up to Patents Rules 2024)',
          jurisdiction: 'INDIA',
          heading: 'Mere discovery of a new form of a known substance without enhanced efficacy',
          text_snippet: '',
          explanation: lang === 'HI'
            ? 'हार्डकोड नियम: प्रक्रिया संकेत का पता चला; उत्पाद बाधा प्रक्रिया पर लागू नहीं हो सकती।'
            : lang === 'MR'
            ? 'हार्डकोड नियम: प्रक्रिया संकेत आढळला; उत्पाद बंदी प्रक्रियेवर लागू होणार नाही.'
            : 'Hardcoded rule: process-signal detected; product bar may not apply to the process itself.',
        },
      },
    ];
  }
  return [
    {
      id: 'hardcoded-3d',
      step_number: 3,
      title: t('step_3d_title', lang),
      severity: 'APPROVAL_REQUIRED',
      description:
        lang === 'HI'
          ? `हार्डकोड जाँच: बिना किसी नवीन प्रक्रिया के प्रभावकारिता या नए उपयोग का दावा पाया गया। धारा 3(d) के अनुसार, किसी भी व्युत्पन्न/नए-रूप के दावे को बढ़ी हुई ज्ञात प्रभावकारिता को मापना होगा; तुलनात्मक विघटन/जैव-उपलब्धता/नैदानिक डेटा दाखिल करें अन्यथा आपत्ति बनी रहेगी।`
          : lang === 'MR'
          ? `हार्डकोड तपासणी: नाविन्यपूर्ण प्रक्रियेशिवाय परिणामकारकता किंवा नवीन वापराचा दावा आढळला. कलम 3(d) अन्वये, कोणत्याही व्युत्पन्न/नवीन-स्वरूप दाव्याने वर्धित ज्ञात परिणामकारकतेचे प्रमाण द्यावे; तुलनात्मक विद्राव्यता/जैवउपलब्धता/नैदानिक डेटा दाखल करा अन्यथा आक्षेप कायम राहील.`
          : `Hardcoded check: an efficacy or new-use assertion was detected without a described novel process. ` +
            `Under Section 3(d), any derivative/new-form claim must quantify enhanced known efficacy; file comparative dissolution/bioavailability/clinical data or the objection will sustain.`,
      citation: {
        section_id: 's.3(d)',
        citation_code: 'Patents Act 1970, s.3(d)',
        act_title: 'The Patents Act, 1970 (as amended up to Patents Rules 2024)',
        jurisdiction: 'INDIA',
        heading: 'Mere discovery of a new form of a known substance without enhanced efficacy',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: प्रक्रिया विवरण के बिना प्रभावकारिता भाषा 3(d) साक्ष्य बोझ को ट्रिगर करती है।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: प्रक्रिया तपशीलाशिवाय परिणामकारकता भाषा 3(d) पुरावा ओझे ट्रिगर करते.'
          : 'Hardcoded rule: efficacy language without process detail triggers 3(d) evidence burden.',
      },
    },
  ];
}

/** CHECK 4 — BDA s.6(1): NBA prior approval for IPR on Indian biological resources. */
function checkBDA(ctx: CheckContext): LegalReasoningStep[] {
  if (ctx.botanicals.length === 0) return [];
  const lang = ctx.language;
  const steps: LegalReasoningStep[] = [
    {
      id: 'hardcoded-bda-6',
      step_number: 10,
      title: t('step_bda6_title', lang),
      severity: 'APPROVAL_REQUIRED',
      description:
        lang === 'HI'
          ? `हार्डकोड अनुपालन ध्वज: भारतीय जैविक संसाधन मिले — ${ctx.botanicals
              .map((b) => `${b.sanskrit_name} (${b.botanical_binomial})`)
              .join('; ')}। इस संसाधन पर शोध/जानकारी पर आधारित कोई भी IPR आवेदन (भारत में या बाहर) राष्ट्रीय जैव विविधता प्राधिकरण (NBA फॉर्म III) की पूर्व स्वीकृति के बिना दाखिल नहीं किया जा सकता है। PCT दाखिलों के लिए, विदेशी राष्ट्रीय-चरण प्रवेश से पहले NBA स्वीकृति अनिवार्य है। गैर-अनुपालन पर विरोध/रद्दीकरण और BDA दंड लागू होते हैं।`
          : lang === 'MR'
          ? `हार्डकोड अनुपालन ध्वज: भारतीय जैविक संसाधने आढळली — ${ctx.botanicals
              .map((b) => `${b.sanskrit_name} (${b.botanical_binomial})`)
              .join('; ')}. या संसाधनावरील संशोधन/माहितीवर आधारित कोणताही IPR अर्ज (भारतात किंवा भारताबाहेर) राष्ट्रीय जैवविविधता प्राधिकरणाच्या (NBA फॉर्म III) पूर्व मंजुरीशिवाय दाखल करता येणार नाही. PCT अर्जांसाठी, परकीय राष्ट्रीय-टप्प्यात प्रवेश करण्यापूर्वी NBA मान्यता अनिवार्य आहे. पालन न केल्यास विरोध/रद्दीकरण आणि BDA दंड लागू होतात.`
          : lang === 'SA'
          ? `हार्डकोड-अनुपालन-ध्वजः भारतीय-जैविक-संसाधनानि प्राप्तानि — ${ctx.botanicals
              .map((b) => `${b.sanskrit_name} (${b.botanical_binomial})`)
              .join('; ')}। अस्य संसाधनस्य अनुसन्धानेन वा सूचनया वा आधारितं किमपि IPR आवेदनं (भारते भारद्बहिर्वा) राष्ट्रियजैवविविधताप्राधिकरणस्य (NBA प्रपत्रम् III) पूर्वानुमोदनं विना न दातव्यम्। PCT आवेदनानां कृते विदेश-राष्ट्रिय-चरण-प्रवेशात् पूर्वं NBA अनुमोदनम् आवश्यकम्। उल्लंघने विरोधः/निरसनं BDA दण्डाश्च प्रवर्तन्ते।`
          : `Hardcoded compliance flag: Indian biological resource(s) detected — ${ctx.botanicals
              .map((b) => `${b.sanskrit_name} (${b.botanical_binomial})`)
              .join('; ')}. No IPR application (in or outside India) based on research/information on this resource may be filed ` +
            `without previous approval of the National Biodiversity Authority (Form III). For PCT filings, NBA approval must precede foreign national-phase entry. Non-compliance attracts opposition/revocation and BDA penalties.`,
      citation: {
        section_id: 'BDA_s.6(1)',
        citation_code: 'Biological Diversity Act 2002, s.6(1)',
        act_title: 'The Biological Diversity Act, 2002 (as amended by the Biological Diversity (Amendment) Act, 2023)',
        jurisdiction: 'INDIA',
        heading: 'Prior Approval of National Biodiversity Authority (NBA) for IPR',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: कोई भी हल किया गया भारतीय औषधीय पौधा धारा 6(1) को ट्रिगर करता है।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: कोणतीही निराकरण केलेली भारतीय औषधीय वनस्पती कलम 6(1) ट्रिगर करते.'
          : 'Hardcoded rule: any resolved Indian medicinal plant triggers s.6(1).',
      },
    },
    {
      id: 'hardcoded-bda-7',
      step_number: 11,
      title: t('step_bda7_title', lang),
      severity: 'APPROVAL_REQUIRED',
      description:
        lang === 'HI'
          ? `हार्डकोड अनुपालन ध्वज: उपरोक्त जैविक संसाधन(नों) के व्यावसायिक उपयोग के लिए भारतीय नागरिकों/संस्थाओं द्वारा संबंधित राज्य जैव विविधता बोर्ड (SBB) को पूर्व सूचना (फॉर्म VII / राज्य पोर्टल) देना अनिवार्य है, साथ ही आयुष विनिर्माण लाइसेंस (D&C नियम 158A/158B, अनुसूची T GMP) भी आवश्यक है।`
          : lang === 'MR'
          ? `हार्डकोड अनुपालन ध्वज: वरील जैविक संसाधनांच्या व्यावसायिक वापरासाठी भारतीय नागरिक/संस्थांनी संबंधित राज्य जैवविविधता मंडळास (SBB) पूर्व सूचना देणे (फॉर्म VII / राज्य पोर्टल) अनिवार्य आहे, तसेच आयुष उत्पादन परवाना (D&C नियम 158A/158B, अनुसूची T GMP) आवश्यक आहे.`
          : lang === 'SA'
          ? `हार्डकोड-अनुपालन-ध्वजः उपर्युक्तजैविकसंसाधनानां व्यावसायिकोपयोगाय भारतीयनागरिकैः/संस्थाभिः सम्बद्धाय राज्यजैवविविधतामण्डलाय (SBB) पूर्वसूचना (प्रपत्रम् VII / राज्यपोर्टल्) दातव्या, साकं आयुष-उत्पादन-अनुज्ञया (D&C नियमः १५८A/१५८B, अनुसूची T GMP) सह।`
          : `Hardcoded compliance flag: commercial utilisation of the above biological resource(s) additionally requires prior intimation ` +
            `to the concerned State Biodiversity Board (SBB) by Indian citizens/entities (Form VII / state portal), alongside AYUSH manufacturing licensing (D&C Rule 158A/158B, Schedule T GMP).`,
      citation: {
        section_id: 'BDA_s.7',
        citation_code: 'Biological Diversity Act 2002, s.7',
        act_title: 'The Biological Diversity Act, 2002 (as amended by the Biological Diversity (Amendment) Act, 2023)',
        jurisdiction: 'INDIA',
        heading: 'Prior intimation to State Biodiversity Board (SBB) for Indian citizens',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: व्यावसायिक-उपयोग पथ हमेशा s.6(1) को s.7 SBB सूचना के साथ जोड़ता है।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: व्यावसायिक-वापर मार्ग नेहमी s.6(1) ला s.7 SBB सूचनेसह जोडतो.'
          : 'Hardcoded rule: commercial-use path always pairs s.6(1) with s.7 SBB intimation.',
      },
    },
  ];
  // Foreign-entity tripwire (BDA s.3) when PCT/foreign signals present.
  if (ctx.isPCT && containsAny(ctx.lowered, ['foreign', 'nri', 'outside india', 'uspto', 'epo', 'wipo', 'pct'])) {
    steps.push({
      id: 'hardcoded-bda-3',
      step_number: 12,
      title: t('step_bda3_title', lang),
      severity: 'APPROVAL_REQUIRED',
      description:
        lang === 'HI'
          ? `हार्डकोड ट्रिपवायर: भारतीय जैविक संसाधनों के साथ विदेशी-दाखिल / गैर-भारतीय-संस्था संकेत पाए गए। गैर-नागरिक, विदेशी-नियंत्रित निकाय, या NRI को धारा 6(1) के अतिरिक्त धारा 3 (फॉर्म I) के तहत NBA पूर्व अनुमोदन की आवश्यकता है।`
          : lang === 'MR'
          ? `हार्डकोड ट्रिपवायर: भारतीय जैविक संसाधनांसह परकीय-दाखल / गैर-भारतीय-संस्था संकेत आढळले. अनागरिक, परकीय-नियंत्रित संस्था, किंवा NRI ला कलम 6(1) व्यतिरिक्त कलम 3 (फॉर्म I) अंतर्गत NBA पूर्व मान्यता आवश्यक आहे.`
          : `Hardcoded tripwire: foreign-filing / non-Indian-entity signals detected alongside Indian biological resources. ` +
            `Non-citizens, foreign-controlled bodies, or NRIs obtaining the resource or associated TK for research/commercial use need prior NBA approval under Section 3 (Form I) in addition to Section 6(1).`,
      citation: {
        section_id: 'BDA_s.3',
        citation_code: 'Biological Diversity Act 2002, s.3',
        act_title: 'The Biological Diversity Act, 2002 (as amended by the Biological Diversity (Amendment) Act, 2023)',
        jurisdiction: 'INDIA',
        heading: 'Certain persons not to undertake Biodiversity related activities without NBA permission',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: PCT/विदेशी भाषा + भारतीय संसाधन धारा 3 को ट्रिगर करता है।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: PCT/परकीय भाषा + भारतीय संसाधन कलम 3 ट्रिगर करते.'
          : 'Hardcoded rule: PCT/foreign language + Indian resource triggers s.3.',
      },
    });
  }
  return steps;
}

/** CHECK 5 — Patents Act s.10(4)(d): source & geographical-origin disclosure. */
function checkSourceDisclosure(ctx: CheckContext): LegalReasoningStep[] {
  if (ctx.botanicals.length === 0) return [];
  const lang = ctx.language;
  const binomials = ctx.botanicals.map((b) => b.botanical_binomial).join('; ');
  const description =
    lang === 'HI'
      ? `हार्डकोड अनिवार्यता: पूर्ण विशिष्टता में उपयोग की गई प्रत्येक जैविक सामग्री का स्रोत और भौगोलिक उद्गम प्रकट करना आवश्यक है (${binomials}). चूक धारा 25(1)(j) के अंतर्गत पूर्व-अनुदान विरोध और धारा 64(1)(p) के अंतर्गत निरसन का कारण बनती है। विशिष्टता में NBA फॉर्म III अनुमोदन संख्या भी शामिल करें।`
      : lang === 'MR'
      ? `हार्डकोड अनिवार्यता: संपूर्ण विशिष्टतेत वापरलेल्या प्रत्येक जैविक सामग्रीचा स्रोत आणि भौगोलिक उत्पत्ती प्रकट करणे आवश्यक आहे (${binomials}). वगळल्यास कलम 25(1)(j) अंतर्गत पूर्व-मंजुरी विरोध आणि कलम 64(1)(p) अंतर्गत रद्दीकरण होऊ शकते. विशिष्टतेत NBA फॉर्म III मान्यता क्रमांकही समाविष्ट करा.`
      : `Hardcoded mandate: the complete specification must disclose the source and geographical origin of each biological material used ` +
        `(${binomials}). Omission invites pre-grant opposition u/s 25(1)(j) and revocation u/s 64(1)(p). Pair this with the NBA Form III approval number in the specification.`;
  return [
    {
      id: 'hardcoded-10-4-d',
      step_number: 13,
      title: t('step_s10_title', lang),
      severity: 'DISCLOSURE_MANDATE',
      description,
      citation: {
        section_id: 's.10(4)(d)',
        citation_code: 'Patents Act 1970, s.10(4)(d)',
        act_title: 'The Patents Act, 1970 (as amended up to Patents Rules 2024)',
        jurisdiction: 'INDIA',
        heading: 'Mandatory disclosure of biological material source and geographical origin',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: दावों में जैविक सामग्री हमेशा धारा 10(4)(d) को ट्रिगर करती है।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: दाव्यांमध्ये जैविक सामग्री नेहमी कलम 10(4)(d) ट्रिगर करते.'
          : 'Hardcoded rule: biological material in claims always triggers s.10(4)(d).',
      },
    },
  ];
}

/** CHECK 6 — WIPO GRATK 2024 Art.3/Art.4: international disclosure alignment. */
function checkGRATK(ctx: CheckContext): LegalReasoningStep[] {
  if (!ctx.isPCT) return [];
  if (ctx.botanicals.length === 0) return [];
  const lang = ctx.language;
  const botanicalNames = ctx.botanicals.map((b) => b.sanskrit_name).join(', ');
  const tkdlId = ctx.tkdlHits[0]?.tkdl_id ?? 'TKDL prior art';
  return [
    {
      id: 'hardcoded-gratk-3',
      step_number: 20,
      title: t('step_gratk3_title', lang),
      severity: 'DISCLOSURE_MANDATE',
      description:
        lang === 'HI'
          ? `हार्डकोड संरेखन जाँच: न्यायाधिकार क्षेत्र ${ctx.jurisdiction} (PCT/अंतर्राष्ट्रीय ट्रैक) है और आविष्कार मूलतः आनुवंशिक संसाधनों / संबद्ध पारंपरिक ज्ञान (${botanicalNames}) पर आधारित है। प्रत्येक संविदाकारी पक्ष को उद्गम देश और स्वदेशी/स्थानीय समुदाय या ज्ञान स्रोत (TKDL/AFI उद्धरण) का प्रकटीकरण आवश्यक है। USPTO/EPO/JPO पर औपचारिकता आपत्तियों से बचने के लिए NBA अनुमोदन संदर्भ के साथ PCT नियम 4 / राष्ट्रीय-चरण प्रकटीकरण दाखिल करें।`
          : lang === 'MR'
          ? `हार्डकोड संरेखन तपासणी: न्यायक्षेत्र ${ctx.jurisdiction} (PCT/आंतरराष्ट्रीय मार्ग) आहे आणि शोध मूलतः अनुवांशिक संसाधने / संबंधित पारंपरिक ज्ञान (${botanicalNames}) वर आधारित आहे. प्रत्येक करार करणाऱ्या पक्षाला उत्पत्तीचा देश आणि स्थानिक समुदाय किंवा ज्ञान स्रोत (TKDL/AFI संदर्भ) प्रकट करणे आवश्यक आहे. USPTO/EPO/JPO येथे औपचारिकता आक्षेप टाळण्यासाठी NBA मान्यता संदर्भासह PCT नियम 4 / राष्ट्रीय-टप्पा प्रकटीकरण दाखल करा.`
          : `Hardcoded alignment check: jurisdiction mode is ${ctx.jurisdiction} (PCT/international track) and the invention is materially based on ` +
            `genetic resources / associated traditional knowledge (${botanicalNames}). ` +
            `Each Contracting Party requires disclosure of the country of origin and the Indigenous/local community or knowledge source (TKDL/AFI citation). ` +
            `File the PCT Rule 4 / national-phase disclosure with the NBA approval reference to avoid formalities objections at USPTO/EPO/JPO.`,
      citation: {
        section_id: 'WIPO_art.3',
        citation_code: 'WIPO GRATK Treaty 2024, Art. 3',
        act_title: 'WIPO Treaty on Intellectual Property, Genetic Resources and Associated Traditional Knowledge (2024)',
        jurisdiction: 'INTERNATIONAL',
        heading: 'Mandatory Disclosure Requirement in Patent Applications',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: PCT क्षेत्राधिकार + GR/TK विषय अनुच्छेद 3 को ट्रिगर करता है।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: PCT न्यायक्षेत्र + GR/TK विषय अनु. 3 ट्रिगर करते.'
          : 'Hardcoded rule: PCT jurisdiction + GR/TK subject matter triggers Art.3.',
      },
    },
    {
      id: 'hardcoded-gratk-4',
      step_number: 21,
      title: t('step_gratk4_title', lang),
      severity: 'DISCLOSURE_MANDATE',
      description:
        lang === 'HI'
          ? `हार्डकोड संरेखन नोट: GRATK अनुच्छेद 4 के तहत, TKDL-शैली सूचना प्रणाली विदेशी परीक्षकों के लिए सुलभ है। EPO/USPTO परीक्षक ${tkdlId} / AFI शास्त्रीय सूत्रताओं को नवीनता/आविष्कार-चरण पूर्व कला के रूप में उद्धृत कर सकते हैं — प्रक्रिया-दावा रणनीति और TKDL/AFI संदर्भों को सूचीबद्ध करते हुए IDS के साथ इसे पूर्व-निवारित करें।`
          : lang === 'MR'
          ? `हार्डकोड संरेखन नोंद: GRATK अनु. 4 अंतर्गत, TKDL-शैली माहिती प्रणाली परकीय परीक्षकांसाठी उपलब्ध आहे. EPO/USPTO परीक्षक ${tkdlId} / AFI शास्त्रीय सूत्रे नावीन्य/शोध-पाऊल पूर्वकला म्हणून उद्धृत करू शकतात — TKDL/AFI संदर्भ सूचीबद्ध करणाऱ्या IDS सह प्रक्रिया-दावा धोरणाने हे आधीच प्रतिबंधित करा.`
          : `Hardcoded alignment note: under GRATK Article 4, TKDL-style information systems are accessible to foreign examiners. ` +
            `Expect the EPO/USPTO examiner to cite ${tkdlId} / AFI classical formulations as novelty/inventive-step prior art ` +
            `— pre-empt with a process-claim strategy and an IDS listing the TKDL/AFI references affirmatively.`,
      citation: {
        section_id: 'WIPO_art.4',
        citation_code: 'WIPO GRATK Treaty 2024, Art. 4',
        act_title: 'WIPO Treaty on Intellectual Property, Genetic Resources and Associated Traditional Knowledge (2024)',
        jurisdiction: 'INTERNATIONAL',
        heading: 'Non-retroactivity and Information Systems for Prior Art',
        text_snippet: '',
        explanation: lang === 'HI'
          ? 'हार्डकोड नियम: PCT ट्रैक हमेशा अनुच्छेद 3 प्रकटीकरण को अनुच्छेद 4 पूर्व-कला चेतावनी के साथ जोड़ता है।'
          : lang === 'MR'
          ? 'हार्डकोड नियम: PCT मार्ग नेहमी अनु. 3 प्रकटीकरणाला अनु. 4 पूर्वकला इशाऱ्यासह जोडतो.'
          : 'Hardcoded rule: PCT track always pairs Art.3 disclosure with Art.4 prior-art warning.',
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

export interface StatutoryCheckResult {
  steps: LegalReasoningStep[];
  isProductBarred: boolean;
  nbaApprovalRequired: boolean;
  wipoDisclosureMandatory: boolean;
  classicalHits: ClassicalHit[];
  tkdlHits: TkdlHit[];
  botanicals: BotanicalEntity[];
}

/** Executes ALL hardcoded checks in fixed statutory order. No network, no LLM. */
export function executeStatutoryChecks(
  query: string,
  jurisdiction: Jurisdiction,
  preResolved?: BotanicalEntity[],
  language: SupportedLanguage = 'EN'
): StatutoryCheckResult {
  const ctx = buildCheckContext(query, jurisdiction, preResolved, language);
  const rawSteps = [
    ...checkGenericTKClaim(ctx),
    ...checkSection3p(ctx),
    ...checkSection3e(ctx),
    ...checkSection3d(ctx),
    ...checkBDA(ctx),
    ...checkSourceDisclosure(ctx),
    ...checkGRATK(ctx),
  ];
  // Renumber sequentially for stable UI ordering.
  const steps = rawSteps.map((s, i) => ({ ...s, step_number: i + 1 }));
  const isProductBarred = steps.some(
    (s) =>
      s.severity === 'BARRED' &&
      (s.id === 'hardcoded-3p' || s.id === 'hardcoded-3e' ||
        s.id === 'hardcoded-3p-generic' || s.id === 'hardcoded-3e-generic')
  );
  return {
    steps,
    isProductBarred,
    nbaApprovalRequired: steps.some((s) => s.id.startsWith('hardcoded-bda')),
    wipoDisclosureMandatory: steps.some((s) => s.id.startsWith('hardcoded-gratk')),
    classicalHits: ctx.classicalHits,
    tkdlHits: ctx.tkdlHits,
    botanicals: ctx.botanicals,
  };
}

function localizedVerdictTitle(
  barred: boolean,
  processViable: boolean,
  language: SupportedLanguage
): string {
  if (barred) {
    if (language === 'HI') return 'उत्पाद पेटेंट वर्जित — धारा 3(p)/3(e) लागू (प्रक्रिया मार्ग संभव)';
    if (language === 'MR') return 'उत्पादन पेटंट वर्जित — कलम 3(p)/3(e) लागू (प्रक्रिया मार्ग शक्य)';
    return 'Product Patent BARRED under s.3(p)/s.3(e) — Process Route Only';
  }
  if (processViable) {
    if (language === 'HI') return 'सशर्त व्यवहार्य — नवीन प्रक्रिया दावा संभव (NBA अनुमोदन सहित)';
    if (language === 'MR') return 'सशर्त व्यवहार्य — नाविन्यपूर्ण प्रक्रिया दावा शक्य (NBA मान्यतेसह)';
    return 'Conditionally Viable — Novel Process Claim Possible (with NBA Approval)';
  }
  if (language === 'HI') return 'निर्धारक वैधानिक जांच पूर्ण — कोई TK अवरोध नहीं मिला';
  if (language === 'MR') return 'निश्चित वैधानिक तपासणी पूर्ण — कोणताही TK अडथळा नाही';
  return 'Deterministic Statutory Screen Complete — No TK Bar Detected';
}

/**
 * Builds a complete deterministic LegalVerdict from hardcoded checks alone.
 * Used as (a) offline fallback when the AI backend is down and (b) the
 * non-bypassable floor merged under AI output.
 */
export function buildDeterministicVerdict(
  query: string,
  jurisdiction: Jurisdiction = 'INDIA',
  language: SupportedLanguage = 'EN',
  preResolved?: BotanicalEntity[]
): LegalVerdict {
  const result = executeStatutoryChecks(query, jurisdiction, preResolved, language);
  const processViable = result.steps.some((s) => s.id === 'hardcoded-3d-process');
  const barred = result.isProductBarred;

  // Intelligent verdict layer: classification + band, gap map, dynamic routes.
  const classification = classifyFormulation({
    query,
    botanicals: result.botanicals,
    classicalHits: result.classicalHits,
    tkdlHits: result.tkdlHits,
  });
  const evidence_gaps = analyzeEvidenceGaps({
    query,
    botanicals: result.botanicals,
    classicalHits: result.classicalHits,
    tkdlHits: result.tkdlHits,
    jurisdiction,
    barred,
  });
  const viableRoutes: ViableRoute[] = recommendRoutes({
    barred,
    processViable,
    classification,
    gaps: evidence_gaps,
    jurisdiction,
    botanicals: result.botanicals,
    language,
  });

  const biopiracyPrecedent =
    result.botanicals.find((b) => b.biopiracy_precedent)?.biopiracy_precedent ?? null;

  const verdict: LegalVerdict = {
    query,
    language,
    resolved_botanicals: result.botanicals,
    verdict_title: localizedVerdictTitle(barred, processViable, language),
    is_patentable: !barred,
    reasoning_chain: result.steps,
    nba_approval_required: result.nbaApprovalRequired,
    wipo_disclosure_mandatory: result.wipoDisclosureMandatory,
    viable_routes: viableRoutes,
    precedent_case: biopiracyPrecedent,
    classification,
    evidence_gaps,
    confidence_score: result.steps.length > 0 ? 0.95 : 0.6,
    audit_record: undefined,
  };
  // Ground citations (SHA-256 + canonical text) so the verdict is court-traceable.
  return validateCitations(verdict);
}

/**
 * Merges deterministic (hardcoded) steps UNDER an AI-generated verdict.
 * Deterministic steps always win: missing ones are prepended, and the
 * patentability/NBA/WIPO flags are tightened (never loosened) by the brain.
 */
export function mergeDeterministicUnderAI(
  aiVerdict: LegalVerdict,
  deterministic: LegalVerdict
): LegalVerdict {
  const aiIds = new Set((aiVerdict.reasoning_chain ?? []).map((s) => s.citation?.section_id));
  const missing = (deterministic.reasoning_chain ?? []).filter(
    (s) => !aiIds.has(s.citation?.section_id)
  );
  const mergedChain = [...missing, ...(aiVerdict.reasoning_chain ?? [])].map((s, i) => ({
    ...s,
    step_number: i + 1,
  }));
  // Enrich AI routes with deterministic priority/rationale/needs where types overlap.
  const detRouteByType = new Map(
    (deterministic.viable_routes ?? []).map((r) => [r.type, r])
  );
  const enrichedAiRoutes = (aiVerdict.viable_routes ?? []).map((r) => {
    const det = detRouteByType.get(r.type);
    if (!det) return r;
    return {
      ...r,
      priority: r.priority ?? det.priority,
      rationale: r.rationale ?? det.rationale,
      needs_gaps: r.needs_gaps ?? det.needs_gaps,
    };
  });
  const aiTypes = new Set(enrichedAiRoutes.map((r) => r.type));
  const mergedRoutes = [
    ...enrichedAiRoutes,
    ...(deterministic.viable_routes ?? []).filter((r) => !aiTypes.has(r.type)),
  ];
  return validateCitations({
    ...aiVerdict,
    retrieval_pack: aiVerdict.retrieval_pack ?? deterministic.retrieval_pack,
    // Deterministic intelligence wins: classification, band, and gap map.
    classification: deterministic.classification ?? aiVerdict.classification,
    evidence_gaps: deterministic.evidence_gaps ?? aiVerdict.evidence_gaps,
    reasoning_chain: mergedChain,
    // Deterministic brain can only tighten, never loosen.
    is_patentable: aiVerdict.is_patentable && deterministic.is_patentable,
    nba_approval_required: aiVerdict.nba_approval_required || deterministic.nba_approval_required,
    wipo_disclosure_mandatory:
      aiVerdict.wipo_disclosure_mandatory || deterministic.wipo_disclosure_mandatory,
    viable_routes: mergedRoutes,
    precedent_case: aiVerdict.precedent_case ?? deterministic.precedent_case,
    resolved_botanicals:
      aiVerdict.resolved_botanicals?.length > 0
        ? aiVerdict.resolved_botanicals
        : deterministic.resolved_botanicals,
    confidence_score: Math.min(aiVerdict.confidence_score || 0.8, 0.95),
  });
}
