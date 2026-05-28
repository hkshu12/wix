import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createInitialMixerState, setPlaying } from '../domain/mixer';
import { WAKE_TIMER_FADE_SECONDS, startWakeTimer } from '../domain/wakeTimer';
import { writeWakeTimerSnapshot } from '../storage/wakeTimerSnapshot';
import { useWakeTimerController } from './useWakeTimerController';

describe('useWakeTimerController', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-27T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fades master volume in and starts playback when the timer ends while paused', () => {
    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(createInitialMixerState);
      const controller = useWakeTimerController({ mixer, setMixer });
      return { mixer, controller };
    });

    const startTime = Date.now();
    act(() => {
      result.current.controller.start(5);
    });

    const fadeMs = WAKE_TIMER_FADE_SECONDS * 1000;
    const endMs = 5 * 60 * 1000;
    const initialVolume = result.current.mixer.masterVolume;

    act(() => {
      vi.setSystemTime(startTime + endMs - fadeMs - 5_000);
      vi.advanceTimersByTime(250);
    });

    expect(result.current.controller.isFading).toBe(false);
    expect(result.current.mixer.isPlaying).toBe(false);

    act(() => {
      vi.setSystemTime(startTime + endMs - fadeMs / 2);
      vi.advanceTimersByTime(500);
    });

    expect(result.current.controller.isFading).toBe(true);
    expect(result.current.mixer.isPlaying).toBe(true);
    expect(result.current.mixer.masterVolume).toBeGreaterThan(0);
    expect(result.current.mixer.masterVolume).toBeLessThan(initialVolume);

    act(() => {
      vi.setSystemTime(startTime + endMs + 500);
      vi.advanceTimersByTime(250);
    });

    expect(result.current.controller.isActive).toBe(false);
    expect(result.current.mixer.isPlaying).toBe(true);
    expect(result.current.mixer.masterVolume).toBe(initialVolume);
  });

  it('restores an active timer from localStorage on mount', () => {
    const now = Date.now();
    const timer = startWakeTimer(now, 30);
    writeWakeTimerSnapshot(timer, 0.65);

    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(createInitialMixerState);
      const controller = useWakeTimerController({ mixer, setMixer });
      return { controller };
    });

    expect(result.current.controller.isActive).toBe(true);
    expect(result.current.controller.remainingLabel).toBe('30:00');

    act(() => {
      result.current.controller.cancel();
    });

    expect(result.current.controller.isActive).toBe(false);
  });

  it('applies target volume when timer expired while app was closed', () => {
    const now = Date.now();
    const timer = startWakeTimer(now, 1);
    writeWakeTimerSnapshot(timer, 0.55);

    act(() => {
      vi.setSystemTime(timer.endsAt! + 1);
    });

    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(createInitialMixerState);
      const controller = useWakeTimerController({ mixer, setMixer });
      return { mixer, controller };
    });

    expect(result.current.controller.isActive).toBe(false);
    expect(result.current.mixer.masterVolume).toBe(0.55);
  });

  it('keeps playing through wake fade when already playing', () => {
    const { result } = renderHook(() => {
      const [mixer, setMixer] = useState(() => setPlaying(createInitialMixerState(), true));
      const controller = useWakeTimerController({ mixer, setMixer });
      return { mixer, controller };
    });

    const startTime = Date.now();
    act(() => {
      result.current.controller.start(5);
    });

    const fadeMs = WAKE_TIMER_FADE_SECONDS * 1000;
    const endMs = 5 * 60 * 1000;

    act(() => {
      vi.setSystemTime(startTime + endMs - fadeMs / 2);
      vi.advanceTimersByTime(250);
    });

    expect(result.current.mixer.isPlaying).toBe(true);
    expect(result.current.controller.isFading).toBe(true);
  });
});
