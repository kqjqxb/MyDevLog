/**
 * Unit tests for the defensive JSON parser used to read structured agent
 * output. Verifies it survives fenced code blocks and surrounding prose.
 */
import { parseJSON } from '@/services/ai/anthropicClient';
import { AnthropicError } from '@/services/ai/config';

describe('parseJSON', () => {
  it('parses plain JSON', () => {
    expect(parseJSON<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
  });

  it('strips markdown code fences', () => {
    const raw = '```json\n{"ok":true}\n```';
    expect(parseJSON<{ ok: boolean }>(raw)).toEqual({ ok: true });
  });

  it('extracts JSON embedded in prose', () => {
    const raw = 'Here is the result: {"value":42} — hope that helps!';
    expect(parseJSON<{ value: number }>(raw)).toEqual({ value: 42 });
  });

  it('throws a typed parse error on garbage', () => {
    expect(() => parseJSON('not json at all')).toThrow(AnthropicError);
  });
});
