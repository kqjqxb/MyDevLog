import axios, { AxiosInstance, isAxiosError } from 'axios';

import { ANTHROPIC_CONFIG, AnthropicError } from './config';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SendOptions {
  apiKey: string;
  system: string;
  messages: ClaudeMessage[];
  maxTokens?: number;
  /**
   * When provided, the request constrains Claude's output to this JSON schema
   * via `output_config.format`, guaranteeing parseable structured output.
   */
  jsonSchema?: { name: string; schema: Record<string, unknown> };
}

interface ContentBlock {
  type: string;
  text?: string;
}

interface MessagesResponse {
  content: ContentBlock[];
  stop_reason: string | null;
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 529]);

function buildClient(apiKey: string): AxiosInstance {
  return axios.create({
    baseURL: ANTHROPIC_CONFIG.baseURL,
    timeout: ANTHROPIC_CONFIG.timeoutMs,
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_CONFIG.apiVersion,
    },
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function mapAxiosError(error: unknown): AnthropicError {
  if (isAxiosError(error)) {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      return new AnthropicError('auth', 'Invalid or unauthorized API key.');
    }
    if (status === 429) {
      return new AnthropicError('rate-limit', 'Rate limited by the API.');
    }
    if (error.code === 'ECONNABORTED' || error.message.includes('Network')) {
      return new AnthropicError('network', 'Network request failed.');
    }
    return new AnthropicError('unknown', error.message);
  }
  return new AnthropicError('unknown', 'Unexpected error contacting Claude.');
}

/**
 * Low-level call to the Messages API. Handles retries with exponential
 * backoff for transient (429/5xx) failures and returns the concatenated text.
 */
export async function sendMessage(options: SendOptions): Promise<string> {
  const { apiKey, system, messages, maxTokens, jsonSchema } = options;

  if (!apiKey.trim()) {
    throw new AnthropicError('missing-key', 'No API key configured.');
  }

  const client = buildClient(apiKey);
  const body: Record<string, unknown> = {
    model: ANTHROPIC_CONFIG.model,
    max_tokens: maxTokens ?? ANTHROPIC_CONFIG.defaultMaxTokens,
    // Thinking disabled keeps latency low and the response a single text block.
    thinking: { type: 'disabled' },
    system,
    messages,
  };

  if (jsonSchema) {
    body.output_config = {
      format: {
        type: 'json_schema',
        name: jsonSchema.name,
        schema: jsonSchema.schema,
      },
    };
  }

  let lastError: AnthropicError | null = null;

  for (let attempt = 0; attempt <= ANTHROPIC_CONFIG.maxRetries; attempt += 1) {
    try {
      const { data } = await client.post<MessagesResponse>('/messages', body);
      const text = data.content
        .filter(block => block.type === 'text' && typeof block.text === 'string')
        .map(block => block.text)
        .join('')
        .trim();

      if (!text) {
        throw new AnthropicError('parse', 'Claude returned an empty response.');
      }
      return text;
    } catch (error) {
      const mapped = error instanceof AnthropicError ? error : mapAxiosError(error);
      lastError = mapped;

      const status = isAxiosError(error) ? error.response?.status : undefined;
      const retryable =
        mapped.kind === 'network' || (status !== undefined && RETRYABLE_STATUS.has(status));

      if (retryable && attempt < ANTHROPIC_CONFIG.maxRetries) {
        await sleep(2 ** attempt * 600);
        continue;
      }
      throw mapped;
    }
  }

  throw lastError ?? new AnthropicError('unknown', 'Request failed.');
}

/**
 * Calls the API expecting structured output and parses it. Even with
 * `output_config.format`, we defensively extract the first JSON object/array
 * in case the model wraps it (older models, edge cases).
 */
export async function sendStructured<T>(options: SendOptions): Promise<T> {
  const raw = await sendMessage(options);
  return parseJSON<T>(raw);
}

/** Robust JSON extraction: handles fenced code blocks and surrounding prose. */
export function parseJSON<T>(raw: string): T {
  const cleaned = raw
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]) as T;
      } catch {
        // fall through
      }
    }
    throw new AnthropicError('parse', 'Claude returned an unexpected response.');
  }
}
