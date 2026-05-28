import {
  clampSleepTimerFadeSeconds,
  isValidSleepTimerFadeSeconds,
  SLEEP_TIMER_FADE_SECONDS
} from '../domain/sleepTimer';

export const STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS = 'wix.sleepTimerFadeSeconds';

export function readSleepTimerFadeSeconds(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS);
    if (!raw) {
      return SLEEP_TIMER_FADE_SECONDS;
    }

    const parsed = Number.parseInt(raw, 10);
    if (!isValidSleepTimerFadeSeconds(parsed)) {
      return SLEEP_TIMER_FADE_SECONDS;
    }

    return parsed;
  } catch {
    return SLEEP_TIMER_FADE_SECONDS;
  }
}

export function writeSleepTimerFadeSeconds(seconds: number): void {
  localStorage.setItem(STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS, String(clampSleepTimerFadeSeconds(seconds)));
}
