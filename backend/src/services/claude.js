const Anthropic = require('@anthropic-ai/sdk').default;

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function processPDF(pdfText, documentTitle) {
  try {
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: `You are analyzing a legal document for a law student. Extract the following information in JSON format:

Document: ${documentTitle}

Content:
${pdfText}

Return a JSON object with:
- holding: The main legal principle or ruling (1-2 sentences)
- reasoning: Key reasoning or facts supporting the holding (2-3 sentences)
- key_points: Array of 3-5 important points
- statute_references: Array of any statute or regulation references found
- related_doctrine: Any legal doctrine or concept this relates to (e.g., "collective bargaining", "wrongful dismissal")

Respond ONLY with valid JSON.`,
        },
      ],
    });

    const content = response.content[0].text;
    try {
      return JSON.parse(content);
    } catch (e) {
      // If response isn't valid JSON, return it as holding
      return {
        holding: content,
        reasoning: '',
        key_points: [],
        statute_references: [],
        related_doctrine: '',
      };
    }
  } catch (err) {
    console.error('Claude processing error:', err);
    throw err;
  }
}

async function generateFlashcards(documentSummary, caseName, courseId) {
  try {
    const { holding, reasoning, statute_references, related_doctrine } = documentSummary;

    const prompt = `Generate 3-5 flashcards for a law student studying Canadian law.

Case/Document: ${caseName}
Holding: ${holding}
Reasoning: ${reasoning}
Statute References: ${statute_references.join(', ') || 'None'}
Related Doctrine: ${related_doctrine}

Generate flashcards with the following types (mix them):
1. Case brief: Q: "What is the holding in [Case]?" A: holding + key reasoning
2. Doctrine: Q: Legal concept or definition. A: Legal definition + example from this case
3. Statute: Q: Statute section + requirement. A: What the statute mandates + example

Return ONLY a JSON array of objects with: {question, answer, card_type, difficulty, tags}
- difficulty: 1-5 scale
- tags: Array of topic tags (e.g., ["collective-bargaining", "labour-law-1"])
- card_type: "case_brief" | "definition" | "statute"

Example:
[
  {
    "question": "What is the holding in this case?",
    "answer": "The court held that...",
    "card_type": "case_brief",
    "difficulty": 3,
    "tags": ["relevant-topic"]
  }
]

Respond ONLY with valid JSON array.`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0].text;
    try {
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse flashcard JSON:', e);
      return [];
    }
  } catch (err) {
    console.error('Flashcard generation error:', err);
    throw err;
  }
}

module.exports = {
  processPDF,
  generateFlashcards,
};
