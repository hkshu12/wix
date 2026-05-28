import {
  createInitialMixerState,
  type MixerLayer,
  type MixerState
} from '../domain/mixer';
import { BUILT_IN_SOUNDS, type BuiltInSoundId } from '../domain/sounds';

export const STORAGE_KEY_MIXER_SNAPSHOT = 'wix.mixerSnapshot';
const SNAPSHOT_VERSION = 1;

const BUILT_IN_SOUND_IDS = new Set<string>(BUILT_IN_SOUNDS.map((sound) => sound.id));

interface MixerSnapshotPayload {
  version: number;
  masterVolume: number;
  stereoWidth: number;
  playbackRate: number;
  layers: MixerLayer[];
}

export function readMixerSnapshot(): MixerSnapshotPayload | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MIXER_SNAPSHOT);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return parseMixerSnapshotPayload(parsed);
  } catch {
    return null;
  }
}

export function writeMixerSnapshot(state: MixerState): void {
  const payload: MixerSnapshotPayload = {
    version: SNAPSHOT_VERSION,
    masterVolume: state.masterVolume,
    stereoWidth: state.stereoWidth,
    playbackRate: state.playbackRate,
    layers: state.layers
  };

  localStorage.setItem(STORAGE_KEY_MIXER_SNAPSHOT, JSON.stringify(payload));
}

/** Restores globals and layers; {@link MixerState.isPlaying} starts paused until autoplay runs. */
export function hydrateMixerState(snapshot: MixerSnapshotPayload | null): MixerState {
  const base = createInitialMixerState();

  if (!snapshot) {
    return base;
  }

  const layers = snapshot.layers.filter(
    (layer) => !isBuiltInSoundId(layer.soundId) || BUILT_IN_SOUND_IDS.has(layer.soundId)
  );

  return {
    ...base,
    isPlaying: false,
    masterVolume: snapshot.masterVolume,
    stereoWidth: snapshot.stereoWidth,
    playbackRate: snapshot.playbackRate,
    layers
  };
}

export function filterMixerLayersToSounds(state: MixerState, allowedSoundIds: ReadonlySet<string>): MixerState {
  const nextLayers = state.layers.filter((layer) => allowedSoundIds.has(layer.soundId));

  if (nextLayers.length === state.layers.length) {
    return state;
  }

  return {
    ...state,
    layers: nextLayers
  };
}

function isBuiltInSoundId(soundId: string): soundId is BuiltInSoundId {
  return BUILT_IN_SOUND_IDS.has(soundId);
}

function parseMixerSnapshotPayload(value: unknown): MixerSnapshotPayload | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (record.version !== SNAPSHOT_VERSION) {
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
    version: SNAPSHOT_VERSION,
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
