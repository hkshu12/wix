import { describe, expect, it } from 'vitest';
import { githubApiHeaders } from './appMeta';

function isIso88591(text: string): boolean {
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) > 0xff) {
      return false;
    }
  }
  return true;
}

describe('githubApiHeaders', () => {
  it('uses only ISO-8859-1 header values so fetch can construct Headers', () => {
    const headers = githubApiHeaders();
    for (const [name, value] of Object.entries(headers)) {
      expect(isIso88591(name), `header name: ${name}`).toBe(true);
      expect(isIso88591(value), `header value for ${name}`).toBe(true);
    }
  });

  it('identifies the app in the user agent', () => {
    expect(githubApiHeaders()['User-Agent']).toMatch(/^wix\//);
  });
});
