import { NextRequest, NextResponse } from 'next/server';
import { searchWithNaturalLanguage, convertNaturalLanguageToRule, suggestDataFixes } from '@/lib/ai-helper';

export async function POST(request: NextRequest) {
  try {
    const { action, query, data, description, context, errors } = await request.json();

    switch (action) {
      case 'search':
        const searchResults = await searchWithNaturalLanguage(query, data);
        return NextResponse.json({ results: searchResults });

      case 'convertRule':
        const rule = await convertNaturalLanguageToRule(description, context);
        return NextResponse.json(rule);

      case 'suggestFixes':
        const fixes = await suggestDataFixes(errors, data);
        return NextResponse.json({ fixes });

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 });
  }
}