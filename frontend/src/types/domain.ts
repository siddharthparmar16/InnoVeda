// IP-SAKTI Sahayak (SIH26045) Domain Types

export type FlowState = 'INPUT' | 'PROCESSING' | 'VERDICT' | 'ABSTAIN';
export type Jurisdiction = 'INDIA' | 'INTERNATIONAL' | 'USPTO' | 'EPO';
export type VerdictSeverity = 'BARRED' | 'APPROVAL_REQUIRED' | 'DISCLOSURE_MANDATE' | 'CONDITIONALLY_VIABLE';
export type SupportedLanguage = 'EN' | 'HI' | 'MR';

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
}

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
  confidence_score: number;
  adversarial_argument?: string; // Adversarial self-check
  audit_record?: AuditRecord;
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
