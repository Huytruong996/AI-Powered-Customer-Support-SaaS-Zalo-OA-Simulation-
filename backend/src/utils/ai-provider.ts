/**
 * AI Provider Abstraction Layer
 * Supports switching between Gemini and OpenRouter via environment variable.
 */

export interface AIProvider {
  generateReply(message: string, context?: string): Promise<string>;
  generateReplyStream(message: string, context?: string): AsyncGenerator<string, void, unknown>;
  generateEmbedding(text: string): Promise<number[]>;
}

// Helper to parse SSE streams
async function* parseSSE(response: Response): AsyncGenerator<string, void, unknown> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split('\n\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        yield data;
      }
    }
  }
  
  if (buffer.startsWith('data: ')) {
     const data = buffer.slice(6).trim();
     if (data && data !== '[DONE]') yield data;
  }
}

export class GeminiProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateReply(message: string, context?: string): Promise<string> {
    try {
      const systemPrompt = context || 'You are a helpful customer support assistant. Reply concisely and professionally in Vietnamese.';
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: `${systemPrompt}\n\nCustomer message: ${message}\n\nReply:` },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Unable to generate reply.';
    } catch (error) {
      console.error('GeminiProvider error:', error);
      throw error;
    }
  }

  async *generateReplyStream(message: string, context?: string): AsyncGenerator<string, void, unknown> {
    const systemPrompt = context || 'You are a helpful customer support assistant. Reply concisely and professionally in Vietnamese.';
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `${systemPrompt}\n\nCustomer message: ${message}\n\nReply:` },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    for await (const data of parseSSE(response)) {
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch (e) {
        // Ignore parse errors for incomplete chunks
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'models/text-embedding-004',
            content: {
              parts: [{ text }],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error (Embedding): ${response.status}`);
      }

      const data = await response.json();
      return data.embedding?.values || [];
    } catch (error) {
      console.error('GeminiProvider embedding error:', error);
      throw error;
    }
  }
}

export class OpenRouterProvider implements AIProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateReply(message: string, context?: string): Promise<string> {
    try {
      const systemPrompt = context || 'You are a helpful customer support assistant. Reply concisely and professionally in Vietnamese.';
      console.log(systemPrompt)
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'openrouter/free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'Unable to generate reply.';
    } catch (error) {
      console.error('OpenRouterProvider error:', error);
      throw error;
    }
  }

  async *generateReplyStream(message: string, context?: string): AsyncGenerator<string, void, unknown> {
    const systemPrompt = context || 'You are a helpful customer support assistant. Reply concisely and professionally in Vietnamese.';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: 'openrouter/free',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    for await (const data of parseSSE(response)) {
      try {
        const parsed = JSON.parse(data);
        const text = parsed.choices?.[0]?.delta?.content;
        if (text) yield text;
      } catch (e) {
        // Ignore parse errors for incomplete chunks
      }
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // We will use Gemini for embeddings regardless, or return empty if no key.
    // Assuming OpenRouter setup for text gen, we might not have a free embedding.
    // For now, if someone uses OpenRouter, they need to supply an embedding API or we return [].
    console.warn("OpenRouter doesn't support a standard free embedding. Please use Gemini for RAG.");
    return [];
  }
}

/**
 * Factory function to create an AI provider based on configuration.
 */
export function createAIProvider(provider: string, apiKey: string): AIProvider {
  switch (provider.toLowerCase()) {
    case 'gemini':
      return new GeminiProvider(apiKey);
    case 'openrouter':
      return new OpenRouterProvider(apiKey);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
