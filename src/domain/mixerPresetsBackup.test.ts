import { describe, expect, it } from 'vitest';
import type { MixerPreset } from '../storage/mixerPresets';
import {
  MIXER_PRESETS_BACKUP_TYPE,
  formatMixerPresetsBackupFilename,
  parseMixerPresetsBackup,
  serializeMixerPresetsBackup
} from './mixerPresetsBackup';

function samplePreset(overrides: Partial<MixerPreset> = {}): MixerPreset {
  return {
    id: 'preset-1',
    name: '专注',
    createdAt: 1_700_000_000_000,
    masterVolume: 0.8,
    stereoWidth: 1,
    playbackRate: 1,
    layers: [{ soundId: 'rain', volume: 0.6, pan: 0, playbackRate: 1, muted: false }],
    ...overrides
  };
}

describe('mixerPresetsBackup', () => {
  it('serializes and parses a backup payload', () => {
    const preset = samplePreset();
    const json = serializeMixerPresetsBackup([preset], 1_700_000_000_000);
    const result = parseMixerPresetsBackup(json);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.presets).toHaveLength(1);
    expect(result.presets[0]).toMatchObject({
      id: 'preset-1',
      name: '专注',
      masterVolume: 0.8,
      layers: [{ soundId: 'rain', volume: 0.6 }]
    });
  });

  it('rejects invalid backup payloads', () => {
    expect(parseMixerPresetsBackup('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseMixerPresetsBackup('not-json')).toEqual({ ok: false, reason: 'invalid-json' });
    expect(parseMixerPresetsBackup(JSON.stringify({ type: 'other' }))).toEqual({
      ok: false,
      reason: 'wrong-type'
    });
    expect(parseMixerPresetsBackup(JSON.stringify({ type: MIXER_PRESETS_BACKUP_TYPE, version: 99 }))).toEqual({
      ok: false,
      reason: 'unsupported-version'
    });
    expect(
      parseMixerPresetsBackup(
        JSON.stringify({ type: MIXER_PRESETS_BACKUP_TYPE, version: 1, presets: [] })
      )
    ).toEqual({ ok: false, reason: 'invalid-payload' });
  });

  it('formats backup filenames with the export date', () => {
    expect(formatMixerPresetsBackupFilename(Date.UTC(2026, 4, 29))).toBe('wix-mixer-presets-20260529.json');
  });
});
