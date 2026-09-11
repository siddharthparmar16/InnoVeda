/**
 * Follow-up Contextual Chat — grounded responder.
 *
 * Answers clarifying questions using ONLY the current verdict's context
 * (classification, botanicals, reasoning chain, gaps, routes, jurisdiction).
 * Template-driven and deterministic: it cites section codes already present
 * in the verdict and refuses to invent facts (fees, timelines, outcomes).
 */

import type { Jurisdiction, SupportedLanguage } from '@/types/domain';

export interface FollowUpBotanical {
  sanskrit_name: string;
  botanical_binomial: string;
  english_common_name: string;
}

export interface FollowUpContext {
  query: string;
  jurisdiction: Jurisdiction;
  language: SupportedLanguage;
  verdict_title: string;
  is_patentable: boolean;
  nba_required: boolean;
  wipo_required: boolean;
  classification_label?: string;
  classification_category?: string;
  band_label?: string;
  botanicals: FollowUpBotanical[];
  reasoning: { title: string; severity: string; citation_code: string; section_id: string }[];
  gaps: { id: string; question: string; how_to_fix: string; severity: string }[];
  routes: { type: string; title: string; priority?: string }[];
}

export interface FollowUpAnswer {
  answer: string;
  citations: string[]; // section_ids grounding the answer
  suggestions: string[];
}

const BARRED_WORDS = ['s.3(p)', 'Patents Act 1970, s.3(p)', 's.3(e)', 'Patents Act 1970, s.3(e)'];

function herbList(ctx: FollowUpContext): string {
  if (ctx.botanicals.length === 0) return 'the named herbs';
  return ctx.botanicals
    .map((b) => `${b.sanskrit_name} (${b.botanical_binomial})`)
    .join(', ');
}

type Lang = SupportedLanguage;

function t(lang: Lang, en: string, hi: string, mr: string): string {
  if (lang === 'HI') return hi;
  if (lang === 'MR') return mr;
  return en;
}

// ---------------------------------------------------------------------------
// Intent handlers (each returns answer + grounding citations)
// ---------------------------------------------------------------------------

function handleWhy(ctx: FollowUpContext, lang: Lang): FollowUpAnswer {
  const herbs = herbList(ctx);
  const answer = t(
    lang,
    ctx.is_patentable
      ? `The product claim is not outright barred, but it is constrained: ${herbs} are traditional-knowledge components, so any product-style claim still faces ${BARRED_WORDS.slice(0, 2).join(' and ')} unless you claim a genuinely novel process with efficacy data. Check the flagged reasoning steps and the Evidence Gap Map for what is missing.`
      : `The product patent is barred because ${herbs} are, in effect, traditional knowledge / an aggregation of known properties of traditionally known components — ${BARRED_WORDS.join(', ')}. A classical or multi-herb mixture without proven synergy cannot be a product invention. The escape lane is a novel PROCESS claim (see the PRIMARY pivot route), not the mixture itself.`,
    ctx.is_patentable
      ? `उत्पाद दावा पूर्णतः वर्जित नहीं है, पर सीमित है: ${herbs} पारंपरिक ज्ञान के घटक हैं, इसलिए नवीन प्रक्रिया + प्रभावकारिता डेटा के बिना उत्पाद-शैली का दावा ${BARRED_WORDS.slice(0, 2).join(' तथा ')} का सामना करेगा।`
      : `उत्पाद पेटेंट इसलिए वर्जित है क्योंकि ${herbs} प्रभावतः पारंपरिक ज्ञान हैं — ${BARRED_WORDS.join(', ')}। सिद्ध सहक्रिया के बिना शास्त्रीय/मिश्रित योग उत्पाद आविष्कार नहीं हो सकता। बचाव मार्ग नवीन प्रक्रिया दावा है।`,
    ctx.is_patentable
      ? `उत्पादन दावा पूर्णपणे वर्जित नाही, पण मर्यादित आहे: ${herbs} हे पारंपरिक ज्ञानाचे घटक आहेत, म्हणून नाविन्यपूर्ण प्रक्रिया + परिणामकारकता डेटा असल्याशिवाय उत्पादन-स्वरूपाचा दावा ${BARRED_WORDS.slice(0, 2).join(' आणि ')} समोर येईल.`
      : `उत्पादन पेटंट वर्जित आहे कारण ${herbs} हे प्रभावतः पारंपरिक ज्ञान आहे — ${BARRED_WORDS.join(', ')}। सिद्ध सहक्रिया असल्याशिवाय शास्त्रीय/मिश्र योग उत्पादन शोध ठरू शकत नाही. बचाव मार्ग नाविन्यपूर्ण प्रक्रिया दावा आहे.`
  );
  return {
    answer,
    citations: ['s.3(p)', 's.3(e)'],
    suggestions: [
      'How do I get NBA approval?',
      'What evidence gaps should I close first?',
      'Can I file a process patent instead?',
    ],
  };
}

