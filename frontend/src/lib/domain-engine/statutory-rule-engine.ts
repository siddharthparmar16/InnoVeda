import { 
  LegalVerdict, 
  JurisdictionDiff,
  BotanicalEntity,
  Jurisdiction,
  SupportedLanguage,
  AuditRecord
} from '../../types/domain';
import { resolveBotanicalEntities } from './botanical-resolver';
import { validateCitations } from './citation-validator';
import {
  buildDeterministicVerdict,
  mergeDeterministicUnderAI,
} from './statutory-checks';
import { retrieveTrackB } from '@/lib/retrieval/hybrid-retriever';
import { classifyAbstention } from './verdict-intelligence';
import classicalFormulations from '../../data/corpus/classical_formulations_index.json';

/**
 * Attaches the Track-B hybrid retrieval pack (statutes + case law +
 * guidelines with span evidence) to a verdict, and backfills any missing
 * per-citation retrieval scores from the pack. Local + synchronous (<50ms).
 */
function withRetrievalPack(
  verdict: LegalVerdict,
  retrievalQuery: string,
  jurisdiction: Jurisdiction
): LegalVerdict {
  const boostSectionIds = (verdict.reasoning_chain ?? [])
    .map((s) => s.citation?.section_id)
    .filter(Boolean) as string[];
  const pack =
    verdict.retrieval_pack ??
    retrieveTrackB(retrievalQuery, {
      botanicals: verdict.resolved_botanicals,
      jurisdiction,
      boostSectionIds,
    });
  const scoreBySection = new Map(
    pack.statutes.map((h) => [h.doc_id.toLowerCase(), h.score])
  );
  const reasoning_chain = (verdict.reasoning_chain ?? []).map((s) => {
    const sid = s.citation?.section_id?.toLowerCase() ?? '';
    if (s.citation && s.citation.retrieval_score == null && scoreBySection.has(sid)) {
      return {
        ...s,
        citation: { ...s.citation, retrieval_score: scoreBySection.get(sid) },
      };
    }
    return s;
  });
  return { ...verdict, retrieval_pack: pack, reasoning_chain };
}

/**
 * DPDP Act 2023 Compliance: Query Sanitizer
 * Strips identifiable personal data (emails, phone numbers, Aadhaar/PAN formats, patient IDs)
 * before query embedding and external API transmission.
 */
export function sanitizeQueryForDPDP(input: string): { sanitizedQuery: string; piiDetected: boolean } {
  let piiDetected = false;
  let sanitized = input;

  // Email regex
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(sanitized)) {
    sanitized = sanitized.replace(emailRegex, '[REDACTED_EMAIL]');
    piiDetected = true;
  }

  // Indian phone number regex (+91 or 10 digits)
  const phoneRegex = /(\+91[\-\s]?)?[6-9]\d{9}/g;
  if (phoneRegex.test(sanitized)) {
    sanitized = sanitized.replace(phoneRegex, '[REDACTED_PHONE]');
    piiDetected = true;
  }

  // Generic identification numbers (e.g. Patient ID, Aadhaar-like 12 digits)
  const idRegex = /\b\d{4}\s\d{4}\s\d{4}\b|\bPatient\s*(?:ID|#)?\s*[:=]?\s*\w+/gi;
  if (idRegex.test(sanitized)) {
    sanitized = sanitized.replace(idRegex, '[REDACTED_ID]');
    piiDetected = true;
  }

  return { sanitizedQuery: sanitized, piiDetected };
}

/**
 * Generates an immutable, non-PII audit record conforming to recognized AI application standards
 */
