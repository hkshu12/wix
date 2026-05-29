import { describe, expect, it } from 'vitest';
import {
  clearSleepTimer,
  createInitialSleepTimerState,
  formatSleepTimerRemaining,
  getSleepTimerRemainingMs,
  shouldFinishSleepTimer,
  shouldStartSleepFade,
  clampSleepTimerFadeSeconds,
  clampSleepTimerMinutes,
  isValidSleepTimerFadeSeconds,
  isValidSleepTimerMinutes,
  SLEEP_TIMER_FADE_MAX_SECONDS,
  SLEEP_TIMER_FADE_MIN_SECONDS,
  SLEEP_TIMER_MAX_MINUTES,
  SLEEP_TIMER_MIN_MINUTES,
  formatSleepClockTime,
  isSleepClockTimeReachable,
  parseSleepClockTimeInput,
  resolveSleepEndsAtMs,
  startSleepTimer,
  startSleepTimerAtClock,
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

  it('accepts a custom fade duration in seconds', () => {
    const now = 0;
    const timer = startSleepTimer(now, 15, 60);

    expect(timer.fadeStartsAt).toBe(timer.endsAt! - 60 * 1000);
  });

  it('validates and clamps custom fade second bounds', () => {
    expect(isValidSleepTimerFadeSeconds(30)).toBe(true);
    expect(isValidSleepTimerFadeSeconds(9)).toBe(false);
    expect(isValidSleepTimerFadeSeconds(121)).toBe(false);

    expect(clampSleepTimerFadeSeconds(45.6)).toBe(46);
    expect(clampSleepTimerFadeSeconds(5)).toBe(SLEEP_TIMER_FADE_MIN_SECONDS);
    expect(clampSleepTimerFadeSeconds(200)).toBe(SLEEP_TIMER_FADE_MAX_SECONDS);
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

  it('schedules clock sleep for later today', () => {
    const nowMs = Date.parse('2026-05-29T20:00:00');
    const timer = startSleepTimerAtClock(nowMs, 23, 0, 60)!;
    const endsAt = Date.parse('2026-05-29T23:00:00');

    expect(timer.endsAt).toBe(endsAt);
    expect(timer.fadeStartsAt).toBe(endsAt - 60 * 1000);
  });

  it('schedules clock sleep for tomorrow when time already passed', () => {
    const nowMs = Date.parse('2026-05-29T23:30:00');
    const endsAt = resolveSleepEndsAtMs(nowMs, 23, 0);

    expect(endsAt).toBe(Date.parse('2026-05-30T23:00:00'));
    expect(isSleepClockTimeReachable(nowMs, 23, 0)).toBe(true);
  });

  it('rejects clock sleep less than one minute away', () => {
    const nowMs = Date.parse('2026-05-29T22:59:30');
    expect(startSleepTimerAtClock(nowMs, 23, 0, 60)).toBeNull();
    expect(isSleepClockTimeReachable(nowMs, 23, 0)).toBe(false);
  });

  it('parses and formats clock input', () => {
    expect(parseSleepClockTimeInput('23:00')).toEqual({ hour: 23, minute: 0 });
    expect(parseSleepClockTimeInput('invalid')).toBeNull();
    expect(formatSleepClockTime(7, 5)).toBe('07:05');
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
