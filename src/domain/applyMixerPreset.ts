import type { MixerState } from './mixer';

export interface MixerPresetSnapshot {
  masterVolume: number;
  stereoWidth: number;
  playbackRate: number;
  layers: MixerState['layers'];
}

/** Applies a saved preset; layers missing from `allowedSoundIds` are dropped. */
export function applyMixerPreset(
  current: MixerState,
  preset: MixerPresetSnapshot,
  allowedSoundIds: ReadonlySet<string>
): MixerState {
  const layers = preset.layers.filter((layer) => allowedSoundIds.has(layer.soundId));

  return {
    ...current,
    masterVolume: preset.masterVolume,
    stereoWidth: preset.stereoWidth,
    playbackRate: preset.playbackRate,
    layers
  };
}
