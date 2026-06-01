import type { CustomLibraryBackupTrack } from './customLibraryBackup';
import type { MixerLayer } from '../domain/mixer';
import type { MixerPreset } from '../storage/mixerPresets';
import { parseMixerPresetList } from '../storage/mixerPresets';
import type { MixerSnapshotPayload } from '../storage/mixerSnapshot';
import type { StoredCustomTrackBytes } from './customLibraryBackup';
import { readPlaybackFadeInSeconds } from '../storage/playbackFadeInPreferences';
import { readScreenWakeLockEnabled } from '../storage/screenWakeLockPreferences';
import { readSleepTimerFadeSeconds } from '../storage/sleepTimerPreferences';
import { readWakeTimerFadeSeconds } from '../storage/wakeTimerPreferences';
import { readThemePreference, type ThemePreference } from '../theme/resolveTheme';
import {
  clampPlaybackFadeInSeconds,
  isValidPlaybackFadeInSeconds,
  PLAYBACK_FADE_IN_OFF
} from './playbackFadeIn';
import {
  clampSleepTimerFadeSeconds,
  isValidSleepTimerFadeSeconds,
  SLEEP_TIMER_FADE_SECONDS
} from './sleepTimer';
import {
  clampWakeTimerFadeSeconds,
  isValidWakeTimerFadeSeconds,
  WAKE_TIMER_FADE_SECONDS
} from './wakeTimer';

export const FULL_APP_BACKUP_TYPE = 'wix-full-backup';
export const FULL_APP_BACKUP_VERSION = 2;
export const FULL_APP_BACKUP_VERSION_LEGACY = 1;

export interface FullAppBackupAppPreferences {
  theme?: ThemePreference;
  playbackFadeInSeconds?: number;
  screenWakeLockEnabled?: boolean;
  sleepTimerFadeSeconds?: number;
  wakeTimerFadeSeconds?: number;
}

export interface FullAppBackupPayload {
  type: typeof FULL_APP_BACKUP_TYPE;
  version: typeof FULL_APP_BACKUP_VERSION | typeof FULL_APP_BACKUP_VERSION_LEGACY;
  exportedAt: number;
  customTracks: CustomLibraryBackupTrack[];
  presets: MixerPreset[];
  mixerSnapshot?: MixerSnapshotPayload;
  appPreferences?: FullAppBackupAppPreferences;
}

export interface FullAppBackupSerializeInput {
  /** Full track bytes for export; omit when only checking exportability via {@link customTrackCount}. */
  tracks?: StoredCustomTrackBytes[];
  /** Used when `tracks` is omitted (e.g. Settings export button). */
  customTrackCount?: number;
  presets: MixerPreset[];
  mixerSnapshot?: MixerSnapshotPayload | null;
  appPreferences?: FullAppBackupAppPreferences | null;
  exportedAt?: number;
}

export type ParseFullAppBackupResult =
  | {
      ok: true;
      tracks: StoredCustomTrackBytes[];
      presets: MixerPreset[];
      mixerSnapshot: MixerSnapshotPayload | null;
      appPreferences: FullAppBackupAppPreferences | null;
    }
  | {
      ok: false;
      reason:
        | 'empty'
        | 'invalid-json'
        | 'wrong-type'
        | 'unsupported-version'
        | 'invalid-payload'
        | 'nothing-to-export';
    };

function resolveCustomTrackCount(input: FullAppBackupSerializeInput): number {
  return input.tracks?.length ?? input.customTrackCount ?? 0;
}

export function hasFullAppBackupExportContent(input: FullAppBackupSerializeInput): boolean {
  if (resolveCustomTrackCount(input) > 0 || input.presets.length > 0) {
    return true;
  }

  if (input.mixerSnapshot && input.mixerSnapshot.layers.length > 0) {
    return true;
  }

  if (input.appPreferences && Object.keys(input.appPreferences).length > 0) {
    return true;
  }

  return false;
}

export function serializeFullAppBackup(input: FullAppBackupSerializeInput): string | null {
  if (!hasFullAppBackupExportContent(input)) {
    return null;
  }

  const tracks = input.tracks ?? [];
  const exportedAt = input.exportedAt ?? Date.now();
  const payload: FullAppBackupPayload = {
    type: FULL_APP_BACKUP_TYPE,
    version: FULL_APP_BACKUP_VERSION,
    exportedAt,
    customTracks: tracks.map((track) => ({
      ...(track.id ? { id: track.id } : {}),
      title: track.title,
      fileName: track.fileName,
      mimeType: track.mimeType,
      size: track.size,
      createdAt: track.createdAt,
      dataBase64: arrayBufferToBase64(track.bytes)
    })),
    presets: input.presets
  };

  if (input.mixerSnapshot && input.mixerSnapshot.layers.length > 0) {
    payload.mixerSnapshot = input.mixerSnapshot;
  }

  if (input.appPreferences && Object.keys(input.appPreferences).length > 0) {
    payload.appPreferences = input.appPreferences;
  }

  return JSON.stringify(payload);
}

