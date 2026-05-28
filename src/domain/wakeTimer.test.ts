import { describe, expect, it } from 'vitest';
import {
  clearWakeTimer,
  formatWakeTimerRemaining,
  getWakeTimerRemainingMs,
  shouldFinishWakeTimer,
  shouldStartWakeFade,
  startWakeTimer,
  WAKE_TIMER_FADE_SECONDS
} from './wakeTimer';

describe('wakeTimer', () => {
  const now = 1_000_000;

  it('schedules fade before the wake moment', () => {
    const timer = startWakeTimer(now, 30, 60);
    const fadeMs = 60 * 1000;
    const durationMs = 30 * 60 * 1000;

    expect(timer.endsAt).toBe(now + durationMs);
    expect(timer.fadeStartsAt).toBe(now + durationMs - fadeMs);
  });

  it('detects fade and completion windows', () => {
    const timer = startWakeTimer(now, 5, WAKE_TIMER_FADE_SECONDS);
    const fadeMs = WAKE_TIMER_FADE_SECONDS * 1000;
    const endMs = 5 * 60 * 1000;

    expect(shouldStartWakeFade(timer, now)).toBe(false);
    expect(shouldStartWakeFade(timer, now + endMs - fadeMs)).toBe(true);
    expect(shouldStartWakeFade(timer, now + endMs - 1)).toBe(true);
    expect(shouldFinishWakeTimer(timer, now + endMs - 1)).toBe(false);
    expect(shouldFinishWakeTimer(timer, now + endMs)).toBe(true);
  });

  it('formats remaining time', () => {
    expect(formatWakeTimerRemaining(90_000)).toBe('1:30');
    expect(formatWakeTimerRemaining(3_661_000)).toBe('1:01:01');
  });

  it('clears inactive timer', () => {
    expect(clearWakeTimer()).toEqual({ fadeStartsAt: null, endsAt: null });
    expect(getWakeTimerRemainingMs(clearWakeTimer(), now)).toBe(0);
  });
});
