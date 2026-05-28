import { beforeEach, describe, expect, it } from 'vitest';
import { SLEEP_TIMER_FADE_SECONDS } from '../domain/sleepTimer';
import {
  readSleepTimerFadeSeconds,
  STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS,
  writeSleepTimerFadeSeconds
} from './sleepTimerPreferences';

describe('sleepTimerPreferences', () => {
  beforeEach(() => localStorage.clear());

  it('defaults to 30 seconds when unset', () => {
    expect(readSleepTimerFadeSeconds()).toBe(SLEEP_TIMER_FADE_SECONDS);
  });

  it('persists a valid fade duration', () => {
    writeSleepTimerFadeSeconds(60);
    expect(readSleepTimerFadeSeconds()).toBe(60);
    expect(localStorage.getItem(STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS)).toBe('60');
  });

  it('clamps out-of-range values on write', () => {
    writeSleepTimerFadeSeconds(5);
    expect(readSleepTimerFadeSeconds()).toBe(10);

    writeSleepTimerFadeSeconds(999);
    expect(readSleepTimerFadeSeconds()).toBe(120);
  });

  it('falls back to default for invalid stored values', () => {
    localStorage.setItem(STORAGE_KEY_SLEEP_TIMER_FADE_SECONDS, 'not-a-number');
    expect(readSleepTimerFadeSeconds()).toBe(SLEEP_TIMER_FADE_SECONDS);
  });
});