function handleNba(ctx: FollowUpContext, lang: Lang): FollowUpAnswer {
  const answer = t(
    lang,
    ctx.nba_required
      ? `Yes — NBA approval is mandatory here. Before filing ANY IPR (India or abroad) on ${herbList(ctx)}, obtain prior National Biodiversity Authority approval on Form III (BDA s.6(1)), intimate the State Biodiversity Board for commercial use (s.7), and cite the approval number with source/origin disclosure in the specification (Patents Act s.10(4)(d)). Foreign-linked applicants additionally need s.3 clearance (Form I).`
      : `For this query no Indian biological resource was classified, so the engine did not flag NBA approval. If your formulation does use Indian herbs, assume Form III prior approval (BDA s.6(1)) applies and re-run the analysis with the ingredients listed.`,
    ctx.nba_required
      ? `हाँ — यहाँ NBA अनुमोदन अनिवार्य है। ${herbList(ctx)} पर कोई भी IPR (भारत/विदेश) दाखिल करने से पहले राष्ट्रीय जैव विविधता प्राधिकरण से Form III पर पूर्व अनुमोदन लें (BDA धारा 6(1)), वाणिज्यिक उपयोग हेतु राज्य बोर्ड को सूचना दें (धारा 7), और विनिर्देश में s.10(4)(d) स्रोत प्रकटीकरण के साथ अनुमोदन संख्या उद्धृत करें।`
      : `इस प्रश्न में कोई भारतीय जैविक संसाधन वर्गीकृत नहीं हुआ, इसलिए NBA अनुमोदन चिह्नित नहीं है। यदि सूत्रीकरण में भारतीय जड़ी-बूटियाँ हैं, तो Form III पूर्व अनुमोदन लागू मानें और सामग्री सूचीबद्ध करके पुनः विश्लेषण करें।`,
    ctx.nba_required
      ? `होय — येथे NBA मान्यता बंधनकारक आहे. ${herbList(ctx)} वरील कोणतेही IPR (भारत/परदेश) दाखल करण्यापूर्वी राष्ट्रीय जैवविविधता प्राधिकरणाची Form III वर पूर्वमान्यता घ्या (BDA कलम 6(1)), व्यावसायिक वापरासाठी राज्य मंडळाला सूचना द्या (कलम 7), आणि विनिर्देशात s.10(4)(d) स्रोत प्रकटीकरणासह मान्यता क्रमांक नमूद करा.`
      : `या प्रश्नात कोणतेही भारतीय जैविक संसाधन वर्गीकृत झाले नाही, म्हणून NBA मान्यता दर्शवली नाही. तुमच्या सूत्रीकरणात भारतीय वनस्पती असल्यास Form III पूर्वमान्यता लागू समजा आणि घटक नमूद करून पुन्हा विश्लेषण करा.`
  );
  return {
    answer,
    citations: ['BDA_s.6(1)', 'BDA_s.7', 's.10(4)(d)'],
    suggestions: [
      'What about international (PCT) disclosure?',
      'What evidence gaps should I close first?',
      'Can I protect this with a GI tag instead?',
    ],
  };
}

