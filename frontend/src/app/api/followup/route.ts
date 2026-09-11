import { NextResponse } from 'next/server';
import { answerFollowUp, FollowUpContext } from '@/lib/domain-engine/followup-responder';

/**
 * POST /api/followup — contextual Q&A grounded ONLY in the current verdict.
 * Body: { question: string, context: FollowUpContext }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, context } = body as { question?: string; context?: FollowUpContext };

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'Missing required field: question' }, { status: 400 });
    }
    if (!context || typeof context !== 'object') {
      return NextResponse.json({ error: 'Missing required field: context' }, { status: 400 });
    }

    const result = answerFollowUp(question.trim().slice(0, 1000), {
      ...context,
      botanicals: Array.isArray(context.botanicals) ? context.botanicals : [],
      reasoning: Array.isArray(context.reasoning) ? context.reasoning : [],
      gaps: Array.isArray(context.gaps) ? context.gaps : [],
      routes: Array.isArray(context.routes) ? context.routes : [],
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error in /api/followup:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
