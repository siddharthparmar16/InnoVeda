// IP-SAKTI Sahayak (SIH26045) Domain Types

export type FlowState = 'INPUT' | 'PROCESSING' | 'VERDICT' | 'ABSTAIN';
export type Jurisdiction = 'INDIA' | 'INTERNATIONAL' | 'USPTO' | 'EPO';
export type VerdictSeverity = 'BARRED' | 'APPROVAL_REQUIRED' | 'DISCLOSURE_MANDATE' | 'CONDITIONALLY_VIABLE';
export type SupportedLanguage = 'EN' | 'HI' | 'MR' | 'SA';

export interface BotanicalEntity {
  id?: string;
  sanskrit_name: string;
  iast_transliteration?: string;
  hindi_name?: string;
  marathi_name?: string;
  english_common_name: string;
  botanical_binomial: string;
  parts_used?: string[];
  afi_reference?: string;
  biopiracy_precedent?: string | null;
  matched_alias?: string;
}

/** A character-offset span into `text_snippet` that supports the AI's claim. */
export interface EvidenceSpan {
  start: number;
  end: number;
  text: string;
}

export type RetrievalMethod = 'hardcoded' | 'hybrid-track-b' | 'vector-chromadb' | 'unverified';

export interface StatutoryCitation {
  section_id: string;
  citation_code: string;
  act_title: string;
  jurisdiction: Jurisdiction | 'INDIA_REGULATORY';
  heading: string;
  text_snippet: string;
  explanation: string;
  sha256_hash?: string;
  version_tag?: string;
  gazette_ref?: string;
  authority?: string;
  nli_verified?: boolean; // Citation Verification Layer
  // --- Cryptographic Citation Vault (Track B) ---
  source_url?: string; // Official host portal for the parent Act
  source_label?: string; // Human-readable source description + locator
  retrieval_method?: RetrievalMethod; // How this citation was fetched
  retrieval_score?: number; // 0..1 hybrid relevance score (if retrieved)
  evidence_spans?: EvidenceSpan[]; // Span-level evidence supporting the claim
}

/** One ranked document from Track-B hybrid retrieval. */
export interface RetrievalHit {
  doc_id: string; // section_id or corpus entry id
  kind: 'statute' | 'case_law' | 'guideline' | 'prior_art_system';
  title: string;
  citation_code: string;
  jurisdiction: string;
  score: number; // 0..1 normalized hybrid score
  matched_terms: string[];
  evidence_spans: EvidenceSpan[];
  source_url?: string;
  source_label?: string;
  snippet: string; // short display text (canonical or holding)
}

export interface RetrievalPack {
  method: 'hybrid-track-b';
  took_ms: number;
  query_terms: string[];
  statutes: RetrievalHit[];
  case_law: RetrievalHit[];
  guidelines: RetrievalHit[];
}

export interface LegalReasoningStep {
  id: string;
  step_number: number;
  title: string;
  severity: VerdictSeverity;
  description: string;
  citation: StatutoryCitation;
}

export interface ViableRoute {
  type: 'PROCESS_PATENT' | 'GEOGRAPHICAL_INDICATION' | 'TRADEMARK' | 'TRADE_SECRET';
  title: string;
  description: string;
  actionable_steps: string[];
  // --- Intelligent Verdict & Outputs ---
  priority?: 'PRIMARY' | 'SECONDARY' | 'NOT_AVAILABLE';
  rationale?: string; // why this route fits (or doesn't) this classification
  needs_gaps?: string[]; // evidence-gap ids that must be closed first
}

/** Preliminary formulation category (before any AI call). */
export type FormulationCategory =
  | 'CLASSICAL'
  | 'PROPRIETARY_ADMIXTURE'
  | 'PROCESS_INNOVATION'
  | 'NON_AYURVEDIC'
  | 'UNCLASSIFIABLE';

/** Evidence-grounded confidence band — counts corroborating signals, never a bare %. */
export type ConfidenceBand = 'HIGH' | 'MODERATE' | 'INSUFFICIENT';

export interface FormulationClassification {
  category: FormulationCategory;
  category_label: string;
  band: ConfidenceBand;
  band_label: string;
  evidence_points: number;
  rationale: string[];
  signals: string[];
}

/** One missing fact that prevents a definitive legal answer. */
export interface EvidenceGap {
  id: string;
  question: string;
  why_it_matters: string;
  statutory_link?: string; // section_id, e.g. 's.3(d)'
  severity: 'BLOCKING' | 'HELPFUL';
  how_to_fix: string;
}

export type AbstentionCategory = 'MEDICAL_ADVICE' | 'NON_IP_DOMAIN' | 'INSUFFICIENT_INPUT' | 'SYSTEM_ERROR';

export interface AuditRecord {
  audit_id: string;
  timestamp: string;
  query_hash: string;
  session_hash: string;
  dpdp_compliance_status: 'PII_SCRUBBED' | 'COMPLIANT';
  jurisdiction: Jurisdiction;
  language: SupportedLanguage;
}

export interface LegalVerdict {
  query: string;
  language: SupportedLanguage;
  resolved_botanicals: BotanicalEntity[];
  verdict_title: string;
  is_patentable: boolean;
  reasoning_chain: LegalReasoningStep[];
  nba_approval_required: boolean;
  wipo_disclosure_mandatory: boolean;
  viable_routes: ViableRoute[];
  precedent_case?: string | null;
  abstain?: boolean;
  abstention_reason?: string;
  abstention_category?: AbstentionCategory;
  abstention_suggestions?: string[];
  classification?: FormulationClassification;
  evidence_gaps?: EvidenceGap[];
  confidence_score: number;
  adversarial_argument?: string; // Adversarial self-check
  audit_record?: AuditRecord;
  retrieval_pack?: RetrievalPack; // Track-B hybrid retrieval evidence
}

export interface FacilitatorDossier {
  dossier_id: string;
  created_at: string;
  applicant_reference: string;
  original_query: string;
  jurisdiction: Jurisdiction;
  verdict_title: string;
  is_patentable: boolean;
  resolved_botanicals: BotanicalEntity[];
  statutory_bars: {
    section_code: string;
    act_title: string;
    severity: VerdictSeverity;
    summary: string;
  }[];
  nba_compliance_needed: boolean;
  recommended_routes: string[];
  patent_attorney_checklist: string[];
  disclaimer: string;
}

export interface JurisdictionDiff {
  query: string;
  india_verdict: LegalVerdict;
  uspto_verdict: LegalVerdict;
  epo_verdict: LegalVerdict;
}
