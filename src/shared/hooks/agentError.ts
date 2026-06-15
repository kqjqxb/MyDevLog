import { AnthropicError } from '@/services/ai';
import { STRINGS } from '@/shared/constants';

/** Maps a thrown error to a friendly, user-facing message. */
export function toAgentErrorMessage(error: unknown): string {
  if (error instanceof AnthropicError) {
    switch (error.kind) {
      case 'missing-key':
        return STRINGS.errors.missingKey;
      case 'auth':
        return STRINGS.errors.auth;
      case 'rate-limit':
        return STRINGS.errors.rateLimited;
      case 'network':
        return STRINGS.errors.network;
      case 'parse':
        return STRINGS.errors.parse;
      default:
        return STRINGS.errors.generic;
    }
  }
  return STRINGS.errors.generic;
}
