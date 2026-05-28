import { describe, expect, it } from 'vitest';
import { shouldHoldScreenWakeLock } from './screenWakeLock';

describe('screenWakeLock', () => {
  it('holds lock only when preference is on and mixer is playing', () => {
    expect(shouldHoldScreenWakeLock(false, false)).toBe(false);
    expect(shouldHoldScreenWakeLock(false, true)).toBe(false);
    expect(shouldHoldScreenWakeLock(true, false)).toBe(false);
    expect(shouldHoldScreenWakeLock(true, true)).toBe(true);
  });
});
