/** Default fade duration before stop when the sleep timer fires. */
export const SLEEP_TIMER_FADE_SECONDS = 30;

/** Preset fade durations in seconds for quick selection in the mixer drawer. */
export const SLEEP_TIMER_FADE_PRESETS_SECONDS = [10, 30, 60, 120] as const;

export type SleepTimerFadePresetSeconds = (typeof SLEEP_TIMER_FADE_PRESETS_SECONDS)[number];

/** Inclusive bounds for custom sleep timer fade duration (seconds). */
export const SLEEP_TIMER_FADE_MIN_SECONDS = 10;
export const SLEEP_TIMER_FADE_MAX_SECONDS = 120;

export function isValidSleepTimerFadeSeconds(seconds: number): boolean {
  return (
    Number.isFinite(seconds) &&
    Number.isInteger(seconds) &&
    seconds >= SLEEP_TIMER_FADE_MIN_SECONDS &&
    seconds <= SLEEP_TIMER_FADE_MAX_SECONDS
  );
}

/** Rounds to an integer and clamps to the allowed sleep fade range. */
export function clampSleepTimerFadeSeconds(seconds: number): number {
  const rounded = Math.round(seconds);
  return Math.min(SLEEP_TIMER_FADE_MAX_SECONDS, Math.max(SLEEP_TIMER_FADE_MIN_SECONDS, rounded));
}

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

/** Minimum lead time before a clock sleep stop (avoids accidental immediate fade). */
export const SLEEP_TIMER_CLOCK_MIN_LEAD_MS = 60 * 1000;

export function isValidSleepClockTime(hour: number, minute: number): boolean {
  return (
    Number.isInteger(hour) &&
    hour >= 0 &&
    hour <= 23 &&
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 59
  );
}

/** Next occurrence of `hour:minute` on the local calendar (tomorrow if already passed). */
export function resolveSleepEndsAtMs(nowMs: number, hour: number, minute: number): number | null {
  if (!isValidSleepClockTime(hour, minute)) {
    return null;
  }

  const now = new Date(nowMs);
  const target = new Date(now);
  target.setSeconds(0, 0);
  target.setHours(hour, minute, 0, 0);

  if (target.getTime() <= nowMs) {
    target.setDate(target.getDate() + 1);
  }

  return target.getTime();
}

export function isSleepClockTimeReachable(nowMs: number, hour: number, minute: number): boolean {
  const endsAt = resolveSleepEndsAtMs(nowMs, hour, minute);
  if (endsAt === null) {
    return false;
  }

  return endsAt - nowMs >= SLEEP_TIMER_CLOCK_MIN_LEAD_MS;
}

export function startSleepTimerAtClock(
  nowMs: number,
  hour: number,
  minute: number,
  fadeSeconds = SLEEP_TIMER_FADE_SECONDS
): SleepTimerState | null {
  const endsAt = resolveSleepEndsAtMs(nowMs, hour, minute);
  if (endsAt === null || !isSleepClockTimeReachable(nowMs, hour, minute)) {
    return null;
  }

  const fadeMs = fadeSeconds * 1000;
  return {
    fadeStartsAt: endsAt - fadeMs,
    endsAt
  };
}

/** Parses `HH:mm` from an `<input type="time">` value. */
export function parseSleepClockTimeInput(value: string): { hour: number; minute: number } | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (!isValidSleepClockTime(hour, minute)) {
    return null;
  }

  return { hour, minute };
}

export function formatSleepClockTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
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
