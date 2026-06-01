import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialMixerState, setPlaying } from '../domain/mixer';
import { SLEEP_TIMER_FADE_SECONDS, startSleepTimer } from '../domain/sleepTimer';
import { writeSleepTimerSnapshot } from '../storage/sleepTimerSnapshot';
import { useSleepTimerController } from './useSleepTimerController';

describe('useSleepTimerController', () => {
  beforeEach(() => {
    localStorage.clear();
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

    const startTime = Date.now();
    act(() => {
      result.current.controller.start(5);
    });

    const fadeMs = SLEEP_TIMER_FADE_SECONDS * 1000;
    const endMs = 5 * 60 * 1000;
    const initialVolume = result.current.mixer.masterVolume;

    act(() => {
      vi.setSystemTime(startTime + endMs - fadeMs - 5_000);
      vi.advanceTimersByTime(250);
    });

    expect(result.current.controller.isFading).toBe(false);

    act(() => {
      vi.setSystemTime(startTime + endMs - fadeMs / 2);
      vi.advanceTimersByTime(250);
    });

    expect(result.current.controller.isFading).toBe(true);
    expect(result.current.mixer.masterVolume).toBeLessThan(initialVolume);

    act(() => {
      vi.setSystemTime(startTime + endMs + 500);
      vi.advanceTimersByTime(250);
    });

    expect(result.current.controller.isActive).toBe(false);
    expect(result.current.mixer.isPlaying).toBe(false);
    expect(result.current.mixer.masterVolume).toBe(initialVolume);
  });

  it('restores an active timer from localStorage on mount', () => {
    const now = Date.now();
    const timer = startSleepTimer(now, 30);
    writeSleepTimerSnapshot(timer, 0.65);

    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(createInitialMixerState);
      const controller = useSleepTimerController({ mixer, setMixer });
      return { controller };
    });

    expect(result.current.controller.isActive).toBe(true);
    expect(result.current.controller.remainingLabel).toBe('30:00');

    act(() => {
      result.current.controller.cancel();
    });

    expect(result.current.controller.isActive).toBe(false);
  });

  it('restores pre-fade master volume when the timer expired while the app was closed', () => {
    const now = Date.now();
    const timer = startSleepTimer(now, 1);
    writeSleepTimerSnapshot(timer, 0.8);

    act(() => {
      vi.setSystemTime(timer.endsAt! + 1_000);
    });

    const fadedMixer = { ...createInitialMixerState(), masterVolume: 0.25 };

    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(fadedMixer);
      const controller = useSleepTimerController({ mixer, setMixer });
      return { mixer, controller };
    });

    expect(result.current.controller.isActive).toBe(false);
    expect(result.current.mixer.masterVolume).toBe(0.8);
    expect(result.current.mixer.isPlaying).toBe(false);
    expect(result.current.controller.suppressRestoreAutoplay).toBe(true);
  });

  it('uses a persisted fade duration when starting the timer', () => {
    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(() => setPlaying(createInitialMixerState(), true));
      const controller = useSleepTimerController({ mixer, setMixer });
      return { mixer, controller };
    });

    act(() => {
      result.current.controller.setFadeSeconds(10);
      result.current.controller.start(5);
    });

    const startTime = Date.now();
    const fadeMs = 10 * 1000;
    const endMs = 5 * 60 * 1000;

    act(() => {
      vi.setSystemTime(startTime + endMs - fadeMs / 2);
      vi.advanceTimersByTime(250);
    });

    expect(result.current.controller.isFading).toBe(true);
  });

  it('starts a clock sleep timer at the next local occurrence', () => {
    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(createInitialMixerState);
      const controller = useSleepTimerController({ mixer, setMixer });
      return { controller };
    });

    act(() => {
      vi.setSystemTime(Date.parse('2026-05-29T20:00:00'));
      expect(result.current.controller.startAtClock(23, 0)).toBe(true);
    });

    expect(result.current.controller.isActive).toBe(true);
    expect(result.current.controller.remainingLabel).toBe('3:00:00');
  });

  it('rejects out-of-range custom durations', () => {
    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(createInitialMixerState);
      const controller = useSleepTimerController({ mixer, setMixer });
      return { controller };
    });

    let started = false;
    act(() => {
      expect(result.current.controller.start(4)).toBe(false);
      started = result.current.controller.start(90);
    });
    expect(started).toBe(true);
    expect(result.current.controller.isActive).toBe(true);
    expect(result.current.controller.remainingLabel).toBe('1:30:00');
  });
});