function handleGratk(ctx: FollowUpContext): FollowUpAnswer {
  const pct = ctx.jurisdiction !== 'INDIA' || ctx.wipo_required;
  const answer = t(
    ctx.language,
    pct
      ? `On this ${ctx.jurisdiction} track, WIPO GRATK Article 3 requires disclosing the country of origin of the genetic resource and the community/source of the associated traditional knowledge (cite your TKDL/AFI references). File the PCT Rule 4 / national-phase disclosure together with your NBA Form III reference — and expect foreign examiners to cite TKDL prior art against novelty (GRATK Art.4), so lead with process claims and an IDS listing the TK.`
      : `You are on the India track, so GRATK is advisory for now — but note BDA s.6(1) already bars filing abroad without prior NBA approval. The moment you enter the PCT/national phase in any member state, GRATK Article 3 disclosure (origin + TK source) becomes mandatory. Switch the jurisdiction toggle to International to re-run this analysis for the PCT track.`,
    pct
      ? `इस ${ctx.jurisdiction} ट्रैक पर WIPO GRATK अनुच्छेद 3 में आनुवंशिक संसाधन के उद्गम देश और पारंपरिक ज्ञान के स्रोत का प्रकटीकरण अनिवार्य है। PCT नियम 4/राष्ट्रीय-चरण प्रकटीकरण NBA Form III संदर्भ सहित दाखिल करें।`
      : `आप India ट्रैक पर हैं, इसलिए GRATK अभी परामर्शी है — पर ध्यान रहे कि BDA धारा 6(1) पूर्व NBA अनुमोदन के बिना विदेश में दाखिल करने पर रोक लगाती है। PCT ट्रैक हेतु जुरिस्डिक्शन टॉगल से International चुनकर पुनः विश्लेषण करें।`,
    pct
      ? `या ${ctx.jurisdiction} ट्रॅकवर WIPO GRATK कलम 3 नुसार आनुवंशिक संसाधनाच्या उगम देशाचे आणि पारंपरिक ज्ञानाच्या स्रोताचे प्रकटीकरण बंधनकारक आहे. PCT नियम 4/राष्ट्रीय-टप्पा प्रकटीकरण NBA Form III संदर्भासह दाखल करा.`
      : `तुम्ही India ट्रॅकवर आहात, त्यामुळे GRATK सध्या सल्लागार आहे — पण BDA कलम 6(1) पूर्व NBA मान्यतेशिवाय परदेशात दाखल करण्यास मनाई करते. PCT ट्रॅकसाठी जुरिस्डिक्शन टॉगलमधून International निवडून पुन्हा विश्लेषण करा.`
  );
  return {
    answer,
    citations: ['WIPO_art.3', 'WIPO_art.4', 'BDA_s.6(1)'],
    suggestions: [
      'How do I get NBA approval?',
      'Can I file a process patent instead?',
      'What evidence gaps should I close first?',
    ],
  };
}

function handleProcess(ctx: FollowUpContext): FollowUpAnswer {
  return {
    answer: `A process pivot works only with two things: (1) genuinely novel method parameters — solvents, temperatures, pressures, yields, purity (e.g. supercritical CO₂, chromatography, nano-delivery); and (2) comparative efficacy data proving enhancement over the known substance (the Novartis v. Union of India s.3(d) standard) or synergy beyond the sum of parts (s.3(e)). Draft claims to the method, never the herb mixture, attach the data dossier, and pair filing with NBA Form III + s.10(4)(d) disclosure.${ctx.gaps.length > 0 ? ` Your current blocking gaps: ${ctx.gaps.filter((g) => g.severity === 'BLOCKING').map((g) => g.question).join(' | ') || 'see the Gap Map'}.` : ''}`,
    citations: ['s.3(d)', 's.3(e)', 's.10(4)(d)'],
    suggestions: [
      'What evidence gaps should I close first?',
      'How do I get NBA approval?',
      'Can I protect this with a GI tag instead?',
    ],
  };
}

function handleGi(ctx: FollowUpContext): FollowUpAnswer {
  return {
    answer: `A GI tag under the Geographical Indications of Goods Act, 1999 protects a product's regional reputation collectively — it fits where patents cannot: classical, public-domain TK tied to a place and community of makers (the engine ${ctx.classification_category === 'CLASSICAL' ? 'classified this as Classical, so GI is a natural secondary route' : 'recommends it as a secondary route'}). You need: a defined region link, a producer association to apply, and a quality/production specification. It does not monopolise the recipe — it blocks misuse of the regional name.`,
    citations: [],
    suggestions: [
      'What about trademark + AYUSH licensing?',
      'What evidence gaps should I close first?',
      'Why is the product patent barred?',
    ],
  };
}

function handleBrand(ctx: FollowUpContext): FollowUpAnswer {
  return {
    answer: `The commercial route is brand + licence: file a trademark for the product brand, then obtain a State AYUSH manufacturing licence for patent & proprietary medicine (Drugs & Cosmetics Rules, Rule 158B — pilot safety/efficacy dossier beyond classical formulations, plus Schedule T GMP), and complete State Biodiversity Board intimation (BDA s.7) for commercial utilisation. This works even when the product itself is unpatentable.`,
    citations: ['DCA_rule.158B', 'BDA_s.7'],
    suggestions: [
      'How do I get NBA approval?',
      'Can I protect this with a GI tag instead?',
      'What evidence gaps should I close first?',
    ],
  };
}

