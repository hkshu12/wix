import { describe, expect, it } from 'vitest';
import { createInitialMixerState, setGlobalPlaybackRate, setLayerControl, setStereoWidth, toggleLayer } from '../domain/mixer';
import { BUILT_IN_SOUNDS } from '../domain/sounds';
import { createAudioGraphPlan } from './audioGraphPlan';

describe('audio graph plan', () => {
  it('maps active mixer layers into playable graph instructions', () => {
    let state = toggleLayer(createInitialMixerState(), 'rain');
    state = toggleLayer(state, 'ocean');
    state = setStereoWidth(setGlobalPlaybackRate(state, 1.2), 0.5);
    state = setLayerControl(state, 'rain', { volume: 0.4, pan: -0.8, playbackRate: 0.75 });

    const plan = createAudioGraphPlan(state, BUILT_IN_SOUNDS);

    expect(plan).toEqual([
      expect.objectContaining({
        soundId: 'rain',
        finalVolume: 0.4,
        finalPan: -0.4,
        finalPlaybackRate: 0.9,
        sound: expect.objectContaining({ title: '雨声' })
      }),
      expect.objectContaining({
        soundId: 'ocean',
        finalVolume: 0.65,
        finalPan: 0,
        finalPlaybackRate: 1.2
      })
    ]);
  });

  it('omits muted and unknown layers', () => {
    const state = {
      ...createInitialMixerState(),
      layers: [
        { soundId: 'rain', volume: 0.5, pan: 0, playbackRate: 1, muted: true },
        { soundId: 'unknown', volume: 1, pan: 0, playbackRate: 1, muted: false }
      ]
    };

    expect(createAudioGraphPlan(state, BUILT_IN_SOUNDS)).toEqual([]);
  });
});
