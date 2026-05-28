/** Default fade duration before target volume when the wake timer fires. */
export const WAKE_TIMER_FADE_SECONDS = 30;

/** Preset fade durations in seconds for quick selection in the mixer drawer. */
export const WAKE_TIMER_FADE_PRESETS_SECONDS = [10, 30, 60, 120] as const;

export type WakeTimerFadePresetSeconds = (typeof WAKE_TIMER_FADE_PRESETS_SECONDS)[number];

/** Inclusive bounds for custom wake timer fade duration (seconds). */
export const WAKE_TIMER_FADE_MIN_SECONDS = 10;
export const WAKE_TIMER_FADE_MAX_SECONDS = 120;

export function isValidWakeTimerFadeSeconds(seconds: number): boolean {
  return (
    Number.isFinite(seconds) &&
    Number.isInteger(seconds) &&
    seconds >= WAKE_TIMER_FADE_MIN_SECONDS &&
    seconds <= WAKE_TIMER_FADE_MAX_SECONDS
  );
}

/** Rounds to an integer and clamps to the allowed wake fade range. */
export function clampWakeTimerFadeSeconds(seconds: number): number {
  const rounded = Math.round(seconds);
  return Math.min(WAKE_TIMER_FADE_MAX_SECONDS, Math.max(WAKE_TIMER_FADE_MIN_SECONDS, rounded));
}

/** Preset durations in minutes for quick selection. */
export const WAKE_TIMER_PRESETS_MINUTES = [15, 30, 45, 60] as const;

export type WakeTimerPresetMinutes = (typeof WAKE_TIMER_PRESETS_MINUTES)[number];

/** Inclusive bounds for custom wake timer duration (minutes). */
export const WAKE_TIMER_MIN_MINUTES = 5;
export const WAKE_TIMER_MAX_MINUTES = 480;

export function isValidWakeTimerMinutes(minutes: number): boolean {
  return (
    Number.isFinite(minutes) &&
    Number.isInteger(minutes) &&
    minutes >= WAKE_TIMER_MIN_MINUTES &&
    minutes <= WAKE_TIMER_MAX_MINUTES
  );
}

/** Rounds to an integer and clamps to the allowed wake timer range. */
export function clampWakeTimerMinutes(minutes: number): number {
  const rounded = Math.round(minutes);
  return Math.min(WAKE_TIMER_MAX_MINUTES, Math.max(WAKE_TIMER_MIN_MINUTES, rounded));
}

export interface WakeTimerState {
  /** Wall-clock time (ms) when master volume begins fading in. */
  fadeStartsAt: number | null;
  /** Wall-clock time (ms) when target master volume is reached. */
  endsAt: number | null;
}

export function createInitialWakeTimerState(): WakeTimerState {
  return { fadeStartsAt: null, endsAt: null };
}

export function startWakeTimer(
  nowMs: number,
  durationMinutes: number,
  fadeSeconds = WAKE_TIMER_FADE_SECONDS
): WakeTimerState {
  const durationMs = durationMinutes * 60 * 1000;
  const fadeMs = fadeSeconds * 1000;
  const endsAt = nowMs + durationMs;

  return {
    fadeStartsAt: endsAt - fadeMs,
    endsAt
  };
}

export function clearWakeTimer(): WakeTimerState {
  return createInitialWakeTimerState();
}

export function isWakeTimerActive(timer: WakeTimerState): boolean {
  return timer.endsAt !== null;
}

export function getWakeTimerRemainingMs(timer: WakeTimerState, nowMs: number): number {
  if (timer.endsAt === null) {
    return 0;
  }

  return Math.max(0, timer.endsAt - nowMs);
}

export function shouldStartWakeFade(timer: WakeTimerState, nowMs: number): boolean {
  return timer.fadeStartsAt !== null && nowMs >= timer.fadeStartsAt && timer.endsAt !== null && nowMs < timer.endsAt;
}

export function shouldFinishWakeTimer(timer: WakeTimerState, nowMs: number): boolean {
  return timer.endsAt !== null && nowMs >= timer.endsAt;
}

/** Formats remaining time as `M:SS` or `H:MM:SS` for display. */
export function formatWakeTimerRemaining(remainingMs: number): string {
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
