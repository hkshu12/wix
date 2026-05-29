import type { MixerPreset } from '../storage/mixerPresets';
import { parseMixerPresetList } from '../storage/mixerPresets';

export const MIXER_PRESETS_BACKUP_TYPE = 'wix-mixer-presets';
export const MIXER_PRESETS_BACKUP_VERSION = 1;

export interface MixerPresetsBackupPayload {
  type: typeof MIXER_PRESETS_BACKUP_TYPE;
  version: typeof MIXER_PRESETS_BACKUP_VERSION;
  exportedAt: number;
  presets: MixerPreset[];
}

export type ParseMixerPresetsBackupResult =
  | { ok: true; presets: MixerPreset[] }
  | { ok: false; reason: 'empty' | 'invalid-json' | 'wrong-type' | 'unsupported-version' | 'invalid-payload' };

export function serializeMixerPresetsBackup(presets: MixerPreset[], exportedAt = Date.now()): string {
  const payload: MixerPresetsBackupPayload = {
    type: MIXER_PRESETS_BACKUP_TYPE,
    version: MIXER_PRESETS_BACKUP_VERSION,
    exportedAt,
    presets
  };

  return JSON.stringify(payload);
}

export function parseMixerPresetsBackup(text: string): ParseMixerPresetsBackupResult {
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
  if (record.type !== MIXER_PRESETS_BACKUP_TYPE) {
    return { ok: false, reason: 'wrong-type' };
  }

  if (record.version !== MIXER_PRESETS_BACKUP_VERSION) {
    return { ok: false, reason: 'unsupported-version' };
  }

  const presets = parseMixerPresetList(record.presets);
  if (!Array.isArray(record.presets) || presets.length === 0) {
    return { ok: false, reason: 'invalid-payload' };
  }

  return { ok: true, presets };
}

export function formatMixerPresetsBackupFilename(exportedAt = Date.now()): string {
  const date = new Date(exportedAt);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `wix-mixer-presets-${year}${month}${day}.json`;
}

export function downloadMixerPresetsBackup(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(url);
}
