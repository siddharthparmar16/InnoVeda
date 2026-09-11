/**
 * Authoritative source map for the Cryptographic Citation Vault.
 *
 * NOTE ON HONESTY: only official host portals are linked (hosts verified to
 * exist). Per-section deep PDF links on India Code use unstable session
 * handles, so each citation carries the official portal URL plus an exact
 * section locator (Act + section + version tag) instead of a fabricated
 * deep link. The SHA-256 hash binds the quoted text to the version tag so
 * any drift is detectable.
 */

export interface StatuteSource {
  portal_url: string;
  portal_label: string;
  locator: string;
}

const ACT_SOURCES: Record<string, StatuteSource> = {
  PATENTS_ACT_1970: {
    portal_url: 'https://www.indiacode.nic.in',
    portal_label: 'India Code — official statute portal (Act 39 of 1970)',
    locator: 'The Patents Act, 1970 (Act 39 of 1970)',
  },
  BIOLOGICAL_DIVERSITY_ACT_2002: {
    portal_url: 'https://nbaindia.org',
    portal_label: 'National Biodiversity Authority — official portal (Act 18 of 2003)',
    locator: 'The Biological Diversity Act, 2002 (Act 18 of 2003)',
  },
  WIPO_GRATK_2024: {
    portal_url: 'https://www.wipo.int',
    portal_label: 'WIPO — official treaty portal (WIPO/GRATK/DC/10)',
    locator: 'WIPO Treaty on IP, Genetic Resources and Associated TK (2024)',
  },
  DRUGS_AND_COSMETICS_ACT_1940: {
    portal_url: 'https://ayush.gov.in',
    portal_label: 'Ministry of Ayush — official portal (D&C Rules 1945, ASU provisions)',
    locator: 'Drugs and Cosmetics Act, 1940 & Rules 1945',
  },
};

const SECTION_TO_ACT: Record<string, string> = {
  's.3(p)': 'PATENTS_ACT_1970',
  's.3(d)': 'PATENTS_ACT_1970',
  's.3(e)': 'PATENTS_ACT_1970',
  's.3(h)': 'PATENTS_ACT_1970',
  's.10(4)(d)': 'PATENTS_ACT_1970',
  'bda_s.6(1)': 'BIOLOGICAL_DIVERSITY_ACT_2002',
  'bda_s.3': 'BIOLOGICAL_DIVERSITY_ACT_2002',
  'bda_s.7': 'BIOLOGICAL_DIVERSITY_ACT_2002',
  'wipo_art.3': 'WIPO_GRATK_2024',
  'wipo_art.4': 'WIPO_GRATK_2024',
  'dca_rule.158a': 'DRUGS_AND_COSMETICS_ACT_1940',
  'dca_rule.158b': 'DRUGS_AND_COSMETICS_ACT_1940',
  'dca_sched.t': 'DRUGS_AND_COSMETICS_ACT_1940',
};

const GENERIC_SOURCE: StatuteSource = {
  portal_url: 'https://www.indiacode.nic.in',
  portal_label: 'India Code — official statute portal',
  locator: 'Indian statute book',
};

/** Resolves the authoritative source for a section_id (case-insensitive). */
export function getStatuteSource(sectionId: string): StatuteSource {
  const actId = SECTION_TO_ACT[sectionId.toLowerCase()];
  if (actId && ACT_SOURCES[actId]) return ACT_SOURCES[actId];
  return GENERIC_SOURCE;
}
