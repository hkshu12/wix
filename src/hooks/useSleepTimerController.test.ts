import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialMixerState, setPlaying } from '../domain/mixer';
import { SLEEP_TIMER_FADE_SECONDS, type SleepTimerPresetMinutes } from '../domain/sleepTimer';
import { useSleepTimerController } from './useSleepTimerController';

describe('useSleepTimerController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fades master volume and pauses when the timer ends while playing', () => {
    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(() => setPlaying(createInitialMixerState(), true));
      const controller = useSleepTimerController({ mixer, setMixer });
      return { mixer, controller };
    });

    act(() => {
      result.current.controller.startPreset(1 as SleepTimerPresetMinutes);
    });

    const fadeMs = SLEEP_TIMER_FADE_SECONDS * 1000;
    const endMs = 60 * 1000;
    const initialVolume = result.current.mixer.masterVolume;

    act(() => {
      vi.advanceTimersByTime(endMs - fadeMs - 1);
    });

    expect(result.current.controller.isFading).toBe(false);

    act(() => {
      vi.advanceTimersByTime(fadeMs / 2);
    });

    expect(result.current.controller.isFading).toBe(true);
    expect(result.current.mixer.masterVolume).toBeLessThan(initialVolume);

    act(() => {
      vi.advanceTimersByTime(fadeMs / 2 + 500);
    });

    expect(result.current.controller.isActive).toBe(false);
    expect(result.current.mixer.isPlaying).toBe(false);
    expect(result.current.mixer.masterVolume).toBe(initialVolume);
  });
});
