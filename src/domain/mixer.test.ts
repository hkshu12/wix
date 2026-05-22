import { describe, expect, it } from 'vitest';
import { createInitialMixerState, setLayerControl, toggleLayer } from './mixer';

describe('mixer state', () => {
  it('starts quiet with no selected layers and sensible global controls', () => {
    expect(createInitialMixerState()).toEqual({
      isPlaying: false,
      masterVolume: 0.82,
      stereoWidth: 0.6,
      playbackRate: 1,
      layers: []
    });
  });

  it('adds and removes sound layers without duplicating selections', () => {
    const withRain = toggleLayer(createInitialMixerState(), 'rain');
    const stillOneRain = toggleLayer(withRain, 'rain');
    const withOcean = toggleLayer(withRain, 'ocean');

    expect(withRain.layers).toHaveLength(1);
    expect(withRain.layers[0]).toMatchObject({ soundId: 'rain', volume: 0.65, pan: 0, muted: false });
    expect(stillOneRain.layers).toHaveLength(0);
    expect(withOcean.layers.map((layer) => layer.soundId)).toEqual(['rain', 'ocean']);
  });

  it('clamps layer controls to safe audio ranges', () => {
    const state = toggleLayer(createInitialMixerState(), 'fireplace');
    const updated = setLayerControl(state, 'fireplace', {
      volume: 2,
      pan: -3,
      playbackRate: 4,
      muted: true
    });

    expect(updated.layers[0]).toMatchObject({
      volume: 1,
      pan: -1,
      playbackRate: 1.75,
      muted: true
    });
  });
});