function createAuditRecord(query: string, jurisdiction: Jurisdiction, language: SupportedLanguage): AuditRecord {
  // Simple deterministic hash for demo audit trail
  let hashVal = 0;
  for (let i = 0; i < query.length; i++) {
    hashVal = (hashVal << 5) - hashVal + query.charCodeAt(i);
    hashVal |= 0;
  }
  const queryHash = `query_fingerprint_${Math.abs(hashVal).toString(16).padStart(16, '0')}`;
  const sessionHash = `sess_${Date.now().toString(16)}`;

  return {
    audit_id: `AUDIT-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    query_hash: queryHash,
    session_hash: sessionHash,
    dpdp_compliance_status: 'PII_SCRUBBED',
    jurisdiction,
    language
  };
}

// Helper: fetch with a hard timeout so slow backends fail fast.
async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(id);
  }
}

/**
 * Resilient JSON repair and parsing utility.
 * Heals truncated LLM responses (e.g. unclosed strings, missing braces/brackets)
 * before parsing so that valuable reasoning chains are preserved rather than dropped.
 */
function repairAndParseJson(raw: string): any {
  let text = (raw || '').trim();
  // Strip markdown code fences
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '').trim();

  // 1. Direct parse attempt
  try {
    return JSON.parse(text);
  } catch {
    // Continue to repair
  }

  // 2. Scan string literal state and bracket stack
  let inString = false;
  let escape = false;
  const stack: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}') {
        if (stack.length > 0 && stack[stack.length - 1] === '{') {
          stack.pop();
        }
      } else if (char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === '[') {
          stack.pop();
        }
      }
    }
  }

  let repaired = text;
  if (inString) {
    repaired += '"';
  }

  repaired = repaired.replace(/,\s*$/, '');
  repaired = repaired.replace(/:\s*$/, ': null');

  while (stack.length > 0) {
    const opening = stack.pop();
    repaired = repaired.replace(/,\s*$/, '');
    if (opening === '{') {
      repaired += '}';
    } else if (opening === '[') {
      repaired += ']';
    }
  }

  try {
    return JSON.parse(repaired);
  } catch (secondErr) {
    const lastComma = text.lastIndexOf(',');
    if (lastComma > 0) {
      const truncated = text.substring(0, lastComma);
      try {
        return repairAndParseJson(truncated);
      } catch {
        // Fall through
      }
    }
    throw secondErr;
  }
}

// Main analysis function
export async function analyzeFormulationQuery(
  query: string,
  jurisdiction: Jurisdiction = 'INDIA',
  language: SupportedLanguage = 'EN'
): Promise<LegalVerdict> {
  // 1. DPDP Sanitization
  const { sanitizedQuery } = sanitizeQueryForDPDP(query);

  // 2. Graceful Abstention Guardrail: typed, specific, redirecting.
  //    MEDICAL_ADVICE / NON_IP_DOMAIN / INSUFFICIENT_INPUT — never hallucinates.
  const abstention = classifyAbstention(query, language);
  if (abstention) {
    const categoryLabel =
      abstention.category === 'MEDICAL_ADVICE'
        ? language === 'HI' ? 'चिकित्सीय सलाह (Medical Advice)' : language === 'MR' ? 'वैद्यकीय सल्ला (Medical Advice)' : 'Medical Advice'
        : abstention.category === 'NON_IP_DOMAIN'
          ? 'Outside IP Domain'
          : 'Insufficient Input';
    const localizedTitle =
      language === 'HI' ? `कार्यक्षेत्राबाहेर — ${categoryLabel}` : language === 'MR' ? `कक्षेबाहेर — ${categoryLabel}` : `Out of Scope — ${categoryLabel}`;

    return {
      query,
      language,
      resolved_botanicals: [],
      verdict_title: localizedTitle,
      is_patentable: false,
      reasoning_chain: [],
      nba_approval_required: false,
      wipo_disclosure_mandatory: false,
      viable_routes: [],
      abstain: true,
      abstention_reason: abstention.reason,
      abstention_category: abstention.category,
      abstention_suggestions: abstention.suggestions,
      confidence_score: 1.0,
      audit_record: createAuditRecord(query, jurisdiction, language)
    };
  }

  // 3. HARDCODED STATUTORY BRAIN (deterministic, runs before + without AI).
  //    Sections 3(p)/3(e)/3(d), BDA s.6(1)/s.7/s.3, s.10(4)(d), GRATK Art.3/4.
  const resolvedBotanicals = resolveBotanicalEntities(sanitizedQuery);
  const deterministicBase = buildDeterministicVerdict(
    sanitizedQuery,
    jurisdiction,
    language,
    resolvedBotanicals
  );
  
  // Filter classical formulations to only include those relevant to the detected botanicals.
  // SPEED: cap at 2 entries and strip to slim fields to keep the LLM prompt small.
  const relevantClassicalFormulations = classicalFormulations.filter(f => {
    const fStr = JSON.stringify(f).toLowerCase();
    return resolvedBotanicals.some(rb =>
      (rb.botanical_binomial && fStr.includes(rb.botanical_binomial.toLowerCase())) ||
      (rb.sanskrit_name && fStr.includes(rb.sanskrit_name.toLowerCase())) ||
      (rb.english_common_name && fStr.includes(rb.english_common_name.toLowerCase()))
    );
  }).slice(0, 2).map((f: Record<string, unknown>) => ({
    name: f.name ?? f.title ?? f.formulation ?? null,
    ref: f.ref ?? f.afi_ref ?? f.source ?? null,
    ingredients: typeof f.ingredients === 'string'
      ? (f.ingredients as string).slice(0, 300)
      : f.ingredients,
  }));

  // 4. Prepare Context (slim — large prompts = slow + expensive generations)
  const context = {
    classical_prior_art: relevantClassicalFormulations,
    detected_botanicals: resolvedBotanicals.map(b => ({
      sanskrit_name: b.sanskrit_name,
      botanical_binomial: b.botanical_binomial,
      english_common_name: b.english_common_name,
    })),
    jurisdiction,
    target_language: language
  };

  // 5. Construct Multilingual System Prompt
  const languageInstruction = language === 'HI'
    ? "IMPORTANT: Provide all verdict titles, reasoning descriptions, and viable route actionable steps in professional, formal HINDI (हिंदी), while keeping statutory section codes (e.g. Section 3(p)) clearly referenced."
    : language === 'MR'
    ? "IMPORTANT: Provide all verdict titles, reasoning descriptions, and viable route actionable steps in professional MARATHI (मराठी), while keeping statutory section codes (e.g. Section 3(p)) clearly referenced."
    : "Provide all verdict titles, reasoning descriptions, and viable route actionable steps in clear, professional ENGLISH.";

  const systemInstruction = `
    You are an expert Indian IP attorney, patent agent, and regulatory consultant specializing in Ayurveda, traditional knowledge systems, the Patents Act 1970 (as amended 2024), and the Biological Diversity Act 2002 (as amended 2023).
    Analyze the user query regarding an Ayurvedic patent or IP protection request.
    Use the provided statutory context (injected by the retrieval vector store) and classical formulary data to determine patentability with zero hallucinations.
    
    ${languageInstruction}

    CRITICAL LEGAL RULES:
    - Return ONLY valid JSON matching the LegalVerdict schema. Do not include markdown formatting or backticks (\`\`\`json).
    - If the query claims a classical formulation or admixture of known Ayurvedic herbs (e.g., Haridra + Maricha), it is STRICTLY BARRED under Section 3(p) and Section 3(e) as a mere admixture without synergy proof.
    - If the user proposes a novel extraction process (e.g. supercritical CO2 extraction, isolated bioactive fraction), it may be process-patentable under Section 3(p) / 3(d) exceptions.
    - Always flag mandatory National Biodiversity Authority (NBA) prior approval under Section 6(1) of Biological Diversity Act 2002 if Indian biological resources are utilized.
    - If international jurisdiction applies, highlight WIPO GRATK Treaty 2024 Article 3 mandatory disclosure.
    
    JSON Schema Requirements:
    {
      "verdict_title": "string",
      "is_patentable": boolean,
      "nba_approval_required": boolean,
      "wipo_disclosure_mandatory": boolean,
      "confidence_score": number (0.0 to 1.0),
      "precedent_case": "string or null",
      "reasoning_chain": [
        {
          "id": "string",
          "step_number": number,
          "title": "string",
          "severity": "BARRED" | "APPROVAL_REQUIRED" | "DISCLOSURE_MANDATE" | "CONDITIONALLY_VIABLE",
          "description": "string",
          "citation": {
            "section_id": "string",
            "citation_code": "string",
            "act_title": "string",
            "jurisdiction": "INDIA" | "INTERNATIONAL" | "INDIA_REGULATORY",
            "heading": "string",
            "text_snippet": "string",
            "explanation": "string",
            "version_tag": "string"
          }
        }
      ],
      "viable_routes": [
        {
          "type": "PROCESS_PATENT" | "GEOGRAPHICAL_INDICATION" | "TRADEMARK" | "TRADE_SECRET",
          "title": "string",
          "description": "string",
          "actionable_steps": ["string"]
        }
      ]
    }
  `;

  const userPrompt = `
    User Query: "${sanitizedQuery}"
    Requested Jurisdiction: ${jurisdiction}
    Requested Output Language: ${language}
    Context JSON: ${JSON.stringify(context)}
  `;

  // 6. Call Python Gemini Fallback Service (RAG Endpoint)
  // SPEED + COMPLETION: 4096 tokens accommodates model reasoning thoughts + complete output.
  // RELIABILITY: 45s timeout + one automatic retry on 503/overload before giving up.
  const ragBody = JSON.stringify({
    prompt: userPrompt,
    retrieval_query: sanitizedQuery,
    system_instruction: systemInstruction,
    temperature: 0.15, // Low temperature for maximum legal grounding
    max_output_tokens: 4096 // ample headroom for reasoning thoughts + output
  });
  let response: Response | null = null;
  let lastStatus = 0;
  let connectionError: unknown = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      response = await fetchWithTimeout('http://127.0.0.1:8000/generate_rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: ragBody
      }, 45000);
    } catch (fetchErr) {
      // Backend down / refused / timed out — fall through to deterministic brain.
      connectionError = fetchErr;
      response = null;
      break;
    }
    if (response.ok) break;
    lastStatus = response.status;
    // Only retry on overload-type errors; anything else fails fast.
    if ((response.status === 503 || response.status === 429 || response.status >= 500) && attempt === 1) {
      await new Promise(r => setTimeout(r, 2500));
      continue;
    }
    break;
  }

  try {
    if (connectionError) throw connectionError;
    if (!response || !response.ok) {
      throw new Error(`AI Backend returned HTTP ${lastStatus}`);
    }

    const data = await response.json();
    let aiResponseText = data.text.trim();
    
    console.log("=== RAW AI RESPONSE ===");
    console.log(aiResponseText);
    console.log("=======================");

    let parsedVerdict;
    try {
      parsedVerdict = repairAndParseJson(aiResponseText);
    } catch (parseError) {
      console.error("Failed to parse AI JSON response even after repair. Raw text was:", aiResponseText);
      throw new Error("AI returned malformed JSON");
    }
    
    // 7. Merge: deterministic hardcoded checks are the non-bypassable floor.
    //    AI may add nuance but can never loosen a hardcoded bar/flag.
    const aiVerdict = {
      query,
      language,
      resolved_botanicals: resolvedBotanicals,
      ...parsedVerdict,
    } as LegalVerdict;
    const merged = mergeDeterministicUnderAI(aiVerdict, deterministicBase);
    return {
      ...withRetrievalPack(merged, sanitizedQuery, jurisdiction),
      audit_record: createAuditRecord(query, jurisdiction, language),
    };

  } catch (error) {
    console.error("Error connecting to AI Backend:", error);

    // OFFLINE BRAIN: if the hardcoded engine fired, return its deterministic
    // verdict instead of a generic error — the user still gets instant,
    // statute-grounded guidance with zero network dependency.
    if (deterministicBase.reasoning_chain.length > 0) {
      console.log(
        `[BRAIN] AI backend unreachable — serving deterministic verdict ` +
        `(${deterministicBase.reasoning_chain.length} hardcoded steps).`
      );
      return {
        ...withRetrievalPack(
          { ...deterministicBase, query, language, resolved_botanicals: resolvedBotanicals },
          sanitizedQuery,
          jurisdiction
        ),
        audit_record: createAuditRecord(query, jurisdiction, language),
      };
    }

    // No statutory signal at all and no AI: honest error abstention.
    const msg = String(error);
    const isOverload = msg.includes('503') || msg.includes('429') || /500|502|504/.test(msg);
    const isMalformed = msg.includes('malformed JSON') || msg.includes('SyntaxError');

    let abstention_reason = "Could not reach the Gemini RAG backend on port 8000. Please verify that `python main.py` is running in gemini-fallback-service, then retry.";
    if (isOverload) {
      abstention_reason = "The AI model is temporarily overloaded (high demand on Gemini). The backend is running — please wait a few seconds and try again. No restart needed.";
    } else if (isMalformed) {
      abstention_reason = "The AI model generated an incomplete or malformed response (possible token limit reached). Please try a shorter query or try again.";
    }

    return {
      query,
      language,
      resolved_botanicals: resolvedBotanicals,
      verdict_title: language === 'HI' ? 'सिस्टम त्रुटि (System Offline)' : 'System Offline / Error',
      is_patentable: false,
      reasoning_chain: [],
      nba_approval_required: false,
      wipo_disclosure_mandatory: false,
      viable_routes: [],
      abstain: true,
      abstention_reason,
      abstention_category: 'SYSTEM_ERROR',
      abstention_suggestions: [
        'Retry in a few seconds — the AI backend may be temporarily overloaded.',
        'If the error persists, verify the Gemini RAG backend is running, then retry.',
      ],
      confidence_score: 0.0,
      audit_record: createAuditRecord(query, jurisdiction, language)
    };
  }
}


