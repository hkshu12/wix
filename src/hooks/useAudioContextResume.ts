import { useEffect, useRef } from 'react';

/**
 * Resumes Web Audio when the document becomes visible again while playback is active.
 * Browsers often suspend AudioContext after tab/app backgrounding; UI may still show "playing".
 */
export function useAudioContextResume(
  isPlaying: boolean,
  onResume: () => void | Promise<void>
): void {
  const isPlayingRef = useRef(isPlaying);
  const onResumeRef = useRef(onResume);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    onResumeRef.current = onResume;
  }, [onResume]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== 'visible' || !isPlayingRef.current) {
        return;
      }

      void onResumeRef.current();
    }

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);
}
