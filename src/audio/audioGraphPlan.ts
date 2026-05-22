import type { MixerState } from '../domain/mixer';
import type { BuiltInSound } from '../domain/sounds';
import type { CustomTrack } from '../storage/customLibrary';

export type PlayableSound = BuiltInSound | CustomTrack;

export interface AudioGraphLayer {
  soundId: string;
  finalVolume: number;
  finalPan: number;
  finalPlaybackRate: number;
  sound: PlayableSound;
}

export function createAudioGraphPlan(state: MixerState, sounds: PlayableSound[]): AudioGraphLayer[] {
  return state.layers.flatMap((layer) => {
    const sound = sounds.find((candidate) => candidate.id === layer.soundId);

    if (!sound || layer.muted) {
      return [];
    }

    return [
      {
        soundId: layer.soundId,
        finalVolume: round(layer.volume),
        finalPan: round(layer.pan * state.stereoWidth),
        finalPlaybackRate: round(layer.playbackRate * state.playbackRate),
        sound
      }
    ];
  });
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
