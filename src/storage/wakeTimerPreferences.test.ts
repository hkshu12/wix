import { beforeEach, describe, expect, it } from 'vitest';
import { WAKE_TIMER_FADE_SECONDS } from '../domain/wakeTimer';
import {
  readWakeTimerFadeSeconds,
  STORAGE_KEY_WAKE_TIMER_FADE_SECONDS,
  writeWakeTimerFadeSeconds
} from './wakeTimerPreferences';

describe('wakeTimerPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to 30 seconds', () => {
    expect(readWakeTimerFadeSeconds()).toBe(WAKE_TIMER_FADE_SECONDS);
  });

  it('persists valid fade duration', () => {
    writeWakeTimerFadeSeconds(60);
    expect(readWakeTimerFadeSeconds()).toBe(60);
    expect(localStorage.getItem(STORAGE_KEY_WAKE_TIMER_FADE_SECONDS)).toBe('60');
  });

  it('falls back when stored value is invalid', () => {
    localStorage.setItem(STORAGE_KEY_WAKE_TIMER_FADE_SECONDS, '5');
    expect(readWakeTimerFadeSeconds()).toBe(WAKE_TIMER_FADE_SECONDS);
  });
});
