import { describe, expect, it } from 'vitest';
import { compareSemver, isNewerVersion, parseSemver } from './semver';

describe('semver', () => {
  it('parses semver prefixes', () => {
    expect(parseSemver('v1.2.3')).toEqual([1, 2, 3]);
    expect(parseSemver('2.0.10')).toEqual([2, 0, 10]);
  });

  it('compares versions', () => {
    expect(compareSemver('1.3.0', '1.2.9')).toBeGreaterThan(0);
    expect(compareSemver('1.2.0', '1.2.1')).toBeLessThan(0);
    expect(isNewerVersion('1.4.0', '1.3.0')).toBe(true);
    expect(isNewerVersion('1.3.0', '1.3.0')).toBe(false);
  });
});
