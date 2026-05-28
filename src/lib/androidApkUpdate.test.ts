import { describe, expect, it } from 'vitest';
import { apkCacheFilePath } from './androidApkUpdate';

describe('apkCacheFilePath', () => {
  it('places APKs under the updates cache subdirectory', () => {
    expect(apkCacheFilePath('1.41.0')).toBe('updates/wix-1.41.0.apk');
  });
});
