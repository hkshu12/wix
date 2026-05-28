import { describe, expect, it, vi } from 'vitest';
import { releaseScreenWakeLock, requestScreenWakeLock } from './screenWakeLockController';

describe('screenWakeLockController', () => {
  it('returns null when wakeLock API is missing', async () => {
    await expect(requestScreenWakeLock({})).resolves.toBeNull();
  });

  it('requests screen lock and releases handle', async () => {
    const release = vi.fn().mockResolvedValue(undefined);
    const request = vi.fn().mockResolvedValue({ release });
    const lock = await requestScreenWakeLock({ wakeLock: { request } });

    expect(request).toHaveBeenCalledWith('screen');
    expect(lock).not.toBeNull();

    await releaseScreenWakeLock(lock);
    expect(release).toHaveBeenCalledTimes(1);
  });

  it('returns null when request throws', async () => {
    const request = vi.fn().mockRejectedValue(new Error('denied'));
    await expect(requestScreenWakeLock({ wakeLock: { request } })).resolves.toBeNull();
  });
});
