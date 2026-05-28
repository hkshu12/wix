import { describe, expect, it } from 'vitest';
import {
  clearSleepTimer,
  createInitialSleepTimerState,
  formatSleepTimerRemaining,
  getSleepTimerRemainingMs,
  shouldFinishSleepTimer,
  shouldStartSleepFade,
  clampSleepTimerMinutes,
  isValidSleepTimerMinutes,
  SLEEP_TIMER_MAX_MINUTES,
  SLEEP_TIMER_MIN_MINUTES,
  startSleepTimer,
  SLEEP_TIMER_FADE_SECONDS
} from './sleepTimer';

describe('sleepTimer', () => {
  it('starts inactive', () => {
    expect(createInitialSleepTimerState()).toEqual({ fadeStartsAt: null, endsAt: null });
  });

  it('schedules fade before end by the fade duration', () => {
    const now = 1_000_000;
    const timer = startSleepTimer(now, 30);

    expect(timer.endsAt).toBe(now + 30 * 60 * 1000);
    expect(timer.fadeStartsAt).toBe(timer.endsAt! - SLEEP_TIMER_FADE_SECONDS * 1000);
  });

  it('reports remaining time and phase transitions', () => {
    const now = 0;
    const timer = startSleepTimer(now, 30);
    const endsAt = timer.endsAt!;

    expect(getSleepTimerRemainingMs(timer, endsAt - 5_000)).toBe(5_000);
    expect(shouldStartSleepFade(timer, endsAt - 45_000)).toBe(false);
    expect(shouldStartSleepFade(timer, endsAt - 10_000)).toBe(true);
    expect(shouldFinishSleepTimer(timer, endsAt - 1)).toBe(false);
    expect(shouldFinishSleepTimer(timer, endsAt)).toBe(true);
  });

  it('formats countdown for UI', () => {
    expect(formatSleepTimerRemaining(90_500)).toBe('1:31');
    expect(formatSleepTimerRemaining(3_661_000)).toBe('1:01:01');
  });

  it('clears an active timer', () => {
    expect(clearSleepTimer()).toEqual(createInitialSleepTimerState());
  });

  it('validates and clamps custom minute bounds', () => {
    expect(isValidSleepTimerMinutes(90)).toBe(true);
    expect(isValidSleepTimerMinutes(4)).toBe(false);
    expect(isValidSleepTimerMinutes(481)).toBe(false);
    expect(isValidSleepTimerMinutes(30.5)).toBe(false);

    expect(clampSleepTimerMinutes(90.4)).toBe(90);
    expect(clampSleepTimerMinutes(2)).toBe(SLEEP_TIMER_MIN_MINUTES);
    expect(clampSleepTimerMinutes(999)).toBe(SLEEP_TIMER_MAX_MINUTES);
  });
});
