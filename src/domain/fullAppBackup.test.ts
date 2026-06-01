import { describe, expect, it, vi } from 'vitest';
import type { MixerPreset } from '../storage/mixerPresets';
import type { MixerSnapshotPayload } from '../storage/mixerSnapshot';
import type { StoredCustomTrackBytes } from './customLibraryBackup';
import {
  FULL_APP_BACKUP_TYPE,
  FULL_APP_BACKUP_VERSION,
  FULL_APP_BACKUP_VERSION_LEGACY,
  applyFullAppBackupAppPreferences,
  formatFullAppBackupFilename,
  hasFullAppBackupExportContent,
  parseFullAppBackup,
  serializeFullAppBackup
} from './fullAppBackup';

function sampleTrack(id = 'custom-track-1'): StoredCustomTrackBytes {
  const bytes = new TextEncoder().encode('audio-bytes').buffer;

  return {
    id,
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

function sampleMixerSnapshot(): MixerSnapshotPayload {
  return {
    version: 1,
    masterVolume: 0.7,
    stereoWidth: 1,
    playbackRate: 1,
    layers: [
      {
        soundId: 'rain',
        volume: 0.5,
        pan: 0,
        playbackRate: 1,
        muted: false
      }
    ]
  };
}

describe('fullAppBackup', () => {
  it('serializes and parses custom tracks and presets together', () => {
    const track = sampleTrack();
    const preset = samplePreset();
    const json = serializeFullAppBackup({ tracks: [track], presets: [preset], exportedAt: 1_700_000_000_000 });
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
    expect(JSON.parse(json!).version).toBe(FULL_APP_BACKUP_VERSION);
  });

  it('preserves custom track ids so mixer layers survive import', () => {
    const track = sampleTrack('custom-track-abc');
    const preset: MixerPreset = {
      ...samplePreset(),
      layers: [
        {
          soundId: 'custom-track-abc',
          volume: 0.6,
          pan: 0,
          playbackRate: 1,
          muted: false
        }
      ]
    };
    const mixerSnapshot: MixerSnapshotPayload = {
      ...sampleMixerSnapshot(),
      layers: [
        {
          soundId: 'custom-track-abc',
          volume: 0.4,
          pan: 0,
          playbackRate: 1,
          muted: false
        }
      ]
    };

    const json = serializeFullAppBackup({
      tracks: [track],
      presets: [preset],
      mixerSnapshot
    });
    expect(json).not.toBeNull();

    const result = parseFullAppBackup(json!);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.tracks[0]?.id).toBe('custom-track-abc');
    expect(result.presets[0]?.layers[0]?.soundId).toBe('custom-track-abc');
    expect(result.mixerSnapshot?.layers[0]?.soundId).toBe('custom-track-abc');
  });

  it('includes mixer snapshot and app preferences in v2 backups', () => {
    const json = serializeFullAppBackup({
      tracks: [],
      presets: [],
      mixerSnapshot: sampleMixerSnapshot(),
      appPreferences: {
        theme: 'dark',
        playbackFadeInSeconds: 4,
        screenWakeLockEnabled: true
      }
    });
    expect(json).not.toBeNull();

    const result = parseFullAppBackup(json!);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.mixerSnapshot?.layers).toHaveLength(1);
    expect(result.appPreferences?.theme).toBe('dark');
    expect(result.appPreferences?.playbackFadeInSeconds).toBe(4);
    expect(result.appPreferences?.screenWakeLockEnabled).toBe(true);
  });

  it('still parses v1 backups without snapshot or preferences', () => {
    const track = sampleTrack();
    const v1Json = JSON.stringify({
      type: FULL_APP_BACKUP_TYPE,
      version: FULL_APP_BACKUP_VERSION_LEGACY,
      exportedAt: 1_700_000_000_000,
      customTracks: [
        {
          title: track.title,
          fileName: track.fileName,
          mimeType: track.mimeType,
          size: track.size,
          createdAt: track.createdAt,
          dataBase64: btoa(String.fromCharCode(...new Uint8Array(track.bytes)))
        }
      ],
      presets: []
    });

    const result = parseFullAppBackup(v1Json);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.tracks).toHaveLength(1);
    expect(result.mixerSnapshot).toBeNull();
    expect(result.appPreferences).toBeNull();
  });

  it('allows presets-only backups', () => {
    const json = serializeFullAppBackup({ tracks: [], presets: [samplePreset()] });
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
    const json = serializeFullAppBackup({ tracks: [sampleTrack()], presets: [] });
    expect(json).not.toBeNull();

    const result = parseFullAppBackup(json!);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.tracks).toHaveLength(1);
    expect(result.presets).toHaveLength(0);
  });

  it('detects exportable content via customTrackCount', () => {
    expect(
      hasFullAppBackupExportContent({
        customTrackCount: 2,
        presets: []
      })
    ).toBe(true);
    expect(
      hasFullAppBackupExportContent({
        customTrackCount: 0,
        presets: [],
        mixerSnapshot: sampleMixerSnapshot()
      })
    ).toBe(true);
  });

  it('returns null when there is nothing to export', () => {
    expect(serializeFullAppBackup({ tracks: [], presets: [] })).toBeNull();
  });

  it('applies imported app preferences through writers', () => {
    const writers = {
      setTheme: vi.fn(),
      setPlaybackFadeInSeconds: vi.fn(),
      setScreenWakeLockEnabled: vi.fn(),
      setSleepTimerFadeSeconds: vi.fn(),
      setWakeTimerFadeSeconds: vi.fn()
    };

    applyFullAppBackupAppPreferences(
      {
        theme: 'dark',
        playbackFadeInSeconds: 6,
        screenWakeLockEnabled: true,
        sleepTimerFadeSeconds: 45,
        wakeTimerFadeSeconds: 60
      },
      writers
    );

    expect(writers.setTheme).toHaveBeenCalledWith('dark');
    expect(writers.setPlaybackFadeInSeconds).toHaveBeenCalledWith(6);
    expect(writers.setScreenWakeLockEnabled).toHaveBeenCalledWith(true);
    expect(writers.setSleepTimerFadeSeconds).toHaveBeenCalledWith(45);
    expect(writers.setWakeTimerFadeSeconds).toHaveBeenCalledWith(60);
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
          version: FULL_APP_BACKUP_VERSION_LEGACY,
          customTracks: [],
          presets: []
        })
      )
    ).toEqual({ ok: false, reason: 'invalid-payload' });
    expect(
      parseFullAppBackup(
        JSON.stringify({
          type: FULL_APP_BACKUP_TYPE,
          version: FULL_APP_BACKUP_VERSION_LEGACY,
          customTracks: [],
          presets: [],
          mixerSnapshot: sampleMixerSnapshot()
        })
      )
    ).toEqual({ ok: false, reason: 'invalid-payload' });
  });

  it('formats backup filenames with the export date', () => {
    expect(formatFullAppBackupFilename(Date.UTC(2026, 4, 29))).toBe('wix-full-backup-20260529.json');
  });
});
