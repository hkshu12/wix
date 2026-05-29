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
  wakeTimerLabel,
  onPlay,
  onPause
}: MediaSessionSyncOptions): void {
  useEffect(() => {
    return bindMediaSessionHandlers({ onPlay, onPause });
  }, [onPlay, onPause]);

  useEffect(() => {
    syncMediaSession({ isPlaying, trackTitles, sleepTimerLabel, wakeTimerLabel });
  }, [isPlaying, sleepTimerLabel, wakeTimerLabel, trackTitles]);
}
