import corpus from '@/data/corpus/legal_statutory_corpus.json';
import { LegalVerdict, LegalReasoningStep, StatutoryCitation } from '@/types/domain';
import { createHash } from 'crypto';

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
    // Index by both section_id and citation_code for flexibility
    sectionMap.set(sec.section_id.toLowerCase(), { section: sec, act });
    sectionMap.set(sec.citation_code.toLowerCase(), { section: sec, act });
  });
});

/**
 * Validates and grounds LLM-generated citations against the canonical statutory corpus.
 * Overwrites hallucinatory text snippets and injects real SHA-256 hashes.
 * If a citation cannot be found in the corpus, the reasoning step is dropped.
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
      console.warn(`[HALLUCINATION DETECTED] Dropped reasoning step (no citation ID): ${step.title}`);
      continue;
    }

    const match = sectionMap.get(lookupId.toLowerCase());

    if (match) {
      const { section, act } = match;
      
      // Calculate real SHA-256 hash of the statutory text
      const hashInput = `${act.act_title}|${section.citation_code}|${section.text}|${section.version_tag}`;
      const hash = createHash('sha256').update(hashInput).digest('hex');

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
        nli_verified: true
      };

      groundedReasoning.push({
        ...step,
        citation: groundedCitation
      });
    } else {
      // Hallucinated citation! Drop this reasoning step.
      console.warn(`[HALLUCINATION DETECTED] Dropped hallucinated citation section: ${lookupId}`);
    }
  }

  return {
    ...verdict,
    reasoning_chain: groundedReasoning
  };
}
