import { describe, expect, it } from 'vitest';
import { resolveEffectiveTheme } from './resolveTheme';

describe('resolveEffectiveTheme', () => {
  it('forces light', () => {
    expect(resolveEffectiveTheme('light', false)).toBe('light');
    expect(resolveEffectiveTheme('light', true)).toBe('light');
  });

  it('forces dark', () => {
    expect(resolveEffectiveTheme('dark', true)).toBe('dark');
  });

  it('follows system preference', () => {
    expect(resolveEffectiveTheme('system', false)).toBe('light');
    expect(resolveEffectiveTheme('system', true)).toBe('dark');
  });
});
