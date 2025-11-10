import { Request, Response } from 'express';
import { generateContent } from '../services/gemini.service';
import { AutocompletionRequest, AutocompletionResponse, SuggestionItem } from '../types/autocompletion.types';
import { v4 as uuidv4 } from 'uuid';


export const getAutocompletionSuggestions = async (req: Request, res: Response) => {
  const startTime = Date.now();

  try {
    const {
      text,
      cursorPosition = text?.length || 0,
      context = '',
      documentType = 'general',
      maxSuggestions = 5,
      strategy = 'ai'
    }: AutocompletionRequest = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required and must be a string',
        data: null
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        message: 'Text is too long. Maximum 10,000 characters allowed',
        data: null
      });
    }

    // Generate suggestions using Gemini AI
    console.log('Generating text predictions for:', text.substring(0, 50) + '...');
    const suggestions = await generateTextPredictions(
      text,
      cursorPosition,
      context,
      documentType,
      maxSuggestions
    );

    const processingTime = Date.now() - startTime;

    const response: AutocompletionResponse = {
      suggestions,
      strategy: strategy || 'ai',
      processingTime,
      hasMore: false // For now, we return all suggestions at once
    };

    res.json({
      success: true,
      message: 'Autocompletion suggestions generated successfully',
      data: response
    });

  } catch (error) {
    console.error('Autocompletion error:', error);

    const processingTime = Date.now() - startTime;

    res.status(500).json({
      success: false,
      message: 'Failed to generate autocompletion suggestions',
      data: {
        suggestions: [],
        strategy: 'ai',
        processingTime,
        hasMore: false
      }
    });
  }
};

/**
 * Generate text predictions using Gemini AI
 */
async function generateTextPredictions(
  text: string,
  cursorPosition: number,
  context: string,
  documentType: string,
  maxSuggestions: number
): Promise<SuggestionItem[]> {
  try {
    console.log('Starting text prediction generation...');
    // Split text at cursor position
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);

    // Create context-aware prompt for Gemini
    console.log('Creating prompt...');
    const prompt = createAutocompletionPrompt(beforeCursor, afterCursor, context, documentType, maxSuggestions);
    console.log('Prompt created, length:', prompt.length);

    // Generate content using Gemini
    console.log('Calling Gemini API...');
    const geminiResponse = await generateContent(prompt, 'gemini-1.5-flash');
    console.log('Gemini response received, length:', geminiResponse.length);

    // Parse and format the response into suggestions
    console.log('Parsing response...');
    const suggestions = parseGeminiResponse(geminiResponse, maxSuggestions);
    console.log('Generated suggestions count:', suggestions.length);

    return suggestions;
  } catch (error: any) {
    console.error('Error generating text predictions:', error.message);

    // Handle quota exceeded gracefully
    if (error.status === 429 || error.message?.includes('quota')) {
      console.log('Quota exceeded, returning fallback suggestions');
      return createQuotaExceededSuggestions(text.substring(0, cursorPosition));
    }

    // For other errors, return fallback suggestions
    console.log('API error, returning fallback suggestions');
    return createDefaultSuggestions();
  }
}

/**
 * Create a well-structured prompt for Gemini AI
 */
function createAutocompletionPrompt(
  beforeCursor: string,
  afterCursor: string,
  context: string,
  documentType: string,
  maxSuggestions: number
): string {
  const contextInfo = context ? `\nContext: ${context}` : '';
  const afterCursorInfo = afterCursor ? `\nText after cursor: "${afterCursor}"` : '';

  const documentTypeInstructions = getDocumentTypeInstructions(documentType);

  return `You are an advanced text completion AI. Your task is to predict and suggest the most appropriate text continuation.

Text before cursor: "${beforeCursor}"${afterCursorInfo}${contextInfo}
Document type: ${documentType}
${documentTypeInstructions}

Please provide ${maxSuggestions} different text completion suggestions that would naturally continue from where the cursor is positioned. Each suggestion should:
1. Be contextually appropriate and grammatically correct
2. Flow naturally from the existing text
3. Be between 1-15 words long
4. Be relevant to the document type
5. Offer variety in completion style (short phrases, longer continuations, different directions)

Format your response as a JSON array with objects containing:
- "text": the suggested completion text
- "type": one of "completion", "continuation", or "replacement"
- "confidence": a number between 0 and 1 representing your confidence
- "preview": a brief description of what the suggestion does

Example format:
[
  {
    "text": "suggested completion text",
    "type": "continuation",
    "confidence": 0.9,
    "preview": "Continues the sentence about..."
  }
]

Respond ONLY with the JSON array, no additional text or explanations.`;
}

