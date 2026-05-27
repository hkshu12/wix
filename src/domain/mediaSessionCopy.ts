import { APP_DISPLAY_NAME } from '../lib/appMeta';

/** Builds lock-screen / OS media title from active track names. */
export function formatMediaSessionTitle(trackTitles: string[]): string {
  if (trackTitles.length === 0) {
    return APP_DISPLAY_NAME;
  }

  if (trackTitles.length === 1) {
    return trackTitles[0];
  }

  if (trackTitles.length === 2) {
    return `${trackTitles[0]} · ${trackTitles[1]}`;
  }

  return `${trackTitles[0]} 等 ${trackTitles.length} 轨`;
}

/** Subtitle shown under the title on system media surfaces. */
export function formatMediaSessionArtist(options: {
  isPlaying: boolean;
  trackCount: number;
  sleepTimerLabel: string | null;
}): string {
  const { isPlaying, trackCount, sleepTimerLabel } = options;

  if (sleepTimerLabel) {
    return `睡眠定时 · ${sleepTimerLabel}`;
  }

  if (!isPlaying) {
    return '已暂停';
  }

  if (trackCount === 0) {
    return '未选择声轨';
  }

  return `${APP_DISPLAY_NAME} · ${trackCount} 轨混音`;
}
