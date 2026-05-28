import { beforeEach, describe, expect, it } from 'vitest';
import {
  readPlaybackFadeInSeconds,
  STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS,
  writePlaybackFadeInSeconds
} from './playbackFadeInPreferences';

describe('playbackFadeInPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to off when unset', () => {
    expect(readPlaybackFadeInSeconds()).toBe(0);
  });

  it('persists a valid fade duration', () => {
    writePlaybackFadeInSeconds(6);
    expect(localStorage.getItem(STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS)).toBe('6');
    expect(readPlaybackFadeInSeconds()).toBe(6);
  });

  it('falls back to off for invalid stored values', () => {
    localStorage.setItem(STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS, '99');
    expect(readPlaybackFadeInSeconds()).toBe(0);
  });
});
