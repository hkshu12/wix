import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialMixerState, setLayerControl, setMasterVolume, toggleLayer } from '../domain/mixer';
import {
  filterMixerLayersToSounds,
  hydrateMixerState,
  readMixerSnapshot,
  STORAGE_KEY_MIXER_SNAPSHOT,
  writeMixerSnapshot
} from './mixerSnapshot';

describe('mixerSnapshot storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns initial state when nothing is stored', () => {
    expect(hydrateMixerState(readMixerSnapshot())).toEqual(createInitialMixerState());
  });

  it('persists and restores globals and layers', () => {
    let state = toggleLayer(createInitialMixerState(), 'rain');
    state = setLayerControl(state, 'rain', { volume: 0.4, pan: -0.2 });
    state = setMasterVolume(state, 0.55);

    writeMixerSnapshot(state);

    const restored = hydrateMixerState(readMixerSnapshot());
    expect(restored.isPlaying).toBe(false);
    expect(restored.masterVolume).toBe(0.55);
    expect(restored.layers).toEqual(state.layers);
  });

  it('ignores invalid snapshot payloads', () => {
    localStorage.setItem(STORAGE_KEY_MIXER_SNAPSHOT, JSON.stringify({ version: 99 }));
    expect(hydrateMixerState(readMixerSnapshot())).toEqual(createInitialMixerState());
  });

  it('drops layers that are no longer available', () => {
    const state = toggleLayer(createInitialMixerState(), 'rain');
    const filtered = filterMixerLayersToSounds(state, new Set(['ocean']));
    expect(filtered.layers).toEqual([]);
  });

  it('keeps custom track layers when sound id is allowed', () => {
    const state = {
      ...createInitialMixerState(),
      layers: [
        {
          soundId: 'custom-abc',
          volume: 0.5,
          pan: 0,
          playbackRate: 1,
          muted: false
        }
      ]
    };

    const filtered = filterMixerLayersToSounds(state, new Set(['custom-abc']));
    expect(filtered.layers).toHaveLength(1);
  });
});
