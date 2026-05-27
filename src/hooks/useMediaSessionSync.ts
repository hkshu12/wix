import { useEffect } from 'react';
import { bindMediaSessionHandlers, syncMediaSession } from '../audio/mediaSession';
import type { MediaSessionSyncInput } from '../audio/mediaSession';

export interface MediaSessionSyncOptions extends MediaSessionSyncInput {
  onPlay: () => void;
  onPause: () => void;
}

export function useMediaSessionSync({
  isPlaying,
  trackTitles,
  sleepTimerLabel,
  onPlay,
  onPause
}: MediaSessionSyncOptions): void {
  useEffect(() => {
    return bindMediaSessionHandlers({ onPlay, onPause });
  }, [onPlay, onPause]);

  useEffect(() => {
    syncMediaSession({ isPlaying, trackTitles, sleepTimerLabel });
  }, [isPlaying, sleepTimerLabel, trackTitles]);
}
