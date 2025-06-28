import { NextRequest, NextResponse } from 'next/server';
import { searchWithNaturalLanguage } from '@/lib/ai-helper';

export async function POST(request: NextRequest) {
  try {
    const { action, query, data } = await request.json();

    if (action === 'search') {
      console.log(process.env.OPENAI_API_KEY);
      
      if (!process.env.OPENAI_API_KEY) {
        // Fallback to simple search if no API key
        const filtered = data.filter((item: any) => 
          JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
        );
        return NextResponse.json({ results: filtered });
      }

      const results = await searchWithNaturalLanguage(query, data);
      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('AI API error:', error);
    return NextResponse.json({ 
      error: 'AI service temporarily unavailable',
      results: [] 
    }, { status: 500 });
  }
}