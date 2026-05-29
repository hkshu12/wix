import type { CustomLibraryBackupTrack } from './customLibraryBackup';
import type { MixerPreset } from '../storage/mixerPresets';
import { parseMixerPresetList } from '../storage/mixerPresets';
import type { StoredCustomTrackBytes } from './customLibraryBackup';

export const FULL_APP_BACKUP_TYPE = 'wix-full-backup';
export const FULL_APP_BACKUP_VERSION = 1;

export interface FullAppBackupPayload {
  type: typeof FULL_APP_BACKUP_TYPE;
  version: typeof FULL_APP_BACKUP_VERSION;
  exportedAt: number;
  customTracks: CustomLibraryBackupTrack[];
  presets: MixerPreset[];
}

export type ParseFullAppBackupResult =
  | { ok: true; tracks: StoredCustomTrackBytes[]; presets: MixerPreset[] }
  | { ok: false; reason: 'empty' | 'invalid-json' | 'wrong-type' | 'unsupported-version' | 'invalid-payload' | 'nothing-to-export' };

export function serializeFullAppBackup(
  tracks: StoredCustomTrackBytes[],
  presets: MixerPreset[],
  exportedAt = Date.now()
): string | null {
  if (tracks.length === 0 && presets.length === 0) {
    return null;
  }

  const payload: FullAppBackupPayload = {
    type: FULL_APP_BACKUP_TYPE,
    version: FULL_APP_BACKUP_VERSION,
    exportedAt,
    customTracks: tracks.map((track) => ({
      title: track.title,
      fileName: track.fileName,
      mimeType: track.mimeType,
      size: track.size,
      createdAt: track.createdAt,
      dataBase64: arrayBufferToBase64(track.bytes)
    })),
    presets
  };

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

  if (record.version !== FULL_APP_BACKUP_VERSION) {
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

  if (tracks.length === 0 && presets.length === 0) {
    return { ok: false, reason: 'invalid-payload' };
  }

  return { ok: true, tracks, presets };
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

  return {
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
