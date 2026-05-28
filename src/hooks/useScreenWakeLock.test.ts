import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useScreenWakeLock } from './useScreenWakeLock';

describe('useScreenWakeLock', () => {
  const release = vi.fn().mockResolvedValue(undefined);
  const request = vi.fn().mockResolvedValue({ release });

  beforeEach(() => {
    release.mockClear();
    request.mockClear();
    Object.defineProperty(navigator, 'wakeLock', {
      configurable: true,
      value: { request }
    });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(navigator, 'wakeLock');
  });

  it('requests lock while enabled and playing', async () => {
    const { rerender } = renderHook(
      ({ enabled, isPlaying }) => useScreenWakeLock(enabled, isPlaying),
      { initialProps: { enabled: true, isPlaying: true } }
    );

    await vi.waitFor(() => expect(request).toHaveBeenCalledWith('screen'));

    rerender({ enabled: true, isPlaying: false });
    await vi.waitFor(() => expect(release).toHaveBeenCalled());
  });

  it('does not request when preference is off', async () => {
    renderHook(() => useScreenWakeLock(false, true));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(request).not.toHaveBeenCalled();
  });
});