function handleGaps(ctx: FollowUpContext): FollowUpAnswer {
  if (ctx.gaps.length === 0) {
    return {
      answer: `No blocking gaps were detected for this analysis — the evidence was sufficient for this preliminary screen. If you add process parameters or target markets, re-run to sharpen the band.`,
      citations: [],
      suggestions: ['Why is the product patent barred?', 'Can I file a process patent instead?'],
    };
  }
  const blocking = ctx.gaps.filter((g) => g.severity === 'BLOCKING');
  const lines = ctx.gaps.map((g, i) => `${i + 1}. [${g.severity}] ${g.question} Fix: ${g.how_to_fix}`).join('\n');
  return {
    answer: `Open unknowns (${ctx.gaps.length}, ${blocking.length} blocking):\n${lines}\n\nRoutes marked CONDITIONAL unlock as these close — add them via the Smart Input Form and re-run.`,
    citations: ['s.3(d)', 's.3(e)'],
    suggestions: [
      'Can I file a process patent instead?',
      'How do I get NBA approval?',
      'Why is the product patent barred?',
    ],
  };
}

function handleCost(): FollowUpAnswer {
  return {
    answer: `I cannot quote fees or timelines — those depend on the patent office, agent, and filing track, and any number I gave would be a hallucination. For authoritative figures, check ipindia.gov.in (fee schedules) and consult a registered patent agent via the Escalate to Facilitator option. What I can tell you from this verdict is which approvals (NBA Form III, AYUSH licence) will carry official fees.`,
    citations: ['BDA_s.6(1)'],
    suggestions: ['How do I get NBA approval?', 'What about trademark + AYUSH licensing?'],
  };
}

function handlePriorArt(ctx: FollowUpContext): FollowUpAnswer {
  const herbs = herbList(ctx);
  return {
    answer: `The prior art anticipating ${herbs} is derived from the Traditional Knowledge Digital Library (TKDL) and classical Ayurvedic treatises (including the Ayurvedic Formulary of India, Charaka Samhita, and Sushruta Samhita). Under Indian Patent Office guidelines, classical therapeutic indications are deemed public domain knowledge. Any applicant seeking to overcome this must produce documented non-obvious technical parameters or novel secondary metabolites that do not exist in the referenced classical formulations.`,
    citations: ['TKDL_Corpus', 'AFI_Vol_1', 's.3(p)'],
    suggestions: [
      'Can I file a process patent instead?',
      'What evidence gaps should I close first?',
      'How do I get NBA approval?'
    ]
  };
}

function handleSynergy(ctx: FollowUpContext): FollowUpAnswer {
  return {
    answer: `Under Section 3(e) of the Indian Patents Act, 1970, a substance obtained by a mere admixture resulting only in the aggregation of the properties of the components is unpatentable. To satisfy the statutory synergy standard, you must establish unexpected synergistic interaction (e.g. via Combination Index < 0.8, isobologram analysis, or quantified enhancement of bioavailability) demonstrating that the combined formulation produces an effect strictly superior to the arithmetic sum of its isolated active ingredients.`,
    citations: ['s.3(e)', 's.3(d)'],
    suggestions: [
      'What evidence gaps should I close first?',
      'Why is the product patent barred?',
      'Can I file a process patent instead?'
    ]
  };
}

function handlePrecedents(): FollowUpAnswer {
  return {
    answer: `Key judicial precedents governing this statutory domain:\n1. **Novartis AG v. Union of India (2013) 6 SCC 1**: Established that under Section 3(d), therapeutic efficacy must be demonstrably enhanced through comparative pharmacological data, not merely physical bioavailability changes.\n2. **Bishwanath Prasad Radhey Shyam v. Hindustan Metal Industries (1979) 2 SCC 511**: Held that an obvious combination of well-known integers without new functional synergy does not constitute an inventive step.\n3. **CSIR Revocation of Turmeric (US Pat 5,401,504)**: Foundational precedent establishing classical Sanskrit texts as global prior art invalidating non-novel traditional knowledge claims.`,
    citations: ['Novartis_2013', 's.3(d)', 's.3(e)', 's.3(p)'],
    suggestions: [
      'Why is the product patent barred?',
      'How do I get NBA approval?',
      'Can I file a process patent instead?'
    ]
  };
}

function handleOpposition(): FollowUpAnswer {
  return {
    answer: `If a patent application covering traditional knowledge is published in the Patent Office Journal, any interested party or citizen group can file a **Pre-Grant Opposition under Section 25(1)** of the Patents Act on grounds of Section 3(p) (traditional knowledge bar), Section 3(d)/(e) (lack of efficacy/admixture), or Section 10(4)(ii)(D) (failure to disclose biological source). Once granted, Post-Grant Opposition under Section 25(2) can be lodged within 12 months, or a Revocation petition under Section 64 filed before the High Court.`,
    citations: ['s.25(1)', 's.25(2)', 's.64', 's.3(p)'],
    suggestions: [
      'Why is the product patent barred?',
      'What evidence gaps should I close first?',
      'How do I get NBA approval?'
    ]
  };
}

