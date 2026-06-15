/** Anthropic REST API configuration shared by the client and agents. */
export const ANTHROPIC_CONFIG = {
  baseURL: 'https://api.anthropic.com/v1',
  /** Model is fixed per the assignment spec. */
  model: 'claude-sonnet-4-6',
  apiVersion: '2023-06-01',
  /** Per-request timeout (ms). Agents can be slow; give them headroom. */
  timeoutMs: 60_000,
  maxRetries: 2,
  defaultMaxTokens: 2048,
} as const;

export type AnthropicErrorKind =
  | 'missing-key'
  | 'auth'
  | 'rate-limit'
  | 'network'
  | 'parse'
  | 'unknown';

/** Typed error surfaced to hooks/UI so they can render the right message. */
export class AnthropicError extends Error {
  readonly kind: AnthropicErrorKind;

  constructor(kind: AnthropicErrorKind, message: string) {
    super(message);
    this.name = 'AnthropicError';
    this.kind = kind;
  }
}
