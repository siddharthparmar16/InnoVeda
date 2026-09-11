import botanicalOntology from '@/data/ontology/ayurvedic_botanical_ontology.json';
import { BotanicalEntity } from '@/types/domain';
import { normalizeQueryText } from './transliteration-normalizer';

/**
 * Resolves Ayurvedic & botanical entities present in user query
 */
export function resolveBotanicalEntities(query: string): BotanicalEntity[] {
  const normalizedQuery = normalizeQueryText(query);
  const matchedEntities: BotanicalEntity[] = [];

  // Sort ontology by longest sanskrit name to prevent partial matches
  const sortedOntology = [...botanicalOntology].sort(
    (a, b) => b.sanskrit_name.length - a.sanskrit_name.length
  );

  for (const drug of sortedOntology) {
    const aliases = [
      drug.sanskrit_name,
      drug.english_common_name,
      drug.hindi_name,
      drug.marathi_name,
      drug.tamil_name,
      drug.botanical_binomial
    ].filter(Boolean) as string[];

    // Sort aliases by length descending
    aliases.sort((a, b) => b.length - a.length);

    let matchedAlias: string | undefined;

    for (const alias of aliases) {
      const aliasLower = alias.toLowerCase();
      // Use regex with word boundaries to avoid matching inside other words
      const escapedAlias = aliasLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedAlias}\\b`, 'i');

      if (regex.test(normalizedQuery)) {
        matchedAlias = alias;
        break;
      }
    }

    if (matchedAlias) {
      matchedEntities.push({
        ...(drug as BotanicalEntity),
        matched_alias: matchedAlias
      });
      continue;
    }

    // Fallback: match "<Genus> <species>" short binomial (e.g. query says
    // "Tinospora cordifolia" but ontology stores "Tinospora cordifolia (Willd.) Miers").
    const binomial = String((drug as Record<string, unknown>)['botanical_binomial'] ?? '');
    const bm = binomial.match(/^([A-Z][a-z]+)\s+([a-z]+)/);
    if (bm) {
      const short = `${bm[1]} ${bm[2]}`.toLowerCase();
      const escapedShort = short.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`\\b${escapedShort}\\b`, 'i').test(normalizedQuery)) {
        matchedEntities.push({
          ...(drug as BotanicalEntity),
          matched_alias: short,
        });
      }
    }
  }

  return matchedEntities;
}