/**
 * Get document type specific instructions
 */
function getDocumentTypeInstructions(documentType: string): string {
  switch (documentType) {
    case 'email':
      return 'Focus on professional, clear, and courteous language appropriate for email communication.';
    case 'article':
      return 'Use engaging, informative language suitable for article writing with good flow and readability.';
    case 'code':
      return 'Suggest code completions that are syntactically correct and follow best practices.';
    case 'general':
    default:
      return 'Provide natural, contextually appropriate text completions.';
  }
}

/**
 * Parse Gemini response and convert to SuggestionItem array
 */
function parseGeminiResponse(geminiResponse: string, maxSuggestions: number): SuggestionItem[] {
  try {
    // Try to parse as JSON first
    let parsedResponse: any[];

    try {
      // Clean the response - remove any markdown formatting
      const cleanedResponse = geminiResponse
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      parsedResponse = JSON.parse(cleanedResponse);
    } catch (parseError) {
      // If JSON parsing fails, create fallback suggestions
      console.warn('Failed to parse Gemini JSON response, creating fallback suggestions');
      return createFallbackSuggestions(geminiResponse, maxSuggestions);
    }

    // Validate and format the parsed response
    if (!Array.isArray(parsedResponse)) {
      throw new Error('Response is not an array');
    }

    const suggestions: SuggestionItem[] = parsedResponse
      .slice(0, maxSuggestions)
      .map((item, index) => ({
        id: uuidv4(),
        text: item.text || `Suggestion ${index + 1}`,
        type: validateSuggestionType(item.type),
        confidence: Math.max(0, Math.min(1, item.confidence || 0.7)),
        preview: item.preview || 'AI generated suggestion',
        context: item.context || undefined
      }))
      .filter(suggestion => suggestion.text && suggestion.text.length > 0);

    return suggestions.length > 0 ? suggestions : createDefaultSuggestions();

  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return createFallbackSuggestions(geminiResponse, maxSuggestions);
  }
}

/**
 * Validate suggestion type
 */
function validateSuggestionType(type: string): 'completion' | 'continuation' | 'replacement' {
  const validTypes = ['completion', 'continuation', 'replacement'];
  return validTypes.includes(type) ? type as any : 'continuation';
}

/**
 * Create fallback suggestions when JSON parsing fails
 */
function createFallbackSuggestions(response: string, maxSuggestions: number): SuggestionItem[] {
  // Split response into lines and use them as suggestions
  const lines = response
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('[') && !line.startsWith('{'))
    .slice(0, maxSuggestions);

  if (lines.length === 0) {
    return createDefaultSuggestions();
  }

  return lines.map((line, index) => ({
    id: uuidv4(),
    text: line,
    type: 'continuation' as const,
    confidence: 0.6 - (index * 0.1),
    preview: `AI suggestion ${index + 1}`
  }));
}

/**
 * Create quota exceeded suggestions with context-aware fallbacks
 */
function createQuotaExceededSuggestions(beforeCursor: string): SuggestionItem[] {
  const contextualSuggestions = generateContextualSuggestions(beforeCursor);

  return contextualSuggestions.map((suggestion, index) => ({
    id: uuidv4(),
    text: suggestion.text,
    type: suggestion.type as 'completion' | 'continuation' | 'replacement',
    confidence: 0.7 - (index * 0.1),
    preview: suggestion.preview + ' (Offline suggestion)'
  }));
}

/**
 * Generate contextual suggestions based on the text before cursor
 */
