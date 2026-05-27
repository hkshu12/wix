import { afterEach, describe, expect, it, vi } from 'vitest';
import { prefersReducedMotion, REDUCED_MOTION_QUERY } from './motionPreference';

describe('prefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('window', {} as Window);
    expect(prefersReducedMotion()).toBe(false);
  });

  it('reads prefers-reduced-motion from matchMedia', () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === REDUCED_MOTION_QUERY,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('window', { matchMedia } as unknown as Window);

    expect(prefersReducedMotion()).toBe(true);
    expect(matchMedia).toHaveBeenCalledWith(REDUCED_MOTION_QUERY);
  });

  it('returns false when reduce motion is not preferred', () => {
    const matchMedia = vi.fn(() => ({
      matches: false,
      media: REDUCED_MOTION_QUERY,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.stubGlobal('window', { matchMedia } as unknown as Window);

    expect(prefersReducedMotion()).toBe(false);
  });
});
