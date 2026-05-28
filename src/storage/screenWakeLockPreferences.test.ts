import { beforeEach, describe, expect, it } from 'vitest';
import {
  readScreenWakeLockEnabled,
  STORAGE_KEY_SCREEN_WAKE_LOCK,
  writeScreenWakeLockEnabled
} from './screenWakeLockPreferences';

describe('screenWakeLockPreferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to disabled', () => {
    expect(readScreenWakeLockEnabled()).toBe(false);
  });

  it('persists enabled flag', () => {
    writeScreenWakeLockEnabled(true);
    expect(localStorage.getItem(STORAGE_KEY_SCREEN_WAKE_LOCK)).toBe('1');
    expect(readScreenWakeLockEnabled()).toBe(true);

    writeScreenWakeLockEnabled(false);
    expect(readScreenWakeLockEnabled()).toBe(false);
  });
});
