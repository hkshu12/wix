import { describe, expect, it } from 'vitest';
import { createInitialMixerState } from './mixer';
import { applyFlagshipScene } from './applyFlagshipScene';
import { FLAGSHIP_SCENES } from './flagshipScenes';

describe('applyFlagshipScene', () => {
  it('replaces layers with scene preset volumes', () => {
    const summerRain = FLAGSHIP_SCENES.find((s) => s.id === 'summer-rain')!;
    const next = applyFlagshipScene(createInitialMixerState(), summerRain);

    expect(next.layers).toHaveLength(3);
    expect(next.layers.map((l) => l.soundId).sort()).toEqual(['rain-on-leaves', 'river', 'summer-rain']);
    expect(next.layers.find((l) => l.soundId === 'summer-rain')?.volume).toBe(0.72);
  });
});
