import { LegalVerdict } from '@/types/domain';

/**
 * Exports a structured Markdown advisory report from a Legal Verdict
 */
export function generateAdvisoryMemoMarkdown(verdict: LegalVerdict): string {
  const timestamp = new Date().toISOString().split('T')[0];

  let markdown = `# IP-SAKTI Sahayak — Statutory IP Advisory Report
**Date:** ${timestamp}  
**Project Ref:** SIH26045 | Ministry of Ayush  
**Query:** "${verdict.query}"  

---

## 1. Statutory Verdict
**Verdict:** ${verdict.verdict_title}  
**Confidence Score:** ${(verdict.confidence_score * 100).toFixed(0)}%  
${verdict.abstain ? `**Abstention Notice:** ${verdict.abstention_reason}\n` : ''}
---

## 2. Botanical Entity Resolution
${verdict.resolved_botanicals.length > 0 ? verdict.resolved_botanicals.map(b => `- **${b.sanskrit_name}** (${b.english_common_name}) → *${b.botanical_binomial}* [AFI Ref: ${b.afi_reference || 'N/A'}]`).join('\n') : 'No specific Ayurvedic botanical species identified.'}

---

## 3. Statutory Reasoning Chain & Citations
`;

  verdict.reasoning_chain.forEach(step => {
    markdown += `### ${step.step_number}. ${step.title} [Severity: ${step.severity}]
- **Statute Code:** \`${step.citation.citation_code}\`
- **Statutory Heading:** ${step.citation.heading}
- **Legal Analysis:** ${step.description}
- **Statutory Text Snippet:**
  > "${step.citation.text_snippet}"
- **Cryptographic Hash (SHA-256):** ${step.citation.sha256_hash ? `\`${step.citation.sha256_hash}\`` : '**UNVERIFIED**'}

`;
  });

  if (verdict.precedent_case) {
    markdown += `## 4. Landmark Biopiracy Precedent
- **Precedent Record:** ${verdict.precedent_case}

`;
  }

  markdown += `## 5. Recommended Protection Routes
`;
  verdict.viable_routes.forEach((route, i) => {
    markdown += `### Route ${i + 1}: ${route.title} (${route.type})
${route.description}

**Actionable Steps:**
${route.actionable_steps.map(s => `- ${s}`).join('\n')}

`;
  });

  markdown += `---
*Disclaimer: This document provides statutory legal guidance based on public Indian and international IP acts. It does not replace advice from a registered Patent Agent or Attorney.*
`;

  return markdown;
}

/**
 * Triggers browser download of advisory memo as a .md file
 */
export function downloadAdvisoryMemoFile(verdict: LegalVerdict) {
  const mdContent = generateAdvisoryMemoMarkdown(verdict);
  const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `IP_SAKTI_Advisory_Memo_${Date.now()}.md`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
