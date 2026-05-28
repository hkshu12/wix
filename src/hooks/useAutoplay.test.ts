import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { createInitialMixerState, setPlaying, toggleLayer } from '../domain/mixer';
import { useAutoplay } from './useAutoplay';

describe('useAutoplay', () => {
  it('starts playback when the first layer is added', async () => {
    const resumeAudio = vi.fn().mockResolvedValue(undefined);
    let mixer = createInitialMixerState();

    const { rerender } = renderHook(
      ({ mixer: currentMixer }) =>
        useAutoplay({
          mixer: currentMixer,
          setMixer: (update) => {
            mixer = typeof update === 'function' ? update(mixer) : update;
          },
          customTracksReady: true,
          resumeAudio
        }),
      { initialProps: { mixer } }
    );

    mixer = toggleLayer(mixer, 'rain');
    rerender({ mixer });

    await waitFor(() => expect(resumeAudio).toHaveBeenCalledTimes(1));
    expect(mixer.isPlaying).toBe(true);
  });

  it('autoplays restored layers once custom tracks are ready', async () => {
    const resumeAudio = vi.fn().mockResolvedValue(undefined);
    let mixer = toggleLayer(createInitialMixerState(), 'rain');

    const { rerender } = renderHook(
      ({ ready, mixer: currentMixer }) =>
        useAutoplay({
          mixer: currentMixer,
          setMixer: (update) => {
            mixer = typeof update === 'function' ? update(mixer) : update;
          },
          customTracksReady: ready,
          resumeAudio
        }),
      { initialProps: { ready: false, mixer } }
    );

    rerender({ ready: true, mixer });

    await waitFor(() => expect(resumeAudio).toHaveBeenCalledTimes(1));
    expect(mixer.isPlaying).toBe(true);
  });

  it('pauses when all layers are removed', async () => {
    const resumeAudio = vi.fn().mockResolvedValue(undefined);
    let mixer = setPlaying(toggleLayer(createInitialMixerState(), 'rain'), true);

    const { rerender } = renderHook(
      ({ mixer: currentMixer }) =>
        useAutoplay({
          mixer: currentMixer,
          setMixer: (update) => {
            mixer = typeof update === 'function' ? update(mixer) : update;
          },
          customTracksReady: true,
          resumeAudio
        }),
      { initialProps: { mixer } }
    );

    mixer = createInitialMixerState();
    rerender({ mixer });

    await waitFor(() => expect(mixer.isPlaying).toBe(false));
    expect(resumeAudio).not.toHaveBeenCalled();
  });

  it('does not restart after manual pause until a layer is added', async () => {
    const resumeAudio = vi.fn().mockResolvedValue(undefined);
    let mixer = toggleLayer(createInitialMixerState(), 'rain');

    const { rerender } = renderHook(
      ({ mixer: currentMixer }) =>
        useAutoplay({
          mixer: currentMixer,
          setMixer: (update) => {
            mixer = typeof update === 'function' ? update(mixer) : update;
          },
          customTracksReady: true,
          resumeAudio
        }),
      { initialProps: { mixer } }
    );

    await waitFor(() => expect(mixer.isPlaying).toBe(true));
    resumeAudio.mockClear();

    mixer = setPlaying(mixer, false);
    rerender({ mixer });

    await act(async () => {
      await Promise.resolve();
    });

    expect(resumeAudio).not.toHaveBeenCalled();
    expect(mixer.isPlaying).toBe(false);
  });

  it('resumes playback when a layer is added after manual pause', async () => {
    const resumeAudio = vi.fn().mockResolvedValue(undefined);
    let mixer = toggleLayer(createInitialMixerState(), 'rain');

    const { rerender } = renderHook(
      ({ mixer: currentMixer }) =>
        useAutoplay({
          mixer: currentMixer,
          setMixer: (update) => {
            mixer = typeof update === 'function' ? update(mixer) : update;
          },
          customTracksReady: true,
          resumeAudio
        }),
      { initialProps: { mixer } }
    );

    await waitFor(() => expect(mixer.isPlaying).toBe(true));

    mixer = setPlaying(mixer, false);
    rerender({ mixer });
    resumeAudio.mockClear();

    mixer = toggleLayer(mixer, 'ocean');
    rerender({ mixer });

    await waitFor(() => expect(resumeAudio).toHaveBeenCalledTimes(1));
    expect(mixer.isPlaying).toBe(true);
  });
});