export async function generateAdversarialArgument(query: string, verdict: LegalVerdict): Promise<string> {
  const lang = verdict.language ?? 'EN';
  const langInstruction = lang === 'HI'
    ? 'Provide the objection in formal, professional HINDI (हिंदी), keeping statutory section references (e.g. धारा 3(p), धारा 3(e), धारा 3(d)) explicit.'
    : lang === 'MR'
    ? 'Provide the objection in formal, professional MARATHI (मराठी), keeping statutory section references (e.g. कलम 3(p), कलम 3(e), कलम 3(d)) explicit.'
    : lang === 'SA'
    ? 'Provide the objection in SANSKRIT (संस्कृतम्), keeping statutory section references explicit.'
    : 'Provide the objection in clear, professional English.';

  const systemInstruction = `
    Act as an Indian Patent Office (IPO) examiner drafting a First Examination Report (FER) objection.
    The applicant has submitted the following query: "${query}"
    The preliminary system verdict is: ${verdict.is_patentable ? 'Potentially Patentable' : 'Patent Barred'}.
    Based on this, draft a short, strict, adversarial 1-2 sentence objection citing relevant sections of the Patents Act (e.g. 3(p), 3(e), 3(d)) or Biological Diversity Act. 
    ${langInstruction}
    Do not be helpful. Be adversarial. Do not use markdown. Return ONLY the text of the objection.
  `;

  try {
    // SPEED: short objection only + hard timeout; never block the main verdict.
    const response = await fetchWithTimeout('http://127.0.0.1:8000/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Draft an objection for: ${query}`.slice(0, 500),
        system_instruction: systemInstruction,
        temperature: 0.7,
        max_output_tokens: 200
      })
    }, 15000);

    if (!response.ok) {
      throw new Error(`AI Backend returned HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.text.trim();
  } catch (error) {
    console.error("Error generating adversarial argument:", error);
    // Fallback if backend is unreachable
    if (!verdict.is_patentable) {
      return lang === 'HI'
        ? "पेटेंट परीक्षक प्राथमिक अस्वीकृति धारा 3(p) एवं 3(e) के अंतर्गत: आवेदक का दावा किया गया योग पारंपरिक रूप से ज्ञात आयुर्वेदिक जड़ी-बूटियों का संचय है। कोई सांख्यिकीय रूप से मान्य तालमेल सूचकांक प्रस्तुत नहीं किया गया है।"
        : lang === 'MR'
        ? "पेटंट परीक्षक प्राथमिक नकार कलम 3(p) व 3(e) अन्वये: अर्जदाराचे सूत्र पारंपरिकरित्या ज्ञात आयुर्वेदिक वनस्पतींचे संचय दर्शवते. कोणताही सांख्यिकीयदृष्ट्या वैध सहकार्य निर्देशांक सादर केलेला नाही."
        : lang === 'SA'
        ? "पटण्टपरीक्षकप्राथमिकप्रत्याख्यानं धारा ३(p) ३(e) चान्तर्गतम्: आवेदकस्य दावा पारम्परिकज्ञानसङ्ग्रहमात्रम्। किमपि सहकार्यप्रमाणं न समर्पितम्।"
        : "Patent Examiner Primary Rejection under Section 3(p) & 3(e): The applicant's claimed formulation represents an aggregation of traditionally known Ayurvedic herbs. No statistically validated synergistic index has been submitted.";
    }
    return lang === 'HI'
      ? "पेटेंट परीक्षक टिप्पणी धारा 3(d) के अंतर्गत: यद्यपि दावा की गई प्रक्रिया चयनात्मक निष्कर्षण प्रदर्शित करती है, आवेदक को यह स्थापित करना होगा कि परिणामी संयोजन चिकित्सीय प्रभावकारिता में संवर्धित वृद्धि प्रदर्शित करता है।"
      : lang === 'MR'
      ? "पेटंट परीक्षक निरीक्षण कलम 3(d) अन्वये: दावा केलेली प्रक्रिया निवडक निष्कर्षण दर्शवत असली तरी, अर्जदाराने परिणामी घटकात उपचारात्मक परिणामकारकतेची वर्धित वाढ सिद्ध केली पाहिजे."
      : lang === 'SA'
      ? "पटण्टपरीक्षकनिरीक्षणं धारा ३(d) अन्तर्गतम्: प्रक्रियां विहाय आवेदकेन वर्धितचिकित्सीयप्रभावकारिता सिद्धा करणीया।"
      : "Patent Examiner Observation under Section 3(d): While the claimed process demonstrates selective extraction, the applicant must establish that the resulting composition exhibits a demonstrated enhancement of therapeutic efficacy.";
  }
}

export async function executeJurisdictionDiff(
  query: string,
  botanicals: BotanicalEntity[],
  baseVerdict?: LegalVerdict,
  language?: SupportedLanguage
): Promise<JurisdictionDiff> {
  // Deterministic diff: re-run the hardcoded brain per jurisdiction so the
  // India vs PCT contrast (BDA s.6 vs GRATK Art.3) is computed, not hallucinated.
  // No LLM calls — instant and free.
  const resolved = botanicals?.length > 0 ? botanicals : resolveBotanicalEntities(query);
  const lang = language ?? baseVerdict?.language ?? 'EN';

  const indiaVerdict: LegalVerdict =
    baseVerdict ?? buildDeterministicVerdict(query, 'INDIA', lang, resolved);

  // USPTO view: same hardcoded Indian screen + US prior-art framing.
  const usDeterministic = buildDeterministicVerdict(query, 'USPTO', lang, resolved);
  const usptoVerdict: LegalVerdict = {
    ...usDeterministic,
    verdict_title: indiaVerdict.is_patentable
      ? (lang === 'HI' ? 'USPTO: प्रक्रिया दावा संभावित रूप से पेटेंट योग्य (35 U.S.C. §§ 102/103)' : lang === 'MR' ? 'USPTO: प्रक्रिया दावा संभाव्यतः पेटंटयोग्य (35 U.S.C. §§ 102/103)' : lang === 'SA' ? 'USPTO: प्रक्रियादावा सम्भाव्यतया पटण्टयोग्यः (35 U.S.C. §§ 102/103)' : 'USPTO: Process Claim Potentially Patentable (35 U.S.C. §§ 102/103)')
      : (lang === 'HI' ? 'USPTO: TKDL/AFI के माध्यम से §102/§103 पूर्व-कला अस्वीकृति संभावित' : lang === 'MR' ? 'USPTO: TKDL/AFI द्वारे §102/§103 पूर्व-कला नकार संभाव्य' : lang === 'SA' ? 'USPTO: TKDL/AFI माध्यमेन §102/§103 पूर्वकलाप्रत्याख्यानं सम्भाव्यम्' : 'USPTO: §102/§103 Prior-Art Rejection Likely via TKDL/AFI'),
  };

  // EPO view: same hardcoded screen + EPC inventive-step framing.
  const epoDeterministic = buildDeterministicVerdict(query, 'EPO', lang, resolved);
  const epoVerdict: LegalVerdict = {
    ...epoDeterministic,
    verdict_title: epoDeterministic.is_patentable
      ? (lang === 'HI' ? 'EPO: प्रक्रिया दावा — Art.56 EPC आविष्कारशील कदम + नागोया प्रकटीकरण' : lang === 'MR' ? 'EPO: प्रक्रिया दावा — Art.56 EPC नाविन्यपूर्ण पायरी + नागोया प्रकटीकरण' : lang === 'SA' ? 'EPO: प्रक्रियादावा — Art.56 EPC आविष्कारकपदम् + नागोयाप्रकटनम्' : 'EPO: Process Claim — Art.56 EPC Inventive-Step Burden + Nagoya Disclosure')
      : (lang === 'HI' ? 'EPO: TKDL/AFI पूर्व कला के आधार पर Art. 52/56 EPC अस्वीकृति संभावित + नागोया प्रकटीकरण' : lang === 'MR' ? 'EPO: TKDL/AFI पूर्व कला आधारे Art. 52/56 EPC नकार संभाव्य + नागोया प्रकटीकरण' : lang === 'SA' ? 'EPO: TKDL/AFI पूर्वकलाधारे Art. 52/56 EPC प्रत्याख्यानं सम्भाव्यम् + नागोयाप्रकटनम्' : 'EPO: Article 52/56 EPC Rejection Likely (TKDL/AFI Prior Art) + Nagoya Disclosure'),
  };

  return {
    query,
    india_verdict: indiaVerdict,
    uspto_verdict: usptoVerdict,
    epo_verdict: epoVerdict
  };
}
