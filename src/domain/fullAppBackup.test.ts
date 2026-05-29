import { describe, expect, it } from 'vitest';
import type { MixerPreset } from '../storage/mixerPresets';
import type { StoredCustomTrackBytes } from './customLibraryBackup';
import {
  FULL_APP_BACKUP_TYPE,
  formatFullAppBackupFilename,
  parseFullAppBackup,
  serializeFullAppBackup
} from './fullAppBackup';

function sampleTrack(): StoredCustomTrackBytes {
  const bytes = new TextEncoder().encode('audio-bytes').buffer;

  return {
    title: 'focus-loop',
    fileName: 'focus-loop.mp3',
    mimeType: 'audio/mpeg',
    size: bytes.byteLength,
    createdAt: 1_700_000_000_000,
    bytes
  };
}

function samplePreset(): MixerPreset {
  return {
    id: 'preset-1',
    name: '专注',
    createdAt: 1_700_000_000_000,
    masterVolume: 0.8,
    stereoWidth: 1,
    playbackRate: 1,
    layers: []
  };
}

describe('fullAppBackup', () => {
  it('serializes and parses custom tracks and presets together', () => {
    const track = sampleTrack();
    const preset = samplePreset();
    const json = serializeFullAppBackup([track], [preset], 1_700_000_000_000);
    expect(json).not.toBeNull();

    const result = parseFullAppBackup(json!);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.tracks).toHaveLength(1);
    expect(result.presets).toHaveLength(1);
    expect(result.presets[0].name).toBe('专注');
    expect(new Uint8Array(result.tracks[0].bytes)).toEqual(new Uint8Array(track.bytes));
  });

  it('allows presets-only backups', () => {
    const json = serializeFullAppBackup([], [samplePreset()]);
    expect(json).not.toBeNull();

    const result = parseFullAppBackup(json!);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.tracks).toHaveLength(0);
    expect(result.presets).toHaveLength(1);
  });

  it('allows custom-tracks-only backups', () => {
    const json = serializeFullAppBackup([sampleTrack()], []);
    expect(json).not.toBeNull();

    const result = parseFullAppBackup(json!);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.tracks).toHaveLength(1);
    expect(result.presets).toHaveLength(0);
  });

  it('returns null when there is nothing to export', () => {
    expect(serializeFullAppBackup([], [])).toBeNull();
  });

  it('rejects invalid backup payloads', () => {
    expect(parseFullAppBackup('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseFullAppBackup('not-json')).toEqual({ ok: false, reason: 'invalid-json' });
    expect(parseFullAppBackup(JSON.stringify({ type: 'other' }))).toEqual({
      ok: false,
      reason: 'wrong-type'
    });
    expect(parseFullAppBackup(JSON.stringify({ type: FULL_APP_BACKUP_TYPE, version: 99 }))).toEqual({
      ok: false,
      reason: 'unsupported-version'
    });
    expect(
      parseFullAppBackup(
        JSON.stringify({
          type: FULL_APP_BACKUP_TYPE,
          version: 1,
          customTracks: [],
          presets: []
        })
      )
    ).toEqual({ ok: false, reason: 'invalid-payload' });
  });

  it('formats backup filenames with the export date', () => {
    expect(formatFullAppBackupFilename(Date.UTC(2026, 4, 29))).toBe('wix-full-backup-20260529.json');
  });
});
