import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAudioContextResume } from './useAudioContextResume';

describe('useAudioContextResume', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    });
  });

  it('calls onResume when document becomes visible while playing', async () => {
    const onResume = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useAudioContextResume(true, onResume));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    });
    document.dispatchEvent(new Event('visibilitychange'));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await vi.waitFor(() => expect(onResume).toHaveBeenCalledTimes(1));
  });

  it('does not call onResume when returning visible but not playing', async () => {
    const onResume = vi.fn().mockResolvedValue(undefined);

    renderHook(() => useAudioContextResume(false, onResume));

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible'
    });
    document.dispatchEvent(new Event('visibilitychange'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onResume).not.toHaveBeenCalled();
  });

  it('does not call onResume when document stays hidden', async () => {
    const onResume = vi.fn().mockResolvedValue(undefined);

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden'
    });

    renderHook(() => useAudioContextResume(true, onResume));
    document.dispatchEvent(new Event('visibilitychange'));

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(onResume).not.toHaveBeenCalled();
  });
});
