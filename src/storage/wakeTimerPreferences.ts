import {
  clampWakeTimerFadeSeconds,
  isValidWakeTimerFadeSeconds,
  WAKE_TIMER_FADE_SECONDS
} from '../domain/wakeTimer';

export const STORAGE_KEY_WAKE_TIMER_FADE_SECONDS = 'wix.wakeTimerFadeSeconds';

export function readWakeTimerFadeSeconds(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WAKE_TIMER_FADE_SECONDS);
    if (!raw) {
      return WAKE_TIMER_FADE_SECONDS;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!isValidWakeTimerFadeSeconds(parsed)) {
      return WAKE_TIMER_FADE_SECONDS;
    }

    return parsed;
  } catch {
    return WAKE_TIMER_FADE_SECONDS;
  }
}

export function writeWakeTimerFadeSeconds(seconds: number): void {
  localStorage.setItem(STORAGE_KEY_WAKE_TIMER_FADE_SECONDS, String(clampWakeTimerFadeSeconds(seconds)));
}
