import { describe, expect, it } from 'vitest';
import { createInitialMixerState } from './mixer';
import { applyMiuiScene } from './applyMiuiScene';
import { MIUI_SCENES } from './miuiScenes';

describe('applyMiuiScene', () => {
  it('replaces layers with scene preset volumes', () => {
    const rain = MIUI_SCENES.find((s) => s.id === 'rain')!;
    const next = applyMiuiScene(createInitialMixerState(), rain);

    expect(next.layers).toHaveLength(1);
    expect(next.layers[0]?.soundId).toBe('rain');
    expect(next.layers[0]?.volume).toBe(0.78);
  });
});
