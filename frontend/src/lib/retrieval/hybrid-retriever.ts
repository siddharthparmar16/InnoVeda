/**
 * Track-B Hybrid Retrieval (offline, in-frontend).
 *
 * Fetches relevant case law, statutory sections, and guidelines based on the
 * classified formulation — keyword/IDF lexical scoring + botanical boost +
 * jurisdiction boost + statutory-link graph boost. No network, no embeddings;
 * complements the ChromaDB vector track (Track-A) running in the backend.
 *
 * Every hit carries character-offset evidence_spans into the canonical text
 * so the Vault drawer can highlight the exact supporting span.
 */

import {
  BotanicalEntity,
  EvidenceSpan,
  Jurisdiction,
  RetrievalHit,
  RetrievalPack,
} from '@/types/domain';
import legalCorpus from '@/data/corpus/legal_statutory_corpus.json';
import caseLawCorpus from '@/data/corpus/case_law_guidelines_corpus.json';
import { getStatuteSource } from './statute-sources';

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  // English
  'i', 'we', 'you', 'he', 'she', 'it', 'they', 'a', 'an', 'the', 'and', 'or',
  'of', 'in', 'on', 'for', 'to', 'with', 'is', 'are', 'was', 'were', 'be',
  'been', 'that', 'this', 'what', 'which', 'want', 'patent', 'patenting',
  'formulation', 'using', 'use', 'based', 'from', 'by', 'as', 'at', 'my',
  // Hindi / Marathi particles
  'ke', 'ki', 'ka', 'ko', 'mein', 'me', 'se', 'hai', 'hain', 'tha', 'thi',
  'chahta', 'chahti', 'karana', 'hwa', 'hwo', 'liye', 'aur', 'ya',
  'sathi', 'aani', 'cha', 'chi', 'che', 'madhye', 'aahe', 'ghyayche',
]);

