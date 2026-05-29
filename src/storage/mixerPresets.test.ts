import { beforeEach, describe, expect, it } from 'vitest';
import { createInitialMixerState } from '../domain/mixer';
import {
  deleteMixerPreset,
  MAX_MIXER_PRESETS,
  readMixerPresets,
  renameMixerPreset,
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

  it('overwrites an existing preset when the name matches', () => {
    const initial = {
      ...createInitialMixerState(),
      masterVolume: 0.4,
      layers: [{ soundId: 'rain', volume: 0.3, pan: 0, playbackRate: 1, muted: false }]
    };
    const first = saveMixerPreset('睡眠', initial);
    expect(first.ok).toBe(true);
    if (!first.ok) {
      return;
    }
    expect(first.overwritten).toBe(false);

    const updatedState = {
      ...createInitialMixerState(),
      masterVolume: 0.8,
      layers: [{ soundId: 'ocean', volume: 0.5, pan: 0, playbackRate: 1, muted: false }]
    };
    const second = saveMixerPreset('睡眠', updatedState);
    expect(second.ok).toBe(true);
    if (!second.ok) {
      return;
    }
    expect(second.overwritten).toBe(true);
    expect(second.preset.id).toBe(first.preset.id);

    const presets = readMixerPresets();
    expect(presets).toHaveLength(1);
    expect(presets[0]?.masterVolume).toBe(0.8);
    expect(presets[0]?.layers[0]?.soundId).toBe('ocean');
  });

  it('allows updating the twelfth preset without hitting max-reached', () => {
    for (let index = 0; index < MAX_MIXER_PRESETS; index += 1) {
      saveMixerPreset(`预设 ${index}`, createInitialMixerState());
    }

    const overwrite = saveMixerPreset('预设 0', {
      ...createInitialMixerState(),
      masterVolume: 0.25
    });
    expect(overwrite.ok).toBe(true);
    if (!overwrite.ok) {
      return;
    }
    expect(overwrite.overwritten).toBe(true);
    expect(readMixerPresets()).toHaveLength(MAX_MIXER_PRESETS);
    expect(readMixerPresets()[0]?.masterVolume).toBe(0.25);
  });

  it('deletes a preset by id', () => {
    const saved = saveMixerPreset('测试', createInitialMixerState());
    if (!saved.ok) {
      throw new Error('expected save to succeed');
    }

    deleteMixerPreset(saved.preset.id);
    expect(readMixerPresets()).toHaveLength(0);
  });

  it('renames a preset without changing layers or volume', () => {
    const state = {
      ...createInitialMixerState(),
      masterVolume: 0.6,
      layers: [{ soundId: 'rain', volume: 0.4, pan: 0, playbackRate: 1, muted: false }]
    };
    const saved = saveMixerPreset('旧名', state);
    if (!saved.ok) {
      throw new Error('expected save to succeed');
    }

    const renamed = renameMixerPreset(saved.preset.id, ' 新名称 ');
    expect(renamed.ok).toBe(true);
    if (!renamed.ok) {
      return;
    }

    expect(renamed.preset.name).toBe('新名称');
    expect(renamed.preset.id).toBe(saved.preset.id);
    expect(renamed.preset.masterVolume).toBe(0.6);
    expect(renamed.preset.layers[0]?.soundId).toBe('rain');

    const presets = readMixerPresets();
    expect(presets).toHaveLength(1);
    expect(presets[0]?.name).toBe('新名称');
  });

  it('rejects rename to an existing name', () => {
    saveMixerPreset('专注', createInitialMixerState());
    const second = saveMixerPreset('睡眠', createInitialMixerState());
    if (!second.ok) {
      throw new Error('expected save to succeed');
    }

    const result = renameMixerPreset(second.preset.id, '专注');
    expect(result).toEqual({ ok: false, reason: 'duplicate-name' });
    expect(readMixerPresets()[1]?.name).toBe('睡眠');
  });

  it('rejects empty rename', () => {
    const saved = saveMixerPreset('测试', createInitialMixerState());
    if (!saved.ok) {
      throw new Error('expected save to succeed');
    }

    expect(renameMixerPreset(saved.preset.id, '   ')).toEqual({ ok: false, reason: 'empty-name' });
    expect(readMixerPresets()[0]?.name).toBe('测试');
  });
});
