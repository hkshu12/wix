import type { MixerLayer, MixerState } from './mixer';
import type { MixerPresetSnapshot } from './applyMixerPreset';

export const MIXER_SHARE_TYPE = 'wix-mixer-share';
export const MIXER_SHARE_VERSION = 1;

export interface MixerSharePayload extends MixerPresetSnapshot {
  type: typeof MIXER_SHARE_TYPE;
  version: typeof MIXER_SHARE_VERSION;
}

export type ParseMixerShareResult =
  | { ok: true; snapshot: MixerPresetSnapshot }
  | { ok: false; reason: 'empty' | 'invalid-json' | 'wrong-type' | 'unsupported-version' | 'invalid-payload' };

export function serializeMixerShare(state: MixerState): string {
  const payload: MixerSharePayload = {
    type: MIXER_SHARE_TYPE,
    version: MIXER_SHARE_VERSION,
    masterVolume: state.masterVolume,
    stereoWidth: state.stereoWidth,
    playbackRate: state.playbackRate,
    layers: state.layers.map((layer) => ({ ...layer }))
  };

  return JSON.stringify(payload);
}

export function parseMixerShare(text: string): ParseMixerShareResult {
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
  if (record.type !== MIXER_SHARE_TYPE) {
    return { ok: false, reason: 'wrong-type' };
  }

  if (record.version !== MIXER_SHARE_VERSION) {
    return { ok: false, reason: 'unsupported-version' };
  }

  const masterVolume = clampNumber(record.masterVolume, 0, 1);
  const stereoWidth = clampNumber(record.stereoWidth, 0, 1);
  const playbackRate = clampNumber(record.playbackRate, 0.5, 1.75);
  const layers = parseLayers(record.layers);

  if (masterVolume === null || stereoWidth === null || playbackRate === null || layers === null) {
    return { ok: false, reason: 'invalid-payload' };
  }

  return {
    ok: true,
    snapshot: {
      masterVolume,
      stereoWidth,
      playbackRate,
      layers
    }
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
