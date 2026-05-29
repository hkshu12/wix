import type { MixerLayer, MixerState } from '../domain/mixer';

export const STORAGE_KEY_MIXER_PRESETS = 'wix.mixerPresets';
export const MAX_MIXER_PRESETS = 12;

const PRESETS_VERSION = 1;

export interface MixerPreset {
  id: string;
  name: string;
  createdAt: number;
  masterVolume: number;
  stereoWidth: number;
  playbackRate: number;
  layers: MixerLayer[];
}

export type SaveMixerPresetResult =
  | { ok: true; preset: MixerPreset; overwritten: boolean }
  | { ok: false; reason: 'empty-name' | 'max-reached' };

export function readMixerPresets(): MixerPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MIXER_PRESETS);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return parseMixerPresetsPayload(parsed);
  } catch {
    return [];
  }
}

export function saveMixerPreset(name: string, state: MixerState): SaveMixerPresetResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty-name' };
  }

  const presets = readMixerPresets();
  const existingIndex = presets.findIndex((preset) => preset.name === trimmed);

  if (existingIndex >= 0) {
    const existing = presets[existingIndex];
    if (!existing) {
      return { ok: false, reason: 'max-reached' };
    }

    const updated: MixerPreset = {
      ...existing,
      masterVolume: state.masterVolume,
      stereoWidth: state.stereoWidth,
      playbackRate: state.playbackRate,
      layers: state.layers.map((layer) => ({ ...layer }))
    };

    const next = [...presets];
    next[existingIndex] = updated;
    writeMixerPresets(next);
    return { ok: true, preset: updated, overwritten: true };
  }

  if (presets.length >= MAX_MIXER_PRESETS) {
    return { ok: false, reason: 'max-reached' };
  }

  const preset: MixerPreset = {
    id: createPresetId(),
    name: trimmed,
    createdAt: Date.now(),
    masterVolume: state.masterVolume,
    stereoWidth: state.stereoWidth,
    playbackRate: state.playbackRate,
    layers: state.layers.map((layer) => ({ ...layer }))
  };

  writeMixerPresets([...presets, preset]);
  return { ok: true, preset, overwritten: false };
}

export function deleteMixerPreset(id: string): void {
  const presets = readMixerPresets().filter((preset) => preset.id !== id);
  writeMixerPresets(presets);
}

export function replaceMixerPresets(presets: MixerPreset[]): void {
  writeMixerPresets(presets);
}

function writeMixerPresets(presets: MixerPreset[]): void {
  localStorage.setItem(
    STORAGE_KEY_MIXER_PRESETS,
    JSON.stringify({ version: PRESETS_VERSION, presets: presets.slice(0, MAX_MIXER_PRESETS) })
  );
}

export function parseMixerPresetList(presets: unknown): MixerPreset[] {
  if (!Array.isArray(presets)) {
    return [];
  }

  const parsed: MixerPreset[] = [];

  for (const item of presets) {
    const preset = parsePreset(item);
    if (preset) {
      parsed.push(preset);
    }
  }

  return parsed.slice(0, MAX_MIXER_PRESETS);
}

function createPresetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `preset-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function parseMixerPresetsPayload(value: unknown): MixerPreset[] {
  if (!value || typeof value !== 'object') {
    return [];
  }

  const record = value as Record<string, unknown>;
  if (record.version !== PRESETS_VERSION || !Array.isArray(record.presets)) {
    return [];
  }

  return parseMixerPresetList(record.presets);
}

function parsePreset(value: unknown): MixerPreset | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'string' || typeof record.name !== 'string' || typeof record.createdAt !== 'number') {
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
    id: record.id,
    name: record.name.trim().slice(0, 40) || '未命名',
    createdAt: record.createdAt,
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

function clampNumber(value: unknown, min: number, max: number): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null;
  }

  return Math.min(max, Math.max(min, value));
}
