export interface MixerLayer {
  soundId: string;
  volume: number;
  pan: number;
  playbackRate: number;
  muted: boolean;
}

export interface MixerState {
  isPlaying: boolean;
  masterVolume: number;
  stereoWidth: number;
  playbackRate: number;
  layers: MixerLayer[];
}

export type LayerControlUpdate = Partial<Pick<MixerLayer, 'volume' | 'pan' | 'playbackRate' | 'muted'>>;

export function createInitialMixerState(): MixerState {
  return {
    isPlaying: false,
    masterVolume: 0.82,
    stereoWidth: 0.6,
    playbackRate: 1,
    layers: []
  };
}

export function toggleLayer(state: MixerState, soundId: string): MixerState {
  const exists = state.layers.some((layer) => layer.soundId === soundId);

  if (exists) {
    return {
      ...state,
      layers: state.layers.filter((layer) => layer.soundId !== soundId)
    };
  }

  return {
    ...state,
    layers: [
      ...state.layers,
      {
        soundId,
        volume: 0.65,
        pan: 0,
        playbackRate: 1,
        muted: false
      }
    ]
  };
}

export function setLayerControl(state: MixerState, soundId: string, update: LayerControlUpdate): MixerState {
  return {
    ...state,
    layers: state.layers.map((layer) => {
      if (layer.soundId !== soundId) {
        return layer;
      }

      return {
        ...layer,
        ...(update.volume === undefined ? {} : { volume: clamp(update.volume, 0, 1) }),
        ...(update.pan === undefined ? {} : { pan: clamp(update.pan, -1, 1) }),
        ...(update.playbackRate === undefined ? {} : { playbackRate: clamp(update.playbackRate, 0.5, 1.75) }),
        ...(update.muted === undefined ? {} : { muted: update.muted })
      };
    })
  };
}

export function setMasterVolume(state: MixerState, masterVolume: number): MixerState {
  return {
    ...state,
    masterVolume: clamp(masterVolume, 0, 1)
  };
}

export function setGlobalPlaybackRate(state: MixerState, playbackRate: number): MixerState {
  return {
    ...state,
    playbackRate: clamp(playbackRate, 0.5, 1.75)
  };
}

export function setStereoWidth(state: MixerState, stereoWidth: number): MixerState {
  return {
    ...state,
    stereoWidth: clamp(stereoWidth, 0, 1)
  };
}

export function setPlaying(state: MixerState, isPlaying: boolean): MixerState {
  return {
    ...state,
    isPlaying
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
