import type { MixerState } from './mixer';
import type { FlagshipScene } from './flagshipScenes';

export function applyFlagshipScene(state: MixerState, scene: FlagshipScene): MixerState {
  return {
    ...state,
    layers: scene.layers.map((layer) => ({
      soundId: layer.soundId,
      volume: layer.volume,
      pan: 0,
      playbackRate: 1,
      muted: false
    }))
  };
}
