import { describe, expect, it } from 'vitest';
import {
  clampPlaybackFadeInSeconds,
  isValidPlaybackFadeInSeconds,
  PLAYBACK_FADE_IN_OFF
} from './playbackFadeIn';

describe('playbackFadeIn', () => {
  it('accepts off and 2–10 second fade durations', () => {
    expect(isValidPlaybackFadeInSeconds(PLAYBACK_FADE_IN_OFF)).toBe(true);
    expect(isValidPlaybackFadeInSeconds(2)).toBe(true);
    expect(isValidPlaybackFadeInSeconds(10)).toBe(true);
    expect(isValidPlaybackFadeInSeconds(11)).toBe(false);
    expect(isValidPlaybackFadeInSeconds(-1)).toBe(false);
  });

  it('clamps custom values into range', () => {
    expect(clampPlaybackFadeInSeconds(0)).toBe(0);
    expect(clampPlaybackFadeInSeconds(4.6)).toBe(5);
    expect(clampPlaybackFadeInSeconds(99)).toBe(10);
  });
});
