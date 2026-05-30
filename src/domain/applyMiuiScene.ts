import type { MixerState } from './mixer';
import type { MiuiScene } from './miuiScenes';

/** Replace the current mix with a MIUI scene preset (keeps master / transport settings). */
export function applyMiuiScene(state: MixerState, scene: MiuiScene): MixerState {
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
