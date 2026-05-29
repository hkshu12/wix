import { describe, expect, it } from 'vitest';
import { fadeProgress, remainingFadeSeconds } from './timerAudioFade';

describe('timerAudioFade', () => {
  it('computes fade progress between start and end', () => {
    expect(fadeProgress(0, 1000, 250)).toBe(0.25);
    expect(fadeProgress(0, 1000, 0)).toBe(0);
    expect(fadeProgress(0, 1000, 1500)).toBe(1);
  });

  it('returns remaining fade duration in seconds', () => {
    expect(remainingFadeSeconds(0, 30_000, 10_000)).toBe(20);
    expect(remainingFadeSeconds(0, 30_000, 35_000)).toBe(0);
  });
});
