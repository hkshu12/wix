import {
  clampPlaybackFadeInSeconds,
  isValidPlaybackFadeInSeconds,
  PLAYBACK_FADE_IN_OFF
} from '../domain/playbackFadeIn';

export const STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS = 'wix.playbackFadeInSeconds';

export function readPlaybackFadeInSeconds(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS);
    if (!raw) {
      return PLAYBACK_FADE_IN_OFF;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!isValidPlaybackFadeInSeconds(parsed)) {
      return PLAYBACK_FADE_IN_OFF;
    }

    return parsed;
  } catch {
    return PLAYBACK_FADE_IN_OFF;
  }
}

export function writePlaybackFadeInSeconds(seconds: number): void {
  localStorage.setItem(STORAGE_KEY_PLAYBACK_FADE_IN_SECONDS, String(clampPlaybackFadeInSeconds(seconds)));
}
