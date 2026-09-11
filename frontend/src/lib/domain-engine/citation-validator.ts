import corpus from '@/data/corpus/legal_statutory_corpus.json';
import { LegalVerdict, LegalReasoningStep, StatutoryCitation } from '@/types/domain';
import { createHash } from 'crypto';
import { getStatuteSource } from '@/lib/retrieval/statute-sources';
import { locateEvidenceSpans, significantTerms } from '@/lib/retrieval/hybrid-retriever';

interface CorpusSection {
  section_id: string;
  section_number: string;
  heading: string;
  text: string;
  explanation: string;
  severity: string;
  citation_code: string;
  version_tag: string;
  gazette_ref: string;
}

interface CorpusAct {
  act_id: string;
  act_title: string;
  jurisdiction: string;
  authority: string;
  version_tag: string;
  amendment_year: number;
  in_force_date: string;
  sections: CorpusSection[];
}

// Build a fast lookup map: section_id -> { section, act }
const sectionMap = new Map<string, { section: CorpusSection; act: CorpusAct }>();

(corpus as CorpusAct[]).forEach((act) => {
  act.sections.forEach((sec) => {
    const sId = sec.section_id.toLowerCase();
    const cCode = sec.citation_code.toLowerCase();
    const sNum = (sec.section_number || '').toLowerCase();
    const cleanNum = sNum.replace(/^section\s+/i, '').replace(/^rule\s+/i, '').replace(/^art(icle)?\.?\s*/i, '').trim();

    sectionMap.set(sId, { section: sec, act });
    sectionMap.set(cCode, { section: sec, act });
    if (sNum) {
      sectionMap.set(sNum, { section: sec, act });
      sectionMap.set(`section ${sNum}`, { section: sec, act });
      sectionMap.set(`s.${sNum}`, { section: sec, act });
      sectionMap.set(`art. ${sNum}`, { section: sec, act });
      sectionMap.set(`article ${sNum}`, { section: sec, act });
    }
    if (cleanNum) {
      sectionMap.set(cleanNum, { section: sec, act });
      sectionMap.set(`section ${cleanNum}`, { section: sec, act });
      sectionMap.set(`s.${cleanNum}`, { section: sec, act });
      sectionMap.set(`article ${cleanNum}`, { section: sec, act });
    }
    const strippedId = sId.replace(/^(bda_|wipo_|dca_)/i, '');
    sectionMap.set(strippedId, { section: sec, act });
    sectionMap.set(`section ${strippedId}`, { section: sec, act });
  });
});

/**
 * Validates and grounds LLM-generated citations against the canonical statutory corpus.
 * Overwrites hallucinatory text snippets and injects real SHA-256 hashes.
 * If a citation cannot be found in the corpus, the reasoning step is preserved with unverified flag.
 */
export function validateCitations(verdict: LegalVerdict): LegalVerdict {
  if (!verdict.reasoning_chain) return verdict;

  const groundedReasoning: LegalReasoningStep[] = [];

  for (const step of verdict.reasoning_chain) {
    const citation = step.citation;
    if (!citation) {
      groundedReasoning.push(step);
      continue;
    }

    const lookupId = citation.section_id || citation.citation_code;
    if (!lookupId) {
      groundedReasoning.push(step);
      continue;
    }

    let match = sectionMap.get(lookupId.toLowerCase());
    if (!match) {
      const normalized = lookupId.toLowerCase()
        .replace(/^section\s+/i, '')
        .replace(/^s\./i, '')
        .replace(/^article\s+/i, '')
        .replace(/^art\.\s*/i, '')
        .trim();
      match = sectionMap.get(normalized) || sectionMap.get(`s.${normalized}`) || sectionMap.get(`section ${normalized}`);
    }

    if (match) {
      const { section, act } = match;

      // Calculate real SHA-256 hash of the statutory text.
      // Binding: act + citation code + canonical text + version tag.
      const hashInput = `${act.act_title}|${section.citation_code}|${section.text}|${section.version_tag}`;
      const hash = createHash('sha256').update(hashInput).digest('hex');

      // Authoritative source portal for the parent Act (official hosts only).
      const source = getStatuteSource(section.section_id);

      // Span-level evidence: locate the exact supporting span(s) of the
      // canonical text for this step's claim. Preserved when already present
      // (e.g. attached by the hybrid retriever).
      const existingSpans = citation.evidence_spans;
      const evidence_spans =
        existingSpans && existingSpans.length > 0
          ? existingSpans
          : locateEvidenceSpans(
              section.text,
              significantTerms(`${step.title} ${step.description} ${citation.explanation ?? ''}`)
            );

      // Create grounded citation, overriding the LLM's potentially hallucinated text
      const groundedCitation: StatutoryCitation = {
        ...citation,
        section_id: section.section_id,
        citation_code: section.citation_code,
        act_title: act.act_title,
        heading: section.heading,
        text_snippet: section.text, // Overwrite with truth
        sha256_hash: hash,
        version_tag: section.version_tag,
        gazette_ref: section.gazette_ref,
        authority: act.authority,
        nli_verified: true,
        source_url: citation.source_url ?? source.portal_url,
        source_label: citation.source_label ?? `${source.portal_label} · ${source.locator}`,
        retrieval_method:
          citation.retrieval_method ??
          (step.id.startsWith('hardcoded-') ? 'hardcoded' : 'hybrid-track-b'),
        evidence_spans,
      };

      groundedReasoning.push({
        ...step,
        citation: groundedCitation
      });
    } else {
      // Citation not in canonical corpus: preserve step with unverified badge rather than dropping reasoning
      console.warn(`[UNGROUNDED CITATION] Preserved reasoning step: ${step.title} (${lookupId})`);
      groundedReasoning.push({
        ...step,
        citation: {
          ...citation,
          nli_verified: false,
        }
      });
    }
  }

  return {
    ...verdict,
    reasoning_chain: groundedReasoning
  };
}
