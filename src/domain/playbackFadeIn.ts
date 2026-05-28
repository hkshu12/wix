/** No master fade-in on play (immediate target volume). */
export const PLAYBACK_FADE_IN_OFF = 0;

/** Quick-select fade-in durations in seconds (0 = off). */
export const PLAYBACK_FADE_IN_PRESETS_SECONDS = [0, 2, 4, 6, 8] as const;

export type PlaybackFadeInPresetSeconds = (typeof PLAYBACK_FADE_IN_PRESETS_SECONDS)[number];

export const PLAYBACK_FADE_IN_MIN_SECONDS = 0;
export const PLAYBACK_FADE_IN_MAX_SECONDS = 10;

export function isValidPlaybackFadeInSeconds(seconds: number): boolean {
  return (
    Number.isFinite(seconds) &&
    Number.isInteger(seconds) &&
    seconds >= PLAYBACK_FADE_IN_MIN_SECONDS &&
    seconds <= PLAYBACK_FADE_IN_MAX_SECONDS
  );
}

export function clampPlaybackFadeInSeconds(seconds: number): number {
  const rounded = Math.round(seconds);
  return Math.min(PLAYBACK_FADE_IN_MAX_SECONDS, Math.max(PLAYBACK_FADE_IN_MIN_SECONDS, rounded));
}