function generateContextualSuggestions(beforeCursor: string): Array<{ text: string, type: string, preview: string }> {
  const text = beforeCursor.toLowerCase().trim();
  const lastWord = text.split(' ').pop() || '';
  const lastSentence = text.split(/[.!?]/).pop() || '';

  // Email-specific suggestions
  if (text.includes('dear') || text.includes('hi') || text.includes('hello')) {
    return [
      { text: ', I hope this email finds you well.', type: 'continuation', preview: 'Polite email opening' },
      { text: ', I wanted to reach out regarding', type: 'continuation', preview: 'Professional inquiry' },
      { text: ', thank you for your time.', type: 'continuation', preview: 'Appreciation' }
    ];
  }

  // Question completions
  if (lastSentence.includes('what') || lastSentence.includes('how') || lastSentence.includes('when') || lastSentence.includes('where')) {
    return [
      { text: ' do you think?', type: 'completion', preview: 'Question completion' },
      { text: ' would be best?', type: 'completion', preview: 'Choice question' },
      { text: ' should we proceed?', type: 'completion', preview: 'Action question' }
    ];
  }

  // Common word completions
  const wordCompletions: { [key: string]: Array<{ text: string, type: string, preview: string }> } = {
    'the': [
      { text: ' best way to', type: 'continuation', preview: 'Superlative phrase' },
      { text: ' main reason', type: 'continuation', preview: 'Explanation starter' },
      { text: ' most important', type: 'continuation', preview: 'Priority phrase' }
    ],
    'i': [
      { text: ' believe that', type: 'continuation', preview: 'Opinion statement' },
      { text: ' would like to', type: 'continuation', preview: 'Polite request' },
      { text: ' think we should', type: 'continuation', preview: 'Suggestion' }
    ],
    'we': [
      { text: ' need to', type: 'continuation', preview: 'Necessity statement' },
      { text: ' should consider', type: 'continuation', preview: 'Proposal' },
      { text: ' can work together', type: 'continuation', preview: 'Collaboration' }
    ]
  };

  if (wordCompletions[lastWord]) {
    return wordCompletions[lastWord];
  }

  // Default contextual suggestions
  return [
    { text: ' and', type: 'completion', preview: 'Connect ideas' },
    { text: ' that', type: 'completion', preview: 'Specify subject' },
    { text: ' to', type: 'completion', preview: 'Purpose or direction' },
    { text: '.', type: 'completion', preview: 'End sentence' },
    { text: ' with', type: 'completion', preview: 'Add accompaniment' }
  ];
}

/**
 * Create default suggestions as last resort
 */
function createDefaultSuggestions(): SuggestionItem[] {
  const defaultSuggestions = [
    { text: ' and', preview: 'Connect with "and"' },
    { text: ' that', preview: 'Continue with "that"' },
    { text: ' to', preview: 'Continue with "to"' },
    { text: '.', preview: 'End sentence' },
    { text: ' with', preview: 'Continue with "with"' }
  ];

  return defaultSuggestions.map((suggestion, index) => ({
    id: uuidv4(),
    text: suggestion.text,
    type: 'completion' as const,
    confidence: 0.5 - (index * 0.05),
    preview: suggestion.preview
  }));
}

/**
 * Alternative function for simple text prediction (without complex formatting)
 */
export const predictNextText = async (inputText: string, context?: string): Promise<string> => {
  try {
    const prompt = `Continue this text naturally: "${inputText}"${context ? `\nContext: ${context}` : ''}
    
Provide a natural continuation (1-10 words) that flows well with the existing text. Respond with only the continuation text, no explanations.`;

    // Generate content using Gemini
    const prediction = await generateContent(prompt, 'gemini-1.5-flash');
    return prediction.trim();
  } catch (error: any) {
    console.error('Error predicting next text:', error.message);

    // Handle quota exceeded or other errors with fallback
    if (error.status === 429 || error.message?.includes('quota')) {
      return generateSimpleFallback(inputText);
    }

    // For other errors, return a generic fallback
    return generateSimpleFallback(inputText);
  }
};

/**
 * Generate a simple fallback prediction when API is unavailable
 */
function generateSimpleFallback(text: string): string {
  const words = text.trim().split(' ');
  const lastWord = words[words.length - 1]?.toLowerCase() || '';

  // Simple rule-based completions
  const completions: { [key: string]: string[] } = {
    'the': ['best way', 'main reason', 'most important thing'],
    'i': ['think', 'believe', 'would like to'],
    'we': ['need to', 'should', 'can'],
    'you': ['can', 'should', 'might want to'],
    'it': ['is', 'was', 'will be'],
    'this': ['is', 'will', 'should'],
    'that': ['is', 'was', 'will']
  };

  if (completions[lastWord]) {
    const options = completions[lastWord];
    return options[Math.floor(Math.random() * options.length)];
  }

  // If no specific completion, return common connectors
  const connectors = ['and', 'but', 'so', 'that', 'with', 'for'];
  return connectors[Math.floor(Math.random() * connectors.length)];
}
