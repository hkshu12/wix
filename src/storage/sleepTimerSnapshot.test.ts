import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearSleepTimer, startSleepTimer } from '../domain/sleepTimer';
import {
  clearSleepTimerSnapshot,
  hydrateSleepTimerSnapshot,
  readSleepTimerSnapshot,
  STORAGE_KEY_SLEEP_TIMER_SNAPSHOT,
  writeSleepTimerSnapshot
} from './sleepTimerSnapshot';

describe('sleepTimerSnapshot storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns cleared state when nothing is stored', () => {
    expect(hydrateSleepTimerSnapshot(readSleepTimerSnapshot(), Date.now())).toEqual({
      timer: clearSleepTimer(),
      preFadeMasterVolume: null
    });
  });

  it('persists and restores an active timer', () => {
    const now = Date.now();
    const timer = startSleepTimer(now, 30);
    writeSleepTimerSnapshot(timer, 0.72);

    const restored = hydrateSleepTimerSnapshot(readSleepTimerSnapshot(), now + 60_000);
    expect(restored.timer).toEqual(timer);
    expect(restored.preFadeMasterVolume).toBe(0.72);
  });

  it('clears expired timers on hydrate', () => {
    const now = Date.now();
    const timer = startSleepTimer(now, 1);
    writeSleepTimerSnapshot(timer, 0.5);

    const endsAt = timer.endsAt!;
    const restored = hydrateSleepTimerSnapshot(readSleepTimerSnapshot(), endsAt);
    expect(restored.timer).toEqual(clearSleepTimer());
    expect(localStorage.getItem(STORAGE_KEY_SLEEP_TIMER_SNAPSHOT)).toBeNull();
  });

  it('ignores invalid snapshot payloads', () => {
    localStorage.setItem(STORAGE_KEY_SLEEP_TIMER_SNAPSHOT, JSON.stringify({ version: 99 }));
    expect(hydrateSleepTimerSnapshot(readSleepTimerSnapshot(), Date.now()).timer).toEqual(clearSleepTimer());
  });

  it('clearSleepTimerSnapshot removes storage', () => {
    const timer = startSleepTimer(Date.now(), 15);
    writeSleepTimerSnapshot(timer, 0.8);
    clearSleepTimerSnapshot();
    expect(readSleepTimerSnapshot()).toBeNull();
  });
});