/** Significant query terms: lowercase tokens, len>=3 (or Devanagari len>=2), minus stopwords. */
export function significantTerms(text: string): string[] {
  const raw = text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of raw) {
    const isDevanagari = /[\u0900-\u097F]/.test(t);
    if (t.length < (isDevanagari ? 2 : 3)) continue;
    if (STOPWORDS.has(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

// Key legal phrases that deserve a bonus when both query and doc mention them.
const KEY_PHRASES = [
  'traditional knowledge',
  'prior approval',
  'mandatory disclosure',
  'mere admixture',
  'aggregation of',
  'enhanced efficacy',
  'therapeutic efficacy',
  'biological resource',
  'genetic resources',
  'synergistic',
  'bioavailability',
  'source and geographical origin',
  'country of origin',
  'classical formulation',
  'supercritical',
];

// ---------------------------------------------------------------------------
// Corpus indexing (module-load, lazy)
// ---------------------------------------------------------------------------

interface StatuteDoc {
  section_id: string;
  citation_code: string;
  act_title: string;
  jurisdiction: string;
  heading: string;
  text: string;
  explanation: string;
  version_tag: string;
  gazette_ref: string;
  authority: string;
  blob: string; // lowercased searchable text
}

let statuteDocs: StatuteDoc[] | null = null;
let docFreq: Map<string, number> | null = null;

function isFillerSection(heading: string, text: string): boolean {
  return (
    heading.startsWith('Generated Patent Act Section') ||
    text.startsWith('This is an expanded corpus section')
  );
}

function loadStatuteDocs(): StatuteDoc[] {
  if (statuteDocs) return statuteDocs;
  const docs: StatuteDoc[] = [];
  for (const act of legalCorpus as Record<string, unknown>[]) {
    const actTitle = String(act['act_title'] ?? '');
    const jurisdiction = String(act['jurisdiction'] ?? 'INDIA');
    const authority = String(act['authority'] ?? '');
    const sections = (act['sections'] ?? []) as Record<string, unknown>[];
    for (const s of sections) {
      const heading = String(s['heading'] ?? '');
      const text = String(s['text'] ?? '');
      if (isFillerSection(heading, text)) continue; // skip synthetic filler
      docs.push({
        section_id: String(s['section_id'] ?? ''),
        citation_code: String(s['citation_code'] ?? ''),
        act_title: actTitle,
        jurisdiction,
        heading,
        text,
        explanation: String(s['explanation'] ?? ''),
        version_tag: String(s['version_tag'] ?? ''),
        gazette_ref: String(s['gazette_ref'] ?? ''),
        authority,
        blob: `${heading} ${text} ${s['explanation'] ?? ''} ${s['citation_code'] ?? ''}`.toLowerCase(),
      });
    }
  }
  statuteDocs = docs;
  // Document frequencies for IDF weighting
  const df = new Map<string, number>();
  for (const d of docs) {
    const terms = new Set(significantTerms(d.blob));
    for (const t of terms) df.set(t, (df.get(t) ?? 0) + 1);
  }
  docFreq = df;
  return docs;
}

function idf(term: string, totalDocs: number): number {
  const df = docFreq?.get(term) ?? 0;
  return 1 + Math.log((1 + totalDocs) / (1 + df));
}

// ---------------------------------------------------------------------------
// Span-level evidence locator
// ---------------------------------------------------------------------------

/**
 * Locates up to `maxSpans` supporting spans inside canonical `text` for the
 * given claim terms. Each span is expanded to sentence boundaries (fallback:
 * ±70 chars) and returned as character offsets. Always returns >=1 span when
 * text is non-empty (falls back to the lead sentence).
 */
export function locateEvidenceSpans(
  text: string,
  claimTerms: string[],
  maxSpans = 3
): EvidenceSpan[] {
  if (!text) return [];
  const lowered = text.toLowerCase();
  const terms = claimTerms
    .map((t) => t.toLowerCase())
    .filter((t) => t.length >= 4)
    .slice(0, 12);

  // Sentence boundaries
  const sentences: { start: number; end: number; text: string }[] = [];
  const sentenceRe = /[^.!?;]+[.!?;]?/g;
  let m: RegExpExecArray | null;
  while ((m = sentenceRe.exec(text)) !== null) {
    const s = m[0];
    if (s.trim().length < 8) continue;
    sentences.push({ start: m.index, end: m.index + s.length, text: s });
  }
  if (sentences.length === 0) {
    sentences.push({ start: 0, end: text.length, text });
  }

  // Score sentences by distinct claim-term hits
  const scored = sentences.map((s) => {
    const low = s.text.toLowerCase();
    let hits = 0;
    for (const t of terms) {
      if (low.includes(t)) hits += 1;
    }
    return { ...s, hits };
  });
  scored.sort((a, b) => b.hits - a.hits);

  const picked = scored.filter((s) => s.hits > 0).slice(0, maxSpans);
  const fallback =
    picked.length > 0 ? picked : [scored[0]].filter(Boolean);

  // Merge overlaps and clamp
  const spans: EvidenceSpan[] = [];
  for (const s of fallback) {
    const start = Math.max(0, s.start);
    const end = Math.min(text.length, s.end);
    if (end <= start) continue;
    if (spans.some((e) => start < e.end && end > e.start)) continue;
    spans.push({ start, end, text: text.slice(start, end) });
  }
  // Deterministic order: document order
  spans.sort((a, b) => a.start - b.start);
  return spans;
}

// ---------------------------------------------------------------------------
// Hybrid scoring
// ---------------------------------------------------------------------------

export interface RetrieveOptions {
  botanicals?: BotanicalEntity[];
  jurisdiction?: Jurisdiction;
  topStatutes?: number;
  topCases?: number;
  topGuidelines?: number;
  /** Section ids already triggered by the hardcoded brain — boosts linked docs. */
  boostSectionIds?: string[];
}

function botanicalTerms(botanicals: BotanicalEntity[]): string[] {
  const out: string[] = [];
  for (const b of botanicals ?? []) {
    if (b.sanskrit_name) out.push(b.sanskrit_name.toLowerCase());
    if (b.english_common_name) {
      for (const p of b.english_common_name.toLowerCase().split(/[\s/,()]+/)) {
        if (p.length > 3) out.push(p);
      }
    }
    if (b.botanical_binomial) {
      const mm = b.botanical_binomial.match(/^([A-Za-z]+)\s+([a-z]+)/);
      if (mm) {
        out.push(mm[1].toLowerCase(), mm[2].toLowerCase());
      }
    }
  }
  return [...new Set(out)];
}

/**
 * Classification-driven affinity: boosts the sections that matter for the
 * classified formulation (TK herbs → 3(p)/3(e)/BDA; process signals → 3(d);
 * PCT track → GRATK). This is what makes retrieval formulation-aware rather
 * than flat keyword overlap — statute texts never mention herb names.
 */
const SECTION_AFFINITY: Record<string, { tk?: number; process?: number; pct?: number; bio?: number }> = {
  's.3(p)': { tk: 4 },
  's.3(e)': { tk: 3 },
  's.3(d)': { process: 4, tk: 1 },
  's.3(h)': {},
  's.10(4)(d)': { bio: 3, tk: 1 },
  'bda_s.6(1)': { bio: 4, tk: 1 },
  'bda_s.7': { bio: 3 },
  'bda_s.3': { bio: 2, pct: 2 },
  'wipo_art.3': { pct: 4, bio: 1 },
  'wipo_art.4': { pct: 3, tk: 1.5 },
  'dca_rule.158a': { tk: 1 },
  'dca_rule.158b': { tk: 1.5, process: 1 },
  'dca_sched.t': { tk: 1 },
};

interface QueryContexts {
  tk: boolean; // classified formulation contains TK botanicals
  process: boolean; // novel process / efficacy signals
  pct: boolean; // international-track intent
  bio: boolean; // Indian biological resource involved
}

function classifyQuery(query: string, botanicalCount: number, jurisdiction?: Jurisdiction): QueryContexts {
  const q = query.toLowerCase();
  const process =
    /supercritical|extract|isolat|purif|fraction|nano|liposom|ferment|novel process|new process|bioavailability|efficac|synerg|clinical trial|purity/.test(q);
  const pct =
    (jurisdiction !== undefined && jurisdiction !== 'INDIA') ||
    /pct|wipo|international|uspto|united states|epo|europe|foreign|abroad|outside india/.test(q);
  const bio = botanicalCount > 0;
  return { tk: bio, process, pct, bio };
}

function jurisdictionMatch(docJurisdiction: string, requested?: Jurisdiction): boolean {
  if (!requested) return false;
  if (docJurisdiction === requested) return true;
  if (requested !== 'INDIA' && docJurisdiction === 'INTERNATIONAL') return true;
  if (requested === 'INTERNATIONAL' && docJurisdiction === 'INDIA') return true; // Indian TK still relevant
  return false;
}

function normalizeScore(raw: number): number {
  // Squash to 0..1; raw ~ TF-IDF sums typically 0..40.
  const s = raw / (raw + 10);
  return Math.round(s * 1000) / 1000;
}

/** Track-B hybrid retrieval over statutes + case law + guidelines. */
export function retrieveTrackB(query: string, opts: RetrieveOptions = {}): RetrievalPack {
  const t0 = Date.now();
  const docs = loadStatuteDocs();
  const botanicals = opts.botanicals ?? [];
  const queryTerms = significantTerms(query);
  const bioTerms = botanicalTerms(botanicals);
  const allTerms = [...new Set([...queryTerms, ...bioTerms])];
  const loweredQuery = query.toLowerCase();

  // ---- Statutes ----
  const ctx = classifyQuery(query, botanicals.length, opts.jurisdiction);
  const statuteScored = docs.map((d) => {
    let raw = 0;
    const matched: string[] = [];
    for (const t of allTerms) {
      if (d.blob.includes(t)) {
        raw += idf(t, docs.length) * (bioTerms.includes(t) ? 1.6 : 1);
        if (matched.length < 8) matched.push(t);
      }
    }
    for (const phrase of KEY_PHRASES) {
      if (loweredQuery.includes(phrase) && d.blob.includes(phrase)) {
        raw += 2.5;
        if (matched.length < 8) matched.push(phrase);
      }
    }
    // Botanical mention boost inside the doc itself
    for (const bt of bioTerms) {
      if (d.blob.includes(bt)) raw += 0.8;
    }
    // Formulation-aware affinity: TK herbs → 3(p)/BDA, process → 3(d), PCT → GRATK
    const affinity = SECTION_AFFINITY[d.section_id.toLowerCase()];
    if (affinity) {
      if (ctx.tk && affinity.tk) {
        raw += affinity.tk;
        if (matched.length < 8) matched.push('TK-formulation');
      }
      if (ctx.process && affinity.process) {
        raw += affinity.process;
        if (matched.length < 8) matched.push('novel-process');
      }
      if (ctx.pct && affinity.pct) {
        raw += affinity.pct;
        if (matched.length < 8) matched.push('PCT-track');
      }
      if (ctx.bio && affinity.bio) {
        raw += affinity.bio;
        if (matched.length < 8) matched.push('bio-resource');
      }
    }
    if (jurisdictionMatch(d.jurisdiction, opts.jurisdiction)) raw += 1.5;
    return { doc: d, raw, matched };
  });
  statuteScored.sort((a, b) => b.raw - a.raw);
  const topStatutes = statuteScored
    .filter((s) => s.raw > 0)
    .slice(0, opts.topStatutes ?? 6);
  const topSectionIds = new Set(topStatutes.map((s) => s.doc.section_id.toLowerCase()));

  const statuteHits: RetrievalHit[] = topStatutes.map((s) => {
    const src = getStatuteSource(s.doc.section_id);
    return {
      doc_id: s.doc.section_id,
      kind: 'statute',
      title: `${s.doc.citation_code} — ${s.doc.heading}`,
      citation_code: s.doc.citation_code,
      jurisdiction: s.doc.jurisdiction,
      score: normalizeScore(s.raw),
      matched_terms: s.matched,
      evidence_spans: locateEvidenceSpans(s.doc.text, [...s.matched, ...bioTerms]),
      source_url: src.portal_url,
      source_label: src.portal_label,
      snippet: s.doc.text.slice(0, 220),
    };
  });

  // ---- Case law / guidelines / prior-art systems ----
  const boostSet = new Set([
    ...topSectionIds,
    ...(opts.boostSectionIds ?? []).map((s) => s.toLowerCase()),
  ]);
  interface AuxDoc {
    id: string;
    kind: 'case_law' | 'guideline' | 'prior_art_system';
    title: string;
    citation: string;
    jurisdiction: string;
    blob: string;
    links: string[];
    holding: string;
    url?: string;
    label?: string;
  }
  const auxDocs: AuxDoc[] = (caseLawCorpus as Record<string, unknown>[]).map((e) => ({
    id: String(e['id'] ?? ''),
    kind: (String(e['kind'] ?? 'guideline') as AuxDoc['kind']),
    title: String(e['title'] ?? ''),
    citation: String(e['citation_ref'] ?? ''),
    jurisdiction: String(e['jurisdiction'] ?? 'INDIA'),
    blob: `${e['title'] ?? ''} ${e['holding_or_summary'] ?? ''} ${((e['relevance_tags'] ?? []) as string[]).join(' ')}`.toLowerCase(),
    links: ((e['statutory_links'] ?? []) as string[]).map((s) => String(s).toLowerCase()),
    holding: String(e['holding_or_summary'] ?? ''),
    url: e['source_url'] ? String(e['source_url']) : undefined,
    label: e['source_label'] ? String(e['source_label']) : undefined,
  }));

  const auxScored = auxDocs.map((d) => {
    let raw = 0;
    const matched: string[] = [];
    for (const t of allTerms) {
      if (d.blob.includes(t)) {
        raw += 1.4;
        if (matched.length < 8) matched.push(t);
      }
    }
    for (const phrase of KEY_PHRASES) {
      if (loweredQuery.includes(phrase) && d.blob.includes(phrase)) {
        raw += 2;
        if (matched.length < 8) matched.push(phrase);
      }
    }
    for (const link of d.links) {
      if (boostSet.has(link)) {
        raw += 2.2;
        if (matched.length < 8) matched.push(`§${link}`);
      }
    }
    if (jurisdictionMatch(d.jurisdiction, opts.jurisdiction)) raw += 1.2;
    return { doc: d, raw, matched };
  });
  auxScored.sort((a, b) => b.raw - a.raw);

  const toHit = (s: (typeof auxScored)[number]): RetrievalHit => ({
    doc_id: s.doc.id,
    kind: s.doc.kind === 'prior_art_system' ? 'prior_art_system' : s.doc.kind,
    title: s.doc.title,
    citation_code: s.doc.citation,
    jurisdiction: s.doc.jurisdiction,
    score: normalizeScore(s.raw),
    matched_terms: s.matched,
    evidence_spans: locateEvidenceSpans(s.doc.holding, [...s.matched, ...bioTerms]),
    source_url: s.doc.url,
    source_label: s.doc.label,
    snippet: s.doc.holding.slice(0, 220),
  });

  const caseHits = auxScored
    .filter((s) => (s.doc.kind === 'case_law' || s.doc.kind === 'prior_art_system') && s.raw > 0)
    .slice(0, opts.topCases ?? 3)
    .map(toHit);
  const guidelineHits = auxScored
    .filter((s) => s.doc.kind === 'guideline' && s.raw > 0)
    .slice(0, opts.topGuidelines ?? 3)
    .map(toHit);

  return {
    method: 'hybrid-track-b',
    took_ms: Date.now() - t0,
    query_terms: allTerms.slice(0, 20),
    statutes: statuteHits,
    case_law: caseHits,
    guidelines: guidelineHits,
  };
}
