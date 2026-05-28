import {
  formatMediaSessionArtist,
  formatMediaSessionTitle
} from '../domain/mediaSessionCopy';
import { APP_DISPLAY_NAME } from '../lib/appMeta';
import { assetUrl } from '../lib/assetUrl';

export interface MediaSessionSyncInput {
  isPlaying: boolean;
  trackTitles: string[];
  sleepTimerLabel: string | null;
}

export interface MediaSessionHandlers {
  onPlay: () => void;
  onPause: () => void;
}

export function isMediaSessionSupported(): boolean {
  return typeof navigator !== 'undefined' && 'mediaSession' in navigator;
}

function mediaSessionArtwork(): MediaImage[] {
  return [
    { src: assetUrl('icon-mark-96.png'), sizes: '96x96', type: 'image/png' },
    { src: assetUrl('icon-192.png'), sizes: '192x192', type: 'image/png' },
    { src: assetUrl('icon-512.png'), sizes: '512x512', type: 'image/png' }
  ];
}

export function syncMediaSession(input: MediaSessionSyncInput): void {
  if (!isMediaSessionSupported()) {
    return;
  }

  const { isPlaying, trackTitles, sleepTimerLabel } = input;
  const title = formatMediaSessionTitle(trackTitles);
  const artist = formatMediaSessionArtist({
    isPlaying,
    trackCount: trackTitles.length,
    sleepTimerLabel
  });

  navigator.mediaSession.metadata = new MediaMetadata({
    title,
    artist,
    album: APP_DISPLAY_NAME,
    artwork: mediaSessionArtwork()
  });

  navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
}

/** Registers play/pause handlers; call the returned cleanup on unmount. */
export function bindMediaSessionHandlers(handlers: MediaSessionHandlers): () => void {
  if (!isMediaSessionSupported()) {
    return () => undefined;
  }

  const { mediaSession } = navigator;

  try {
    mediaSession.setActionHandler('play', () => {
      handlers.onPlay();
    });
    mediaSession.setActionHandler('pause', () => {
      handlers.onPause();
    });
  } catch {
    return () => undefined;
  }

  return () => {
    try {
      mediaSession.setActionHandler('play', null);
      mediaSession.setActionHandler('pause', null);
    } catch {
      // ignore unsupported platforms
    }
  };
}
