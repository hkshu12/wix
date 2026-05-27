import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialMixerState } from '../domain/mixer';
import {
  deleteMixerPreset,
  MAX_MIXER_PRESETS,
  readMixerPresets,
  saveMixerPreset,
  STORAGE_KEY_MIXER_PRESETS
} from './mixerPresets';

describe('mixerPresets storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty list when unset', () => {
    expect(readMixerPresets()).toEqual([]);
  });

  it('saves and reads a preset from mixer state', () => {
    const state = {
      ...createInitialMixerState(),
      masterVolume: 0.55,
      layers: [{ soundId: 'rain', volume: 0.4, pan: 0.2, playbackRate: 1, muted: false }]
    };

    const result = saveMixerPreset(' 雨夜专注 ', state);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const presets = readMixerPresets();
    expect(presets).toHaveLength(1);
    expect(presets[0]?.name).toBe('雨夜专注');
    expect(presets[0]?.masterVolume).toBe(0.55);
    expect(presets[0]?.layers[0]?.soundId).toBe('rain');
    expect(localStorage.getItem(STORAGE_KEY_MIXER_PRESETS)).toContain('"version":1');
  });

  it('rejects empty names', () => {
    const result = saveMixerPreset('   ', createInitialMixerState());
    expect(result).toEqual({ ok: false, reason: 'empty-name' });
    expect(readMixerPresets()).toHaveLength(0);
  });

  it('enforces max preset count', () => {
    for (let index = 0; index < MAX_MIXER_PRESETS; index += 1) {
      saveMixerPreset(`预设 ${index}`, createInitialMixerState());
    }

    const overflow = saveMixerPreset('超出', createInitialMixerState());
    expect(overflow).toEqual({ ok: false, reason: 'max-reached' });
    expect(readMixerPresets()).toHaveLength(MAX_MIXER_PRESETS);
  });

  it('deletes a preset by id', () => {
    const saved = saveMixerPreset('测试', createInitialMixerState());
    if (!saved.ok) {
      throw new Error('expected save to succeed');
    }

    deleteMixerPreset(saved.preset.id);
    expect(readMixerPresets()).toHaveLength(0);
  });
});
