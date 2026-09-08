import { NextResponse } from 'next/server';
import { analyzeFormulationQuery } from '@/lib/domain-engine/statutory-rule-engine';
import { Jurisdiction, SupportedLanguage, LegalVerdict } from '@/types/domain';

// Simple bounded in-memory LRU cache for hackathon demo
const _verdictCache = new Map<string, LegalVerdict>();
const MAX_CACHE_SIZE = 100;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query, jurisdiction = 'INDIA', language = 'EN' } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Missing required field: query' },
        { status: 400 }
      );
    }

    const cacheKey = `${query.trim().toLowerCase()}_${jurisdiction}_${language}`;
    const cachedVerdict = _verdictCache.get(cacheKey);
    if (cachedVerdict) {
      console.log(`[API] Cache hit for ${cacheKey}`);
      _verdictCache.delete(cacheKey);
      _verdictCache.set(cacheKey, cachedVerdict);
      return NextResponse.json(cachedVerdict);
    }

    const verdict = await analyzeFormulationQuery(
      query, 
      jurisdiction as Jurisdiction,
      language as SupportedLanguage
    );
    
    // Only cache successful verdicts, do not cache fallback errors
    if (verdict.confidence_score !== 0.0) {
      _verdictCache.set(cacheKey, verdict);
      
      // Enforce max cache size by deleting oldest item
      if (_verdictCache.size > MAX_CACHE_SIZE) {
        const firstKey = _verdictCache.keys().next().value;
        if (firstKey) _verdictCache.delete(firstKey);
      }
    }

    return NextResponse.json(verdict);
  } catch (error) {
    console.error('API Error in /api/verdict:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
