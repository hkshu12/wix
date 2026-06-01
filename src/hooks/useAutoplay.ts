import { useCallback, useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { setPlaying, type MixerState } from '../domain/mixer';

interface UseAutoplayOptions {
  mixer: MixerState;
  setMixer: Dispatch<SetStateAction<MixerState>>;
  customTracksReady: boolean;
  resumeAudio: () => Promise<void>;
  /** When true, do not autoplay restored layers on cold start (e.g. sleep timer already stopped playback). */
  suppressRestoreAutoplay?: boolean;
}

/**
 * Starts playback when layers are present: on restore, when a track is added,
 * or after presets/share import. Pauses when all layers are removed.
 * Manual play/pause remains available via {@link handlePlayToggle}.
 */
export function useAutoplay({
  mixer,
  setMixer,
  customTracksReady,
  resumeAudio,
  suppressRestoreAutoplay = false
}: UseAutoplayOptions) {
  const mixerRef = useRef(mixer);
  const prevLayerIdsRef = useRef<string[]>([]);
  const sessionAutoplayDoneRef = useRef(false);

  useEffect(() => {
    mixerRef.current = mixer;
  }, [mixer]);

  const startPlayback = useCallback(async () => {
    if (mixerRef.current.layers.length === 0) {
      return;
    }

    await resumeAudio();
    setMixer((state) => (state.isPlaying ? state : setPlaying(state, true)));
  }, [resumeAudio, setMixer]);

  const primeAudioContext = useCallback(() => resumeAudio(), [resumeAudio]);

  useEffect(() => {
    if (!customTracksReady) {
      return;
    }

    const currentIds = mixer.layers.map((layer) => layer.soundId);
    const prevIds = prevLayerIdsRef.current;
    const addedLayer = currentIds.some((id) => !prevIds.includes(id));
    prevLayerIdsRef.current = currentIds;

    if (currentIds.length === 0) {
      if (mixer.isPlaying) {
        setMixer((state) => setPlaying(state, false));
      }
      return;
    }

    const shouldAutoplay =
      !mixer.isPlaying && (addedLayer || (!sessionAutoplayDoneRef.current && currentIds.length > 0));

    if (
      suppressRestoreAutoplay &&
      !sessionAutoplayDoneRef.current &&
      currentIds.length > 0 &&
      !addedLayer
    ) {
      sessionAutoplayDoneRef.current = true;
      return;
    }

    if (!shouldAutoplay) {
      return;
    }

    sessionAutoplayDoneRef.current = true;
    void startPlayback();
  }, [customTracksReady, mixer.isPlaying, mixer.layers, setMixer, startPlayback, suppressRestoreAutoplay]);

  return { startPlayback, primeAudioContext };
}
