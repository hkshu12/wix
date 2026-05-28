import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearWakeTimer, startWakeTimer } from '../domain/wakeTimer';
import {
  clearWakeTimerSnapshot,
  hydrateWakeTimerSnapshot,
  readWakeTimerSnapshot,
  STORAGE_KEY_WAKE_TIMER_SNAPSHOT,
  writeWakeTimerSnapshot
} from './wakeTimerSnapshot';

describe('wakeTimerSnapshot storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cleared state when nothing is stored', () => {
    expect(hydrateWakeTimerSnapshot(readWakeTimerSnapshot(), Date.now())).toEqual({
      timer: clearWakeTimer(),
      targetMasterVolume: null,
      expiredWhileClosed: false
    });
  });

  it('persists and restores an active timer', () => {
    const now = Date.now();
    const timer = startWakeTimer(now, 30);
    writeWakeTimerSnapshot(timer, 0.72);

    const restored = hydrateWakeTimerSnapshot(readWakeTimerSnapshot(), now + 60_000);
    expect(restored.timer).toEqual(timer);
    expect(restored.targetMasterVolume).toBe(0.72);
    expect(restored.expiredWhileClosed).toBe(false);
  });

  it('clears expired timers on hydrate but keeps target volume for restore', () => {
    const now = Date.now();
    const timer = startWakeTimer(now, 1);
    writeWakeTimerSnapshot(timer, 0.5);

    const endsAt = timer.endsAt!;
    const restored = hydrateWakeTimerSnapshot(readWakeTimerSnapshot(), endsAt);
    expect(restored.timer).toEqual(clearWakeTimer());
    expect(restored.targetMasterVolume).toBe(0.5);
    expect(restored.expiredWhileClosed).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY_WAKE_TIMER_SNAPSHOT)).toBeNull();
  });

  it('ignores invalid snapshot payloads', () => {
    localStorage.setItem(STORAGE_KEY_WAKE_TIMER_SNAPSHOT, JSON.stringify({ version: 99 }));
    expect(hydrateWakeTimerSnapshot(readWakeTimerSnapshot(), Date.now()).timer).toEqual(clearWakeTimer());
  });

  it('clearWakeTimerSnapshot removes storage', () => {
    const timer = startWakeTimer(Date.now(), 15);
    writeWakeTimerSnapshot(timer, 0.8);
    clearWakeTimerSnapshot();
    expect(readWakeTimerSnapshot()).toBeNull();
  });
});
