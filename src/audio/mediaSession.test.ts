import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bindMediaSessionHandlers,
  isMediaSessionSupported,
  syncMediaSession
} from './mediaSession';

describe('mediaSession', () => {
  const originalMediaSession = navigator.mediaSession;
  let actionHandlers: Record<string, (() => void) | null>;

  beforeEach(() => {
    actionHandlers = {};

    Object.defineProperty(navigator, 'mediaSession', {
      configurable: true,
      value: {
        metadata: null,
        playbackState: 'none',
        setActionHandler(action: string, handler: (() => void) | null) {
          actionHandlers[action] = handler;
        }
      }
    });

    vi.stubGlobal('MediaMetadata', class MediaMetadata {
      title: string;
      artist: string;
      album: string;
      artwork: MediaImage[];

      constructor(init: MediaMetadataInit) {
        this.title = init.title ?? '';
        this.artist = init.artist ?? '';
        this.album = init.album ?? '';
        this.artwork = init.artwork ?? [];
      }
    });
  });

  afterEach(() => {
    if (originalMediaSession === undefined) {
      Reflect.deleteProperty(navigator, 'mediaSession');
    } else {
      Object.defineProperty(navigator, 'mediaSession', {
        configurable: true,
        value: originalMediaSession
      });
    }

    vi.unstubAllGlobals();
  });

  it('detects Media Session API support', () => {
    expect(isMediaSessionSupported()).toBe(true);
  });

  it('syncs metadata and playback state', () => {
    syncMediaSession({
      isPlaying: true,
      trackTitles: ['雨声', '篝火'],
      sleepTimerLabel: null,
      wakeTimerLabel: null
    });

    expect(navigator.mediaSession.metadata?.title).toBe('雨声 · 篝火');
    expect(navigator.mediaSession.metadata?.artist).toContain('2 轨混音');
    expect(navigator.mediaSession.playbackState).toBe('playing');

    syncMediaSession({
      isPlaying: false,
      trackTitles: ['雨声'],
      sleepTimerLabel: '14:59',
      wakeTimerLabel: null
    });

    expect(navigator.mediaSession.playbackState).toBe('paused');
    expect(navigator.mediaSession.metadata?.artist).toBe('睡眠定时 · 14:59');

    syncMediaSession({
      isPlaying: false,
      trackTitles: ['雨声'],
      sleepTimerLabel: null,
      wakeTimerLabel: '05:00'
    });

    expect(navigator.mediaSession.metadata?.artist).toBe('唤醒定时 · 05:00');
  });

  it('binds play and pause handlers with cleanup', () => {
    const onPlay = vi.fn();
    const onPause = vi.fn();
    const cleanup = bindMediaSessionHandlers({ onPlay, onPause });

    actionHandlers.play?.();
    actionHandlers.pause?.();
    expect(onPlay).toHaveBeenCalledOnce();
    expect(onPause).toHaveBeenCalledOnce();

    cleanup();
    expect(actionHandlers.play).toBeNull();
    expect(actionHandlers.pause).toBeNull();
  });
});