export function parseFullAppBackup(text: string): ParseFullAppBackupResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { ok: false, reason: 'invalid-payload' };
  }

  const record = parsed as Record<string, unknown>;
  if (record.type !== FULL_APP_BACKUP_TYPE) {
    return { ok: false, reason: 'wrong-type' };
  }

  const version = record.version;
  if (version !== FULL_APP_BACKUP_VERSION && version !== FULL_APP_BACKUP_VERSION_LEGACY) {
    return { ok: false, reason: 'unsupported-version' };
  }

  const tracks: StoredCustomTrackBytes[] = [];
  if (record.customTracks !== undefined) {
    if (!Array.isArray(record.customTracks)) {
      return { ok: false, reason: 'invalid-payload' };
    }

    for (const entry of record.customTracks) {
      const track = parseBackupTrack(entry);
      if (!track) {
        return { ok: false, reason: 'invalid-payload' };
      }
      tracks.push(track);
    }
  }

  const presets = parseMixerPresetList(record.presets);
  if (record.presets !== undefined && !Array.isArray(record.presets)) {
    return { ok: false, reason: 'invalid-payload' };
  }

  let mixerSnapshot: MixerSnapshotPayload | null = null;
  if (record.mixerSnapshot !== undefined) {
    if (version === FULL_APP_BACKUP_VERSION_LEGACY) {
      return { ok: false, reason: 'invalid-payload' };
    }

    mixerSnapshot = parseMixerSnapshotBackup(record.mixerSnapshot);
    if (!mixerSnapshot) {
      return { ok: false, reason: 'invalid-payload' };
    }
  }

  let appPreferences: FullAppBackupAppPreferences | null = null;
  if (record.appPreferences !== undefined) {
    if (version === FULL_APP_BACKUP_VERSION_LEGACY) {
      return { ok: false, reason: 'invalid-payload' };
    }

    appPreferences = parseAppPreferencesBackup(record.appPreferences);
    if (!appPreferences) {
      return { ok: false, reason: 'invalid-payload' };
    }
  }

  if (
    tracks.length === 0 &&
    presets.length === 0 &&
    (!mixerSnapshot || mixerSnapshot.layers.length === 0) &&
    (!appPreferences || Object.keys(appPreferences).length === 0)
  ) {
    return { ok: false, reason: 'invalid-payload' };
  }

  return { ok: true, tracks, presets, mixerSnapshot, appPreferences };
}

export function readCurrentAppPreferencesForBackup(): FullAppBackupAppPreferences {
  const prefs: FullAppBackupAppPreferences = {};
  const theme = readThemePreference();

  if (theme !== 'system') {
    prefs.theme = theme;
  }

  const playbackFadeInSeconds = readPlaybackFadeInSeconds();
  if (playbackFadeInSeconds !== PLAYBACK_FADE_IN_OFF) {
    prefs.playbackFadeInSeconds = playbackFadeInSeconds;
  }

  if (readScreenWakeLockEnabled()) {
    prefs.screenWakeLockEnabled = true;
  }

  const sleepTimerFadeSeconds = readSleepTimerFadeSeconds();
  if (sleepTimerFadeSeconds !== SLEEP_TIMER_FADE_SECONDS) {
    prefs.sleepTimerFadeSeconds = sleepTimerFadeSeconds;
  }

  const wakeTimerFadeSeconds = readWakeTimerFadeSeconds();
  if (wakeTimerFadeSeconds !== WAKE_TIMER_FADE_SECONDS) {
    prefs.wakeTimerFadeSeconds = wakeTimerFadeSeconds;
  }

  return prefs;
}

export function formatFullAppBackupFilename(exportedAt = Date.now()): string {
  const date = new Date(exportedAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `wix-full-backup-${year}${month}${day}.json`;
}

export function downloadFullAppBackup(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}

function parseMixerSnapshotBackup(value: unknown): MixerSnapshotPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version !== 1) {
    return null;
  }

  const masterVolume = clampNumber(record.masterVolume, 0, 1);
  const stereoWidth = clampNumber(record.stereoWidth, 0, 1);
  const playbackRate = clampNumber(record.playbackRate, 0.5, 1.75);
  const layers = parseLayers(record.layers);

  if (masterVolume === null || stereoWidth === null || playbackRate === null || layers === null) {
    return null;
  }

  return {
    version: 1,
    masterVolume,
    stereoWidth,
    playbackRate,
    layers
  };
}

