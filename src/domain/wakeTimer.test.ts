import { describe, expect, it } from 'vitest';
import {
  clearWakeTimer,
  formatWakeClockTime,
  formatWakeTimerRemaining,
  getWakeTimerRemainingMs,
  isWakeClockTimeReachable,
  parseWakeClockTimeInput,
  resolveWakeEndsAtMs,
  shouldFinishWakeTimer,
  shouldStartWakeFade,
  startWakeTimer,
  startWakeTimerAtClock,
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

  it('schedules clock wake for later today', () => {
    const nowMs = Date.parse('2026-05-29T06:00:00');
    const timer = startWakeTimerAtClock(nowMs, 7, 30, 60)!;
    const endsAt = Date.parse('2026-05-29T07:30:00');

    expect(timer.endsAt).toBe(endsAt);
    expect(timer.fadeStartsAt).toBe(endsAt - 60 * 1000);
    expect(getWakeTimerRemainingMs(timer, nowMs)).toBe(90 * 60 * 1000);
  });

  it('schedules clock wake for tomorrow when time already passed', () => {
    const nowMs = Date.parse('2026-05-29T08:00:00');
    const endsAt = resolveWakeEndsAtMs(nowMs, 7, 30);

    expect(endsAt).toBe(Date.parse('2026-05-30T07:30:00'));
    expect(isWakeClockTimeReachable(nowMs, 7, 30)).toBe(true);
  });

  it('rejects clock wake less than one minute away', () => {
    const nowMs = Date.parse('2026-05-29T07:29:30');
    expect(startWakeTimerAtClock(nowMs, 7, 30, 60)).toBeNull();
    expect(isWakeClockTimeReachable(nowMs, 7, 30)).toBe(false);
  });

  it('parses and formats clock input', () => {
    expect(parseWakeClockTimeInput('07:30')).toEqual({ hour: 7, minute: 30 });
    expect(parseWakeClockTimeInput('invalid')).toBeNull();
    expect(formatWakeClockTime(7, 5)).toBe('07:05');
  });
});
