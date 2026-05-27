import { describe, expect, it } from 'vitest';
import { applyMixerPreset } from './applyMixerPreset';
import { createInitialMixerState } from './mixer';

describe('applyMixerPreset', () => {
  it('replaces globals and layers while keeping playback state', () => {
    const current = {
      ...createInitialMixerState(),
      isPlaying: true,
      masterVolume: 0.5,
      layers: [{ soundId: 'rain', volume: 0.3, pan: 0, playbackRate: 1, muted: false }]
    };

    const next = applyMixerPreset(
      current,
      {
        masterVolume: 0.9,
        stereoWidth: 0.2,
        playbackRate: 0.8,
        layers: [
          { soundId: 'ocean', volume: 0.7, pan: -0.5, playbackRate: 1.1, muted: true },
          { soundId: 'deleted-custom', volume: 1, pan: 0, playbackRate: 1, muted: false }
        ]
      },
      new Set(['rain', 'ocean'])
    );

    expect(next.isPlaying).toBe(true);
    expect(next.masterVolume).toBe(0.9);
    expect(next.stereoWidth).toBe(0.2);
    expect(next.playbackRate).toBe(0.8);
    expect(next.layers).toHaveLength(1);
    expect(next.layers[0]?.soundId).toBe('ocean');
    expect(next.layers[0]?.muted).toBe(true);
  });
});