function handleDefault(question: string, ctx: FollowUpContext): FollowUpAnswer {
  const herbs = herbList(ctx);
  const title = ctx.verdict_title;
  const isPat = ctx.is_patentable;

  const answer = `Regarding "${question}" in the context of ${herbs}:

The statutory assessment classified this query under **${ctx.classification_label || 'Ayurvedic Traditional Knowledge'}** (${ctx.band_label || 'High Scrutiny'}).

**Statutory Verdict**: ${title} (${isPat ? 'Conditionally Viable' : 'Subject to Statutory Bar'}).
- **Primary Statutory Ground**: ${isPat ? 'Section 3(d)/3(e) process novelty with proven comparative efficacy' : 'Section 3(p) statutory exclusion for traditional knowledge & Section 3(e) admixture prohibition'}.
- **Biological Resource Obligation**: ${ctx.nba_required ? 'Mandatory NBA Form III prior clearance under Biological Diversity Act 2002/2023 Sec 6(1)' : 'Standard biological source declaration under Section 10(4)(ii)(D)'}.
- **Recommended Action**: ${ctx.routes[0]?.title || 'Adopt a novel extraction/purification process claim with verified comparative pharmacological data'}.

You can ask further questions regarding Section 3(p) exclusions, NBA Form III timelines, process patent pivots, or evidence gaps.`;

  return {
    answer,
    citations: ctx.reasoning.slice(0, 3).map((r) => r.section_id).filter(Boolean).length > 0
      ? ctx.reasoning.slice(0, 3).map((r) => r.section_id)
      : ['s.3(p)', 's.3(e)', 's.10(4)(d)'],
    suggestions: [
      'Why is the product patent barred?',
      'How do I get NBA approval?',
      'Can I file a process patent instead?',
      'What evidence gaps should I close first?'
    ],
  };
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export function answerFollowUp(question: string, ctx: FollowUpContext): FollowUpAnswer {
  const q = question.toLowerCase();

  if (/why|barred|bar\b|3\s*\(?\s*p|reject|क्यों|का.*(नहीं|नही)|काय.*(नाही|नाही)|refus/.test(q)) return handleWhy(ctx, ctx.language);
  if (/nba|approv|form iii|form 3|biodiversity|bda|अनुमोदन|मान्यता|clearance|permission/.test(q)) return handleNba(ctx, ctx.language);
  if (/gratk|wipo|pct|international|abroad|foreign|disclosure|disclose|आंतरराष्ट्रीय|अंतर्राष्ट्रीय/.test(q)) return handleGratk(ctx);
  if (/process|method|3\s*\(?\s*d|efficacy|novel|extract|supercritical|क्रिया|प्रक्रिया/.test(q)) return handleProcess(ctx);
  if (/synerg|admixture|3\s*\(?\s*e|isobologram|combination index|sum of parts/.test(q)) return handleSynergy(ctx);
  if (/prior art|tkdl|afi|charaka|sushruta|samhita|classical|treatise/.test(q)) return handlePriorArt(ctx);
  if (/precedent|case law|novartis|bishwanath|court|judgment|supreme court/.test(q)) return handlePrecedents();
  if (/opposition|oppose|revoke|revocation|challenge|section 25|section 64/.test(q)) return handleOpposition();
  if (/\bgi\b|geographical|indication|tag\b/.test(q)) return handleGi(ctx);
  if (/trademark|brand|ayush|licen|158b|schedule t|gmp|commercial|sell|बिक्री|व्यापार/.test(q)) return handleBrand(ctx);
  if (/gap|missing|unknown|what.*(need|next|fix|close|lack)|evidence|still/.test(q)) return handleGaps(ctx);
  if (/fee|cost|price|charge|how long|timeline|time.*take|duration|फीस|कीमत/.test(q)) return handleCost();
  return handleDefault(question, ctx);
}

/** Context-aware starter suggestions for the composer. */
export function starterSuggestions(ctx: FollowUpContext): string[] {
  const out: string[] = [];
  if (!ctx.is_patentable) out.push('Why is the product patent barred?');
  else out.push('What limits apply to my process claim?');
  if (ctx.nba_required) out.push('How do I get NBA approval?');
  if (ctx.jurisdiction !== 'INDIA' || ctx.wipo_required) out.push('What does GRATK disclosure require?');
  if (ctx.gaps.length > 0) out.push('What evidence gaps should I close first?');
  out.push('Can I file a process patent instead?');
  out.push('What prior art in TKDL anticipates this?');
  return out.slice(0, 5);
}

