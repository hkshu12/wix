import { describe, expect, it } from 'vitest';
import {
  CUSTOM_LIBRARY_BACKUP_TYPE,
  formatCustomLibraryBackupFilename,
  parseCustomLibraryBackup,
  serializeCustomLibraryBackup,
  type StoredCustomTrackBytes
} from './customLibraryBackup';

function sampleTrack(overrides: Partial<StoredCustomTrackBytes> = {}): StoredCustomTrackBytes {
  const bytes = new TextEncoder().encode('audio-bytes').buffer;

  return {
    title: 'focus-loop',
    fileName: 'focus-loop.mp3',
    mimeType: 'audio/mpeg',
    size: bytes.byteLength,
    createdAt: 1_700_000_000_000,
    bytes,
    ...overrides
  };
}

describe('customLibraryBackup', () => {
  it('serializes and parses a backup payload', () => {
    const track = sampleTrack();
    const json = serializeCustomLibraryBackup([track], 1_700_000_000_000);
    const result = parseCustomLibraryBackup(json);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.tracks).toHaveLength(1);
    expect(result.tracks[0]).toMatchObject({
      title: 'focus-loop',
      fileName: 'focus-loop.mp3',
      mimeType: 'audio/mpeg',
      size: track.size,
      createdAt: track.createdAt
    });
    expect(new Uint8Array(result.tracks[0].bytes)).toEqual(new Uint8Array(track.bytes));
  });

  it('rejects invalid backup payloads', () => {
    expect(parseCustomLibraryBackup('')).toEqual({ ok: false, reason: 'empty' });
    expect(parseCustomLibraryBackup('not-json')).toEqual({ ok: false, reason: 'invalid-json' });
    expect(parseCustomLibraryBackup(JSON.stringify({ type: 'other' }))).toEqual({
      ok: false,
      reason: 'wrong-type'
    });
    expect(parseCustomLibraryBackup(JSON.stringify({ type: CUSTOM_LIBRARY_BACKUP_TYPE, version: 99 }))).toEqual({
      ok: false,
      reason: 'unsupported-version'
    });
  });

  it('formats backup filenames with the export date', () => {
    expect(formatCustomLibraryBackupFilename(Date.UTC(2026, 4, 29))).toBe('wix-custom-library-20260529.json');
  });
});
