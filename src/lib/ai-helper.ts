import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function searchWithNaturalLanguage(query: string, data: any[]) {
  try {
    const prompt = `
Given this data structure: ${JSON.stringify(data.slice(0, 2), null, 2)}

Convert this natural language query to a JavaScript filter function:
"${query}"

Return only the filter function body that can be used with array.filter()
Example: return item.Duration > 1 && item.PreferredPhases.includes(2)
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    });

    const filterCode = response.choices[0].message.content?.trim() || '';
    
    try {
      // Fix: Cast to the specific function type that filter expects
      const filterFunction = new Function('item', `return ${filterCode}`) as (item: any) => boolean;
      return data.filter(filterFunction);
    } catch (error) {
      console.error('Filter function error:', error);
      return data;
    }
  } catch (error) {
    console.error('AI search error:', error);
    return data;
  }
}

// Alternative approach using eval (use with caution in production)
export async function searchWithNaturalLanguageAlt(query: string, data: any[]) {
  try {
    const prompt = `
Given this data structure: ${JSON.stringify(data.slice(0, 2), null, 2)}

Convert this natural language query to a JavaScript filter function:
"${query}"

Return only the filter function body that can be used with array.filter()
Example: return item.Duration > 1 && item.PreferredPhases.includes(2)
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    });

    const filterCode = response.choices[0].message.content?.trim() || '';
    
    try {
      // Alternative: Use eval with arrow function (be careful with security)
      const filterFunction = eval(`(item) => { ${filterCode} }`);
      return data.filter(filterFunction);
    } catch (error) {
      console.error('Filter function error:', error);
      return data;
    }
  } catch (error) {
    console.error('AI search error:', error);
    return data;
  }
}

// Safer approach with proper typing
export async function searchWithNaturalLanguageTyped<T>(query: string, data: T[]): Promise<T[]> {
  try {
    const prompt = `
Given this data structure: ${JSON.stringify(data.slice(0, 2), null, 2)}

Convert this natural language query to a JavaScript filter function:
"${query}"

Return only the filter function body that can be used with array.filter()
Example: return item.Duration > 1 && item.PreferredPhases.includes(2)
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    });

    const filterCode = response.choices[0].message.content?.trim() || '';
    
    try {
      // Type-safe approach
      const filterFunction: (item: T) => boolean = new Function('item', `return ${filterCode}`) as (item: T) => boolean;
      return data.filter(filterFunction);
    } catch (error) {
      console.error('Filter function error:', error);
      return data;
    }
  } catch (error) {
    console.error('AI search error:', error);
    return data;
  }
}

export async function convertNaturalLanguageToRule(description: string, context: any) {
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
      model: "gpt-3.5-turbo",
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
      model: "gpt-3.5-turbo",
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