import { describe, expect, it } from 'vitest';
import { createInitialMixerState } from './mixer';
import { applyMiuiScene } from './applyMiuiScene';
import { MIUI_SCENES } from './miuiScenes';

describe('applyMiuiScene', () => {
  it('replaces layers with scene preset volumes', () => {
    const summerRain = MIUI_SCENES.find((s) => s.id === 'summer-rain')!;
    const next = applyMiuiScene(createInitialMixerState(), summerRain);

    expect(next.layers).toHaveLength(3);
    expect(next.layers.map((l) => l.soundId).sort()).toEqual(['rain', 'stream', 'thunder']);
    expect(next.layers.find((l) => l.soundId === 'rain')?.volume).toBe(0.72);
  });
});
