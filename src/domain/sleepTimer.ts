/** Default fade duration before stop when the sleep timer fires. */
export const SLEEP_TIMER_FADE_SECONDS = 30;

/** Preset durations in minutes for quick selection. */
export const SLEEP_TIMER_PRESETS_MINUTES = [15, 30, 45, 60] as const;

export type SleepTimerPresetMinutes = (typeof SLEEP_TIMER_PRESETS_MINUTES)[number];

/** Inclusive bounds for custom sleep timer duration (minutes). */
export const SLEEP_TIMER_MIN_MINUTES = 5;
export const SLEEP_TIMER_MAX_MINUTES = 480;

export function isValidSleepTimerMinutes(minutes: number): boolean {
  return (
    Number.isFinite(minutes) &&
    Number.isInteger(minutes) &&
    minutes >= SLEEP_TIMER_MIN_MINUTES &&
    minutes <= SLEEP_TIMER_MAX_MINUTES
  );
}

/** Rounds to an integer and clamps to the allowed sleep timer range. */
export function clampSleepTimerMinutes(minutes: number): number {
  const rounded = Math.round(minutes);
  return Math.min(SLEEP_TIMER_MAX_MINUTES, Math.max(SLEEP_TIMER_MIN_MINUTES, rounded));
}

export interface SleepTimerState {
  /** Wall-clock time (ms) when playback should begin fading out. */
  fadeStartsAt: number | null;
  /** Wall-clock time (ms) when playback should stop after fade. */
  endsAt: number | null;
}

export function createInitialSleepTimerState(): SleepTimerState {
  return { fadeStartsAt: null, endsAt: null };
}

export function startSleepTimer(
  nowMs: number,
  durationMinutes: number,
  fadeSeconds = SLEEP_TIMER_FADE_SECONDS
): SleepTimerState {
  const durationMs = durationMinutes * 60 * 1000;
  const fadeMs = fadeSeconds * 1000;
  const endsAt = nowMs + durationMs;

  return {
    fadeStartsAt: endsAt - fadeMs,
    endsAt
  };
}

export function clearSleepTimer(): SleepTimerState {
  return createInitialSleepTimerState();
}

export function isSleepTimerActive(timer: SleepTimerState): boolean {
  return timer.endsAt !== null;
}

export function getSleepTimerRemainingMs(timer: SleepTimerState, nowMs: number): number {
  if (timer.endsAt === null) {
    return 0;
  }

  return Math.max(0, timer.endsAt - nowMs);
}

export function shouldStartSleepFade(timer: SleepTimerState, nowMs: number): boolean {
  return timer.fadeStartsAt !== null && nowMs >= timer.fadeStartsAt && timer.endsAt !== null && nowMs < timer.endsAt;
}

export function shouldFinishSleepTimer(timer: SleepTimerState, nowMs: number): boolean {
  return timer.endsAt !== null && nowMs >= timer.endsAt;
}

/** Formats remaining time as `M:SS` or `H:MM:SS` for display. */
export function formatSleepTimerRemaining(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
