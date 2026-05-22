import { beforeEach, describe, expect, it } from 'vitest';
import { getHasEnteredStudio, markEnteredStudio, STORAGE_KEY_ENTERED_STUDIO } from './onboarding';

describe('onboarding storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns false when unset', () => {
    expect(getHasEnteredStudio()).toBe(false);
  });

  it('returns true after markEnteredStudio', () => {
    markEnteredStudio();
    expect(getHasEnteredStudio()).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY_ENTERED_STUDIO)).toBe('1');
  });
});
