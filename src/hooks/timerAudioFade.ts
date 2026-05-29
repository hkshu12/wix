/** Bridges sleep/wake timers to {@link AudioEngine} master-gain ramps. */
export interface TimerAudioFade {
  scheduleMasterRamp: (fromVolume: number, toVolume: number, durationSeconds: number) => void;
  setMasterVolumeImmediate: (volume: number) => void;
}

export function remainingFadeSeconds(
  fadeStartsAtMs: number,
  fadeEndsAtMs: number,
  nowMs: number
): number {
  const remainingMs = Math.max(0, fadeEndsAtMs - nowMs);
  const fadeDurationMs = Math.max(0, fadeEndsAtMs - fadeStartsAtMs);
  if (fadeDurationMs === 0) {
    return 0;
  }

  return remainingMs / 1000;
}

export function fadeProgress(
  fadeStartsAtMs: number,
  fadeEndsAtMs: number,
  nowMs: number
): number {
  const fadeDuration = fadeEndsAtMs - fadeStartsAtMs;
  if (fadeDuration <= 0) {
    return 1;
  }

  return Math.min(1, Math.max(0, (nowMs - fadeStartsAtMs) / fadeDuration));
}
