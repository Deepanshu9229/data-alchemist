import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export async function searchWithNaturalLanguage(query: string, data: any[]) {
  if (!openai) {
    console.log('OpenAI API key not configured, using fallback search');
    // Fallback to simple text search
    return data.filter(item => 
      JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
    );
  }

  try {
    const prompt = `
Given this data structure: ${JSON.stringify(data.slice(0, 2), null, 2)}

Convert this natural language query to a JavaScript filter function:
"${query}"

Return only the filter function body that can be used with array.filter()
Example: return item.Duration > 1 && item.PreferredPhases.includes(2)

Important: Only return the code inside the return statement, no function declaration.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    });

    const filterCode = response.choices[0].message.content?.trim() || '';
    
    try {
      // Create a safe filter function
      const filterFunction = new Function('item', `try { return ${filterCode}; } catch(e) { return false; }`) as (item: any) => boolean;
      return data.filter(filterFunction);
    } catch (error) {
      console.error('Filter function error:', error);
      // Fallback to simple search
      return data.filter(item => 
        JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
      );
    }
  } catch (error) {
    console.error('AI search error:', error);
    // Fallback to simple search
    return data.filter(item => 
      JSON.stringify(item).toLowerCase().includes(query.toLowerCase())
    );
  }
}

export async function convertNaturalLanguageToRule(description: string, context: any) {
  if (!openai) {
    console.log('OpenAI API key not configured');
    return null;
  }

  try {
    const prompt = `
Convert this business rule description to a structured rule object:
"${description}"

Available rule types:
- coRun: { type: "coRun", tasks: ["T1", "T2"], description: "..." }
- slotRestriction: { type: "slotRestriction", group: "...", minCommonSlots: 2, description: "..." }
- loadLimit: { type: "loadLimit", workerGroup: "...", maxSlotsPerPhase: 3, description: "..." }
- phaseWindow: { type: "phaseWindow", taskId: "...", allowedPhases: [1,2,3], description: "..." }

Context data: ${JSON.stringify(context, null, 2)}

Return only valid JSON object with id field added.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
      max_tokens: 300
    });

    const ruleJson = response.choices[0].message.content?.trim() || '{}';
    const rule = JSON.parse(ruleJson);
    rule.id = Date.now().toString();
    return rule;
  } catch (error) {
    console.error('Rule conversion error:', error);
    return null;
  }
}

export async function suggestDataFixes(errors: any[], data: any[]) {
  if (!openai) {
    console.log('OpenAI API key not configured');
    return [];
  }

  try {
    const prompt = `
Data validation errors found:
${JSON.stringify(errors.slice(0, 5), null, 2)}

Sample data:
${JSON.stringify(data.slice(0, 3), null, 2)}

Suggest specific fixes for these errors. Return JSON array of fix suggestions:
[{
  "errorIndex": 0,
  "suggestedFix": "Set PriorityLevel to 3",
  "field": "PriorityLevel",
  "newValue": 3,
  "confidence": 0.9
}]
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    return JSON.parse(response.choices[0].message.content || '[]');
  } catch (error) {
    console.error('Fix suggestion error:', error);
    return [];
  }
}