function parseLayers(value: unknown): MixerLayer[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const layers: MixerLayer[] = [];

  for (const item of value) {
    const layer = parseLayer(item);
    if (layer) {
      layers.push(layer);
    }
  }

  return layers;
}

function parseLayer(value: unknown): MixerLayer | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.soundId !== 'string' || record.soundId.length === 0) {
    return null;
  }

  const volume = clampNumber(record.volume, 0, 1);
  const pan = clampNumber(record.pan, -1, 1);
  const playbackRate = clampNumber(record.playbackRate, 0.5, 1.75);

  if (volume === null || pan === null || playbackRate === null) {
    return null;
  }

  return {
    soundId: record.soundId,
    volume,
    pan,
    playbackRate,
    muted: record.muted === true
  };
}

function parseAppPreferencesBackup(value: unknown): FullAppBackupAppPreferences | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const prefs: FullAppBackupAppPreferences = {};

  if (record.theme !== undefined) {
    if (record.theme !== 'light' && record.theme !== 'dark' && record.theme !== 'system') {
      return null;
    }
    prefs.theme = record.theme;
  }

  if (record.playbackFadeInSeconds !== undefined) {
    if (typeof record.playbackFadeInSeconds !== 'number' || !isValidPlaybackFadeInSeconds(record.playbackFadeInSeconds)) {
      return null;
    }
    prefs.playbackFadeInSeconds = record.playbackFadeInSeconds;
  }

  if (record.screenWakeLockEnabled !== undefined) {
    if (typeof record.screenWakeLockEnabled !== 'boolean') {
      return null;
    }
    prefs.screenWakeLockEnabled = record.screenWakeLockEnabled;
  }

  if (record.sleepTimerFadeSeconds !== undefined) {
    if (typeof record.sleepTimerFadeSeconds !== 'number' || !isValidSleepTimerFadeSeconds(record.sleepTimerFadeSeconds)) {
      return null;
    }
    prefs.sleepTimerFadeSeconds = record.sleepTimerFadeSeconds;
  }

  if (record.wakeTimerFadeSeconds !== undefined) {
    if (typeof record.wakeTimerFadeSeconds !== 'number' || !isValidWakeTimerFadeSeconds(record.wakeTimerFadeSeconds)) {
      return null;
    }
    prefs.wakeTimerFadeSeconds = record.wakeTimerFadeSeconds;
  }

  if (Object.keys(prefs).length === 0) {
    return null;
  }

  return prefs;
}

export function applyFullAppBackupAppPreferences(
  prefs: FullAppBackupAppPreferences,
  writers: {
    setTheme: (theme: ThemePreference) => void;
    setPlaybackFadeInSeconds: (seconds: number) => void;
    setScreenWakeLockEnabled: (enabled: boolean) => void;
    setSleepTimerFadeSeconds: (seconds: number) => void;
    setWakeTimerFadeSeconds: (seconds: number) => void;
  }
): void {
  if (prefs.theme !== undefined) {
    writers.setTheme(prefs.theme);
  }

  if (prefs.playbackFadeInSeconds !== undefined) {
    writers.setPlaybackFadeInSeconds(clampPlaybackFadeInSeconds(prefs.playbackFadeInSeconds));
  }

  if (prefs.screenWakeLockEnabled !== undefined) {
    writers.setScreenWakeLockEnabled(prefs.screenWakeLockEnabled);
  }

  if (prefs.sleepTimerFadeSeconds !== undefined) {
    writers.setSleepTimerFadeSeconds(clampSleepTimerFadeSeconds(prefs.sleepTimerFadeSeconds));
  }

  if (prefs.wakeTimerFadeSeconds !== undefined) {
    writers.setWakeTimerFadeSeconds(clampWakeTimerFadeSeconds(prefs.wakeTimerFadeSeconds));
  }
}

function parseBackupTrack(entry: unknown): StoredCustomTrackBytes | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const title = readNonEmptyString(record.title);
  const fileName = readNonEmptyString(record.fileName);
  const mimeType = readNonEmptyString(record.mimeType) ?? 'audio/mpeg';
  const size = readPositiveInteger(record.size);
  const createdAt = readPositiveInteger(record.createdAt);
  const dataBase64 = readNonEmptyString(record.dataBase64);

  if (!title || !fileName || size === null || createdAt === null || !dataBase64) {
    return null;
  }

  let bytes: ArrayBuffer;
  try {
    bytes = base64ToArrayBuffer(dataBase64);
  } catch {
    return null;
  }

  if (bytes.byteLength !== size) {
    return null;
  }

  const id = readNonEmptyString(record.id) ?? undefined;

  return {
    ...(id ? { id } : {}),
    title,
    fileName,
    mimeType,
    size,
    createdAt,
    bytes
  };
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function readPositiveInteger(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : null;
}

function clampNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return Math.min(max, Math.max(min, value));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}
